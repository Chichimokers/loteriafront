import type { Context, NextFunction } from 'grammy';
import { isAuthenticated } from '../utils/store.js';

export async function authGuard(ctx: Context, next: NextFunction) {
  if (!ctx.chat) return next();
  const chatId = ctx.chat.id;

  if (!isAuthenticated(chatId)) {
    await ctx.reply(
      '🔒 Necesitas iniciar sesión para usar esta función.\n\nUsa /login para entrar o /register para crear una cuenta.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  return next();
}
