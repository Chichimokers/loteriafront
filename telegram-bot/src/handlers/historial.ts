import type { Bot } from 'grammy';
import { authGuard } from '../middleware/auth.js';
import { apuestaService } from '../api.js';
import { formatMonto } from '../utils/format.js';

export function registerHistorialHandlers(bot: Bot) {
  // /historial command
  bot.command('historial', authGuard, async (ctx) => {
    await showHistorial(ctx);
  });

  // Menu button "📋 Historial"
  bot.hears('📋 Historial', authGuard, async (ctx) => {
    await showHistorial(ctx);
  });
}

async function showHistorial(ctx: any) {
  const chatId = ctx.chat.id;

  try {
    const apuestas = await apuestaService.getMisApuestas(chatId);

    if (!apuestas || apuestas.length === 0) {
      await ctx.reply('📋 No tienes apuestas registradas.');
      return;
    }

    // Show last 15 bets
    const recent = apuestas.slice(0, 15);
    let msg = `📋 *Mis Apuestas* (últimas ${recent.length})\n\n`;

    for (const a of recent) {
      const status = a.paga === true ? '✅ Ganado' : a.paga === false && a.resultado ? '❌ Perdido' : '⏳ Pendiente';
      const numeros = Array.isArray(a.numeros) ? a.numeros.join(', ') : a.numeros;
      msg += `${status}\n`;
      msg += `  🎰 ${a.loteria_nombre || 'N/A'}\n`;
      msg += `  🎯 ${numeros}\n`;
      msg += `  💵 ${formatMonto(a.monto_total || 0)}`;
      if (a.premio_total > 0) msg += ` → 🏆 ${formatMonto(a.premio_total)}`;
      msg += `\n  📅 ${a.fecha || ''}\n\n`;
    }

    // Telegram message limit is 4096 chars
    if (msg.length > 4000) {
      msg = msg.slice(0, 3990) + '\n\n... (ver más en la web)';
    }

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener historial. Intenta de nuevo.');
  }
}
