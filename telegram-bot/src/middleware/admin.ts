import type { Context, NextFunction } from 'grammy';
import { isAuthenticated, isAdmin } from '../utils/store.js';

export async function adminGuard(ctx: Context, next: NextFunction) {
  if (!ctx.chat) return next();
  const chatId = ctx.chat.id;

  if (!isAuthenticated(chatId)) {
    await ctx.reply('🔒 Necesitas iniciar sesión primero. Usa /login');
    return;
  }

  if (!isAdmin(chatId)) {
    await ctx.reply('⛔ No tienes permisos de administrador.');
    return;
  }

  return next();
}
