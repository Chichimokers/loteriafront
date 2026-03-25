import type { Bot, Context } from 'grammy';
import { getSession, clearSession } from '../utils/store.js';
import { authService } from '../api.js';
import { mainMenuKeyboard, adminMenuKeyboard, banksKeyboard } from '../keyboards/keyboards.js';
import { formatMonto } from '../utils/format.js';

export function registerStartHandlers(bot: Bot) {
  // /start command
  bot.command('start', async (ctx) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);

    if (session.user) {
      const menuKb = session.user.is_staff ? adminMenuKeyboard : mainMenuKeyboard;
      await ctx.reply(
        `🎰 *Bienvenido de nuevo, ${session.user.email}!*\n\nTu oportunidad de ganar`,
        { parse_mode: 'Markdown', reply_markup: menuKb }
      );
    } else {
      await ctx.reply(
        `🎰 *Bienvenido a Lotería*\n_Tu oportunidad de ganar_\n\n` +
        `Para comenzar, necesitas iniciar sesión o registrarte:\n\n` +
        `/login - Iniciar sesión\n` +
        `/register - Crear cuenta nueva`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  // /login command
  bot.command('login', async (ctx) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    session.wizardStep = 'login:email';
    session.wizardData = {};
    await ctx.reply('📧 Ingresa tu email:');
  });

  // /register command
  bot.command('register', async (ctx) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    session.wizardStep = 'register:email';
    session.wizardData = {};
    await ctx.reply(
      '📝 *Crear cuenta nueva*\n\n📧 Ingresa tu email:',
      { parse_mode: 'Markdown' }
    );
  });

  // /logout command
  bot.command('logout', async (ctx) => {
    const chatId = ctx.chat.id;
    clearSession(chatId);
    await ctx.reply('✅ Sesión cerrada correctamente.', {
      reply_markup: { remove_keyboard: true },
    });
  });

  // Handle text messages for login/register wizards
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    const text = ctx.message.text;

    // Skip if it's a command
    if (text.startsWith('/')) return next();

    // Login wizard
    if (session.wizardStep?.startsWith('login:')) {
      await handleLoginWizard(ctx, session, text);
      return;
    }

    // Register wizard
    if (session.wizardStep?.startsWith('register:')) {
      await handleRegisterWizard(ctx, session, text);
      return;
    }

    // Handle menu buttons
    if (['💰 Saldo', '📊 Resultados', '📋 Historial', '👤 Perfil', '🎰 Apostar', '💳 Acreditar', '💸 Extraer', '🔧 Admin'].includes(text)) {
      return next();
    }

    return next();
  });

  // Handle bank selection callback
  bot.callbackQuery(/^bank:(.+)$/, async (ctx) => {
    const chatId = ctx.chat!.id;
    const session = getSession(chatId);
    const bank = ctx.match[1];

    if (session.wizardStep === 'register:banco') {
      session.wizardData.banco = bank;
      session.wizardStep = 'register:tarjeta';
      await ctx.answerCallbackQuery();
      await ctx.reply('💳 Ingresa tu número de tarjeta bancaria (formato: xxxx-xxxx-xxxx-xxxx):');
    }
  });
}

async function handleLoginWizard(ctx: Context, session: ReturnType<typeof getSession>, text: string) {
  const chatId = ctx.chat!.id;

  if (session.wizardStep === 'login:email') {
    session.wizardData.email = text;
    session.wizardStep = 'login:password';
    await ctx.reply('🔑 Ingresa tu contraseña:');
    return;
  }

  if (session.wizardStep === 'login:password') {
    session.wizardData.password = text;
    session.wizardStep = null;

    try {
      await ctx.reply('⏳ Iniciando sesión...');
      const tokens = await authService.login({
        email: session.wizardData.email,
        password: session.wizardData.password,
      });

      session.accessToken = tokens.access;
      session.refreshToken = tokens.refresh;

      const user = await authService.getCurrentUser(chatId);
      session.user = user;

      const menuKb = user.is_staff ? adminMenuKeyboard : mainMenuKeyboard;
      await ctx.reply(
        `✅ *Bienvenido, ${user.email}!*\n\n` +
        `💰 Saldo Principal: ${formatMonto(user.saldo_principal)}\n` +
        `💸 Saldo Extracción: ${formatMonto(user.saldo_extraccion)}`,
        { parse_mode: 'Markdown', reply_markup: menuKb }
      );
    } catch (err: any) {
      const data = err.response?.data;
      let errorMsg = err.message || 'Error de conexión';
      if (data) {
        if (data.detail) errorMsg = data.detail;
        else if (data.non_field_errors) errorMsg = data.non_field_errors.join(', ');
        else errorMsg = JSON.stringify(data);
      }
      await ctx.reply(
        `❌ Error al iniciar sesión: ${errorMsg}\n\nUsa /login para intentar de nuevo.`
      );
    }
    session.wizardData = {};
    return;
  }
}

async function handleRegisterWizard(ctx: Context, session: ReturnType<typeof getSession>, text: string) {
  const chatId = ctx.chat!.id;

  if (session.wizardStep === 'register:email') {
    session.wizardData.email = text;
    session.wizardStep = 'register:password';
    await ctx.reply('🔑 Ingresa una contraseña:');
    return;
  }

  if (session.wizardStep === 'register:password') {
    session.wizardData.password = text;
    session.wizardStep = 'register:password2';
    await ctx.reply('🔑 Confirma tu contraseña:');
    return;
  }

  if (session.wizardStep === 'register:password2') {
    if (text !== session.wizardData.password) {
      await ctx.reply('❌ Las contraseñas no coinciden. Ingresa la contraseña de nuevo:');
      session.wizardStep = 'register:password';
      return;
    }
    session.wizardStep = 'register:movil';
    await ctx.reply('📱 Ingresa tu número de móvil (ej: 5XXXXXXX):');
    return;
  }

  if (session.wizardStep === 'register:movil') {
    session.wizardData.movil = text;
    session.wizardStep = 'register:banco';
    await ctx.reply('🏦 Selecciona tu banco:', { reply_markup: banksKeyboard });
    return;
  }

  if (session.wizardStep === 'register:tarjeta') {
    session.wizardData.tarjeta_bancaria = text;
    session.wizardStep = null;

    try {
      await ctx.reply('⏳ Creando cuenta...');
      await authService.register({
        email: session.wizardData.email,
        password: session.wizardData.password,
        movil: session.wizardData.movil,
        tarjeta_bancaria: session.wizardData.tarjeta_bancaria,
        banco: session.wizardData.banco,
      });

      // Auto login
      const tokens = await authService.login({
        email: session.wizardData.email,
        password: session.wizardData.password,
      });

      session.accessToken = tokens.access;
      session.refreshToken = tokens.refresh;

      const user = await authService.getCurrentUser(chatId);
      session.user = user;

      const menuKb = user.is_staff ? adminMenuKeyboard : mainMenuKeyboard;
      await ctx.reply(
        `✅ *Cuenta creada exitosamente!*\n\nBienvenido, ${user.email}!`,
        { parse_mode: 'Markdown', reply_markup: menuKb }
      );
    } catch (err: any) {
      const errors = err.response?.data;
      let errorMsg = 'Error al crear cuenta';
      if (errors) {
        errorMsg = Object.entries(errors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('\n');
      }
      await ctx.reply(`❌ ${errorMsg}\n\nUsa /register para intentar de nuevo.`);
    }
    session.wizardData = {};
    return;
  }
}
