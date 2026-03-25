import type { Bot } from 'grammy';
import { authGuard } from '../middleware/auth.js';
import { getSession } from '../utils/store.js';
import { lotteryService, apuestaService, authService } from '../api.js';
import { loteriasKeyboard, tiradasKeyboard, modalidadesKeyboard } from '../keyboards/keyboards.js';
import { formatHora, formatMonto } from '../utils/format.js';

export function registerApuestasHandlers(bot: Bot) {
  // /apostar command
  bot.command('apostar', authGuard, async (ctx) => {
    await startApuestaWizard(ctx);
  });

  // Menu button "🎰 Apostar"
  bot.hears('🎰 Apostar', authGuard, async (ctx) => {
    await startApuestaWizard(ctx);
  });

  // Step 1: Select loteria
  bot.callbackQuery(/^apuesta:lot:(\d+)$/, authGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const session = getSession(chatId);
    const loteriaId = parseInt(ctx.match[1]);

    try {
      const tiradas = await lotteryService.getTiradasActivas(chatId);
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const filtered = tiradas.filter((t: any) => {
        if (t.loteria !== loteriaId && t.loteria_id !== loteriaId) return false;
        if (t.resultado_hoy) return false;
        // Filter out past tiradas by time
        if (t.hora) {
          const parts = t.hora.split(':');
          const tiradaMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          if (tiradaMinutes < currentMinutes) return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        await ctx.answerCallbackQuery('No hay tiradas activas para esta lotería');
        return;
      }

      session.wizardData.loteriaId = loteriaId;
      const loteria = (await lotteryService.getLoterias(chatId)).find((l: any) => l.id === loteriaId);
      session.wizardData.loteriaNombre = loteria?.nombre || 'Lotería';

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `⏰ *${loteria?.nombre || 'Lotería'}* - Selecciona una tirada:`,
        { parse_mode: 'Markdown', reply_markup: tiradasKeyboard(filtered, 'apuesta:tir') }
      );
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error al cargar tiradas');
      await ctx.reply('❌ Error al cargar tiradas. Intenta de nuevo.');
    }
  });

  // Step 2: Select tirada
  bot.callbackQuery(/^apuesta:tir:(\d+)$/, authGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const session = getSession(chatId);
    const tiradaId = parseInt(ctx.match[1]);

    try {
      const tiradas = await lotteryService.getTiradasActivas(chatId);
      const tirada = tiradas.find((t: any) => t.id === tiradaId);

      if (!tirada) {
        await ctx.answerCallbackQuery('Tirada no encontrada');
        return;
      }

      session.wizardData.tiradaId = tiradaId;
      session.wizardData.tiradaHora = formatHora(tirada.hora);

      const modalidades = await lotteryService.getModalidades(chatId);

      if (modalidades.length === 0) {
        await ctx.answerCallbackQuery('No hay modalidades disponibles');
        return;
      }

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `📐 *Modalidades de apuesta*\n_${session.wizardData.loteriaNombre} - ${session.wizardData.tiradaHora}_\n\nSelecciona una modalidad:`,
        { parse_mode: 'Markdown', reply_markup: modalidadesKeyboard(modalidades, 'apuesta:mod') }
      );
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error al cargar modalidades');
      await ctx.reply('❌ Error al cargar modalidades.');
    }
  });

  // Step 3: Select modalidad
  bot.callbackQuery(/^apuesta:mod:(\d+)$/, authGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const session = getSession(chatId);
    const modalidadId = parseInt(ctx.match[1]);

    try {
      const modalidades = await lotteryService.getModalidades(chatId);
      const modalidad = modalidades.find((m: any) => m.id === modalidadId);

      if (!modalidad) {
        await ctx.answerCallbackQuery('Modalidad no encontrada');
        return;
      }

      session.wizardData.modalidadId = modalidadId;
      session.wizardData.modalidadNombre = modalidad.nombre;
      session.wizardData.premioPorPeso = modalidad.premio_por_peso;
      session.wizardStep = 'apuesta:numeros';
      session.wizardData.numeros = [];

      // Refresh user saldo
      const user = await authService.getCurrentUser(chatId);
      session.user = user;

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `🎯 *${session.wizardData.loteriaNombre}* - ${session.wizardData.tiradaHora}\n` +
        `Modalidad: ${modalidad.nombre} (${modalidad.premio_por_peso}x)\n` +
        `💰 Saldo: ${formatMonto(user.saldo_principal)}\n\n` +
        `Ingresa los números a jugar (3 dígitos cada uno).\n` +
        `Escribe cada número por separado o varios separados por coma.\n` +
        `Ejemplo: 123, 456, 789\n\n` +
        `Máximo 10 números. Escribe /listo cuando termines.`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al seleccionar modalidad.');
    }
  });

  // Register /listo as a command so it works even if Telegram handles it
  bot.command('listo', authGuard, async (ctx) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    if (session.wizardStep !== 'apuesta:numeros') return;
    if (session.wizardData.numeros.length === 0) {
      await ctx.reply('❌ Debes ingresar al menos un número.');
      return;
    }
    session.wizardStep = 'apuesta:monto';
    await ctx.reply(
      `📝 Números seleccionados: ${session.wizardData.numeros.join(', ')}\n\n` +
      `Ingresa el monto por número (en CUP):`
    );
  });

  // Handle number input during bet wizard
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    const text = ctx.message.text;

    if (session.wizardStep !== 'apuesta:numeros') return next();
    if (text.startsWith('/')) return next();

    // Skip menu button texts
    const menuButtons = ['💰 Saldo', '📊 Resultados', '📋 Historial', '👤 Perfil', '🎰 Apostar', '💳 Acreditar', '💸 Extraer', '🔧 Admin'];
    if (menuButtons.includes(text)) return next();

    // Listo para monto (as text, not command)
    if (text.toLowerCase() === 'listo') {
      if (session.wizardData.numeros.length === 0) {
        await ctx.reply('❌ Debes ingresar al menos un número.');
        return;
      }
      session.wizardStep = 'apuesta:monto';
      await ctx.reply(
        `📝 Números seleccionados: ${session.wizardData.numeros.join(', ')}\n\n` +
        `Ingresa el monto por número (en CUP):`
      );
      return;
    }

    // Parse numbers
    const parts = text.split(/[,\s]+/).map((s: string) => s.trim()).filter(Boolean);
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const p of parts) {
      if (/^\d{1,3}$/.test(p)) {
        const num = p.padStart(3, '0');
        if (!session.wizardData.numeros.includes(num) && session.wizardData.numeros.length + valid.length < 10) {
          valid.push(num);
        }
      } else {
        invalid.push(p);
      }
    }

    session.wizardData.numeros.push(...valid);

    let msg = '';
    if (valid.length > 0) msg += `✅ Agregados: ${valid.join(', ')}\n`;
    if (invalid.length > 0) msg += `❌ Inválidos: ${invalid.join(', ')}\n`;
    msg += `\n📊 Números: ${session.wizardData.numeros.length}/10`;
    msg += `\n\nEscribe más números o /listo para continuar.`;

    await ctx.reply(msg);
  });

  // Handle monto input
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    const text = ctx.message.text;

    if (session.wizardStep !== 'apuesta:monto') return next();
    if (text.startsWith('/')) return next();

    const monto = parseFloat(text);
    if (isNaN(monto) || monto <= 0) {
      await ctx.reply('❌ Ingresa un monto válido mayor a 0:');
      return;
    }

    const total = monto * session.wizardData.numeros.length;
    const premioTotal = monto * session.wizardData.premioPorPeso * session.wizardData.numeros.length;

    // Validate saldo
    const user = await authService.getCurrentUser(chatId);
    session.user = user;
    if (total > Number(user.saldo_principal)) {
      await ctx.reply(
        `❌ Saldo insuficiente.\n` +
        `💰 Tu saldo: ${formatMonto(user.saldo_principal)}\n` +
        `📊 Total requerido: ${formatMonto(total)}\n\n` +
        `Usa /acreditar para depositar fondos.`
      );
      return;
    }

    session.wizardData.montoPorNumero = monto;
    session.wizardStep = null;

    await ctx.reply(
      `📋 *Resumen de apuesta*\n\n` +
      `🎰 Lotería: ${session.wizardData.loteriaNombre}\n` +
      `⏰ Tirada: ${session.wizardData.tiradaHora}\n` +
      `📐 Modalidad: ${session.wizardData.modalidadNombre} (${session.wizardData.premioPorPeso}x)\n` +
      `🎯 Números: ${session.wizardData.numeros.join(', ')}\n` +
      `💵 Monto por número: ${monto.toFixed(2)} CUP\n` +
      `📊 Total: *${total.toFixed(2)} CUP*\n` +
      `🏆 Premio máximo: *${premioTotal.toFixed(2)} CUP*\n` +
      `💰 Tu saldo: ${formatMonto(user.saldo_principal)}\n\n` +
      `¿Confirmar apuesta?`,
      {
        parse_mode: 'Markdown',
        reply_markup: new (await import('grammy')).InlineKeyboard()
          .text('✅ Confirmar', 'apuesta:confirm:yes')
          .text('❌ Cancelar', 'apuesta:confirm:no'),
      }
    );
  });

  // Confirm bet
  bot.callbackQuery('apuesta:confirm:yes', authGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const session = getSession(chatId);

    try {
      await ctx.answerCallbackQuery('Procesando apuesta...');

      const result = await apuestaService.createApuesta(chatId, {
        tirada_id: session.wizardData.tiradaId,
        modalidad_id: session.wizardData.modalidadId,
        numeros: session.wizardData.numeros,
        monto_por_numero: session.wizardData.montoPorNumero,
      });

      // Refresh user data
      const user = await authService.getCurrentUser(chatId);
      session.user = user;

      const total = session.wizardData.montoPorNumero * session.wizardData.numeros.length;
      await ctx.reply(
        `✅ *Apuesta realizada exitosamente!*\n\n` +
        `🎯 Números: ${session.wizardData.numeros.join(', ')}\n` +
        `💵 Total apostado: ${total.toFixed(2)} CUP\n` +
        `💰 Saldo restante: ${formatMonto(user.saldo_principal)}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Error al realizar apuesta';
      await ctx.reply(`❌ ${msg}`);
    }

    session.wizardData = {};
  });

  // Cancel bet
  bot.callbackQuery('apuesta:confirm:no', authGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const session = getSession(chatId);
    session.wizardData = {};
    session.wizardStep = null;
    await ctx.answerCallbackQuery('Apuesta cancelada');
    await ctx.reply('❌ Apuesta cancelada.');
  });
}

async function startApuestaWizard(ctx: any) {
  const chatId = ctx.chat.id;
  const session = getSession(chatId);

  try {
    const loterias = await lotteryService.getLoterias(chatId);
    const activas = loterias.filter((l: any) => l.activa);

    if (activas.length === 0) {
      await ctx.reply('❌ No hay loterías activas en este momento.');
      return;
    }

    session.wizardStep = null;
    session.wizardData = {};

    await ctx.reply(
      '🎰 *Nueva Apuesta*\n\nPaso 1: Selecciona una lotería:',
      { parse_mode: 'Markdown', reply_markup: loteriasKeyboard(activas, 'apuesta:lot') }
    );
  } catch (err: any) {
    const data = err.response?.data;
    let errorMsg = err.message || 'Error al cargar loterías';
    if (data?.detail) errorMsg = data.detail;
    await ctx.reply(`❌ ${errorMsg}`);
  }
}
