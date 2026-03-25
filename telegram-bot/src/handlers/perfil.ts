import type { Bot } from 'grammy';
import { authGuard } from '../middleware/auth.js';
import { getSession } from '../utils/store.js';
import { authService } from '../api.js';
import { banksKeyboard } from '../keyboards/keyboards.js';

export function registerPerfilHandlers(bot: Bot) {
  // /perfil command
  bot.command('perfil', authGuard, async (ctx) => {
    await showPerfil(ctx);
  });

  // Menu button "👤 Perfil"
  bot.hears('👤 Perfil', authGuard, async (ctx) => {
    await showPerfil(ctx);
  });

  // Handle edit perfil wizard
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    const text = ctx.message.text;

    if (!session.wizardStep?.startsWith('perfil:')) return next();
    if (text.startsWith('/')) return next();

    if (session.wizardStep === 'perfil:movil') {
      try {
        await authService.updateProfile(chatId, { movil: text });
        const user = await authService.getCurrentUser(chatId);
        session.user = user;
        session.wizardStep = null;
        await ctx.reply(`✅ Móvil actualizado: ${text}`);
      } catch (err: any) {
        await ctx.reply('❌ Error al actualizar móvil.');
      }
      return;
    }

    if (session.wizardStep === 'perfil:tarjeta') {
      try {
        await authService.updateProfile(chatId, { tarjeta_bancaria: text });
        const user = await authService.getCurrentUser(chatId);
        session.user = user;
        session.wizardStep = null;
        await ctx.reply(`✅ Tarjeta bancaria actualizada.`);
      } catch (err: any) {
        await ctx.reply('❌ Error al actualizar tarjeta.');
      }
      return;
    }

    return next();
  });

  // Edit movil callback
  bot.callbackQuery('perfil:edit:movil', authGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    getSession(chatId).wizardStep = 'perfil:movil';
    await ctx.answerCallbackQuery();
    await ctx.reply('📱 Ingresa tu nuevo número de móvil:');
  });

  // Edit tarjeta callback
  bot.callbackQuery('perfil:edit:tarjeta', authGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    getSession(chatId).wizardStep = 'perfil:tarjeta';
    await ctx.answerCallbackQuery();
    await ctx.reply('💳 Ingresa tu nuevo número de tarjeta bancaria:');
  });

  // Edit banco callback
  bot.callbackQuery('perfil:edit:banco', authGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    getSession(chatId).wizardStep = 'perfil:banco';
    await ctx.answerCallbackQuery();
    await ctx.reply('🏦 Selecciona tu nuevo banco:', { reply_markup: banksKeyboard });
  });

  // Bank selection for profile edit
  bot.callbackQuery(/^bank:(.+)$/, async (ctx, next) => {
    const chatId = ctx.chat!.id;
    const session = getSession(chatId);
    if (session.wizardStep !== 'perfil:banco') return next();

    const bank = ctx.match[1];
    try {
      await authService.updateProfile(chatId, { banco: bank });
      const user = await authService.getCurrentUser(chatId);
      session.user = user;
      session.wizardStep = null;
      await ctx.answerCallbackQuery();
      await ctx.reply(`✅ Banco actualizado: ${bank}`);
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al actualizar banco.');
    }
  });
}

async function showPerfil(ctx: any) {
  const chatId = ctx.chat.id;
  const session = getSession(chatId);

  try {
    const user = await authService.getCurrentUser(chatId);
    session.user = user;

    const kb = new (await import('grammy')).InlineKeyboard()
      .text('📱 Editar Móvil', 'perfil:edit:movil')
      .row()
      .text('💳 Editar Tarjeta', 'perfil:edit:tarjeta')
      .row()
      .text('🏦 Editar Banco', 'perfil:edit:banco');

    await ctx.reply(
      `👤 *Mi Perfil*\n\n` +
      `📧 Email: ${user.email}\n` +
      `📱 Móvil: ${user.movil || 'No definido'}\n` +
      `💳 Tarjeta: ${user.tarjeta_bancaria || 'No definida'}\n` +
      `🏦 Banco: ${user.banco || 'No definido'}\n\n` +
      `Selecciona qué deseas editar:`,
      { parse_mode: 'Markdown', reply_markup: kb }
    );
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener perfil.');
  }
}
