// messenger.js — Capa de mensajería con Telegram (Telegraf)
require('dotenv').config();
const { Telegraf } = require('telegraf');
const cliente = require('./commands/cliente');
const admin = require('./commands/admin');
const memory = require('./memory');
const sessionStore = require('./sessionStore');
const logger = require('./logger');

const BUSINESS_ID = process.env.BUSINESS_ID;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

// Sesiones admin activas: chatId → timestamp de última actividad
const adminSessions = new Map();
const ADMIN_SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

function isAdminSession(chatId) {
  const lastActivity = adminSessions.get(chatId);
  if (!lastActivity) return false;
  if (Date.now() - lastActivity > ADMIN_SESSION_TIMEOUT_MS) {
    adminSessions.delete(chatId);
    return false;
  }
  return true;
}

function refreshAdminSession(chatId) {
  adminSessions.set(chatId, Date.now());
}

function createBot() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  // ── /start ────────────────────────────────────────────────────────────────
  bot.start(async (ctx) => {
    const chatId = String(ctx.chat.id);
    const respuesta = await cliente.handleMessage(
      BUSINESS_ID,
      chatId,
      '/start — El paciente ha iniciado la conversación por primera vez.',
      bot
    );
    await ctx.reply(respuesta);
  });

  // ── Mensajes de texto ─────────────────────────────────────────────────────
  bot.on('text', async (ctx) => {
    const chatId = String(ctx.chat.id);
    const texto = ctx.message.text.trim();

    // Mostrar "escribiendo..."
    try { await ctx.sendChatAction('typing'); } catch (_) {}

    // ── Modo admin: activar sesión o procesar comando ──────────────────────
    if (texto.toLowerCase().startsWith('#admin')) {
      // Verificar que es el admin (por chat_id) o el dueño conocido
      if (ADMIN_CHAT_ID && chatId !== ADMIN_CHAT_ID) {
        // Si no es el admin, tratar como mensaje de paciente normal
        return await handlePatient(ctx, bot, chatId, texto);
      }

      refreshAdminSession(chatId);
      let respuesta;
      try {
        respuesta = await admin.handleMessage(BUSINESS_ID, chatId, texto, bot);
      } catch (err) {
        console.error('[messenger] Error en admin:', err);
        respuesta = '⚠️ Error procesando el comando. Inténtalo de nuevo.';
      }
      return await ctx.reply(respuesta, { parse_mode: 'Markdown' });
    }

    // ── Si el chat_id es el del admin y tiene sesión activa ────────────────
    if (ADMIN_CHAT_ID && chatId === ADMIN_CHAT_ID && isAdminSession(chatId)) {
      refreshAdminSession(chatId);
      let respuesta;
      try {
        respuesta = await admin.handleMessage(BUSINESS_ID, chatId, `#admin ${texto}`, bot);
      } catch (err) {
        console.error('[messenger] Error en admin (sesión):', err);
        respuesta = '⚠️ Error procesando el comando.';
      }
      return await ctx.reply(respuesta, { parse_mode: 'Markdown' });
    }

    // ── Modo paciente ─────────────────────────────────────────────────────
    await handlePatient(ctx, bot, chatId, texto);
  });

  // ── Mensajes de voz (no soportados todavía) ───────────────────────────────
  bot.on('voice', async (ctx) => {
    const idioma = await getPatientIdioma(String(ctx.chat.id));
    const msg = idioma === 'en'
      ? 'I\'m sorry, I\'m not able to process voice messages at the moment. Please write your query and I\'ll be happy to help you.'
      : 'Lo siento, de momento no puedo procesar mensajes de voz. Por favor, escríbame su consulta y estaré encantada de ayudarle.';
    await ctx.reply(msg);
  });

  // ── Fotos / documentos ────────────────────────────────────────────────────
  bot.on(['photo', 'document'], async (ctx) => {
    const idioma = await getPatientIdioma(String(ctx.chat.id));
    const msg = idioma === 'en'
      ? 'I have received your file. To manage documents or images related to your history, our team will get in touch with you. If you have any questions, please write to me.'
      : 'He recibido su archivo. Para gestionar documentos o imágenes relacionadas con su historial, nuestro equipo se pondrá en contacto con usted. Si tiene alguna pregunta, escríbame.';
    await ctx.reply(msg);
  });

  // ── Errores globales ──────────────────────────────────────────────────────
  bot.catch(async (err, ctx) => {
    logger.error({ canal: 'telegram', msg: 'error no capturado', error: err.message });
    try {
      const idioma = await getPatientIdioma(String(ctx.chat?.id));
      const msg = idioma === 'en'
        ? 'An unexpected error has occurred. Our team has been notified. Please try again.'
        : 'Ha ocurrido un error inesperado. Nuestro equipo está siendo notificado. Por favor, inténtelo de nuevo.';
      await ctx.reply(msg);
    } catch (_) {}
  });

  return bot;
}

