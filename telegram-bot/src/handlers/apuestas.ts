import type { Bot } from 'grammy';
import { authGuard } from '../middleware/auth.js';
import { getSession } from '../utils/store.js';
import { lotteryService, apuestaService, authService } from '../api.js';
import { InlineKeyboard } from 'grammy';
import { loteriasKeyboard, tiradasKeyboard, modalidadesKeyboard } from '../keyboards/keyboards.js';
import { formatHora, formatMonto } from '../utils/format.js';

// Detect modalidad type from name
function getModalityType(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes('candado')) return 'candado';
  if (n.includes('parl') || n.includes('parle')) return 'parle';
  if (n.includes('pick') || n.includes('centena')) return 'pick3';
  if (n.includes('corrido')) return 'corrido';
  if (n.includes('fijo')) return 'fijo';
  return 'pick3'; // default to 3 digits
}

// Get instructions per modalidad type
function getModalityInstructions(modType: string): string {
  switch (modType) {
    case 'fijo':
      return `Ingresa números de *2 dígitos*.\nEjemplo: 37, 88, 15\nMáximo 10 números.`;
    case 'corrido':
      return `Ingresa números de *2 dígitos*.\nEjemplo: 75, 02, 99\nMáximo 10 números.`;
    case 'pick3':
      return `Ingresa números de *3 dígitos*.\nEjemplo: 837, 123, 456\nMáximo 10 números.`;
    case 'parle':
      return `Ingresa *parejas de 2 dígitos* separadas por guion.\nEjemplo: 37-75, 02-58\nCada pareja es una jugada.`;
    case 'candado':
      return `Ingresa *números de 2 dígitos* separados por coma.\nEjemplo: 37, 75, 02, 58\nSe generarán todas las combinaciones automáticamente.`;
    default:
      return `Ingresa los números a jugar.`;
  }
}

// Validate a single number for a modalidad type
function validateNumber(num: string, modType: string): boolean {
  switch (modType) {
    case 'fijo':
    case 'corrido':
      return /^\d{2}$/.test(num);
    case 'pick3':
      return /^\d{3}$/.test(num);
    default:
      return /^\d+$/.test(num);
  }
}

