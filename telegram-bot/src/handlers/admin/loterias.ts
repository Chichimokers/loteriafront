import type { Bot } from 'grammy';
import { adminGuard } from '../../middleware/admin.js';
import { lotteryService, adminService } from '../../api.js';

export function registerAdminLoteriasHandlers(bot: Bot) {
  // /admin_loterias command
  bot.command('admin_loterias', adminGuard, async (ctx) => {
    await showLoterias(ctx);
  });

  // Admin callback - loterias
  bot.callbackQuery('admin:loterias', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showLoterias(ctx);
  });

  // Toggle loteria active
  bot.callbackQuery(/^admin_lot:toggle:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const id = parseInt(ctx.match[1]);

    try {
      const loterias = await lotteryService.getLoterias(chatId);
      const lot = loterias.find((l: any) => l.id === id);
      if (!lot) {
        await ctx.answerCallbackQuery('Lotería no encontrada');
        return;
      }

      await adminService.updateLoteria(chatId, id, { activa: !lot.activa });
      await ctx.answerCallbackQuery(lot.activa ? 'Lotería desactivada' : 'Lotería activada');
      await ctx.reply(lot.activa ? '🔴 Lotería desactivada.' : '🟢 Lotería activada.');
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al actualizar lotería.');
    }
  });

  // Delete loteria confirmation
  bot.callbackQuery(/^admin_lot:delete:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const id = parseInt(ctx.match[1]);

    try {
      await adminService.deleteLoteria(chatId, id);
      await ctx.answerCallbackQuery('Lotería eliminada');
      await ctx.reply(`🗑️ Lotería #${id} eliminada.`);
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply(`❌ Error al eliminar: ${err.response?.data?.detail || 'Error desconocido'}`);
    }
  });
}

async function showLoterias(ctx: any) {
  const chatId = ctx.chat.id;

  try {
    const loterias = await lotteryService.getLoterias(chatId);

    if (!loterias || loterias.length === 0) {
      await ctx.reply('No hay loterías registradas.');
      return;
    }

    const kb = new (await import('grammy')).InlineKeyboard();
    for (const lot of loterias) {
      const status = lot.activa ? '🟢' : '🔴';
      kb.text(`${status} ${lot.nombre}`, `admin_lot:toggle:${lot.id}`);
      kb.text('🗑️', `admin_lot:delete:${lot.id}`).row();
    }

    await ctx.reply(
      `🎰 *Loterías* (${loterias.length})\n\n🟢 = Activa | 🔴 = Inactiva\n\nTocar para activar/desactivar:`,
      { parse_mode: 'Markdown', reply_markup: kb }
    );
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener loterías.');
  }
}
