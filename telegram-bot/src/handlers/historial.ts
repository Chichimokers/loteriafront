import type { Bot } from 'grammy';
import { authGuard } from '../middleware/auth.js';
import { apuestaService } from '../api.js';
import { formatMonto, formatHora } from '../utils/format.js';

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
    let msg = `📋 Mis Apuestas (últimas ${recent.length} de ${apuestas.length})\n\n`;

    for (const a of recent) {
      const status = a.paga === true ? '✅ Ganado' : a.paga === false && a.resultado ? '❌ Perdido' : '⏳ Pendiente';
      msg += `${status} #${a.id}\n`;
      msg += `  🎰 ${a.loteria_nombre || 'N/A'}`;
      if (a.hora_tirada || a.tirada_hora) msg += ` - ${formatHora(a.hora_tirada || a.tirada_hora)}`;
      msg += '\n';
      if (a.modalidad_nombre) msg += `  📐 ${a.modalidad_nombre}\n`;

      // Mostrar combinaciones generadas (candado) o números normales
      if (a.combinaciones_generadas && a.combinaciones_generadas.length > 0) {
        const combos = a.combinaciones_generadas.map((p: string[]) => `${p[0]}-${p[1]}`).join(', ');
        msg += `  🔗 Combinaciones (${a.combinaciones_generadas.length}): ${combos}\n`;
      } else if (Array.isArray(a.numeros) && a.numeros.length > 0 && Array.isArray(a.numeros[0])) {
        // Parlé directo: números son parejas
        const parejas = a.numeros.map((p: string[]) => `${p[0]}-${p[1]}`).join(', ');
        msg += `  🎯 Parejas: ${parejas}\n`;
      } else {
        const numeros = Array.isArray(a.numeros) ? a.numeros.join(', ') : a.numeros;
        msg += `  🎯 ${numeros}\n`;
      }

      msg += `  💵 ${formatMonto(a.monto_total || 0)}`;
      if (a.premio_total > 0) msg += ` → 🏆 ${formatMonto(a.premio_total)}`;
      msg += `\n  📅 ${a.fecha || ''}`;

      // Show result if available
      if (a.resultado) {
        if (a.resultado.pick_3) {
          const p3 = a.resultado.pick_3.split('').join(' ');
          msg += `\n  🎱 Pick 3: ${p3}`;
        }
        if (a.resultado.pick_4) {
          const p4 = a.resultado.pick_4.split('').join(' ');
          msg += `\n  🎱 Pick 4: ${p4}`;
        }
      }
      msg += '\n\n';
    }

    // Telegram message limit is 4096 chars
    if (msg.length > 4000) {
      msg = msg.slice(0, 3990) + '\n\n... (ver más en la web)';
    }

    await ctx.reply(msg);
  } catch (err: any) {
    const data = err.response?.data;
    let errorMsg = err.message || 'Error al obtener historial';
    if (data?.detail) errorMsg = data.detail;
    await ctx.reply(`❌ ${errorMsg}`);
  }
}
