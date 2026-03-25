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
    // Same approach as frontend: get tiradas + loterias separately
    const [tiradasData, loteriasData] = await Promise.all([
      lotteryService.getTiradas(chatId),
      lotteryService.getLoterias(chatId),
    ]);

    // Filter only active tiradas
    const tiradasActivas = tiradasData.filter((t: any) => t.activa);

    if (tiradasActivas.length === 0) {
      await ctx.reply('📊 No hay resultados para hoy aún.');
      return;
    }

    // Build lotería name map from loterias
    const loteriasMap = new Map<number, string>();
    for (const l of loteriasData) {
      loteriasMap.set(l.id, l.nombre);
    }

    // Group tiradas by lotería ID
    const gruposMap = new Map<number, { nombre: string; tiradas: any[] }>();

    for (const t of tiradasActivas) {
      const loteriaId = t.loteria || t.loteria_id;
      if (!gruposMap.has(loteriaId)) {
        gruposMap.set(loteriaId, {
          nombre: loteriasMap.get(loteriaId) || t.loteria_nombre || 'Lotería',
          tiradas: [],
        });
      }
      gruposMap.get(loteriaId)!.tiradas.push(t);
    }

    // Sort tiradas by hora within each group
    gruposMap.forEach((grupo) => {
      grupo.tiradas.sort((a, b) => a.hora.localeCompare(b.hora));
    });

    // Get today's date formatted
    const today = new Date();
    const fechaStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const fechaCapitalized = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);

    let msg = `📊 *Resultados de Hoy*\n📅 ${fechaCapitalized}\n\n`;

    for (const [, grupo] of gruposMap) {
      const conResultados = grupo.tiradas.filter((t: any) => t.resultado_hoy).length;
      const total = grupo.tiradas.length;
      const icono = conResultados === total && total > 0 ? '✅' : '⏳';
      msg += `${icono} *${grupo.nombre}* (${conResultados}/${total})\n`;

      for (const t of grupo.tiradas) {
        const resultado = t.resultado_hoy;
        const pick3 = resultado?.pick_3;
        const pick4 = resultado?.pick_4;

        if (pick3 || pick4) {
          msg += `  ✅ ${formatHora(t.hora)}:`;
          if (pick3) msg += ` 🎱 ${pick3.split('').join(' ')}`;
          if (pick4) msg += ` | ${pick4.split('').join(' ')}`;
        } else {
          msg += `  ⏳ ${formatHora(t.hora)}: ⏳ Pendiente`;
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
