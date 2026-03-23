// commands/admin.js — Modo admin: copiloto del equipo de recepción
require('dotenv').config();
const memory = require('../memory');
const config = require('../config');
const { getAdminResponse } = require('../agent');

// ── Handler principal ─────────────────────────────────────────────────────────

async function handleMessage(businessId, chatId, texto, bot) {
  const cmd = texto.replace(/^#admin\s*/i, '').trim().toLowerCase();

  // Comandos estructurados
  if (cmd === 'citas hoy' || cmd === 'citas de hoy') {
    return await cmdCitasHoy(businessId);
  }
  if (cmd === 'citas mañana' || cmd === 'citas de mañana') {
    return await cmdCitasManana(businessId);
  }
  if (cmd.startsWith('confirmar ')) {
    return await cmdConfirmar(businessId, cmd.replace('confirmar ', '').trim(), bot);
  }
  if (cmd.startsWith('rechazar ')) {
    return await cmdRechazar(businessId, cmd.replace('rechazar ', '').trim(), bot);
  }
  if (cmd.startsWith('cancelar ')) {
    return await cmdCancelar(businessId, cmd.replace('cancelar ', '').trim(), bot);
  }
  if (cmd.startsWith('no-show ') || cmd.startsWith('noshow ')) {
    const nombre = cmd.replace(/^no-?show\s+/, '').trim();
    return await cmdNoShow(businessId, nombre);
  }
  if (cmd.startsWith('completar ')) {
    return await cmdCompletar(businessId, cmd.replace('completar ', '').trim());
  }
  if (cmd === 'lista espera' || cmd === 'lista de espera') {
    return await cmdListaEspera(businessId);
  }
  if (cmd === 'preguntas') {
    return await cmdPreguntas(businessId);
  }
  if (cmd.startsWith('respuesta ')) {
    return await cmdResponder(businessId, cmd.replace('respuesta ', '').trim());
  }
  if (cmd === 'resumen' || cmd === 'resumen del día' || cmd === 'resumen hoy') {
    return await cmdResumen(businessId);
  }
  if (cmd === 'reporte semanal' || cmd === 'reporte') {
    return await cmdReporteSemanal(businessId);
  }
  if (cmd === 'ayuda' || cmd === 'help') {
    return cmdAyuda();
  }

  // Fallback: Claude Haiku interpreta en lenguaje libre
  return await cmdFallback(businessId, texto);
}

// ── Comandos ──────────────────────────────────────────────────────────────────

async function cmdCitasHoy(businessId) {
  const hoy = new Date().toISOString().split('T')[0];
  const citas = await memory.getCitasByFecha(businessId, hoy);

  if (citas.length === 0) return '📅 No hay citas registradas para hoy.';

  const lineas = citas.map(c =>
    `• ${c.hora} — ${c.nombre} | ${c.tratamiento || '-'} | ${c.profesional || 'Sin asignar'} | *${c.estado}*`
  );
  return `📅 *Citas de hoy (${formatFecha(hoy)})*\n\n${lineas.join('\n')}`;
}

async function cmdCitasManana(businessId) {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const fechaStr = manana.toISOString().split('T')[0];
  const citas = await memory.getCitasByFecha(businessId, fechaStr);

  if (citas.length === 0) return `📅 No hay citas registradas para mañana (${formatFecha(fechaStr)}).`;

  const lineas = citas.map(c =>
    `• ${c.hora} — ${c.nombre} | ${c.tratamiento || '-'} | ${c.profesional || 'Sin asignar'} | *${c.estado}*`
  );
  return `📅 *Citas de mañana (${formatFecha(fechaStr)})*\n\n${lineas.join('\n')}`;
}

async function cmdConfirmar(businessId, nombre, bot) {
  const cita = await memory.getCitaByNombre(businessId, nombre);
  if (!cita) return `❌ No encontré ninguna cita pendiente para "${nombre}".`;

  await memory.updateCita(cita.id, { estado: 'confirmada' });

  // Notificar al paciente
  if (bot && cita.chat_id) {
    const msg = cita.idioma === 'en'
      ? `Dear ${cita.nombre}, your appointment has been confirmed for ${formatFecha(cita.fecha_cita)} at ${cita.hora} (${cita.tratamiento || 'treatment'}). We look forward to seeing you!`
      : `Estimado/a ${cita.nombre}, su cita ha sido confirmada para el ${formatFecha(cita.fecha_cita)} a las ${cita.hora} (${cita.tratamiento || 'tratamiento'}). ¡Le esperamos!`;
    try {
      await bot.telegram.sendMessage(cita.chat_id, msg);
    } catch (e) {
      console.error('[admin] Error notificando paciente:', e.message);
    }
  }

  return `✅ Cita de *${cita.nombre}* confirmada. El paciente ha sido notificado.`;
}

async function cmdRechazar(businessId, texto, bot) {
  // Buscar cita probando el texto completo primero, luego separando motivo desde el final
  let cita = await memory.getCitaByNombre(businessId, texto);
  let nombre = texto;
  let motivo = 'no disponemos de disponibilidad para esa fecha';

  if (!cita) {
    const palabras = texto.split(' ');
    for (let i = palabras.length - 1; i >= 1; i--) {
      const candidato = palabras.slice(0, i).join(' ');
      cita = await memory.getCitaByNombre(businessId, candidato);
      if (cita) {
        nombre = candidato;
        motivo = palabras.slice(i).join(' ') || motivo;
        break;
      }
    }
  }

  if (!cita) return `❌ No encontré ninguna cita pendiente para "${texto}".`;

  await memory.updateCita(cita.id, { estado: 'rechazada' });

  // Notificar al paciente
  if (bot && cita.chat_id) {
    const msg = cita.idioma === 'en'
      ? `Dear ${cita.nombre}, unfortunately we are unable to confirm your appointment request because ${motivo}. We apologize for the inconvenience. Please contact us to find an alternative.`
      : `Estimado/a ${cita.nombre}, lamentablemente no podemos confirmar su solicitud de cita porque ${motivo}. Disculpe las molestias. Por favor, contáctenos para encontrar una alternativa.`;
    try {
      await bot.telegram.sendMessage(cita.chat_id, msg);
    } catch (e) {
      console.error('[admin] Error notificando paciente:', e.message);
    }
  }

  return `❌ Cita de *${nombre}* rechazada. El paciente ha sido notificado.`;
}

async function cmdCancelar(businessId, nombre, bot) {
  const cita = await memory.getCitaByNombre(businessId, nombre);
  if (!cita) return `❌ No encontré ninguna cita para "${nombre}".`;

  await memory.updateCita(cita.id, { estado: 'cancelada' });

  // Notificar al paciente
  if (bot && cita.chat_id) {
    const msg = cita.idioma === 'en'
      ? `Dear ${cita.nombre}, your appointment for ${formatFecha(cita.fecha_cita)} at ${cita.hora} has been cancelled. We apologize for any inconvenience.`
      : `Estimado/a ${cita.nombre}, su cita del ${formatFecha(cita.fecha_cita)} a las ${cita.hora} ha sido cancelada. Disculpe las molestias.`;
    try {
      await bot.telegram.sendMessage(cita.chat_id, msg);
    } catch (e) {
      console.error('[admin] Error notificando paciente:', e.message);
    }
  }

  return `🗑️ Cita de *${nombre}* cancelada y paciente notificado.`;
}

async function cmdCompletar(businessId, nombre) {
  const cita = await memory.getCitaByNombre(businessId, nombre);
  if (!cita) return `❌ No encontré ninguna cita para "${nombre}".`;

  await memory.completarCita(businessId, cita.id);
  return `✔️ Cita de *${cita.nombre}* marcada como completada. Perfil del paciente actualizado.`;
}

async function cmdNoShow(businessId, nombre) {
  const cita = await memory.getCitaByNombre(businessId, nombre);
  if (!cita) return `❌ No encontré ninguna cita para "${nombre}".`;

  await memory.updateCita(cita.id, { estado: 'no_show' });
  return `⚠️ Cita de *${nombre}* marcada como no presentado.`;
}

async function cmdListaEspera(businessId) {
  const lista = await memory.getListaEspera(businessId);
  if (lista.length === 0) return '📋 La lista de espera está vacía.';

  const lineas = lista.map((p, i) =>
    `${i + 1}. ${p.nombre} — ${p.tratamiento} | Franja: ${p.franja_preferida}`
  );
  return `📋 *Lista de espera (${lista.length})*\n\n${lineas.join('\n')}`;
}

async function cmdPreguntas(businessId) {
  const preguntas = await memory.getPreguntasPendientes(businessId);
  if (preguntas.length === 0) return '✅ No hay preguntas pendientes de responder.';

  const lineas = preguntas.map(p =>
    `• ID: \`${p.id.substring(0, 8)}\`\n  "${p.pregunta}"`
  );
  return `❓ *Preguntas sin responder (${preguntas.length})*\n\n${lineas.join('\n\n')}\n\nResponde con: \`#admin respuesta [id] [tu respuesta]\``;
}

async function cmdResponder(businessId, texto) {
  // Formato: "idCorto respuesta completa aquí"
  const espacioIdx = texto.indexOf(' ');
  if (espacioIdx === -1) return '❌ Formato: `#admin respuesta [id] [respuesta]`';

  const idCorto = texto.substring(0, espacioIdx);
  const respuesta = texto.substring(espacioIdx + 1).trim();

  if (!respuesta) return '❌ La respuesta no puede estar vacía.';

  const pregunta = await memory.getPreguntaByIdCorto(businessId, idCorto);
  if (!pregunta) return `❌ No encontré una pregunta con ID "${idCorto}".`;

  await memory.responderPregunta(pregunta.id, respuesta);
  return `✅ Respuesta guardada en la base de conocimiento. El agente la usará en futuras conversaciones.`;
}

async function cmdResumen(businessId) {
  const hoy = new Date().toISOString().split('T')[0];
  // getCitasByFecha excluye canceladas/rechazadas — obtener todas las del día por separado
  const [citasActivas, todasLasCitas] = await Promise.all([
    memory.getCitasByFecha(businessId, hoy),
    memory.getCitasDelDiaCompleto(businessId, hoy),
  ]);

  const stats = {
    total: todasLasCitas.length,
    confirmadas: citasActivas.filter(c => c.estado === 'confirmada').length,
    pendientes: citasActivas.filter(c => c.estado === 'pendiente').length,
    noShow: citasActivas.filter(c => c.estado === 'no_show').length,
    canceladas: todasLasCitas.filter(c => c.estado === 'cancelada').length,
    completadas: citasActivas.filter(c => c.estado === 'completada').length,
  };

  const preguntas = await memory.getPreguntasPendientes(businessId);
  const listaEspera = await memory.getListaEspera(businessId);

  return (
    `📊 *Resumen del día — ${formatFecha(hoy)}*\n\n` +
    `🗓️ Citas totales: ${stats.total}\n` +
    `✅ Confirmadas: ${stats.confirmadas}\n` +
    `⏳ Pendientes: ${stats.pendientes}\n` +
    `✔️ Completadas: ${stats.completadas}\n` +
    `⚠️ No presentados: ${stats.noShow}\n` +
    `❌ Canceladas: ${stats.canceladas}\n\n` +
    `❓ Preguntas pendientes: ${preguntas.length}\n` +
    `📋 En lista de espera: ${listaEspera.length}`
  );
}

async function cmdReporteSemanal(businessId) {
  const hace7dias = new Date();
  hace7dias.setDate(hace7dias.getDate() - 7);
  const desde = hace7dias.toISOString().split('T')[0];
  const hasta = new Date().toISOString().split('T')[0];

  // Obtener citas de la semana combinando los 7 días
  const promesas = [];
  for (let i = 0; i <= 7; i++) {
    const d = new Date(hace7dias);
    d.setDate(d.getDate() + i);
    promesas.push(memory.getCitasByFecha(businessId, d.toISOString().split('T')[0]));
  }
  const resultados = await Promise.all(promesas);
  const citas = resultados.flat();

  if (citas.length === 0) return '📊 No hay datos para el reporte semanal.';

  const completadas = citas.filter(c => c.estado === 'completada');
  const noShows = citas.filter(c => c.estado === 'no_show');

  // Tratamientos más demandados
  const conteoTratamientos = {};
  citas.forEach(c => {
    if (c.tratamiento) conteoTratamientos[c.tratamiento] = (conteoTratamientos[c.tratamiento] || 0) + 1;
  });
  const top = Object.entries(conteoTratamientos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t, n]) => `  • ${t}: ${n}`)
    .join('\n');

  return (
    `📊 *Reporte semanal (${formatFecha(desde)} – ${formatFecha(hasta)})*\n\n` +
    `🗓️ Total citas: ${citas.length}\n` +
    `✔️ Completadas: ${completadas.length}\n` +
    `⚠️ No presentados: ${noShows.length} (${Math.round(noShows.length / citas.length * 100)}%)\n\n` +
    `💆 Tratamientos más demandados:\n${top || '  Sin datos'}`
  );
}

