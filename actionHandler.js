// actionHandler.js — Motor de procesamiento de etiquetas del LLM
const memory = require('./memory');
const logger = require('./logger');

// Global regex — finds all [TAG_NAME: fields] in one pass
const TAG_REGEX = /\[([A-Z_]+):\s*([^\]]+)\]/g;

/**
 * Processes all tags in the raw LLM response.
 * If a DB action fails, calls retryFn(errorMsg) to get a reformulated response from the LLM.
 * retryFn is set to null on recursive retry call to prevent infinite loops.
 *
 * @param {string} rawText - Raw LLM response
 * @param {string} businessId
 * @param {string} chatId
 * @param {object} bot - Telegraf instance
 * @param {Function|null} retryFn - async (errorMsg: string) => string
 * @returns {Promise<string>} Cleaned text without any tags
 */
async function processActions(rawText, businessId, chatId, bot, retryFn) {
  // Extract all tags in one pass
  const tags = [];
  let match;
  TAG_REGEX.lastIndex = 0;
  while ((match = TAG_REGEX.exec(rawText)) !== null) {
    tags.push({ full: match[0], name: match[1], raw: match[2] });
  }

  // Strip all found tags from text
  let texto = rawText;
  for (const tag of tags) {
    texto = texto.replace(tag.full, '');
  }

  // Execute each action; on failure call retryFn and reprocess
  for (const tag of tags) {
    logger.info({ canal: 'action', tag: tag.name, businessId, chatId });
    const errorMsg = await executeTag(tag, businessId, chatId, bot);
    if (errorMsg && retryFn) {
      logger.warn({ canal: 'action', tag: tag.name, businessId, chatId, msg: 'tag falló, reintentando', error: errorMsg });
      let retryText;
      try {
        retryText = await retryFn(errorMsg);
      } catch (e) {
        logger.error({ canal: 'action', businessId, chatId, msg: 'retryFn falló', error: e.message });
        break;
      }
      // Reprocess the retry response (null retryFn prevents infinite loop)
      return processActions(retryText, businessId, chatId, bot, null);
    }
  }

  return cleanTags(texto).replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Executes the action for a single tag.
 * @returns {string|null} null if OK, error message string if the action failed
 */
async function executeTag(tag, businessId, chatId, bot) {
  const { name, raw } = tag;
  const datos = parsearCampos(raw);

  switch (name) {
    case 'CITA': {
      const citaId = await memory.saveCita(businessId, chatId, datos);
      if (!citaId) {
        return `No fue posible registrar la cita del ${datos.fecha} a las ${datos.hora} — ese horario ya está ocupado. Disculpa al paciente y ofrécele dos alternativas concretas de fecha u hora diferente.`;
      }
      const idCorto = citaId.substring(0, 8);
      await notifyAdmin(bot, businessId,
        `🗓️ *Nueva cita pendiente*\n` +
        `👤 ${datos.nombre}\n📅 ${datos.fecha} a las ${datos.hora}\n` +
        `💆 ${datos.tratamiento || 'Sin especificar'}\n` +
        `📞 ${datos.telefono || 'Sin teléfono'}\n📝 ${datos.notas || '-'}\n\n` +
        `Confirmar: \`#admin confirmar ${datos.nombre}\`\nID: \`${idCorto}\``
      );
      await guardarRecordatorioSiProcede(businessId, chatId, datos);

      // Enviar instrucciones pre-tratamiento al paciente inmediatamente tras la reserva
      if (bot && chatId && datos.tratamiento) {
        try {
          const instrucciones = require(`./clientes/${process.env.BUSINESS_ID}/instrucciones`);
          const preInstr = instrucciones.getPreInstrucciones(datos.tratamiento);
          if (preInstr) {
            const idioma = datos.idioma || 'es';
            const msg = idioma === 'en' ? preInstr.en : preInstr.es;
            if (msg) {
              await bot.telegram.sendMessage(String(chatId), msg, { parse_mode: 'Markdown' });
            }
          }
        } catch (e) {
          console.error('[actionHandler] Error enviando instrucciones pre-cita:', e.message);
        }
      }

      return null;
    }

    case 'CANCELAR_CITA': {
      const idCorto = datos.id || raw.trim();
      const cita = await memory.getCitaByIdCorto(businessId, idCorto);
      if (!cita) return null;
      await memory.updateCita(cita.id, { estado: 'cancelada' });
      await notifyAdmin(bot, businessId,
        `❌ *Cita cancelada*\n👤 ${cita.nombre}\n📅 ${cita.fecha_cita} a las ${cita.hora}`
      );
      if (cita.tratamiento) {
        const enEspera = await memory.getPrimerEnEspera(businessId, cita.tratamiento, null);
        if (enEspera && bot) {
          const msg = enEspera.idioma === 'en'
            ? `Good news, ${enEspera.nombre}! A slot opened up for ${enEspera.tratamiento}. Would you like to book?`
            : `Buenas noticias, ${enEspera.nombre}. Se ha liberado un hueco para ${enEspera.tratamiento}. ¿Le gustaría concertar una cita?`;
          await bot.telegram.sendMessage(enEspera.chat_id, msg).catch(() => {});
          await memory.updateListaEspera(enEspera.id, { estado: 'asignada' });
        }
      }
      return null;
    }

    case 'MODIFICAR_CITA': {
      if (!datos.id || !datos.campo || !datos.valor) return null;
      const cita = await memory.getCitaByIdCorto(businessId, datos.id);
      if (!cita) return null;
      let valor = datos.valor;
      if (datos.campo === 'fecha_cita' && valor.includes('/')) {
        const [d, m, y] = valor.split('/');
        valor = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      // Si se cambia fecha u hora, verificar que el nuevo slot esté libre
      if (datos.campo === 'fecha_cita' || datos.campo === 'hora') {
        const nuevaFecha = datos.campo === 'fecha_cita' ? valor : cita.fecha_cita;
        const nuevaHora  = datos.campo === 'hora'       ? valor : cita.hora;
        const disponible = await memory.checkSlotDisponibleExcluyendo(businessId, nuevaFecha, nuevaHora, cita.profesional, cita.id);
        if (!disponible) {
          return `El horario ${nuevaHora} del ${nuevaFecha} ya está ocupado. Por favor, ofrece al paciente una fecha u hora alternativa.`;
        }
      }
      await memory.updateCita(cita.id, { [datos.campo]: valor });
      await notifyAdmin(bot, businessId,
        `✏️ *Cita modificada*\nID: ${datos.id}\n${datos.campo} → ${datos.valor}`
      );
      return null;
    }

    case 'LISTA_ESPERA': {
      const patient = await memory.getPatient(businessId, chatId);
      await memory.saveListaEspera(businessId, chatId, {
        nombre: datos.nombre,
        tratamiento: datos.tratamiento,
        franja: datos.franja || 'indiferente',
        idioma: patient?.idioma_preferido || 'es',
      });
      await notifyAdmin(bot, businessId,
        `📋 *Lista de espera*\n👤 ${datos.nombre}\n💆 ${datos.tratamiento}\n🕐 Franja: ${datos.franja || 'indiferente'}`
      );
      return null;
    }

    case 'PREGUNTA_DESCONOCIDA': {
      const pregunta = raw.trim();
      await memory.savePreguntaDesconocida(businessId, chatId, pregunta);
      await notifyAdmin(bot, businessId,
        `❓ *Pregunta sin respuesta*\n"${pregunta}"\n\nResponde: \`#admin respuesta [id] [respuesta]\``
      );
      return null;
    }

    case 'PACIENTE_NOTA': {
      await memory.updatePatientNotes(businessId, chatId, raw.trim());
      return null;
    }

    case 'DETECTAR_IDIOMA': {
      const idioma = raw.trim().toLowerCase();
      if (idioma === 'es' || idioma === 'en') {
        await memory.updatePatientIdioma(businessId, chatId, idioma);
      }
      return null;
    }

    case 'ALERTA_CONTRAINDICACION': {
      const descripcion = raw.trim();
      const patient = await memory.getPatient(businessId, chatId);
      const prev = patient?.contraindicaciones || '';
      await memory.upsertPatient(businessId, chatId, {
        contraindicaciones: prev ? `${prev}; ${descripcion}` : descripcion,
      });
      await notifyAdmin(bot, businessId,
        `⚠️ *Alerta contraindicación*\nPaciente: ${chatId}\n${descripcion}`
      );
      return null;
    }

    default:
      return null; // Unknown tag — ignore silently
  }
}

/**
 * Removes any remaining [TAG: ...] patterns from text.
 * This is the final safety net so patients never see internal tags.
 */
function cleanTags(text) {
  return text.replace(/\[[A-Z_]+:[^\]]*\]/g, '').trim();
}

// ── Private helpers ───────────────────────────────────────────────────────────

function parsearCampos(str) {
  const result = {};
  const regex = /(\w+)=([^,\]]+(?:,(?!\s*\w+=)[^,\]]+)*)/g;
  let m;
  while ((m = regex.exec(str)) !== null) {
    result[m[1].trim()] = m[2].trim();
  }
  return result;
}

