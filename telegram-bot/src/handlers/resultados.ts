import type { Bot } from 'grammy';
import { authGuard } from '../middleware/auth.js';
import { lotteryService } from '../api.js';
import { formatHora } from '../utils/format.js';

export function registerResultadosHandlers(bot: Bot) {
  // /resultados command
  bot.command('resultados', authGuard, async (ctx) => {
    await showResultados(ctx);
  });

  // Menu button "📊 Resultados"
  bot.hears('📊 Resultados', authGuard, async (ctx) => {
    await showResultados(ctx);
  });
}

async function showResultados(ctx: any) {
  const chatId = ctx.chat.id;

  try {
    const resultados = await lotteryService.getResultadosHoy(chatId);

    if (!resultados || resultados.length === 0) {
      await ctx.reply('📊 No hay resultados para hoy aún.');
      return;
    }

    let msg = `📊 *Resultados de Hoy*\n\n`;

    for (const r of resultados) {
      const estado = r.pick_3 || r.pick_4 ? '✅' : '⏳';
      msg += `${estado} *${r.loteria_nombre || 'Lotería'}* - ${formatHora(r.hora)}\n`;

      if (r.pick_3) {
        const p3 = r.pick_3.split('').join(' ');
        msg += `  Pick 3: 🎱 ${p3}\n`;
      }
      if (r.pick_4) {
        const p4 = r.pick_4.split('').join(' ');
        msg += `  Pick 4: 🎱 ${p4}\n`;
      }
      if (!r.pick_3 && !r.pick_4) {
        msg += `  ⏳ Pendiente\n`;
      }
      msg += '\n';
    }

    if (msg.length > 4000) {
      msg = msg.slice(0, 3990) + '\n\n... (ver más en la web)';
    }

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener resultados. Intenta de nuevo.');
  }
}
