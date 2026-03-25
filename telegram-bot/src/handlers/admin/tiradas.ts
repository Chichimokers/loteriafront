import type { Bot } from 'grammy';
import { adminGuard } from '../../middleware/admin.js';
import { lotteryService, adminService } from '../../api.js';
import { formatHora } from '../../utils/format.js';

export function registerAdminTiradasHandlers(bot: Bot) {
  // /admin_tiradas command
  bot.command('admin_tiradas', adminGuard, async (ctx) => {
    await showTiradas(ctx);
  });

  // Admin callback - tiradas
  bot.callbackQuery('admin:tiradas', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showTiradas(ctx);
  });

  // Toggle tirada active
  bot.callbackQuery(/^admin_tir:toggle:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const id = parseInt(ctx.match[1]);

    try {
      const tiradas = await lotteryService.getTiradas(chatId);
      const tirada = tiradas.find((t: any) => t.id === id);
      if (!tirada) {
        await ctx.answerCallbackQuery('Tirada no encontrada');
        return;
      }

      await adminService.updateTirada(chatId, id, { activa: !tirada.activa });
      await ctx.answerCallbackQuery(tirada.activa ? 'Tirada desactivada' : 'Tirada activada');
      await ctx.reply(tirada.activa ? '🔴 Tirada desactivada.' : '🟢 Tirada activada.');
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al actualizar tirada.');
    }
  });

  // Delete tirada
  bot.callbackQuery(/^admin_tir:delete:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const id = parseInt(ctx.match[1]);

    try {
      await adminService.deleteTirada(chatId, id);
      await ctx.answerCallbackQuery('Tirada eliminada');
      await ctx.reply(`🗑️ Tirada #${id} eliminada.`);
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply(`❌ Error al eliminar: ${err.response?.data?.detail || 'Error desconocido'}`);
    }
  });
}

async function showTiradas(ctx: any) {
  const chatId = ctx.chat.id;

  try {
    const tiradas = await lotteryService.getTiradas(chatId);

    if (!tiradas || tiradas.length === 0) {
      await ctx.reply('No hay tiradas registradas.');
      return;
    }

    const kb = new (await import('grammy')).InlineKeyboard();
    for (const t of tiradas) {
      const status = t.activa ? '🟢' : '🔴';
      const result = t.resultado_hoy ? '✅' : '';
      kb.text(`${status}${result} ${t.loteria_nombre || ''} - ${formatHora(t.hora)}`, `admin_tir:toggle:${t.id}`);
      kb.text('🗑️', `admin_tir:delete:${t.id}`).row();
    }

    await ctx.reply(
      `⏰ *Tiradas* (${tiradas.length})\n\n🟢 = Activa | 🔴 = Inactiva | ✅ = Con resultado hoy\n\nTocar para activar/desactivar:`,
      { parse_mode: 'Markdown', reply_markup: kb }
    );
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener tiradas.');
  }
}
