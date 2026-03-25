import type { Bot } from 'grammy';
import { authGuard } from '../middleware/auth.js';
import { getSession } from '../utils/store.js';
import { acreditacionService, tarjetaService } from '../api.js';
import { tarjetasKeyboard } from '../keyboards/keyboards.js';
import { formatMonto } from '../utils/format.js';

export function registerAcreditacionHandlers(bot: Bot) {
  // /acreditar command
  bot.command('acreditar', authGuard, async (ctx) => {
    await startAcreditacion(ctx);
  });

  // Menu button "💳 Acreditar"
  bot.hears('💳 Acreditar', authGuard, async (ctx) => {
    await startAcreditacion(ctx);
  });

  // Step 1: Select tarjeta
  bot.callbackQuery(/^acred:tar:(\d+)$/, authGuard, async (ctx) => {
    const chatId = ctx.chat!.id;
    const session = getSession(chatId);
    const tarjetaId = parseInt(ctx.match[1]);

    // Get full tarjeta details
    const tarjetas = await tarjetaService.getAll(chatId);
    const tarjeta = tarjetas.find((t: any) => t.id === tarjetaId);

    if (!tarjeta) {
      await ctx.answerCallbackQuery('Tarjeta no encontrada');
      return;
    }

    session.wizardData.tarjetaId = tarjetaId;
    session.wizardData.tarjetaNumero = tarjeta.numero || 'N/A';
    session.wizardData.tarjetaMovil = tarjeta.movil || 'N/A';
    session.wizardStep = 'acreditacion:monto';

    await ctx.answerCallbackQuery();
    await ctx.reply(
      `💳 *Datos de la tarjeta seleccionada:*\n\n` +
      `🏦 Banco: ${tarjeta.banco || 'N/A'}\n` +
      `🔢 Tarjeta: ${tarjeta.numero || 'N/A'}\n` +
      `📱 Móvil: ${tarjeta.movil || 'N/A'}\n\n` +
      `Realiza tu transferencia a estos datos y luego ingresa el monto transferido (en CUP):`,
      { parse_mode: 'Markdown' }
    );
  });

  // Handle text input for acreditacion wizard
  bot.on('message:text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const session = getSession(chatId);
    const text = ctx.message.text;

    if (session.wizardStep?.startsWith('acreditacion:') === false) return next();
    if (!session.wizardStep?.startsWith('acreditacion:')) return next();
    if (text.startsWith('/')) return next();

    if (session.wizardStep === 'acreditacion:monto') {
      const monto = parseFloat(text);
      if (isNaN(monto) || monto <= 0) {
        await ctx.reply('❌ Ingresa un monto válido mayor a 0:');
        return;
      }
      session.wizardData.monto = monto;
      session.wizardStep = 'acreditacion:id_transferencia';
      await ctx.reply('🔢 Ingresa el ID de la transferencia:');
      return;
    }

    if (session.wizardStep === 'acreditacion:id_transferencia') {
      session.wizardData.id_transferencia = text;
      session.wizardStep = 'acreditacion:sms';
      await ctx.reply('📱 Ingresa el mensaje SMS de confirmación de la transferencia:');
      return;
    }

    if (session.wizardStep === 'acreditacion:sms') {
      session.wizardData.sms_confirmacion = text;
      session.wizardStep = null;

      try {
        await ctx.reply('⏳ Procesando solicitud...');
        await acreditacionService.create(chatId, {
          tarjeta: session.wizardData.tarjetaId,
          monto: session.wizardData.monto,
          sms_confirmacion: session.wizardData.sms_confirmacion,
          id_transferencia: session.wizardData.id_transferencia,
        });

        await ctx.reply(
          `✅ *Solicitud de acreditación enviada*\n\n` +
          `💵 Monto: ${formatMonto(session.wizardData.monto)}\n` +
          `🔢 Transferencia: ${session.wizardData.id_transferencia}\n\n` +
          `⏳ Tu solicitud está pendiente de aprobación.`,
          { parse_mode: 'Markdown' }
        );
      } catch (err: any) {
        const data = err.response?.data;
        let errorMsg = err.message || 'Error al crear solicitud';
        if (data) {
          if (data.detail) errorMsg = data.detail;
          else if (data.non_field_errors) errorMsg = data.non_field_errors.join(', ');
          else errorMsg = JSON.stringify(data);
        }
        await ctx.reply(`❌ ${errorMsg}`);
      }

      session.wizardData = {};
      return;
    }

    return next();
  });
}

async function startAcreditacion(ctx: any) {
  const chatId = ctx.chat.id;
  const session = getSession(chatId);

  try {
    const tarjetas = await tarjetaService.getAll(chatId);

    if (!tarjetas || tarjetas.length === 0) {
      await ctx.reply('❌ No hay tarjetas de pago disponibles. Contacta al administrador.');
      return;
    }

    session.wizardStep = null;
    session.wizardData = {};

    await ctx.reply(
      '💳 *Acreditar Saldo*\n\nPaso 1: Selecciona la tarjeta a la que transferiste:',
      { parse_mode: 'Markdown', reply_markup: tarjetasKeyboard(tarjetas, 'acred:tar') }
    );
  } catch (err: any) {
    const data = err.response?.data;
    let errorMsg = err.message || 'Error al cargar tarjetas';
    if (data) {
      if (data.detail) errorMsg = data.detail;
      else errorMsg = JSON.stringify(data);
    }
    await ctx.reply(`❌ ${errorMsg}`);
  }
}
