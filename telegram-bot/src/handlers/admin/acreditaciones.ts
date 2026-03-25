import type { Bot } from 'grammy';
import { adminGuard } from '../../middleware/admin.js';
import { acreditacionService } from '../../api.js';
import { approveRejectKeyboard } from '../../keyboards/keyboards.js';
import { formatMonto } from '../../utils/format.js';

export function registerAdminAcreditacionesHandlers(bot: Bot) {
  // /admin_acreditaciones command
  bot.command('admin_acreditaciones', adminGuard, async (ctx) => {
    await showPendientes(ctx);
  });

  // Admin callback - acreditaciones
  bot.callbackQuery('admin:acreditaciones', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showPendientes(ctx);
  });

  // Approve acreditacion
  bot.callbackQuery(/^admin_acred:approve:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const id = parseInt(ctx.match[1]);

    try {
      await acreditacionService.approve(chatId, id);
      await ctx.answerCallbackQuery('Acreditación aprobada');
      await ctx.reply(`✅ Acreditación #${id} aprobada.`);
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply(`❌ Error al aprobar: ${err.response?.data?.detail || 'Error desconocido'}`);
    }
  });

  // Reject acreditacion
  bot.callbackQuery(/^admin_acred:reject:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const id = parseInt(ctx.match[1]);

    try {
      await acreditacionService.reject(chatId, id);
      await ctx.answerCallbackQuery('Acreditación rechazada');
      await ctx.reply(`❌ Acreditación #${id} rechazada.`);
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply(`❌ Error al rechazar: ${err.response?.data?.detail || 'Error desconocido'}`);
    }
  });
}

async function showPendientes(ctx: any) {
  const chatId = ctx.chat.id;

  try {
    const acreditaciones = await acreditacionService.get(chatId, 'pendiente');

    if (!acreditaciones || acreditaciones.length === 0) {
      await ctx.reply('✅ No hay acreditaciones pendientes.');
      return;
    }

    for (const a of acreditaciones.slice(0, 10)) {
      await ctx.reply(
        `💳 *Acreditación #${a.id}*\n\n` +
        `👤 Usuario: ${a.usuario_email || 'N/A'}\n` +
        `💵 Monto: ${formatMonto(a.monto)}\n` +
        `🏦 Tarjeta: **** ${String(a.tarjeta_numero || '').slice(-4)}\n` +
        `📱 SMS: ${a.sms_confirmacion || 'N/A'}\n` +
        `🔢 Transferencia: ${a.id_transferencia || 'N/A'}\n` +
        `📅 Fecha: ${a.fecha || 'N/A'}`,
        { parse_mode: 'Markdown', reply_markup: approveRejectKeyboard('admin_acred', a.id) }
      );
    }
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener acreditaciones.');
  }
}
