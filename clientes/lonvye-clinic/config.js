// clientes/lonvye-clinic/config.js — Lonvye Clinic by Dra. Antón (Valencia)
// PRINCIPIO: config.js es LEAN. Solo datos operacionales y catálogo mínimo.
// El conocimiento detallado de cada tratamiento vive en la base de conocimiento
// (tabla preguntas_desconocidas, estado='respondida') → kb-seed.sql

module.exports = {
  // ── Identidad ─────────────────────────────────────────────────────────────
  NOMBRE_CLINICA: 'Lonvye Clinic by Dra. Antón',
  NOMBRE_AGENTE: 'Lonvye',
  DESCRIPCION: 'Clínica médica de referencia en Valencia especializada en medicina estética avanzada, medicina regenerativa y longevidad. Fundada y dirigida por la Dra. María Dolores Antón Rico, con más de 25 años de experiencia y trayectoria en SHA Wellness Clinic. Nuestro concepto es el de un Longevity Hub: un espacio donde la estética, la regeneración celular y la ciencia del envejecimiento trabajan juntos para que viva más años con mejor calidad de vida.',

  // ── Datos de contacto ─────────────────────────────────────────────────────
  DIRECCION: 'Carrer de Martí, 5, L\'Eixample, 46005 Valencia',
  TELEFONO: '+34 609 663 344',
  WHATSAPP: '+34 609 663 344',
  EMAIL: 'info@lonvyeclinicbydranton.com',
  WEB: 'https://www.lonvyeclinicbydranton.com',
  HORARIO: 'Lunes de 11:00 a 18:30. Martes a viernes de 10:30 a 19:00. Sábado y domingo cerrado.',
  COMO_LLEGAR: 'En el barrio de L\'Eixample, zona central de Valencia. A pocos minutos del centro histórico.',

  // ── Equipo médico ─────────────────────────────────────────────────────────
  MEDICO_PRINCIPAL: 'Dra. María Dolores Antón Rico — Licenciada en Medicina y Cirugía (Universidad de Alicante), Máster Oficial en Medicina Estética. Más de 25 años de experiencia. Exdirectora de Estética en SHA Wellness Clinic. Especialista en procedimientos no invasivos, rejuvenecimiento avanzado y medicina de la longevidad.',

  // ── Política de citas ─────────────────────────────────────────────────────
  POLITICA_CANCELACION: 'Las citas requieren un depósito de reserva de 65 €, que se aplica al coste del tratamiento. Las cancelaciones con menos de 24 horas de antelación o las no presentaciones conllevan la pérdida del depósito. Para cancelar o modificar una cita, contáctenos con al menos 24 horas de antelación.',
  TIEMPO_MIN_ENTRE_CITAS: 30,
  ANTELACION_MIN_RESERVA: 2,
  DEPOSITO_RESERVA: 65,

  // ── Idiomas de atención ───────────────────────────────────────────────────
  IDIOMAS: 'Español, inglés, árabe, chino simplificado, francés y ruso.',

  // ── Reseñas ───────────────────────────────────────────────────────────────
  GOOGLE_MAPS_URL: 'https://maps.app.goo.gl/QdGUgmLx8CLpwCsg7',

  // ── Catálogo de tratamientos — LEAN ───────────────────────────────────────
  // Solo nombre (para referencia de citas), descripción mínima de 1 línea
  // (para que el agente sepa de qué va si el paciente lo menciona)
  // y frecuencia_dias (para recordatorios de recurrencia).
  // TODO el conocimiento detallado → KB en Supabase (kb-seed.sql)
  TRATAMIENTOS: [
    // ── Aparatología corporal ──────────────────────────────────────────────
    {
      id: 'coolsculpting-elite',
      nombre: 'CoolSculpting Elite',
      descripcion: 'Eliminación de grasa localizada sin cirugía mediante criolipólisis médica. Sin recuperación.',
      frecuencia_dias: 60,
    },
    {
      id: 'thermage-flx',
      nombre: 'Thermage FLX',
      descripcion: 'Reafirmación y lifting de piel mediante radiofrecuencia monopolar. 1 sesión, resultados hasta 6 meses.',
      frecuencia_dias: 365,
    },
    {
      id: 'emtone',
      nombre: 'Emtone',
      descripcion: 'Tratamiento de celulitis y textura corporal que combina calor y vibración. Sin recuperación.',
      frecuencia_dias: 7,
    },
    {
      id: 'emsculpt-neo',
      nombre: 'Emsculpt Neo',
      descripcion: 'Tonificación muscular y lipólisis simultánea mediante tecnología HIFEM+ y radiofrecuencia.',
      frecuencia_dias: 7,
    },
    // ── Aparatología facial ────────────────────────────────────────────────
    {
      id: 'endolift',
      nombre: 'Endolift',
      descripcion: 'Lifting sin cirugía con microfibra óptica láser bajo la piel. Mínima recuperación (24-48h).',
      frecuencia_dias: 270,
    },
    {
      id: 'laser-dual-fraxel',
      nombre: 'Láser Dual Fraxel',
      descripcion: 'Tratamiento de manchas, cicatrices y rejuvenecimiento facial con láser fraccionado de precisión.',
      frecuencia_dias: 30,
    },
    {
      id: 'laser-clear-brilliant',
      nombre: 'Clear and Brilliant',
      descripcion: 'Láser suave de rejuvenecimiento preventivo y luminosidad. Sin recuperación.',
      frecuencia_dias: 21,
    },
    // ── Facial médico (inyectable + aparatología menor) ───────────────────
    {
      id: 'rinomodelacion',
      nombre: 'Rinomodelación sin cirugía',
      descripcion: 'Corrección y armonización de la nariz con ácido hialurónico, sin cirugía ni recuperación.',
      frecuencia_dias: 365,
    },
    {
      id: 'full-face',
      nombre: 'Full Face (tratamiento facial completo)',
      descripcion: 'Protocolo integral de rejuvenecimiento facial combinando varias técnicas en una sola sesión.',
      frecuencia_dias: 180,
    },
    {
      id: 'efecto-tensor',
      nombre: 'Efecto Tensor',
      descripcion: 'Reafirmación facial con técnicas de tensado no invasivo para un efecto lifting inmediato.',
      frecuencia_dias: 180,
    },
    {
      id: 'revitalizacion-facial',
      nombre: 'Revitalización Facial',
      descripcion: 'Hidratación profunda y luminosidad mediante microinyecciones de ácido hialurónico no reticulado.',
      frecuencia_dias: 120,
    },
    {
      id: 'radiofrecuencia-facial',
      nombre: 'Radiofrecuencia Facial',
      descripcion: 'Reafirmación y estimulación de colágeno en rostro mediante radiofrecuencia. Sin recuperación.',
      frecuencia_dias: 30,
    },
    {
      id: 'peelings-quimicos',
      nombre: 'Peelings Químicos',
      descripcion: 'Renovación celular con ácidos médicos para manchas, acné, poros y textura irregular.',
      frecuencia_dias: 30,
    },
    {
      id: 'medical-leds',
      nombre: 'Medical LEDs',
      descripcion: 'Fototerapia con luz LED médica para regeneración, efecto antiinflamatorio y rejuvenecimiento.',
      frecuencia_dias: 14,
    },
    {
      id: 'laser-alma-q',
      nombre: 'Láser Alma Q',
      descripcion: 'Láser Q-switched para tratamiento de manchas, tatuajes y lesiones pigmentadas.',
      frecuencia_dias: 30,
    },
    // ── Tratamientos inyectables ───────────────────────────────────────────
    {
      id: 'neuromoduladores',
      nombre: 'Neuromoduladores (Bótox)',
      descripcion: 'Suavizado de arrugas de expresión mediante toxina botulínica. Resultado natural 4-6 meses.',
      frecuencia_dias: 150,
    },
    {
      id: 'rellenos-dermicos',
      nombre: 'Rellenos dérmicos (Ácido Hialurónico)',
      descripcion: 'Recuperación de volúmenes y redefinición del contorno facial. Resultados inmediatos, 9-18 meses.',
      frecuencia_dias: 365,
    },
    {
      id: 'exosomas-autologos',
      nombre: 'Exosomas Autólogos',
      descripcion: 'Terapia regenerativa avanzada con vesículas extraídas de las propias células del paciente.',
      frecuencia_dias: 90,
    },
    {
      id: 'factores-crecimiento',
      nombre: 'Factores de Crecimiento',
      descripcion: 'Tratamiento regenerativo con factores de crecimiento propios del paciente para piel y cabello.',
      frecuencia_dias: 90,
    },
    // ── Suelo pélvico e íntimo ─────────────────────────────────────────────
    {
      id: 'emsella',
      nombre: 'Emsella (Suelo Pélvico)',
      descripcion: 'Fortalecimiento del suelo pélvico con tecnología electromagnética. Sin recuperación, sentada y vestida.',
      frecuencia_dias: 14,
    },
    {
      id: 'laser-co2-liquen',
      nombre: 'Láser CO2 (Liquen Escleroso Vulvar)',
      descripcion: 'Tratamiento especializado con láser fraccionado para liquen escleroso vulvar.',
      frecuencia_dias: 60,
    },
    // ── Capilar ───────────────────────────────────────────────────────────
    {
      id: 'hair-recovery',
      nombre: 'Hair Recovery (Exosomas + LED)',
      descripcion: 'Protocolo para frenar la caída del cabello y estimular el crecimiento. Exosomas + LED de alta potencia.',
      frecuencia_dias: 30,
    },
    // ── Cámara Hiperbárica ─────────────────────────────────────────────────
    {
      id: 'camara-hiperbarica',
      nombre: 'Cámara Hiperbárica (HBOT)',
      descripcion: 'Oxigenoterapia hiperbárica para regeneración celular, longevidad y recuperación. Sesiones de 90 min.',
      frecuencia_dias: 2,
    },
    // ── Programas Signature ───────────────────────────────────────────────
    {
      id: 'longevity-method',
      nombre: 'Lonvye Signature Longevity Method',
      descripcion: 'Programa exclusivo de longevidad: 10 sesiones de cámara hiperbárica + suplementación personalizada.',
      frecuencia_dias: 2,
    },
    {
      id: 'sculpting-method',
      nombre: 'Lonvye Signature Sculpting Method',
      descripcion: 'Programa de transformación corporal: 5 sesiones de Emsculpt Neo + 5 sesiones de Emtone.',
      frecuencia_dias: 7,
    },
    {
      id: 'tightening-method',
      nombre: 'Lonvye Signature Tightening Method',
      descripcion: 'Programa de reafirmación sin cirugía: 1 sesión de Thermage FLX + 3 sesiones de Emsculpt Neo.',
      frecuencia_dias: 14,
    },
    // ── Consulta ──────────────────────────────────────────────────────────
    {
      id: 'consulta-valoracion',
      nombre: 'Consulta de Valoración',
      descripcion: 'Primera visita con la Dra. Antón para evaluación médica personalizada y diseño del plan de tratamiento.',
      frecuencia_dias: 365,
    },
  ],

  // ── Contraindicaciones generales ──────────────────────────────────────────
  CONTRAINDICACIONES_GENERALES: [
    'Embarazo o lactancia activa',
    'Dispositivos electrónicos implantados (marcapasos, desfibrilador) — especialmente para EMSculpt, Emsella y Thermage',
    'Toma de medicación anticoagulante sin autorización médica',
    'Infección activa o herida abierta en la zona a tratar',
    'Enfermedad autoinmune en brote activo',
    'Alergia conocida a algún componente del tratamiento',
    'Cáncer activo o reciente en la zona a tratar',
    'Piel con autobronceador o bronceado solar reciente (para tratamientos láser)',
  ],
};
