import type { Bot } from 'grammy';
import { adminGuard } from '../../middleware/admin.js';
import { getSession } from '../../utils/store.js';
import { lotteryService, resultadoService } from '../../api.js';
import { tiradasKeyboard } from '../../keyboards/keyboards.js';
import { formatHora } from '../../utils/format.js';

export function registerAdminResultadosHandlers(bot: Bot) {
  // /admin_resultados command
  bot.command('admin_resultados', adminGuard, async (ctx) => {
    await startResultadoWizard(ctx);
  });

  // Admin callback - resultados
  bot.callbackQuery('admin:resultados', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    await startResultadoWizard(ctx);
  });

  // Select tirada for result
  bot.callbackQuery(/^admin_res:tir:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const session = getSession(chatId);
    const tiradaId = parseInt(ctx.match[1]);

    try {
      const tiradas = await lotteryService.getTiradas(chatId);
      const tirada = tiradas.find((t: any) => t.id === tiradaId);

      if (!tirada) {
        await ctx.answerCallbackQuery('Tirada no encontrada');
        return;
      }

      session.wizardData.tiradaId = tiradaId;
      session.wizardData.tiradaInfo = `${tirada.loteria_nombre || 'Lotería'} - ${formatHora(tirada.hora)}`;
      session.wizardStep = 'admin:resultado:pick3';

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `🎲 *Ingresar Resultado*\n${session.wizardData.tiradaInfo}\n\n` +
        `Ingresa el Pick 3 (3 dígitos, ej: 123):`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al obtener tirada.');
    }
  });

  // Handle result input
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    const text = ctx.message.text;

    if (!session.wizardStep?.startsWith('admin:resultado:')) return next();
    if (text.startsWith('/')) return next();

    if (session.wizardStep === 'admin:resultado:pick3') {
      if (!/^\d{1,3}$/.test(text)) {
        await ctx.reply('❌ Ingresa exactamente 3 dígitos para Pick 3:');
        return;
      }
      session.wizardData.pick3 = text.padStart(3, '0');
      session.wizardStep = 'admin:resultado:pick4';
      await ctx.reply('Ingresa el Pick 4 (4 dígitos, ej: 1234):');
      return;
    }

    if (session.wizardStep === 'admin:resultado:pick4') {
      if (!/^\d{1,4}$/.test(text)) {
        await ctx.reply('❌ Ingresa exactamente 4 dígitos para Pick 4:');
        return;
      }
      session.wizardData.pick4 = text.padStart(4, '0');
      session.wizardStep = null;

      try {
        await ctx.reply('⏳ Guardando resultado...');
        await resultadoService.create(chatId, {
          tirada_id: session.wizardData.tiradaId,
          pick_3: session.wizardData.pick3,
          pick_4: session.wizardData.pick4,
        });

        await ctx.reply(
          `✅ *Resultado guardado*\n\n` +
          `🎯 ${session.wizardData.tiradaInfo}\n` +
          `Pick 3: 🎱 ${session.wizardData.pick3.split('').join(' ')}\n` +
          `Pick 4: 🎱 ${session.wizardData.pick4.split('').join(' ')}`,
          { parse_mode: 'Markdown' }
        );
      } catch (err: any) {
        const msg = err.response?.data?.detail || 'Error al guardar resultado';
        await ctx.reply(`❌ ${msg}`);
      }

      session.wizardData = {};
      return;
    }

    return next();
  });
}

async function startResultadoWizard(ctx: any) {
  const chatId = ctx.chat.id;
  const session = getSession(chatId);

  try {
    const tiradas = await lotteryService.getTiradas(chatId);
    const withoutResult = tiradas.filter((t: any) => !t.resultado_hoy && t.activa);

    if (withoutResult.length === 0) {
      await ctx.reply('✅ Todas las tiradas activas ya tienen resultado hoy.');
      return;
    }

    session.wizardStep = null;
    session.wizardData = {};

    await ctx.reply(
      '🎲 *Ingresar Resultado*\n\nSelecciona la tirada:',
      { parse_mode: 'Markdown', reply_markup: tiradasKeyboard(withoutResult, 'admin_res:tir') }
    );
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener tiradas.');
  }
}