function cmdAyuda() {
  return (
    `🤖 *Comandos disponibles:*\n\n` +
    `\`#admin citas hoy\` — Citas del día\n` +
    `\`#admin citas mañana\` — Citas de mañana\n` +
    `\`#admin confirmar [nombre]\` — Confirma cita\n` +
    `\`#admin rechazar [nombre] [motivo]\` — Rechaza cita\n` +
    `\`#admin cancelar [nombre]\` — Cancela cita\n` +
    `\`#admin completar [nombre]\` — Marca cita como completada\n` +
    `\`#admin no-show [nombre]\` — Marca como no presentado\n` +
    `\`#admin lista espera\` — Lista de espera\n` +
    `\`#admin preguntas\` — Preguntas pendientes\n` +
    `\`#admin respuesta [id] [texto]\` — Responde pregunta\n` +
    `\`#admin resumen\` — Resumen del día\n` +
    `\`#admin reporte semanal\` — Métricas de la semana\n\n` +
    `También puedes escribir en lenguaje libre y te entiendo.`
  );
}

// ── Fallback con Claude Haiku ─────────────────────────────────────────────────

async function cmdFallback(businessId, textoOriginal) {
  const hoy = new Date().toISOString().split('T')[0];
  const [citasHoy, listaEspera, preguntas] = await Promise.all([
    memory.getCitasByFecha(businessId, hoy),
    memory.getListaEspera(businessId),
    memory.getPreguntasPendientes(businessId),
  ]);

  const systemPrompt = `
Eres el copiloto administrativo de ${config.NOMBRE_CLINICA}.
El miembro del equipo te ha escrito en lenguaje libre (prefijado con #admin).
Responde de forma concisa con la información que tienes, en español.

CITAS DE HOY:
${citasHoy.length > 0
  ? citasHoy.map(c => `- ${c.hora} ${c.nombre} | ${c.tratamiento} | ${c.estado}`).join('\n')
  : 'No hay citas hoy'}

LISTA DE ESPERA: ${listaEspera.length} pacientes
PREGUNTAS PENDIENTES: ${preguntas.length}

Responde de forma útil y directa. Si no puedes ayudar con lo pedido, dilo claramente.
`.trim();

  try {
    return await getAdminResponse(systemPrompt, textoOriginal);
  } catch (e) {
    console.error('[admin] Error en fallback:', e.message);
    return '⚠️ No pude procesar tu consulta. Prueba con uno de los comandos estructurados (`#admin ayuda`).';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(isoDate) {
  if (!isoDate) return '-';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

module.exports = { handleMessage };
