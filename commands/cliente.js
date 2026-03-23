// commands/cliente.js — Modo paciente: llama al agente y procesa etiquetas
const agent = require('../agent');
const memory = require('../memory');
const config = require('../config');

// ── Handler principal ─────────────────────────────────────────────────────────

async function handleMessage(businessId, chatId, userMessage, bot) {
  // Guardar mensaje del usuario
  await memory.saveMessage(businessId, chatId, 'user', userMessage);

  // Obtener respuesta de Claude
  let rawResponse;
  try {
    rawResponse = await agent.getResponse(businessId, chatId, userMessage);
  } catch (err) {
    console.error('[cliente] Error llamando a Claude:', err.message);
    const patient = await memory.getPatient(businessId, chatId).catch(() => null);
    const idioma = patient?.idioma_preferido || 'es';
    return idioma === 'en'
      ? 'I\'m sorry, I\'m experiencing technical difficulties. Please try again in a few minutes or call us directly.'
      : 'Lo siento, estoy teniendo problemas técnicos en este momento. Por favor, inténtelo de nuevo en unos minutos o llámenos directamente.';
  }

  // Procesar etiquetas (orden importa: primero extraer, luego limpiar)
  const textoLimpio = await procesarEtiquetas(rawResponse, businessId, chatId, bot);

  // Guardar respuesta del asistente (sin etiquetas)
  await memory.saveMessage(businessId, chatId, 'assistant', textoLimpio);

  return textoLimpio;
}

// ── Procesador de etiquetas ───────────────────────────────────────────────────

async function procesarEtiquetas(rawText, businessId, chatId, bot) {
  let texto = rawText;

  // [CITA: ...]
  const matchCita = texto.match(/\[CITA:\s*([^\]]+)\]/);
  if (matchCita) {
    texto = texto.replace(matchCita[0], '').trim();
    const datos = parsearCampos(matchCita[1]);
    await procesarCita(businessId, chatId, datos, bot);
  }

  // [CANCELAR_CITA: id=XXXXXXXX]
  const matchCancelar = texto.match(/\[CANCELAR_CITA:\s*id=([^\],\s]+)\]/i);
  if (matchCancelar) {
    texto = texto.replace(matchCancelar[0], '').trim();
    await procesarCancelacion(businessId, chatId, matchCancelar[1], bot);
  }

  // [MODIFICAR_CITA: id=XXXXXXXX, campo=X, valor=X]
  const matchModificar = texto.match(/\[MODIFICAR_CITA:\s*([^\]]+)\]/i);
  if (matchModificar) {
    texto = texto.replace(matchModificar[0], '').trim();
    const datos = parsearCampos(matchModificar[1]);
    await procesarModificacion(businessId, chatId, datos, bot);
  }

  // [LISTA_ESPERA: ...]
  const matchEspera = texto.match(/\[LISTA_ESPERA:\s*([^\]]+)\]/i);
  if (matchEspera) {
    texto = texto.replace(matchEspera[0], '').trim();
    const datos = parsearCampos(matchEspera[1]);
    await memory.saveListaEspera(businessId, chatId, {
      nombre: datos.nombre,
      tratamiento: datos.tratamiento,
      franja: datos.franja || 'indiferente',
    });
    await notifyAdmin(bot, businessId,
      `📋 *Lista de espera*\n👤 ${datos.nombre}\n💆 ${datos.tratamiento}\n🕐 Franja: ${datos.franja || 'indiferente'}`
    );
  }

  // [PREGUNTA_DESCONOCIDA: texto]
  const matchPregunta = texto.match(/\[PREGUNTA_DESCONOCIDA:\s*([^\]]+)\]/i);
  if (matchPregunta) {
    texto = texto.replace(matchPregunta[0], '').trim();
    const pregunta = matchPregunta[1].trim();
    await memory.savePreguntaDesconocida(businessId, chatId, pregunta);
    await notifyAdmin(bot, businessId,
      `❓ *Pregunta sin respuesta*\n"${pregunta}"\n\nResponde con: #admin respuesta [id] [tu respuesta]`
    );
  }

  // [PACIENTE_NOTA: texto]
  const matchNota = texto.match(/\[PACIENTE_NOTA:\s*([^\]]+)\]/i);
  if (matchNota) {
    texto = texto.replace(matchNota[0], '').trim();
    await memory.updatePatientNotes(businessId, chatId, matchNota[1].trim());
  }

  // [DETECTAR_IDIOMA: es|en]
  const matchIdioma = texto.match(/\[DETECTAR_IDIOMA:\s*(es|en)\]/i);
  if (matchIdioma) {
    texto = texto.replace(matchIdioma[0], '').trim();
    await memory.updatePatientIdioma(businessId, chatId, matchIdioma[1].toLowerCase());
  }

  // [ALERTA_CONTRAINDICACION: texto]
  const matchContra = texto.match(/\[ALERTA_CONTRAINDICACION:\s*([^\]]+)\]/i);
  if (matchContra) {
    texto = texto.replace(matchContra[0], '').trim();
    const descripcion = matchContra[1].trim();
    // Guardar en perfil del paciente
    const patient = await memory.getPatient(businessId, chatId);
    const contrActuales = patient?.contraindicaciones || '';
    await memory.upsertPatient(businessId, chatId, {
      contraindicaciones: contrActuales ? `${contrActuales}; ${descripcion}` : descripcion,
    });
    await notifyAdmin(bot, businessId,
      `⚠️ *Alerta contraindicación*\nPaciente chat: ${chatId}\n${descripcion}\n\nRevisar antes de confirmar la cita.`
    );
  }

  // Limpiar posibles líneas vacías extra
  return texto.replace(/\n{3,}/g, '\n\n').trim();
}