// Pad number to correct length
function padNumber(num: string, modType: string): string {
  switch (modType) {
    case 'fijo':
    case 'corrido':
      return num.padStart(2, '0');
    case 'pick3':
      return num.padStart(3, '0');
    default:
      return num;
  }
}

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
      const data = err.response?.data;
      await ctx.reply(`❌ ${data?.detail || 'Error al cargar tiradas'}`);
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

      // Agregar opción de candado al final
      const kb = modalidadesKeyboard(modalidades, 'apuesta:mod');
      kb.row().text('🔗 Candado (combinaciones)', 'apuesta:candado');

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `📐 *Modalidades de apuesta*\n_${session.wizardData.loteriaNombre} - ${session.wizardData.tiradaHora}_\n\nSelecciona una modalidad:`,
        { parse_mode: 'Markdown', reply_markup: kb }
      );
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error al cargar modalidades');
      await ctx.reply('❌ Error al cargar modalidades.');
    }
  });

  // Step 3: Select candado (independiente)
  bot.callbackQuery('apuesta:candado', authGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const session = getSession(chatId);

    try {
      session.wizardData.modalidadId = null;
      session.wizardData.modalidadNombre = 'Candado';
      session.wizardData.premioPorPeso = null;
      session.wizardData.modalityType = 'candado';
      session.wizardStep = 'apuesta:numeros';
      session.wizardData.numeros = [];

      const user = await authService.getCurrentUser(chatId);
      session.user = user;

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `🔗 *${session.wizardData.loteriaNombre}* - ${session.wizardData.tiradaHora}\n` +
        `Modalidad: Candado (combinaciones automáticas)\n` +
        `💰 Saldo: ${formatMonto(user.saldo_principal)}\n\n` +
        getModalityInstructions('candado') +
        `\n\nEscribe /listo cuando termines.`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al seleccionar candado.');
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

      const modType = getModalityType(modalidad.nombre);

      session.wizardData.modalidadId = modalidadId;
      session.wizardData.modalidadNombre = modalidad.nombre;
      session.wizardData.premioPorPeso = modalidad.premio_por_peso;
      session.wizardData.modalityType = modType;
      session.wizardData.numeros = [];

      // Refresh user saldo
      const user = await authService.getCurrentUser(chatId);
      session.user = user;

      // For parlé, ir directo a números (no preguntar tipo)
      session.wizardStep = 'apuesta:numeros';

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `🎯 *${session.wizardData.loteriaNombre}* - ${session.wizardData.tiradaHora}\n` +
        `Modalidad: ${modalidad.nombre} (${modalidad.premio_por_peso}x)\n` +
        `💰 Saldo: ${formatMonto(user.saldo_principal)}\n\n` +
        getModalityInstructions(modType) +
        `\n\nEscribe /listo cuando termines.`,
        { parse_mode: 'Markdown' }
      );
      return;
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al seleccionar modalidad.');
    }
  });

  // Register /listo as a command
  bot.command('listo', authGuard, async (ctx) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    if (session.wizardStep !== 'apuesta:numeros') return;
    if (session.wizardData.numeros.length === 0) {
      await ctx.reply('❌ Debes ingresar al menos un número.');
      return;
    }

    const modType = session.wizardData.modalityType;
    const nums = session.wizardData.numeros;

    // Candado needs at least 2 numbers for combinations
    if (modType === 'candado' && nums.length < 2) {
      await ctx.reply('❌ Para candado necesitas al menos 2 números.');
      return;
    }

    session.wizardStep = 'apuesta:monto';

    let displayNums = '';
    if (modType === 'parle') {
      displayNums = nums.map((p: string[]) => `${p[0]}-${p[1]}`).join(', ');
    } else {
      displayNums = nums.join(', ');
    }

    await ctx.reply(
      `📝 Números seleccionados: ${displayNums}\n\n` +
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

    // Listo para monto
    if (text.toLowerCase() === 'listo') {
      if (session.wizardData.numeros.length === 0) {
        await ctx.reply('❌ Debes ingresar al menos un número.');
        return;
      }
      const modType = session.wizardData.modalityType;
      if (modType === 'candado' && session.wizardData.numeros.length < 2) {
        await ctx.reply('❌ Para candado necesitas al menos 2 números.');
        return;
      }
      session.wizardStep = 'apuesta:monto';

      let displayNums = '';
      if (modType === 'parle') {
        displayNums = session.wizardData.numeros.map((p: string[]) => `${p[0]}-${p[1]}`).join(', ');
      } else {
        displayNums = session.wizardData.numeros.join(', ');
      }

      await ctx.reply(
        `📝 Números seleccionados: ${displayNums}\n\n` +
        `Ingresa el monto por número (en CUP):`
      );
      return;
    }

    const modType = session.wizardData.modalityType;

    // PARLÉ: parse pairs like "37-75, 02-58"
    if (modType === 'parle') {
      const pairParts = text.split(/[,\s]+/).map((s: string) => s.trim()).filter(Boolean);
      const validPairs: string[][] = [];
      const invalid: string[] = [];
      const duplicates: string[] = [];

      for (const part of pairParts) {
        const match = part.match(/^(\d{1,2})-(\d{1,2})$/);
        if (match) {
          const n1 = match[1].padStart(2, '0');
          const n2 = match[2].padStart(2, '0');
          // Verificar si ya existe (en cualquier orden)
          const exists = session.wizardData.numeros.some(
            (p: string[]) => (p[0] === n1 && p[1] === n2) || (p[0] === n2 && p[1] === n1)
          );
          const existsInBatch = validPairs.some(
            (p) => (p[0] === n1 && p[1] === n2) || (p[0] === n2 && p[1] === n1)
          );
          if (exists || existsInBatch) {
            duplicates.push(`${n1}-${n2}`);
          } else if (session.wizardData.numeros.length + validPairs.length < 10) {
            validPairs.push([n1, n2]);
          }
        } else {
          invalid.push(part);
        }
      }

      session.wizardData.numeros.push(...validPairs);

      let msg = '';
      if (validPairs.length > 0) msg += `✅ Agregadas: ${validPairs.map((p) => `${p[0]}-${p[1]}`).join(', ')}\n`;
      if (duplicates.length > 0) msg += `⚠️ Ya existen: ${duplicates.join(', ')}\n`;
      if (invalid.length > 0) msg += `❌ Inválidos: ${invalid.join(', ')}\n`;
      msg += `\n📊 Parejas: ${session.wizardData.numeros.length}/10`;
      msg += `\n\nEscribe más parejas o /listo para continuar.`;

      await ctx.reply(msg);
      return;
    }

    // CANDADO: parse 2-digit numbers
    if (modType === 'candado') {
      const parts = text.split(/[,\s]+/).map((s: string) => s.trim()).filter(Boolean);
      const valid: string[] = [];
      const invalid: string[] = [];

      for (const p of parts) {
        if (/^\d{1,2}$/.test(p)) {
          const num = p.padStart(2, '0');
          if (!session.wizardData.numeros.includes(num) && session.wizardData.numeros.length + valid.length < 10) {
            valid.push(num);
          }
        } else {
          invalid.push(p);
        }
      }

      session.wizardData.numeros.push(...valid);

      const count = session.wizardData.numeros.length;
      const combinaciones = count >= 2 ? (count * (count - 1)) / 2 : 0;

      let msg = '';
      if (valid.length > 0) msg += `✅ Agregados: ${valid.join(', ')}\n`;
      if (invalid.length > 0) msg += `❌ Inválidos: ${invalid.join(', ')}\n`;
      msg += `\n📊 Números: ${count}/10`;
      if (combinaciones > 0) msg += ` (${combinaciones} combinaciones)`;
      msg += `\n\nEscribe más números o /listo para continuar.`;

      await ctx.reply(msg);
      return;
    }

    // FIJO / CORRIDO / PICK3: parse numbers
    const parts = text.split(/[,\s]+/).map((s: string) => s.trim()).filter(Boolean);
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const p of parts) {
      if (validateNumber(p, modType)) {
        const num = padNumber(p, modType);
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

    const modType = session.wizardData.modalityType;
    const numeros = session.wizardData.numeros;

    // Calculate total based on modality
    let total: number;
    let itemCount: number;
    let displayNums: string;

    if (modType === 'candado') {
      // Candado: C(n,2) combinations
      const count = numeros.length;
      itemCount = (count * (count - 1)) / 2;
      total = monto * itemCount;
      displayNums = `Números: ${numeros.join(', ')} (${itemCount} combinaciones)`;
    } else if (modType === 'parle') {
      // Parlé: each pair is one item
      itemCount = numeros.length;
      total = monto * itemCount;
      displayNums = numeros.map((p: string[]) => `${p[0]}-${p[1]}`).join(', ');
    } else {
      itemCount = numeros.length;
      total = monto * itemCount;
      displayNums = numeros.join(', ');
    }

    const premioTotal = monto * session.wizardData.premioPorPeso * itemCount;

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
      `🎯 ${displayNums}\n` +
      `💵 Monto por jugada: ${formatMonto(monto)}\n` +
      `📊 Total: *${formatMonto(total)}*\n` +
      `🏆 Premio máximo: *${formatMonto(premioTotal)}*\n` +
      `💰 Tu saldo: ${formatMonto(user.saldo_principal)}\n\n` +
      `¿Confirmar apuesta?`,
      {
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
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

      const modType = session.wizardData.modalityType;
      const numeros = session.wizardData.numeros;

      if (modType === 'candado') {
        // Candado uses separate endpoint
        await apuestaService.createCandado(chatId, {
          tirada_id: session.wizardData.tiradaId,
          numeros: numeros,
          monto_por_numero: session.wizardData.montoPorNumero,
        });
      } else {
        // Normal bet (fijo, corrido, pick3, parle)
        await apuestaService.createApuesta(chatId, {
          tirada_id: session.wizardData.tiradaId,
          modalidad_id: session.wizardData.modalidadId,
          numeros: numeros,
          monto_por_numero: session.wizardData.montoPorNumero,
        });
      }

      // Refresh user data
      const user = await authService.getCurrentUser(chatId);
      session.user = user;

      let total: number;
      let displayNums: string;

      if (modType === 'candado') {
        const combos = (numeros.length * (numeros.length - 1)) / 2;
        total = session.wizardData.montoPorNumero * combos;
        displayNums = `Números: ${numeros.join(', ')} (${combos} combinaciones)`;
      } else if (modType === 'parle') {
        total = session.wizardData.montoPorNumero * numeros.length;
        displayNums = numeros.map((p: string[]) => `${p[0]}-${p[1]}`).join(', ');
      } else {
        total = session.wizardData.montoPorNumero * numeros.length;
        displayNums = numeros.join(', ');
      }

      await ctx.reply(
        `✅ *Apuesta realizada exitosamente!*\n\n` +
        `🎯 ${displayNums}\n` +
        `💵 Total apostado: ${formatMonto(total)}\n` +
        `💰 Saldo restante: ${formatMonto(user.saldo_principal)}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      const data = err.response?.data;
      let errorMsg = err.message || 'Error al realizar apuesta';
      if (data) {
        if (data.detail) errorMsg = data.detail;
        else if (data.non_field_errors) errorMsg = data.non_field_errors.join(', ');
        else errorMsg = JSON.stringify(data);
      }
      await ctx.reply(`❌ ${errorMsg}`);
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
