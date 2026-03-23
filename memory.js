// memory.js — Todas las operaciones con Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ── Conversaciones (memoria corto plazo) ──────────────────────────────────────

async function getHistory(businessId, chatId, limit = 10) {
  const { data, error } = await supabase
    .from('conversaciones')
    .select('role, content')
    .eq('business_id', businessId)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('[memory] getHistory:', error.message); return []; }
  return data.reverse(); // cronológico
}

async function saveMessage(businessId, chatId, role, content) {
  const { error } = await supabase
    .from('conversaciones')
    .insert({ business_id: businessId, chat_id: chatId, role, content });

  if (error) console.error('[memory] saveMessage:', error.message);
}

// ── Pacientes (memoria largo plazo) ───────────────────────────────────────────

async function getPatient(businessId, chatId) {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('business_id', businessId)
    .eq('chat_id', chatId)
    .maybeSingle();

  if (error) { console.error('[memory] getPatient:', error.message); return null; }
  return data;
}

async function upsertPatient(businessId, chatId, fields) {
  const { error } = await supabase
    .from('pacientes')
    .upsert(
      { business_id: businessId, chat_id: chatId, ...fields },
      { onConflict: 'business_id,chat_id' }
    );

  if (error) console.error('[memory] upsertPatient:', error.message);
}

async function updatePatientNotes(businessId, chatId, nota) {
  const patient = await getPatient(businessId, chatId);
  const notasActuales = patient?.notas || '';
  const nuevasNotas = notasActuales
    ? `${notasActuales}\n- ${nota}`
    : `- ${nota}`;

  await upsertPatient(businessId, chatId, { notas: nuevasNotas });
}

async function updatePatientIdioma(businessId, chatId, idioma) {
  await upsertPatient(businessId, chatId, { idioma_preferido: idioma });
}

// ── Citas ─────────────────────────────────────────────────────────────────────

async function getActiveCitas(businessId, chatId) {
  const { data, error } = await supabase
    .from('citas')
    .select('id, fecha_cita, hora, tratamiento, profesional, estado, notas')
    .eq('business_id', businessId)
    .eq('chat_id', chatId)
    .in('estado', ['pendiente', 'confirmada'])
    .gte('fecha_cita', new Date().toISOString().split('T')[0])
    .order('fecha_cita', { ascending: true });

  if (error) { console.error('[memory] getActiveCitas:', error.message); return []; }
  return data;
}

async function saveCita(businessId, chatId, datos) {
  const { data, error } = await supabase
    .from('citas')
    .insert({
      business_id: businessId,
      chat_id: chatId,
      nombre: datos.nombre,
      telefono: datos.telefono || null,
      fecha_cita: parseFecha(datos.fecha),
      hora: datos.hora,
      servicio: datos.servicio || 'tratamiento',
      tratamiento: datos.tratamiento || null,
      profesional: datos.profesional || null,
      idioma: datos.idioma || 'es',
      notas: datos.notas || null,
      estado: 'pendiente',
    })
    .select('id')
    .single();

  if (error) { console.error('[memory] saveCita:', error.message); return null; }
  return data.id;
}

async function getCitaById(id) {
  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) { console.error('[memory] getCitaById:', error.message); return null; }
  return data;
}

async function updateCita(id, fields) {
  const { error } = await supabase
    .from('citas')
    .update(fields)
    .eq('id', id);

  if (error) { console.error('[memory] updateCita:', error.message); return false; }
  return true;
}

async function getCitasByFecha(businessId, fecha) {
  const { data, error } = await supabase
    .from('citas')
    .select('id, nombre, hora, tratamiento, profesional, estado, telefono')
    .eq('business_id', businessId)
    .eq('fecha_cita', fecha)
    .not('estado', 'in', '("cancelada","rechazada")')
    .order('hora', { ascending: true });

  if (error) { console.error('[memory] getCitasByFecha:', error.message); return []; }
  return data;
}

