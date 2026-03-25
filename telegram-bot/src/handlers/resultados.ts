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

    // Get today's date formatted
    const today = new Date();
    const fechaStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const fechaCapitalized = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);

    let msg = `📊 *Resultados de Hoy*\n📅 ${fechaCapitalized}\n\n`;

    // Group by lotería
    const grouped: Record<string, any[]> = {};
    for (const r of resultados) {
      const key = r.loteria_nombre || 'Lotería';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    }

    for (const [loteria, tiradas] of Object.entries(grouped)) {
      const conResultados = tiradas.filter((t: any) => t.pick_3 || t.pick_4).length;
      msg += `*${loteria}* (${conResultados}/${tiradas.length})\n`;

      for (const r of tiradas) {
        const estado = r.pick_3 || r.pick_4 ? '✅' : '⏳';
        msg += `  ${estado} ${formatHora(r.hora)}:`;

        if (r.pick_3) {
          const p3 = r.pick_3.split('').join(' ');
          msg += ` 🎱 ${p3}`;
        }
        if (r.pick_4) {
          const p4 = r.pick_4.split('').join(' ');
          msg += ` | ${p4}`;
        }
        if (!r.pick_3 && !r.pick_4) {
          msg += ` ⏳ Pendiente`;
        }
        msg += '\n';
      }
      msg += '\n';
    }

    if (msg.length > 4000) {
      msg = msg.slice(0, 3990) + '\n\n... (ver más en la web)';
    }

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (err: any) {
    const data = err.response?.data;
    let errorMsg = err.message || 'Error al obtener resultados';
    if (data?.detail) errorMsg = data.detail;
    await ctx.reply(`❌ ${errorMsg}`);
  }
}
