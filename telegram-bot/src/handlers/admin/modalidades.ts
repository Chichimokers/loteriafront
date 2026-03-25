import type { Bot } from 'grammy';
import { adminGuard } from '../../middleware/admin.js';
import { getSession } from '../../utils/store.js';
import { lotteryService, modalidadService } from '../../api.js';

export function registerAdminModalidadesHandlers(bot: Bot) {
  // /admin_modalidades command
  bot.command('admin_modalidades', adminGuard, async (ctx) => {
    await showModalidades(ctx);
  });

  // Admin callback - modalidades
  bot.callbackQuery('admin:modalidades', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showModalidades(ctx);
  });

  // Select modality to edit
  bot.callbackQuery(/^admin_mod:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const modId = parseInt(ctx.match[1]);
    const session = getSession(chatId);

    try {
      const modalidades = await lotteryService.getModalidades(chatId);
      const mod = modalidades.find((m: any) => m.id === modId);

      if (!mod) {
        await ctx.answerCallbackQuery('Modalidad no encontrada');
        return;
      }

      session.wizardData.modId = modId;
      session.wizardData.modNombre = mod.nombre;
      session.wizardStep = 'admin:modalidad:premio';

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `📐 *${mod.nombre}*\n\n` +
        `Premio actual: ${mod.premio_por_peso}x\n\n` +
        `Ingresa el nuevo multiplicador de premio (ej: 600):`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al obtener modalidad.');
    }
  });

  // Handle premio input
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    const text = ctx.message.text;

    if (session.wizardStep !== 'admin:modalidad:premio') return next();
    if (text.startsWith('/')) return next();

    const premio = parseFloat(text);
    if (isNaN(premio) || premio <= 0) {
      await ctx.reply('❌ Ingresa un número válido mayor a 0:');
      return;
    }

    try {
      await modalidadService.update(chatId, session.wizardData.modId, { premio_por_peso: premio });
      session.wizardStep = null;
      await ctx.reply(
        `✅ *${session.wizardData.modNombre}* actualizado.\nNuevo premio: ${premio}x`,
        { parse_mode: 'Markdown' }
      );
    } catch (err: any) {
      await ctx.reply(`❌ Error al actualizar: ${err.response?.data?.detail || 'Error desconocido'}`);
    }

    session.wizardData = {};
  });
}

async function showModalidades(ctx: any) {
  const chatId = ctx.chat.id;

  try {
    const modalidades = await lotteryService.getModalidades(chatId);

    if (!modalidades || modalidades.length === 0) {
      await ctx.reply('No hay modalidades registradas.');
      return;
    }

    const kb = new (await import('grammy')).InlineKeyboard();
    for (const m of modalidades) {
      kb.text(`${m.nombre} (${m.premio_por_peso}x)`, `admin_mod:${m.id}`).row();
    }

    await ctx.reply(
      `📐 *Modalidades* (${modalidades.length})\n\nToca una para editar su multiplicador:`,
      { parse_mode: 'Markdown', reply_markup: kb }
    );
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener modalidades.');
  }
}
