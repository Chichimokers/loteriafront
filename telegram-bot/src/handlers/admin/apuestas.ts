import type { Bot } from 'grammy';
import { adminGuard } from '../../middleware/admin.js';
import { apuestaService } from '../../api.js';
import { formatMonto } from '../../utils/format.js';

export function registerAdminApuestasHandlers(bot: Bot) {
  // /admin_apuestas command
  bot.command('admin_apuestas', adminGuard, async (ctx) => {
    await showAllApuestas(ctx);
  });

  // Admin callback - apuestas
  bot.callbackQuery('admin:apuestas', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showAllApuestas(ctx);
  });

  // Filter callbacks
  bot.callbackQuery(/^admin:apuestas_filter:(.+)$/, adminGuard, async (ctx) => {
    const filter = ctx.match[1];
    await ctx.answerCallbackQuery();
    await showAllApuestas(ctx, filter);
  });
}

async function showAllApuestas(ctx: any, filter: string = 'todas') {
  const chatId = ctx.chat.id;

  try {
    const apuestas = await apuestaService.getAllApuestas(chatId);

    if (!apuestas || apuestas.length === 0) {
      await ctx.reply('No hay apuestas registradas.');
      return;
    }

    let filtered = apuestas;
    if (filter === 'ganadas') filtered = apuestas.filter((a: any) => a.paga === true);
    else if (filter === 'perdidas') filtered = apuestas.filter((a: any) => a.paga === false && a.resultado);
    else if (filter === 'pendientes') filtered = apuestas.filter((a: any) => !a.resultado);

    const kb = new (await import('grammy')).InlineKeyboard()
      .text('Todas', 'admin:apuestas_filter:todas')
      .text('✅ Ganadas', 'admin:apuestas_filter:ganadas')
      .row()
      .text('❌ Perdidas', 'admin:apuestas_filter:perdidas')
      .text('⏳ Pendientes', 'admin:apuestas_filter:pendientes');

    const recent = filtered.slice(0, 10);
    let msg = `📝 *Apuestas* (${filtered.length} de ${apuestas.length}) - Filtro: ${filter}\n\n`;

    for (const a of recent) {
      const status = a.paga === true ? '✅' : a.paga === false && a.resultado ? '❌' : '⏳';
      const numeros = Array.isArray(a.numeros) ? a.numeros.join(', ') : a.numeros;
      msg += `${status} #${a.id} - ${a.usuario_email || 'N/A'}\n`;
      msg += `  🎰 ${a.loteria_nombre || 'N/A'} | 🎯 ${numeros}\n`;
      msg += `  💵 ${formatMonto(a.monto_total || 0)}\n\n`;
    }

    if (msg.length > 4000) msg = msg.slice(0, 3990) + '\n...';

    await ctx.reply(msg, { parse_mode: 'Markdown', reply_markup: kb });
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener apuestas.');
  }
}