async function getCitasDelDiaCompleto(businessId, fecha) {
  const { data, error } = await supabase
    .from('citas')
    .select('id, nombre, hora, tratamiento, profesional, estado, telefono')
    .eq('business_id', businessId)
    .eq('fecha_cita', fecha)
    .order('hora', { ascending: true });

  if (error) { console.error('[memory] getCitasDelDiaCompleto:', error.message); return []; }
  return data;
}

async function getCitaByIdCorto(businessId, idCorto) {
  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .eq('business_id', businessId)
    .like('id', `${idCorto}%`)
    .maybeSingle();

  if (error) { console.error('[memory] getCitaByIdCorto:', error.message); return null; }
  return data;
}

async function getCitaByNombre(businessId, nombre) {
  const hoy = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .eq('business_id', businessId)
    .ilike('nombre', `%${nombre}%`)
    .in('estado', ['pendiente', 'confirmada'])
    .gte('fecha_cita', hoy)
    .order('fecha_cita', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) { console.error('[memory] getCitaByNombre:', error.message); return null; }
  return data;
}

async function completarCita(businessId, citaId) {
  // 1. Marcar cita como completada
  const ok = await updateCita(citaId, { estado: 'completada' });
  if (!ok) return false;

  // 2. Obtener datos de la cita para actualizar el paciente
  const cita = await getCitaById(citaId);
  if (!cita) return true; // cita actualizada aunque no encontremos el registro

  const patient = await getPatient(businessId, cita.chat_id);
  const tratamientosPrevios = patient?.tratamientos_realizados || [];
  const tratamiento = cita.tratamiento || cita.servicio;

  await upsertPatient(businessId, cita.chat_id, {
    ultima_visita: cita.fecha_cita,
    visitas_total: (patient?.visitas_total || 0) + 1,
    tratamientos_realizados: tratamientosPrevios.includes(tratamiento)
      ? tratamientosPrevios
      : [...tratamientosPrevios, tratamiento],
  });

  return true;
}

// ── Lista de espera ───────────────────────────────────────────────────────────

async function saveListaEspera(businessId, chatId, datos) {
  const { error } = await supabase
    .from('lista_espera')
    .insert({
      business_id: businessId,
      chat_id: chatId,
      nombre: datos.nombre,
      tratamiento: datos.tratamiento,
      franja_preferida: datos.franja || 'indiferente',
      estado: 'activa',
    });

  if (error) console.error('[memory] saveListaEspera:', error.message);
}

async function getListaEspera(businessId) {
  const { data, error } = await supabase
    .from('lista_espera')
    .select('*')
    .eq('business_id', businessId)
    .eq('estado', 'activa')
    .order('created_at', { ascending: true });

  if (error) { console.error('[memory] getListaEspera:', error.message); return []; }
  return data;
}

async function updateListaEspera(id, fields) {
  const { error } = await supabase
    .from('lista_espera')
    .update(fields)
    .eq('id', id);

  if (error) { console.error('[memory] updateListaEspera:', error.message); return false; }
  return true;
}

async function getPrimerEnEspera(businessId, tratamiento, franja) {
  let query = supabase
    .from('lista_espera')
    .select('*')
    .eq('business_id', businessId)
    .eq('estado', 'activa')
    .ilike('tratamiento', `%${tratamiento}%`)
    .order('created_at', { ascending: true })
    .limit(1);

  if (franja && franja !== 'indiferente') {
    query = query.or(`franja_preferida.eq.${franja},franja_preferida.eq.indiferente`);
  }

  const { data, error } = await query.maybeSingle();
  if (error) { console.error('[memory] getPrimerEnEspera:', error.message); return null; }
  return data;
}

// ── Preguntas desconocidas ────────────────────────────────────────────────────

async function savePreguntaDesconocida(businessId, chatId, pregunta) {
  const { error } = await supabase
    .from('preguntas_desconocidas')
    .insert({
      business_id: businessId,
      chat_id: chatId,
      pregunta,
      estado: 'pendiente',
    });

  if (error) console.error('[memory] savePreguntaDesconocida:', error.message);
}

