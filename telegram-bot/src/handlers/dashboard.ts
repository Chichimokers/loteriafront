import type { Bot } from 'grammy';
import { authGuard } from '../middleware/auth.js';
import { authService } from '../api.js';
import { getSession } from '../utils/store.js';
import { formatMonto } from '../utils/format.js';

export function registerDashboardHandlers(bot: Bot) {
  // /saldo command
  bot.command('saldo', authGuard, async (ctx) => {
    await showSaldo(ctx);
  });

  // Menu button "💰 Saldo"
  bot.hears('💰 Saldo', authGuard, async (ctx) => {
    await showSaldo(ctx);
  });
}

async function showSaldo(ctx: any) {
  const chatId = ctx.chat.id;
  const session = getSession(chatId);

  try {
    // Refresh user data
    const user = await authService.getCurrentUser(chatId);
    session.user = user;

    await ctx.reply(
      `💰 *Tus Saldos*\n\n` +
      `📊 Saldo Principal: *${formatMonto(user.saldo_principal)}*\n` +
      `💸 Saldo Extracción: *${formatMonto(user.saldo_extraccion)}*\n\n` +
      `Usa /acreditar para depositar fondos\n` +
      `Usa /extraer para retirar ganancias`,
      { parse_mode: 'Markdown' }
    );
  } catch {
    await ctx.reply('❌ Error al obtener saldo. Intenta de nuevo.');
  }
}
