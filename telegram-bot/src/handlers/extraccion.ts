import type { Bot } from 'grammy';
import { authGuard } from '../middleware/auth.js';
import { getSession } from '../utils/store.js';
import { extraccionService, authService } from '../api.js';
import { formatMonto } from '../utils/format.js';

export function registerExtraccionHandlers(bot: Bot) {
  // /extraer command
  bot.command('extraer', authGuard, async (ctx) => {
    await startExtraccion(ctx);
  });

  // Menu button "💸 Extraer"
  bot.hears('💸 Extraer', authGuard, async (ctx) => {
    await startExtraccion(ctx);
  });

  // Handle text input for extraccion wizard
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    const text = ctx.message.text;

    if (session.wizardStep !== 'extraccion:monto') return next();
    if (text.startsWith('/')) return next();

    const monto = parseFloat(text);
    if (isNaN(monto) || monto <= 0) {
      await ctx.reply('❌ Ingresa un monto válido mayor a 0:');
      return;
    }

    // Validate against available balance
    if (session.wizardData.saldoDisponible && monto > Number(session.wizardData.saldoDisponible)) {
      await ctx.reply(`❌ Saldo insuficiente. Disponible: ${formatMonto(session.wizardData.saldoDisponible)}`);
      return;
    }

    session.wizardStep = null;

    try {
      await ctx.reply('⏳ Procesando solicitud...');
      await extraccionService.create(chatId, { monto });

      // Refresh user data
      const user = await authService.getCurrentUser(chatId);
      session.user = user;

      await ctx.reply(
        `✅ *Solicitud de extracción enviada*\n\n` +
        `💵 Monto: ${formatMonto(monto)}\n` +
        `💰 Saldo extracción restante: ${formatMonto(user.saldo_extraccion)}\n\n` +
        `⏳ Tu solicitud está pendiente de aprobación.`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      const data = err.response?.data;
      let errorMsg = err.message || 'Error al crear solicitud';
      if (data) {
        if (data.detail) errorMsg = data.detail;
        else if (data.monto) errorMsg = Array.isArray(data.monto) ? data.monto.join(', ') : data.monto;
        else if (data.non_field_errors) errorMsg = data.non_field_errors.join(', ');
        else errorMsg = JSON.stringify(data);
      }
      await ctx.reply(`❌ ${errorMsg}`);
    }

    session.wizardData = {};
  });
}

async function startExtraccion(ctx: any) {
  const chatId = ctx.chat.id;
  const session = getSession(chatId);

  try {
    // Refresh user balance
    const user = await authService.getCurrentUser(chatId);
    session.user = user;

    if (user.saldo_extraccion <= 0) {
      await ctx.reply('❌ No tienes saldo de extracción disponible.');
      return;
    }

    session.wizardStep = 'extraccion:monto';
    session.wizardData = { saldoDisponible: user.saldo_extraccion };

    await ctx.reply(
      `💸 *Extraer Dinero*\n\n` +
      `💰 Saldo disponible para extracción: *${formatMonto(user.saldo_extraccion)}*\n\n` +
      `Ingresa el monto que deseas extraer:`,
      { parse_mode: 'Markdown' }
    );
  } catch (err: any) {
    const data = err.response?.data;
    let errorMsg = err.message || 'Error al obtener saldo';
    if (data) {
      if (data.detail) errorMsg = data.detail;
      else errorMsg = JSON.stringify(data);
    }
    await ctx.reply(`❌ ${errorMsg}`);
  }
}
