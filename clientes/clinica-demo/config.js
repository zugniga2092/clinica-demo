// clientes/clinica-demo/config.js — Configuración de Clínica Estética Lumina (demo)

module.exports = {
  // ── Identidad ─────────────────────────────────────────────────────────────
  NOMBRE_CLINICA: 'Clínica Estética Lumina',
  NOMBRE_AGENTE: 'Sofía',
  DESCRIPCION: 'Centro especializado en medicina estética y tratamientos de belleza avanzados en el corazón de Madrid',

  // ── Datos de contacto ─────────────────────────────────────────────────────
  DIRECCION: 'Calle Serrano 42, 2º planta, 28001 Madrid',
  TELEFONO: '+34 91 234 56 78',
  EMAIL: 'info@clinicalumina.es',
  HORARIO: 'Lunes a viernes de 9:00 a 20:00. Sábados de 10:00 a 14:00. Domingos cerrado.',
  COMO_LLEGAR: 'Metro línea 4, estación Serrano (salida Calle Serrano). A 2 minutos a pie.',
  PARKING: 'Parking público El Corte Inglés Serrano a 150 metros. También parking en Calle Lagasca.',

  // ── Política de citas ─────────────────────────────────────────────────────
  POLITICA_CANCELACION: 'Las cancelaciones deben realizarse con al menos 24 horas de antelación. Las cancelaciones tardías o no presentaciones pueden conllevar un cargo del 50% del servicio.',
  TIEMPO_MIN_ENTRE_CITAS: 30,
  ANTELACION_MIN_RESERVA: 2,

  // ── Catálogo de tratamientos ───────────────────────────────────────────────
  TRATAMIENTOS: [
    {
      id: 'botox',
      nombre: 'Bótox',
      descripcion: 'Tratamiento con toxina botulínica para suavizar arrugas de expresión en frente, entrecejo y patas de gallo.',
      precio: 'Desde 200€',
      duracion: '30-45 minutos',
      sesiones: '1 sesión. Se recomienda renovar cada 4-6 meses.',
      contraindicaciones: 'Embarazo, lactancia, enfermedades neuromusculares (miastenia gravis), alergia a la toxina botulínica, toma de anticoagulantes.',
      frecuencia_dias: 150,
    },
    {
      id: 'rellenos',
      nombre: 'Rellenos de ácido hialurónico',
      descripcion: 'Voluminización y contorno facial, relleno de labios, surcos nasogenianos y ojeras.',
      precio: 'Desde 300€',
      duracion: '30-60 minutos',
      sesiones: '1 sesión. Duración de 9-12 meses según zona.',
      contraindicaciones: 'Embarazo, lactancia, alergia al ácido hialurónico, infección activa en la zona.',
      frecuencia_dias: 300,
    },
    {
      id: 'laser',
      nombre: 'Láser depilación',
      descripcion: 'Depilación láser definitiva para cualquier zona del cuerpo. Tecnología de diodo de última generación.',
      precio: 'Desde 50€/zona',
      duracion: '15-60 minutos según zona',
      sesiones: '8-10 sesiones (ciclo completo), luego revisión anual.',
      contraindicaciones: 'Embarazo, piel bronceada o con autobronceador, medicación fotosensibilizante, vitíligo, psoriasis activa en la zona.',
      frecuencia_dias: 35,
    },
    {
      id: 'ipl',
      nombre: 'IPL / Fotorejuvenecimiento',
      descripcion: 'Tratamiento de luz pulsada intensa para manchas, rojeces, poros dilatados y rejuvenecimiento general.',
      precio: 'Desde 120€/sesión',
      duracion: '45-60 minutos',
      sesiones: '3-5 sesiones en ciclo, luego mantenimiento semestral.',
      contraindicaciones: 'Piel bronceada, embarazo, medicación fotosensibilizante, rosácea activa grave.',
      frecuencia_dias: 25,
    },
    {
      id: 'peeling',
      nombre: 'Peeling químico',
      descripcion: 'Renovación celular con ácidos para tratar manchas, acné, poros y textura irregular.',
      precio: 'Desde 80€/sesión',
      duracion: '45 minutos',
      sesiones: '3-6 sesiones en ciclo, luego mantenimiento cada 6 meses.',
      contraindicaciones: 'Embarazo, lactancia, piel sensibilizada, uso reciente de retinoides o isotretinoína.',
      frecuencia_dias: 25,
    },
    {
      id: 'mesoterapia',
      nombre: 'Mesoterapia capilar',
      descripcion: 'Microinyecciones de vitaminas y factores de crecimiento para frenar la caída del cabello y estimular su crecimiento.',
      precio: 'Desde 150€/sesión',
      duracion: '45 minutos',
      sesiones: 'Mensual durante 3-4 meses, luego trimestral.',
      contraindicaciones: 'Embarazo, lactancia, toma de anticoagulantes, alergia a alguno de los componentes.',
      frecuencia_dias: 30,
    },
    {
      id: 'bioestimulacion',
      nombre: 'Bioestimulación (Profhilo / Radiesse)',
      descripcion: 'Tratamiento de rejuvenecimiento global que estimula la producción de colágeno y elastina.',
      precio: 'Desde 350€/sesión',
      duracion: '30 minutos',
      sesiones: '3 sesiones (cada 4-6 semanas), luego mantenimiento semestral.',
      contraindicaciones: 'Embarazo, lactancia, toma de anticoagulantes, alergia al ácido hialurónico.',
      frecuencia_dias: 35,
    },
    {
      id: 'consulta',
      nombre: 'Consulta de valoración',
      descripcion: 'Primera visita con el especialista para evaluar el estado de la piel y diseñar un plan de tratamiento personalizado.',
      precio: 'Gratuita',
      duracion: '30 minutos',
      sesiones: '1 sesión.',
      contraindicaciones: 'Ninguna.',
      frecuencia_dias: 365,
    },
  ],

  // ── Contraindicaciones generales (aplican a todos los tratamientos) ────────
  CONTRAINDICACIONES_GENERALES: [
    'Embarazo o lactancia activa',
    'Toma de medicación anticoagulante (salvo autorización médica)',
    'Infección activa en la zona a tratar',
    'Enfermedad autoinmune en brote activo',
    'Alergia conocida a alguno de los componentes del tratamiento solicitado',
    'Piel muy sensibilizada o con heridas abiertas en la zona',
  ],
};
