import type { Bot } from 'grammy';
import { adminGuard } from '../../middleware/admin.js';
import { usuarioService } from '../../api.js';
import { formatMonto } from '../../utils/format.js';

export function registerAdminUsuariosHandlers(bot: Bot) {
  // /admin_usuarios command
  bot.command('admin_usuarios', adminGuard, async (ctx) => {
    await showUsuarios(ctx);
  });

  // Admin callback - usuarios list
  bot.callbackQuery('admin:usuarios', adminGuard, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showUsuarios(ctx);
  });

  // Select user to edit
  bot.callbackQuery(/^admin:user:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const userId = parseInt(ctx.match[1]);

    try {
      const users = await usuarioService.getAll(chatId);
      const user = users.find((u: any) => u.id === userId);

      if (!user) {
        await ctx.answerCallbackQuery('Usuario no encontrado');
        return;
      }

      const kb = new (await import('grammy')).InlineKeyboard()
        .text('💰 Editar Saldo Principal', `admin:edit_saldo:${userId}:principal`)
        .row()
        .text('💸 Editar Saldo Extracción', `admin:edit_saldo:${userId}:extraccion`)
        .row()
        .text(user.is_active ? '🔴 Desactivar' : '🟢 Activar', `admin:toggle_active:${userId}`)
        .row()
        .text('🔙 Volver', 'admin:usuarios');

      await ctx.answerCallbackQuery();
      await ctx.reply(
        `👤 *Usuario #${user.id}*\n\n` +
        `📧 Email: ${user.email}\n` +
        `📱 Móvil: ${user.movil || 'N/A'}\n` +
        `💳 Tarjeta: ${user.tarjeta_bancaria || 'N/A'}\n` +
        `🏦 Banco: ${user.banco || 'N/A'}\n` +
        `💰 Saldo Principal: ${formatMonto(user.saldo_principal || 0)}\n` +
        `💸 Saldo Extracción: ${formatMonto(user.saldo_extraccion || 0)}\n` +
        `🟢 Estado: ${user.is_active ? 'Activo' : 'Inactivo'}\n` +
        `🔑 Admin: ${user.is_staff ? 'Sí' : 'No'}`,
        { parse_mode: 'Markdown', reply_markup: kb }
      );
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al obtener usuario.');
    }
  });

  // Edit saldo
  bot.callbackQuery(/^admin:edit_saldo:(\d+):(principal|extraccion)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const userId = parseInt(ctx.match[1]);
    const tipo = ctx.match[2];
    const { getSession } = await import('../../utils/store.js');
    const session = getSession(chatId);
    session.wizardStep = `admin:set_saldo:${tipo}:${userId}`;
    await ctx.answerCallbackQuery();
    await ctx.reply(`Ingresa el nuevo saldo ${tipo}:`);
  });

  // Toggle active
  bot.callbackQuery(/^admin:toggle_active:(\d+)$/, adminGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const userId = parseInt(ctx.match[1]);

    try {
      const users = await usuarioService.getAll(chatId);
      const user = users.find((u: any) => u.id === userId);
      if (!user) {
        await ctx.answerCallbackQuery('Usuario no encontrado');
        return;
      }

      await usuarioService.update(chatId, userId, { is_active: !user.is_active });
      await ctx.answerCallbackQuery(user.is_active ? 'Usuario desactivado' : 'Usuario activado');
      await ctx.reply(user.is_active ? '🔴 Usuario desactivado.' : '🟢 Usuario activado.');
    } catch (err: any) {
      await ctx.answerCallbackQuery('Error');
      await ctx.reply('❌ Error al actualizar usuario.');
    }
  });

  // Handle saldo text input
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const { getSession } = await import('../../utils/store.js');
    const session = getSession(chatId);
    const text = ctx.message.text;

    if (!session.wizardStep?.startsWith('admin:set_saldo:')) return next();
    if (text.startsWith('/')) return next();

    const parts = session.wizardStep.split(':');
    const tipo = parts[2];
    const userId = parseInt(parts[3]);

    const monto = parseFloat(text);
    if (isNaN(monto) || monto < 0) {
      await ctx.reply('❌ Ingresa un monto válido (0 o mayor):');
      return;
    }

    try {
      const field = tipo === 'principal' ? 'saldo_principal' : 'saldo_extraccion';
      await usuarioService.update(chatId, userId, { [field]: monto });
      session.wizardStep = null;
      await ctx.reply(`✅ Saldo ${tipo} actualizado a ${formatMonto(monto)}`);
    } catch (err: any) {
      await ctx.reply('❌ Error al actualizar saldo.');
    }
  });
}

async function showUsuarios(ctx: any) {
  const chatId = ctx.chat.id;
  try {
    const users = await usuarioService.getAll(chatId);

    if (!users || users.length === 0) {
      await ctx.reply('No hay usuarios registrados.');
      return;
    }

    const kb = new (await import('grammy')).InlineKeyboard();
    for (const u of users.slice(0, 20)) {
      const status = u.is_active ? '🟢' : '🔴';
      kb.text(`${status} ${u.email}`, `admin:user:${u.id}`).row();
    }

    await ctx.reply(
      `👥 *Usuarios* (${users.length} total)\n\nSelecciona un usuario:`,
      { parse_mode: 'Markdown', reply_markup: kb }
    );
  } catch (err: any) {
    await ctx.reply('❌ Error al obtener usuarios.');
  }
}