async function getPreguntaByIdCorto(businessId, idCorto) {
  const { data, error } = await supabase
    .from('preguntas_desconocidas')
    .select('id')
    .eq('business_id', businessId)
    .like('id', `${idCorto}%`)
    .maybeSingle();

  if (error) { console.error('[memory] getPreguntaByIdCorto:', error.message); return null; }
  return data;
}

async function getPreguntasPendientes(businessId) {
  const { data, error } = await supabase
    .from('preguntas_desconocidas')
    .select('id, pregunta, created_at')
    .eq('business_id', businessId)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true });

  if (error) { console.error('[memory] getPreguntasPendientes:', error.message); return []; }
  return data;
}

async function responderPregunta(id, respuesta) {
  const { error } = await supabase
    .from('preguntas_desconocidas')
    .update({ respuesta, estado: 'respondida' })
    .eq('id', id);

  if (error) { console.error('[memory] responderPregunta:', error.message); return false; }
  return true;
}

// ── Base de conocimiento ──────────────────────────────────────────────────────

async function getKnowledgeBase(businessId) {
  const { data, error } = await supabase
    .from('preguntas_desconocidas')
    .select('pregunta, respuesta')
    .eq('business_id', businessId)
    .eq('estado', 'respondida')
    .not('respuesta', 'is', null)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) { console.error('[memory] getKnowledgeBase:', error.message); return []; }
  return data;
}

// ── Agenda del día ────────────────────────────────────────────────────────────

async function getDayContext(businessId, fecha) {
  const { data, error } = await supabase
    .from('agenda_dia')
    .select('profesional, plazas_libres, promocion, notas_dia')
    .eq('business_id', businessId)
    .eq('fecha', fecha)
    .eq('activo', true)
    .maybeSingle();

  if (error) { console.error('[memory] getDayContext:', error.message); return null; }
  return data;
}

// ── Recordatorios de tratamiento ──────────────────────────────────────────────

async function saveRecordatorioTratamiento(businessId, chatId, datos) {
  const { error } = await supabase
    .from('recordatorios_tratamiento')
    .upsert({
      business_id: businessId,
      chat_id: chatId,
      nombre_paciente: datos.nombre,
      tratamiento: datos.tratamiento,
      ultima_sesion: datos.ultimaSesion,
      proxima_sesion: datos.proximaSesion,
      frecuencia_dias: datos.frecuenciaDias,
      recordatorio_enviado: false,
      estado: 'activo',
    }, { onConflict: 'business_id,chat_id,tratamiento' });

  if (error) console.error('[memory] saveRecordatorioTratamiento:', error.message);
}

// ── Notificaciones ────────────────────────────────────────────────────────────

async function saveNotificacion(businessId, tipo, contenido, destinatario) {
  const { error } = await supabase
    .from('notificaciones')
    .insert({
      business_id: businessId,
      tipo,
      contenido,
      destinatario,
      enviado: true,
    });

  if (error) console.error('[memory] saveNotificacion:', error.message);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseFecha(fechaStr) {
  // Acepta DD/MM/YYYY → YYYY-MM-DD
  if (!fechaStr) return null;
  if (fechaStr.includes('/')) {
    const [d, m, y] = fechaStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return fechaStr; // ya en formato ISO
}

module.exports = {
  getHistory,
  saveMessage,
  getPatient,
  upsertPatient,
  updatePatientNotes,
  updatePatientIdioma,
  getActiveCitas,
  saveCita,
  getCitaById,
  getCitaByIdCorto,
  updateCita,
  completarCita,
  getCitasByFecha,
  getCitasDelDiaCompleto,
  getCitaByNombre,
  saveListaEspera,
  getListaEspera,
  updateListaEspera,
  getPrimerEnEspera,
  savePreguntaDesconocida,
  getPreguntaByIdCorto,
  getPreguntasPendientes,
  responderPregunta,
  getKnowledgeBase,
  getDayContext,
  saveRecordatorioTratamiento,
  saveNotificacion,
};