// ── Procesadores específicos ──────────────────────────────────────────────────

async function procesarCita(businessId, chatId, datos, bot) {
  const citaId = await memory.saveCita(businessId, chatId, datos);

  if (!citaId) {
    console.error('[cliente] No se pudo guardar la cita');
    return;
  }

  const idCorto = citaId.substring(0, 8);

  // Notificar al admin
  await notifyAdmin(bot, businessId,
    `🗓️ *Nueva cita pendiente*\n` +
    `👤 ${datos.nombre}\n` +
    `📅 ${datos.fecha} a las ${datos.hora}\n` +
    `💆 ${datos.tratamiento || 'Sin especificar'}\n` +
    `👨‍⚕️ ${datos.profesional || 'Sin asignar'}\n` +
    `📞 ${datos.telefono || 'Sin teléfono'}\n` +
    `📝 ${datos.notas || '-'}\n\n` +
    `Para confirmar: \`#admin confirmar ${datos.nombre}\`\n` +
    `ID cita: \`${idCorto}\``
  );

  // Guardar recordatorio de recurrencia si hay tratamiento conocido
  const tratamientoConfig = config.TRATAMIENTOS.find(
    t => t.id === datos.tratamiento?.toLowerCase() ||
         t.nombre.toLowerCase().includes(datos.tratamiento?.toLowerCase())
  );
  if (tratamientoConfig && datos.fecha) {
    const fechaISO = parseFechaParaDate(datos.fecha);
    if (fechaISO) {
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
  }
}

async function procesarCancelacion(businessId, chatId, idCorto, bot) {
  const cita = await memory.getCitaByIdCorto(businessId, idCorto);
  if (!cita) return;

  await memory.updateCita(cita.id, { estado: 'cancelada' });

  // Notificar al admin
  await notifyAdmin(bot, businessId,
    `❌ *Cita cancelada*\n👤 ${cita.nombre}\n📅 ${cita.fecha_cita} a las ${cita.hora}\n💆 ${cita.tratamiento || '-'}`
  );

  // Buscar primer paciente en lista de espera para ese tratamiento
  if (cita.tratamiento) {
    const enEspera = await memory.getPrimerEnEspera(businessId, cita.tratamiento, null);
    if (enEspera && bot) {
      try {
        const msg = enEspera.idioma === 'en'
          ? `Good news, ${enEspera.nombre}! A slot has opened up for ${enEspera.tratamiento}. Would you like to book an appointment?`
          : `Buenas noticias, ${enEspera.nombre}. Se ha liberado un hueco para ${enEspera.tratamiento}. ¿Le gustaría concertar una cita? Estaremos encantados de atenderle.`;
        await bot.telegram.sendMessage(enEspera.chat_id, msg);
        await memory.updateListaEspera(enEspera.id, { estado: 'asignada' });
      } catch (e) {
        console.error('[cliente] Error notificando lista espera:', e.message);
      }
    }
  }
}

async function procesarModificacion(businessId, chatId, datos, bot) {
  if (!datos.id || !datos.campo || !datos.valor) return;

  // Resolver UUID completo desde el ID corto
  const cita = await memory.getCitaByIdCorto(businessId, datos.id);
  if (!cita) {
    console.error('[cliente] procesarModificacion: cita no encontrada para id corto', datos.id);
    return;
  }

  // Convertir fecha si es necesario
  let valor = datos.valor;
  if (datos.campo === 'fecha_cita' && valor.includes('/')) {
    const [d, m, y] = valor.split('/');
    valor = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  await memory.updateCita(cita.id, { [datos.campo]: valor });
  await notifyAdmin(bot, businessId,
    `✏️ *Cita modificada*\nID: ${datos.id}\nCampo: ${datos.campo} → ${datos.valor}`
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsearCampos(str) {
  const result = {};
  // Regex que maneja valores con comas dentro (ej. notas)
  const regex = /(\w+)=([^,\]]+(?:,(?!\s*\w+=)[^,\]]+)*)/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    result[match[1].trim()] = match[2].trim();
  }
  return result;
}

function parseFechaParaDate(fechaStr) {
  if (!fechaStr) return null;
  if (fechaStr.includes('/')) {
    const [d, m, y] = fechaStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return fechaStr;
}

async function notifyAdmin(bot, businessId, mensaje) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChatId || !bot) return;
  try {
    await bot.telegram.sendMessage(adminChatId, mensaje, { parse_mode: 'Markdown' });
    await memory.saveNotificacion(businessId, 'admin_alert', mensaje, adminChatId);
  } catch (e) {
    console.error('[cliente] Error enviando notif admin:', e.message);
  }
}

module.exports = { handleMessage };
