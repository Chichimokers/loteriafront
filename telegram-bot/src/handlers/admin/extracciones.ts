import type { Bot } from 'grammy';
import { adminGuard } from '../../middleware/admin.js';
import { extraccionService } from '../../api.js';
import { approveRejectKeyboard } from '../../keyboards/keyboards.js';
import { formatMonto } from '../../utils/format.js';

export function registerAdminExtraccionesHandlers(bot: Bot) {
  // /admin_extracciones command
  bot.command('admin_extracciones', adminGuard, async (ctx) => {
    await showPendientes(ctx);
  });

  // Admin callback - extracciones
  bot.callbackQuery('admin:extracciones', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showPendientes(ctx);
  });

  // Approve extraccion
  bot.callbackQuery(/^admin_extr:approve:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const id = parseInt(ctx.match[1]);

    try {
      await extraccionService.approve(chatId, id);
      await ctx.answerCallbackQuery('Extracción aprobada');
      await ctx.reply(`✅ Extracción #${id} aprobada.`);
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply(`❌ Error al aprobar: ${err.response?.data?.detail || 'Error desconocido'}`);
    }
  });

  // Reject extraccion
  bot.callbackQuery(/^admin_extr:reject:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const id = parseInt(ctx.match[1]);

    try {
      await extraccionService.reject(chatId, id);
      await ctx.answerCallbackQuery('Extracción rechazada');
      await ctx.reply(`❌ Extracción #${id} rechazada.`);
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply(`❌ Error al rechazar: ${err.response?.data?.detail || 'Error desconocido'}`);
    }
  });
}

async function showPendientes(ctx: any) {
  const chatId = ctx.chat.id;

  try {
    const extracciones = await extraccionService.get(chatId, 'pendiente');

    if (!extracciones || extracciones.length === 0) {
      await ctx.reply('✅ No hay extracciones pendientes.');
      return;
    }

    for (const e of extracciones.slice(0, 10)) {
      await ctx.reply(
        `💸 *Extracción #${e.id}*\n\n` +
        `👤 Usuario: ${e.usuario_email || 'N/A'}\n` +
        `💵 Monto: ${formatMonto(e.monto)}\n` +
        `💳 Tarjeta destino: ${e.usuario_tarjeta || 'N/A'}\n` +
        `🏦 Banco: ${e.usuario_banco || 'N/A'}\n` +
        `📅 Fecha: ${e.fecha || 'N/A'}`,
        { parse_mode: 'Markdown', reply_markup: approveRejectKeyboard('admin_extr', e.id) }
      );
    }
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener extracciones.');
  }
}