async function handlePatient(ctx, bot, chatId, texto) {
  const done = logger.timer({ canal: 'telegram', businessId: BUSINESS_ID, chatId });
  let respuesta;
  try {
    let mensajeFinal = texto;

    // If this patient was sent an outbound message expecting a reply, inject context
    const outboundCtx = sessionStore.getOutboundContext(chatId);
    if (outboundCtx) {
      sessionStore.clearOutboundContext(chatId);

      // Respuesta a encuesta: manejar directamente sin pasar por el LLM
      if (outboundCtx.label === 'encuesta_satisfaccion') {
        const handled = await handleEncuestaRespuesta(ctx, chatId, texto, outboundCtx);
        if (handled) return;
        // Si no es un número válido, el paciente escribió algo libre → cae al agente con contexto
      }

      mensajeFinal =
        `[CONTEXTO: El paciente responde a este mensaje previo del sistema: "${outboundCtx.originalMessage}"]` +
        `\n\n${texto}`;
    }

    respuesta = await cliente.handleMessage(BUSINESS_ID, chatId, mensajeFinal, bot);
    done({ msg: 'respuesta enviada' });
  } catch (err) {
    logger.error({ canal: 'telegram', businessId: BUSINESS_ID, chatId, msg: 'error en handlePatient', error: err.message });
    const idioma = await getPatientIdioma(chatId);
    respuesta = idioma === 'en'
      ? 'I\'m sorry, I\'m experiencing technical difficulties. Please try again in a few moments or call us directly.'
      : 'Lo siento, estoy teniendo dificultades técnicas. Por favor, inténtelo de nuevo en unos momentos o llámenos directamente.';
  }
  await ctx.reply(respuesta);
}

async function handleEncuestaRespuesta(ctx, chatId, texto, outboundCtx) {
  const puntuacion = parseInt(texto.trim(), 10);
  if (isNaN(puntuacion) || puntuacion < 1 || puntuacion > 5) return false;

  const idioma = outboundCtx.idioma || 'es';

  // Guardar valoración en la cita
  if (outboundCtx.citaId) {
    await memory.setValoracionCita(outboundCtx.citaId, puntuacion);
  }

  if (puntuacion >= 4) {
    let googleUrl = '';
    try {
      const config = require(`./clientes/${BUSINESS_ID}/config`);
      googleUrl = config.GOOGLE_MAPS_URL || '';
    } catch (_) {}

    const msg = idioma === 'en'
      ? `Thank you so much for your ${puntuacion}/5 rating! We're delighted you had a great experience.\n\nWould you mind sharing it on Google? It really helps us reach more patients.\n\n${googleUrl}`.trim()
      : `¡Muchas gracias por su valoración de ${puntuacion}/5! Nos alegra mucho que su experiencia haya sido tan positiva.\n\n¿Le importaría compartirla en Google? Nos ayuda mucho a llegar a más pacientes.\n\n${googleUrl}`.trim();

    await ctx.reply(msg);
    await memory.saveNotificacion(BUSINESS_ID, 'solicitar_resena', msg, chatId);
  } else {
    const msg = idioma === 'en'
      ? `Thank you for your honest feedback. We're sorry the experience wasn't as expected. We'd genuinely like to know how we can improve — feel free to share anything that didn't meet your expectations.`
      : `Gracias por su valoración sincera. Lamentamos que la experiencia no haya sido la esperada. Nos gustaría saber cómo podemos mejorar. Si desea contarnos algo más, estamos a su disposición.`;
    await ctx.reply(msg);
  }

  return true;
}

async function getPatientIdioma(chatId) {
  try {
    const patient = await memory.getPatient(BUSINESS_ID, chatId);
    return patient?.idioma_preferido || 'es';
  } catch (_) {
    return 'es';
  }
}

module.exports = { createBot };
