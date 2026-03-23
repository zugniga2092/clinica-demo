// clientes/clinica-demo/instrucciones.js
// Instrucciones pre/post tratamiento y frecuencias de recurrencia.
// Usado en dos contextos:
//   - agent.js: texto plano para el system prompt del agente
//   - n8n-endpoints.js: objetos ES/EN para mensajes de notificación

// ── Para el system prompt (texto plano, ES) ───────────────────────────────────

const preTratamiento = `
Bótox / Rellenos:
• No tomar alcohol las 24h previas
• No tomar anticoagulantes (ibuprofeno, aspirina) salvo prescripción médica
• Llegar con la piel limpia, sin maquillaje

Láser / IPL:
• No exposición solar las 2 semanas previas
• No depilación con cera ni hilo las 4 semanas previas
• No usar autobronceador las 2 semanas previas
• Informar si toma medicación fotosensibilizante

Peeling químico:
• No usar retinol ni ácidos los 5 días previos
• No exposición solar intensa la semana previa

Mesoterapia / Bioestimulación:
• No tomar anticoagulantes salvo prescripción médica
• Llegar bien hidratado/a`.trim();

const postTratamiento = `
Bótox:
• No tumbarse las 4h siguientes al tratamiento
• No masajear la zona tratada las 24h siguientes
• Evitar calor intenso (sauna, sol directo) las 48h siguientes
• El efecto completo se aprecia entre los días 7 y 14

Láser / IPL:
• Aplicar fotoprotector SPF 50+ cada 2h si hay exposición solar
• Puede aparecer enrojecimiento leve las primeras 24-48h, es completamente normal
• No rascar ni exfoliar la zona durante 7 días
• Evitar calor (sauna, deporte intenso) 48h

Peeling:
• No arrancar la piel que se descama — dejar que caiga sola
• Hidratación intensa durante los días siguientes
• Fotoprotector obligatorio durante 30 días`.trim();

const frecuencias = `
• Bótox: cada 4-6 meses
• Rellenos de ácido hialurónico: cada 9-12 meses
• Láser depilación: cada 4-6 semanas durante el ciclo (8-10 sesiones), luego revisión anual
• IPL / Fotorejuvenecimiento: cada 3-4 semanas en ciclo, luego mantenimiento semestral
• Peeling químico: cada 3-4 semanas en ciclo, cada 6 meses mantenimiento
• Mesoterapia capilar: mensual durante 3-4 meses, luego trimestral
• Bioestimulación: cada 4-6 semanas durante 3 sesiones, luego semestral
• Revisión general: anual para todos los pacientes activos`.trim();

// ── Para notificaciones n8n (ES + EN por tipo de tratamiento) ─────────────────

function getPreInstrucciones(tratamiento) {
  const t = (tratamiento || '').toLowerCase();

  if (t.includes('botox') || t.includes('bótox') || t.includes('relleno')) {
    return {
      es: '📋 *Instrucciones pre-tratamiento:*\n• No tome alcohol las 24h previas\n• No tome anticoagulantes (ibuprofeno, aspirina)\n• Llegar con la piel limpia, sin maquillaje',
      en: '📋 *Pre-treatment instructions:*\n• No alcohol 24h before\n• Avoid blood thinners (ibuprofen, aspirin)\n• Arrive with clean skin, no makeup',
    };
  }
  if (t.includes('laser') || t.includes('láser') || t.includes('ipl')) {
    return {
      es: '📋 *Instrucciones pre-tratamiento:*\n• Sin exposición solar las 2 semanas previas\n• Sin depilación con cera las 4 semanas previas\n• Sin autobronceador las 2 semanas previas',
      en: '📋 *Pre-treatment instructions:*\n• No sun exposure 2 weeks before\n• No wax hair removal 4 weeks before\n• No self-tanner 2 weeks before',
    };
  }
  if (t.includes('peeling')) {
    return {
      es: '📋 *Instrucciones pre-tratamiento:*\n• No use retinol ni ácidos los 5 días previos\n• Sin exposición solar intensa la semana previa',
      en: '📋 *Pre-treatment instructions:*\n• Avoid retinol and acids 5 days before\n• No intense sun exposure the week before',
    };
  }
  if (t.includes('mesoterapia') || t.includes('bioestimulación') || t.includes('bioestimulacion')) {
    return {
      es: '📋 *Instrucciones pre-tratamiento:*\n• No tome anticoagulantes salvo prescripción médica\n• Llegar bien hidratado/a',
      en: '📋 *Pre-treatment instructions:*\n• Avoid blood thinners unless medically prescribed\n• Arrive well hydrated',
    };
  }
  return null;
}

function getPostInstrucciones(tratamiento) {
  const t = (tratamiento || '').toLowerCase();

  if (t.includes('botox') || t.includes('bótox')) {
    return {
      es: '• No se tumbe las 4h siguientes al tratamiento\n• No masajee la zona tratada las 24h siguientes\n• Evite calor intenso (sauna, sol directo) las 48h siguientes\n• El efecto completo se aprecia entre los días 7 y 14',
      en: '• Do not lie down for 4 hours after treatment\n• Do not massage the treated area for 24 hours\n• Avoid intense heat (sauna, direct sun) for 48 hours\n• Full results visible between days 7 and 14',
    };
  }
  if (t.includes('laser') || t.includes('láser') || t.includes('ipl')) {
    return {
      es: '• Aplique fotoprotector SPF 50+ cada 2h si hay exposición solar\n• Puede aparecer enrojecimiento leve las primeras 24-48h, es normal\n• No rasque ni exfolie la zona durante 7 días\n• Evite calor (sauna, deporte intenso) 48h',
      en: '• Apply SPF 50+ sunscreen every 2h if sun-exposed\n• Mild redness may appear in the first 24-48h, this is normal\n• Do not scratch or exfoliate the area for 7 days\n• Avoid heat (sauna, intense exercise) for 48h',
    };
  }
  if (t.includes('peeling')) {
    return {
      es: '• No arranque la piel que se descama — déjela caer sola\n• Hidratación intensa durante los días siguientes\n• Fotoprotector obligatorio durante 30 días',
      en: '• Do not peel off flaking skin — let it fall off naturally\n• Intense moisturization in the following days\n• Sunscreen mandatory for 30 days',
    };
  }
  if (t.includes('relleno')) {
    return {
      es: '• Evite masajear la zona tratada las 24h siguientes\n• No realice ejercicio intenso las primeras 24h\n• Evite calor extremo las 48h siguientes',
      en: '• Avoid massaging the treated area for 24 hours\n• No intense exercise for the first 24 hours\n• Avoid extreme heat for 48 hours',
    };
  }
  return null;
}

module.exports = { preTratamiento, postTratamiento, frecuencias, getPreInstrucciones, getPostInstrucciones };