async function notifyAdmin(bot, businessId, mensaje) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId || !bot) return;
  try {
    await bot.telegram.sendMessage(adminChatId, mensaje, { parse_mode: 'Markdown' });
    await memory.saveNotificacion(businessId, 'admin_alert', mensaje, adminChatId);
  } catch (e) {
    logger.error({ canal: 'action', businessId, msg: 'error notif admin', error: e.message });
  }
}

async function guardarRecordatorioSiProcede(businessId, chatId, datos) {
  let config;
  try {
    config = require(`./clientes/${process.env.BUSINESS_ID}/config`);
  } catch { return; }

  const tratamientoConfig = config.TRATAMIENTOS.find(
    t => t.id === datos.tratamiento?.toLowerCase() ||
         t.nombre.toLowerCase().includes((datos.tratamiento || '').toLowerCase())
  );
  if (!tratamientoConfig || !datos.fecha) return;

  const fechaISO = datos.fecha.includes('/')
    ? (() => { const [d, m, y] = datos.fecha.split('/'); return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; })()
    : datos.fecha;

  const proxima = new Date(fechaISO);
  proxima.setDate(proxima.getDate() + tratamientoConfig.frecuencia_dias);

  await memory.saveRecordatorioTratamiento(businessId, chatId, {
    nombre: datos.nombre,
    tratamiento: datos.tratamiento,
    ultimaSesion: fechaISO,
    proximaSesion: proxima.toISOString().split('T')[0],
    frecuenciaDias: tratamientoConfig.frecuencia_dias,
  });
}

module.exports = { processActions, cleanTags };
