import type { Bot } from 'grammy';
import { adminGuard } from '../../middleware/admin.js';
import { adminService } from '../../api.js';
import { adminPanelKeyboard } from '../../keyboards/keyboards.js';
import { formatMonto } from '../../utils/format.js';

export function registerAdminPanelHandlers(bot: Bot) {
  // /admin command
  bot.command('admin', adminGuard, async (ctx) => {
    await showAdminPanel(ctx);
  });

  // Menu button "🔧 Admin"
  bot.hears('🔧 Admin', adminGuard, async (ctx) => {
    await showAdminPanel(ctx);
  });

  // Admin callback - panel
  bot.callbackQuery('admin:panel', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showAdminPanel(ctx);
  });

  // Admin callback - metricas
  bot.callbackQuery('admin:metricas', adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    try {
      const m = await adminService.getMetricas(chatId);
      await ctx.answerCallbackQuery();
      await ctx.reply(
        `📊 *Métricas del Día*\n\n` +
        `💰 Total Apostado Hoy: ${formatMonto(m.total_apostado_hoy || 0)}\n` +
        `🏆 Premios Pagados: ${formatMonto(m.premios_pagados || 0)}\n` +
        `💳 Acreditado Hoy: ${formatMonto(m.acreditado_hoy || 0)}\n` +
        `💸 Extraído Hoy: ${formatMonto(m.extraido_hoy || 0)}\n` +
        `🎰 Lotería Top: ${m.loteria_top || 'N/A'}\n` +
        `⏰ Tirada Top: ${m.tirada_top || 'N/A'}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al obtener métricas.');
    }
  });
}

async function showAdminPanel(ctx: any) {
  await ctx.reply(
    '🔧 *Panel de Administración*\n\nSelecciona una opción:',
    { parse_mode: 'Markdown', reply_markup: adminPanelKeyboard() }
  );
}
