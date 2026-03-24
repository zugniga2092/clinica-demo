// agent.js — Núcleo IA: construye el system prompt y llama a Claude
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const memory = require('./memory');
const { getRelevantKB } = require('./contextManager');

const BUSINESS_ID = process.env.BUSINESS_ID;
const config = require(`./clientes/${BUSINESS_ID}/config`);
const instrucciones = require(`./clientes/${BUSINESS_ID}/instrucciones`);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── System prompt dinámico ────────────────────────────────────────────────────

async function buildSystemPrompt(businessId, chatId, userQuery = null, is_voice = false) {
  const ahora = new Date();
  const fechaHoy = ahora.toISOString().split('T')[0];
  const horaActual = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const fechaLegible = ahora.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const [dayCtx, patient, citasActivas, kb] = await Promise.all([
    memory.getDayContext(businessId, fechaHoy),
    memory.getPatient(businessId, chatId),
    memory.getActiveCitas(businessId, chatId),
    memory.getKnowledgeBase(businessId),
  ]);

  // Catálogo de tratamientos formateado (campos opcionales para compatibilidad con config lean)
  const catalogoStr = config.TRATAMIENTOS.map(t => {
    const partes = [`• ${t.nombre}: ${t.descripcion}`];
    if (t.precio) partes.push(`Precio: ${t.precio}`);
    if (t.duracion) partes.push(`Duración: ${t.duracion}`);
    if (t.sesiones) partes.push(`Sesiones: ${t.sesiones}`);
    return partes.join(' | ');
  }).join('\n');

  // Contraindicaciones generales
  const contraindicacionesStr = config.CONTRAINDICACIONES_GENERALES
    .map(c => `• ${c}`).join('\n');

  const preTratamientoStr = instrucciones.preTratamiento;
  const postTratamientoStr = instrucciones.postTratamiento;
  const frecuenciasStr = instrucciones.frecuencias;

  // Contexto del día (Supabase)
  let contextoDia = 'No hay información de agenda configurada para hoy.';
  if (dayCtx) {
    contextoDia = [
      dayCtx.profesional ? `Profesional de turno: ${dayCtx.profesional}` : '',
      dayCtx.plazas_libres != null ? `Plazas disponibles: ${dayCtx.plazas_libres}` : '',
      dayCtx.promocion ? `Promoción activa: ${dayCtx.promocion}` : '',
      dayCtx.notas_dia ? `Notas del día: ${dayCtx.notas_dia}` : '',
    ].filter(Boolean).join('\n');
  }

  // Perfil del paciente (Supabase)
  let perfilPaciente = 'Paciente nuevo — primera interacción.';
  if (patient) {
    perfilPaciente = [
      patient.nombre ? `Nombre: ${patient.nombre}` : '',
      `Visitas totales: ${patient.visitas_total || 0}`,
      patient.idioma_preferido ? `Idioma preferido: ${patient.idioma_preferido}` : '',
      patient.tipo_piel ? `Tipo de piel: ${patient.tipo_piel}` : '',
      patient.alergias_cosmeticos ? `Alergias cosméticos: ${patient.alergias_cosmeticos}` : '',
      patient.contraindicaciones ? `Contraindicaciones: ${patient.contraindicaciones}` : '',
      patient.tratamientos_realizados?.length
        ? `Tratamientos previos: ${patient.tratamientos_realizados.join(', ')}` : '',
      patient.notas ? `Notas: ${patient.notas}` : '',
    ].filter(Boolean).join('\n');
  }

  // Citas activas del paciente
  let citasStr = 'No tiene citas próximas registradas.';
  if (citasActivas.length > 0) {
    citasStr = citasActivas.map(c =>
      `• ID: ${c.id.substring(0, 8)} | ${c.fecha_cita} a las ${c.hora} | ${c.tratamiento || c.servicio} | Estado: ${c.estado}`
    ).join('\n');
  }

  // Base de conocimiento aprendida (filtrada por relevancia)
  const kbFiltered = getRelevantKB(kb, userQuery);
  let kbStr = 'Sin preguntas respondidas todavía.';
  if (kbFiltered.length > 0) {
    kbStr = kbFiltered.map(q => `P: ${q.pregunta}\nR: ${q.respuesta}`).join('\n\n');
  }

  return `
1. FECHA Y HORA ACTUAL
Hoy es ${fechaLegible}. Son las ${horaActual}. Usa siempre esta fecha cuando el paciente pregunte por disponibilidad o quiera agendar una cita.

2. IDIOMA
Detecta el idioma del paciente en su primer mensaje y mantén ese idioma durante toda la conversación. Si escribe en inglés, responde siempre en inglés con el mismo nivel de cortesía formal.

3. IDENTIDAD
Eres ${config.NOMBRE_AGENTE}, la asistente virtual de ${config.NOMBRE_CLINICA}. ${config.DESCRIPCION}.${config.MEDICO_PRINCIPAL ? `\nMédico responsable: ${config.MEDICO_PRINCIPAL}` : ''}

4. TONO Y COMUNICACIÓN
• Trata SIEMPRE de usted a los pacientes. Nunca tutees. Ejemplos: "¿En qué puedo ayudarle?", "¿Tiene usted alguna preferencia de horario?"
• Si el paciente escribe en inglés: "How may I assist you?", "Dear Mr./Ms. [name]"
• Tono cálido, empático y profesional. Habla de bienestar, confianza y cuidado personal.
• Respuestas concisas pero completas. Sin emojis en ningún caso.
• Nunca minimices una preocupación del paciente. Valida siempre antes de informar.${is_voice ? '\n• MODO VOZ ACTIVO: Responde en máximo 2 frases cortas. Sin markdown, sin asteriscos, sin guiones, sin emojis, sin listas. Solo texto hablado natural.' : ''}

5. LÍMITES
Solo hablas de ${config.NOMBRE_CLINICA} y sus servicios. Si te preguntan sobre temas ajenos, deriva amablemente: "Estoy aquí para ayudarle con todo lo relacionado con nuestra clínica."

6. INFORMACIÓN DE LA CLÍNICA
• Dirección: ${config.DIRECCION}
• Teléfono: ${config.TELEFONO}${config.WHATSAPP && config.WHATSAPP !== config.TELEFONO ? `\n• WhatsApp: ${config.WHATSAPP}` : ''}
• Email: ${config.EMAIL}
• Horario: ${config.HORARIO}
• Cómo llegar: ${config.COMO_LLEGAR}${config.PARKING ? `\n• Parking: ${config.PARKING}` : ''}${config.IDIOMAS ? `\n• Idiomas de atención: ${config.IDIOMAS}` : ''}

7. CATÁLOGO DE TRATAMIENTOS
${catalogoStr}

8. CONTRAINDICACIONES GENERALES
${contraindicacionesStr}

9. INSTRUCCIONES PRE-TRATAMIENTO
${preTratamientoStr}

10. INSTRUCCIONES POST-TRATAMIENTO
${postTratamientoStr}

11. FRECUENCIAS DE RECURRENCIA
${frecuenciasStr}

12. CONTEXTO DEL DÍA
${contextoDia}

13. PERFIL DEL PACIENTE
${perfilPaciente}

14. CITAS ACTIVAS DEL PACIENTE
${citasStr}

15. CONTEXTO DE SOPORTE (preguntas similares resueltas)
${kbStr}

16. VALIDACIÓN DE AGENDA
• Política de cancelación: ${config.POLITICA_CANCELACION}
• Si el paciente pide un día u hora y no hay disponibilidad indicada en el contexto del día (sección 12), di que vas a consultar con el equipo y que te confirmen.
• Si no hay plazas libres para el día solicitado, ofrece apuntarle a la lista de espera.

17. FLUJO DE CITA
Para registrar una cita necesitas: nombre completo, fecha, hora preferida, tratamiento y teléfono de contacto. Recoge los datos de forma natural, sin parecer un formulario. Si el paciente ya está en tu perfil y conoces su nombre, no vuelvas a pedírselo. Cuando tengas todos los datos, emite la etiqueta [CITA] en tu respuesta.
Al confirmar la cita, avisa al paciente de que recibirá a continuación las indicaciones previas al tratamiento. Ejemplo: "Le envío ahora las indicaciones para preparar su tratamiento." El sistema las enviará automáticamente en el siguiente mensaje.

18. ETIQUETAS DEL SISTEMA
Cuando sea necesario, incluye UNA de estas etiquetas en tu respuesta. El sistema las procesa automáticamente — el paciente nunca las verá.

• Registrar cita:
[CITA: nombre=X, fecha=DD/MM/YYYY, hora=HH:MM, tratamiento=X, profesional=X, telefono=X, idioma=es|en, notas=X]

• Cancelar cita:
[CANCELAR_CITA: id=XXXXXXXX]
(usa los primeros 8 caracteres del ID de la cita que aparece en la sección 14)

• Modificar cita:
[MODIFICAR_CITA: id=XXXXXXXX, campo=hora|fecha_cita|tratamiento, valor=X]

• Lista de espera:
[LISTA_ESPERA: nombre=X, tratamiento=X, franja=mañana|tarde|indiferente, telefono=X]

• Pregunta sin respuesta:
[PREGUNTA_DESCONOCIDA: texto exacto de la pregunta]
(úsalo cuando no tengas información para responder con seguridad)

• Nota sobre el paciente:
[PACIENTE_NOTA: texto breve de lo aprendido]
(úsalo para guardar preferencias, observaciones o datos relevantes del paciente)

• Detectar idioma:
[DETECTAR_IDIOMA: es|en]
(úsalo solo en el primer mensaje donde detectes el idioma)

• Alerta contraindicación:
[ALERTA_CONTRAINDICACION: descripción de la contraindicación detectada]
(úsalo si el paciente menciona una condición que podría ser contraindicación para el tratamiento solicitado)

19. URGENCIAS Y DERIVACIÓN
Si el paciente describe una reacción adversa grave, una urgencia médica, o necesita atención inmediata, dale el teléfono directo: ${config.TELEFONO} y pídele que llame o acuda a urgencias si es necesario.
`.trim();
}

// ── Llamada a Claude ──────────────────────────────────────────────────────────

async function getResponse(businessId, chatId, userMessage, is_voice = false) {
  const [systemPrompt, history] = await Promise.all([
    buildSystemPrompt(businessId, chatId, userMessage, is_voice),
    memory.getHistory(businessId, chatId, 10),
  ]);

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  return response.content[0].text;
}

// ── Claude Haiku para tareas rápidas (admin) ──────────────────────────────────

async function getAdminResponse(systemPrompt, userMessage) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return response.content[0].text;
}

module.exports = { buildSystemPrompt, getResponse, getAdminResponse };
