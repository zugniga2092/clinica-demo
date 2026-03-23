// workflows/n8n-endpoints.js — Endpoints REST para automatizaciones n8n
const express = require('express');
const memory = require('../memory');
const config = require(`../clientes/${process.env.BUSINESS_ID}/config`);
const instrucciones = require(`../clientes/${process.env.BUSINESS_ID}/instrucciones`);

const router = express.Router();

// ── POST /agent — Endpoint principal para n8n ─────────────────────────────────
// Body: { businessId, action, data }

router.post('/agent', async (req, res) => {
  const { businessId, action, data } = req.body;

  if (!businessId || !action) {
    return res.status(400).json({ error: 'businessId y action son obligatorios' });
  }

  try {
    const result = await processAction(action, businessId, data, req.bot);
    res.json({ ok: true, result });
  } catch (err) {
    console.error(`[n8n] Error en acción "${action}":`, err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Procesador de acciones ────────────────────────────────────────────────────

async function processAction(action, businessId, data, bot) {
  switch (action) {

    // Recordatorio 48h antes de la cita
    case 'recordatorio_48h': {
      const { chatId, nombre, tratamiento, fecha, hora, idioma = 'es' } = data;
      const preInstr = instrucciones.getPreInstrucciones(tratamiento);
      const msg = idioma === 'en'
        ? `Dear ${nombre},\n\nThis is a reminder that your ${tratamiento} appointment is tomorrow, ${fecha} at ${hora}.\n\n${preInstr?.en || ''}\n\nSee you soon!`
        : `Estimado/a ${nombre},\n\nLe recordamos que tiene su cita de ${tratamiento} mañana, ${fecha} a las ${hora}.\n\n${preInstr?.es || ''}\n\n¡Le esperamos!`;

      await sendToPatient(bot, chatId, msg);
      await memory.saveNotificacion(businessId, 'recordatorio_48h', msg, chatId);
      return { sent: true, chatId };
    }

    // Recordatorio 24h antes
    case 'recordatorio_24h': {
      const { chatId, nombre, tratamiento, fecha, hora, idioma = 'es' } = data;
      const msg = idioma === 'en'
        ? `Dear ${nombre}, your ${tratamiento} appointment is confirmed for tomorrow ${fecha} at ${hora}. If you need to reschedule, please let us know as soon as possible.`
        : `Estimado/a ${nombre}, su cita de ${tratamiento} está confirmada para mañana ${fecha} a las ${hora}. Si necesita reagendar, comuníquenoslo cuanto antes.`;

      await sendToPatient(bot, chatId, msg);
      await memory.saveNotificacion(businessId, 'recordatorio_24h', msg, chatId);
      return { sent: true };
    }

    // Recordatorio 2h antes (anti no-show)
    case 'recordatorio_2h': {
      const { chatId, nombre, tratamiento, hora, idioma = 'es' } = data;
      const msg = idioma === 'en'
        ? `Dear ${nombre}, your ${tratamiento} appointment is in 2 hours (${hora}). We look forward to welcoming you!`
        : `Estimado/a ${nombre}, su cita de ${tratamiento} es en 2 horas (${hora}). ¡Le esperamos!`;

      await sendToPatient(bot, chatId, msg);
      await memory.saveNotificacion(businessId, 'recordatorio_2h', msg, chatId);
      return { sent: true };
    }

    // Post-tratamiento (2h después)
    case 'post_tratamiento': {
      const { chatId, nombre, tratamiento, idioma = 'es' } = data;
      const postInstr = instrucciones.getPostInstrucciones(tratamiento);
      const msg = idioma === 'en'
        ? `Dear ${nombre}, thank you for visiting us today!\n\nHere are your post-treatment instructions for ${tratamiento}:\n\n${postInstr?.en || 'Follow your specialist\'s recommendations.'}\n\nIf you have any questions or concerns, don't hesitate to contact us.`
        : `Estimado/a ${nombre}, ¡gracias por visitarnos hoy!\n\nAquí tiene sus instrucciones post-tratamiento de ${tratamiento}:\n\n${postInstr?.es || 'Siga las recomendaciones de su especialista.'}\n\nSi tiene cualquier duda o molestia, no dude en contactarnos.`;

      await sendToPatient(bot, chatId, msg);
      await memory.saveNotificacion(businessId, 'post_tratamiento', msg, chatId);
      return { sent: true };
    }

    // Encuesta de satisfacción (48h después)
    case 'encuesta_satisfaccion': {
      const { chatId, nombre, tratamiento, idioma = 'es' } = data;
      const msg = idioma === 'en'
        ? `Dear ${nombre}, we hope you're feeling great after your ${tratamiento} treatment!\n\nWe'd love to know your experience. On a scale of 1 to 5, how would you rate your visit? (Just reply with a number)\n\n1 😞 2 😐 3 🙂 4 😊 5 🤩`
        : `Estimado/a ${nombre}, esperamos que esté notando los resultados de su tratamiento de ${tratamiento}.\n\nNos gustaría conocer su experiencia. Del 1 al 5, ¿cómo valoraría su visita? (Responda simplemente con un número)\n\n1 😞 2 😐 3 🙂 4 😊 5 🤩`;

      await sendToPatient(bot, chatId, msg);
      await memory.saveNotificacion(businessId, 'encuesta_satisfaccion', msg, chatId);
      return { sent: true };
    }

    // Solicitar reseña en Google (72h después, solo si valoración ≥4)
    case 'solicitar_resena': {
      const { chatId, nombre, googleMapsUrl, idioma = 'es' } = data;
      const msg = idioma === 'en'
        ? `Dear ${nombre}, thank you for your kind feedback!\n\nWould you mind sharing your experience on Google? It would mean a great deal to us and helps other patients find us.\n\n${googleMapsUrl || ''}`
        : `Estimado/a ${nombre}, ¡muchas gracias por su valoración!\n\n¿Le importaría compartir su experiencia en Google? Nos ayuda mucho y permite que otros pacientes nos encuentren.\n\n${googleMapsUrl || ''}`;

      await sendToPatient(bot, chatId, msg);
      await memory.saveNotificacion(businessId, 'solicitar_resena', msg, chatId);
      return { sent: true };
    }

    // Recordatorio de recurrencia
    case 'recordatorio_recurrencia': {
      const { chatId, nombre, tratamiento, idioma = 'es' } = data;
      const msg = idioma === 'en'
        ? `Dear ${nombre}, it's time for your next ${tratamiento} session! Would you like to book your appointment? Just let us know your preferred date and time.`
        : `Estimado/a ${nombre}, ha llegado el momento de su próxima sesión de ${tratamiento}. ¿Le gustaría agendar su cita? Díganos su fecha y hora preferida.`;

      await sendToPatient(bot, chatId, msg);
      await memory.saveNotificacion(businessId, 'recordatorio_recurrencia', msg, chatId);
      return { sent: true };
    }

    // Reactivar pacientes inactivos >90 días
    case 'reactivar_pacientes': {
      const { pacientes } = data; // array de { chatId, nombre, ultimoTratamiento, idioma }
      const resultados = [];

      for (const p of pacientes) {
        const msg = p.idioma === 'en'
          ? `Dear ${p.nombre}, we miss you at ${config.NOMBRE_CLINICA}! It's been a while since your last ${p.ultimoTratamiento} treatment. Can we help you with anything? We're here for you.`
          : `Estimado/a ${p.nombre}, ¡le echamos de menos en ${config.NOMBRE_CLINICA}! Hace tiempo que no nos visita desde su último tratamiento de ${p.ultimoTratamiento}. ¿Podemos ayudarle en algo? Estamos a su disposición.`;

        await sendToPatient(bot, p.chatId, msg);
        await memory.saveNotificacion(businessId, 'reactivar_pacientes', msg, p.chatId);
        resultados.push({ chatId: p.chatId, sent: true });
      }

      return { resultados };
    }

    // Notificar lista de espera cuando se cancela una cita
    case 'notificar_lista_espera': {
      const { tratamiento, franja } = data;
      const enEspera = await memory.getPrimerEnEspera(businessId, tratamiento, franja);
      if (!enEspera) return { found: false };

      const idioma = enEspera.idioma || 'es';
      const msg = idioma === 'en'
        ? `Dear ${enEspera.nombre}, good news! A slot has opened up for ${enEspera.tratamiento}. Would you like to book an appointment? Just let us know your availability.`
        : `Estimado/a ${enEspera.nombre}, ¡buenas noticias! Se ha liberado un hueco para ${enEspera.tratamiento}. ¿Le gustaría concertar una cita? Díganos su disponibilidad.`;

      await sendToPatient(bot, enEspera.chat_id, msg);
      await memory.saveNotificacion(businessId, 'notificar_lista_espera', msg, enEspera.chat_id);
      return { found: true, notificado: enEspera.nombre };
    }

    // Aviso al equipo: días sin agenda configurada
    case 'aviso_agenda': {
      const { diasSinConfigurar } = data; // array de fechas ISO
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (!adminChatId || !diasSinConfigurar?.length) return { sent: false };

      const msg = `⚠️ *Aviso de agenda*\n\nLos siguientes días no tienen disponibilidad configurada:\n${diasSinConfigurar.map(d => `• ${d}`).join('\n')}\n\nActualice la tabla \`agenda_dia\` en Supabase.`;
      await sendToAdmin(bot, adminChatId, msg);
      return { sent: true };
    }

    // Reporte semanal al equipo
    case 'reporte_semanal': {
      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (!adminChatId) return { sent: false };

      // Obtener el reporte vía el comando de admin
      const adminModule = require('../commands/admin');
      const reporte = await adminModule.handleMessage(
        businessId, adminChatId, '#admin reporte semanal', bot
      );
      await sendToAdmin(bot, adminChatId, reporte);
      return { sent: true };
    }

    default:
      throw new Error(`Acción desconocida: ${action}`);
  }
}

// ── Helpers de envío ──────────────────────────────────────────────────────────

async function sendToPatient(bot, chatId, msg) {
  if (!bot || !chatId) {
    console.warn('[n8n] bot o chatId no disponible, mensaje no enviado');
    return;
  }
  await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
}

async function sendToAdmin(bot, adminChatId, msg) {
  if (!bot || !adminChatId) return;
  await bot.telegram.sendMessage(adminChatId, msg, { parse_mode: 'Markdown' });
}

module.exports = { router, processAction };
