// clientes/lonvye-clinic/instrucciones.js
// Instrucciones pre/post tratamiento para Lonvye Clinic by Dra. Antón.
// Usado en dos contextos:
//   - agent.js: texto plano inyectado en el system prompt
//   - n8n-endpoints.js: objetos ES/EN para mensajes de recordatorio automático

// ── Para el system prompt (texto plano, ES) ───────────────────────────────────

const preTratamiento = `
Inyectables (Bótox / Ácido Hialurónico / Exosomas):
• No tomar alcohol las 24h previas
• Evitar ibuprofeno, aspirina u otros anticoagulantes los 5 días previos (salvo prescripción médica)
• Llegar con la piel limpia, sin maquillaje ni cremas en la zona a tratar
• Informar si toma medicación habitual o tiene alergias conocidas

Láser (Dual Fraxel / Clear and Brilliant / CO2):
• Sin exposición solar ni autobronceador las 2 semanas previas
• Sin retinol, ácidos o exfoliantes los 5-7 días previos
• Informar si toma medicación fotosensibilizante
• Llegar con la piel limpia, sin maquillaje

Aparatología corporal (CoolSculpting Elite / Thermage FLX / Emtone / Emsculpt Neo):
• Mantener buena hidratación los días previos
• Ropa cómoda y fácil de retirar en la zona a tratar
• Informar si tiene dispositivos metálicos implantados (prótesis, marcapasos, DIU metálico)
• No es necesario ayuno

Endolift:
• No tomar anticoagulantes ni antiinflamatorios los 5 días previos
• Sin exposición solar intensa los 7 días previos
• Llegar sin maquillaje ni cremas en la zona

Cámara Hiperbárica (HBOT):
• No fumar el día de la sesión (reduce la efectividad del oxígeno)
• Ropa de algodón 100% (no sintéticos por riesgo de chispa)
• Informar si tiene otitis, sinusitis activa o claustrofobia
• No es necesario ayuno; se recomienda comer algo ligero antes

Emsella (Suelo Pélvico):
• Sin ropa interior con metal (retirar joyas y cinturones antes)
• Informar si tiene dispositivo intrauterino (DIU)
• Se realiza completamente vestida — no es necesario preparación adicional

Hair Recovery:
• Llegar con el cuero cabelludo limpio y libre de productos (geles, lacas, tónicos)
• No tomar anticoagulantes los 3 días previos`.trim();

const postTratamiento = `
Bótox (Neuromoduladores):
• No tumbarse ni inclinarse hacia delante las 4h siguientes
• No masajear ni presionar la zona tratada las 24h siguientes
• Evitar calor intenso (sauna, sol directo, deporte intenso) las 48h siguientes
• El efecto completo se aprecia entre los días 7 y 14

Ácido Hialurónico (Rellenos Dérmicos):
• No masajear la zona tratada las 24h siguientes
• Evitar ejercicio intenso y calor extremo las 24-48h siguientes
• Leve hinchazón o moratón son normales los primeros días — desaparecen solos
• El resultado final se estabiliza a las 2 semanas

Exosomas Autólogos:
• Mantener la zona tratada limpia las primeras 12h
• Evitar maquillaje y cremas las primeras 24h si se aplica en rostro
• Los resultados se aprecian progresivamente desde la segunda semana

Láser (Dual Fraxel / Clear and Brilliant / CO2):
• Aplicar fotoprotector SPF 50+ cada 2h si hay exposición solar (obligatorio 30 días)
• Puede aparecer enrojecimiento leve las primeras 24-48h — es completamente normal
• No rascar, frotar ni exfoliar la zona durante 7 días
• Evitar sauna y deporte intenso las 48h siguientes
• Hidratación intensa los días posteriores

CoolSculpting Elite:
• Puede aparecer enrojecimiento, hinchazón o sensación de adormecimiento temporal en la zona — es normal
• Masajear la zona tratada 2-5 minutos puede acelerar el proceso
• Actividad normal inmediata. Sin restricciones
• Los resultados son progresivos — visibles entre las 4 y 12 semanas

Thermage FLX:
• Posible leve enrojecimiento las primeras horas — es normal
• Actividad normal inmediata
• Los resultados se acumulan progresivamente hasta los 6 meses

Emtone / Emsculpt Neo:
• Actividad normal inmediata
• Puede notarse sensación de agujetas leve 24-48h (Emsculpt) — es señal de trabajo muscular real
• No hay restricciones de ningún tipo

Endolift:
• Posible leve hinchazón o enrojecimiento los primeros 2-3 días — normal y transitorio
• Evitar maquillaje las primeras 24h si se trató el rostro
• Evitar exposición solar directa la primera semana
• El resultado se aprecia de forma inmediata y mejora durante 3-6 meses

Cámara Hiperbárica (HBOT):
• Puede aparecer leve sensación de presión en los oídos durante la sesión — normal y temporal
• Hidratarse bien después de cada sesión
• Sin restricciones de actividad

Emsella (Suelo Pélvico):
• Sin restricciones. Actividad normal inmediata
• Las mejoras en la continencia se aprecian progresivamente entre sesiones

Hair Recovery:
• No lavar el cabello las primeras 12-24h
• Evitar el secador de calor las primeras 24h
• Los primeros resultados (reducción de caída) se notan en 4-6 semanas`.trim();

const frecuencias = `
• Bótox / Neuromoduladores: cada 4-6 meses
• Rellenos de Ácido Hialurónico: cada 9-18 meses (según zona)
• Exosomas Autólogos: cada 3 meses (mantenimiento)
• Láser Dual Fraxel: mensual en ciclo activo, luego según evaluación
• Clear and Brilliant: cada 3 semanas en ciclo, mantenimiento anual
• CoolSculpting Elite: revisión a los 2 meses para evaluar resultados
• Thermage FLX: revisión anual
• Emtone: cada 7 días en ciclo (4-8 sesiones), luego mantenimiento semestral
• Emsculpt Neo: cada 7 días en ciclo (4 sesiones), luego mantenimiento trimestral
• Endolift: revisión a los 9 meses
• Emsella: cada 14 días en ciclo (4-6 sesiones), luego según evolución
• Hair Recovery: mensual durante el ciclo activo
• Cámara Hiperbárica: cada 2 días en protocolo activo (mínimo 10 sesiones para efectos de longevidad)
• Programa Longevity Method: 10 sesiones de hiperbárica (cada 2 días) + suplementación continua
• Programa Sculpting Method: 10 sesiones en 5-7 semanas (cada 7 días)
• Programa Tightening Method: 4 sesiones totales (Thermage 1 vez + Emsculpt cada 14 días)`.trim();

// ── Para notificaciones n8n (ES + EN por tipo de tratamiento) ─────────────────

function getPreInstrucciones(tratamiento) {
  const t = (tratamiento || '').toLowerCase();

  if (t.includes('botox') || t.includes('bótox') || t.includes('neuromodulador')) {
    return {
      es: '📋 *Antes de su sesión de mañana:*\n• Sin alcohol hoy\n• Sin ibuprofeno ni aspirina los últimos 5 días\n• Llegue sin maquillaje ni cremas en la zona\n• Cualquier duda, estamos en el +34 609 663 344',
      en: '📋 *Before your session tomorrow:*\n• No alcohol today\n• No ibuprofen or aspirin for the last 5 days\n• Arrive without makeup or creams on the area\n• Any questions, reach us at +34 609 663 344',
    };
  }
  if (t.includes('relleno') || t.includes('hialurónico') || t.includes('hialuronico')) {
    return {
      es: '📋 *Antes de su sesión de mañana:*\n• Sin antiinflamatorios ni anticoagulantes los últimos 5 días\n• Llegue con la zona a tratar limpia, sin maquillaje\n• Cualquier duda, estamos en el +34 609 663 344',
      en: '📋 *Before your session tomorrow:*\n• No anti-inflammatories or blood thinners for the last 5 days\n• Arrive with the treatment area clean, no makeup\n• Any questions, reach us at +34 609 663 344',
    };
  }
  if (t.includes('laser') || t.includes('láser') || t.includes('fraxel') || t.includes('brilliant') || t.includes('co2')) {
    return {
      es: '📋 *Antes de su sesión de mañana:*\n• Sin exposición solar ni autobronceador estas 2 semanas\n• Sin retinol ni ácidos los últimos 5 días\n• Llegue con la piel limpia, sin maquillaje\n• Cualquier duda, estamos en el +34 609 663 344',
      en: '📋 *Before your session tomorrow:*\n• No sun exposure or self-tanner these 2 weeks\n• No retinol or acids for the last 5 days\n• Arrive with clean skin, no makeup\n• Any questions, reach us at +34 609 663 344',
    };
  }
  if (t.includes('coolsculpting') || t.includes('thermage') || t.includes('emtone') || t.includes('emsculpt')) {
    return {
      es: '📋 *Antes de su sesión de mañana:*\n• Buena hidratación hoy y mañana\n• Ropa cómoda y fácil de retirar en la zona a tratar\n• Sin joyas ni dispositivos metálicos en la zona\n• Cualquier duda, estamos en el +34 609 663 344',
      en: '📋 *Before your session tomorrow:*\n• Good hydration today and tomorrow\n• Comfortable, easy-to-remove clothing on the treatment area\n• No jewelry or metal devices in the area\n• Any questions, reach us at +34 609 663 344',
    };
  }
  if (t.includes('hiperbarica') || t.includes('hiperbárica') || t.includes('hbot') || t.includes('longevity')) {
    return {
      es: '📋 *Antes de su sesión de mañana:*\n• No fumar el día de la sesión\n• Ropa de algodón 100% (nada sintético)\n• Comer algo ligero antes\n• Informe si tiene otitis o sinusitis activa\n• Cualquier duda, estamos en el +34 609 663 344',
      en: '📋 *Before your session tomorrow:*\n• No smoking on the day of the session\n• 100% cotton clothing (no synthetic fabrics)\n• Eat something light beforehand\n• Let us know if you have active ear or sinus infection\n• Any questions, reach us at +34 609 663 344',
    };
  }
  if (t.includes('emsella') || t.includes('suelo pélvico') || t.includes('pelvico')) {
    return {
      es: '📋 *Antes de su sesión de mañana:*\n• Sin ropa interior con piezas metálicas\n• Se realiza completamente vestida — no hay preparación especial\n• Llegue con tiempo para quitarse joyas y cinturón si lleva\n• Cualquier duda, estamos en el +34 609 663 344',
      en: '📋 *Before your session tomorrow:*\n• No underwear with metal parts\n• Treatment is performed fully clothed — no special preparation needed\n• Arrive with time to remove jewelry and belt if wearing one\n• Any questions, reach us at +34 609 663 344',
    };
  }
  if (t.includes('endolift')) {
    return {
      es: '📋 *Antes de su sesión de mañana:*\n• Sin anticoagulantes ni antiinflamatorios los últimos 5 días\n• Sin exposición solar la última semana\n• Llegue sin maquillaje ni cremas en la zona\n• Cualquier duda, estamos en el +34 609 663 344',
      en: '📋 *Before your session tomorrow:*\n• No blood thinners or anti-inflammatories for the last 5 days\n• No sun exposure this past week\n• Arrive without makeup or creams on the area\n• Any questions, reach us at +34 609 663 344',
    };
  }
  if (t.includes('hair') || t.includes('capilar') || t.includes('exosoma')) {
    return {
      es: '📋 *Antes de su sesión de mañana:*\n• Cuero cabelludo limpio, sin geles, lacas ni tónicos\n• Sin anticoagulantes los últimos 3 días\n• Cualquier duda, estamos en el +34 609 663 344',
      en: '📋 *Before your session tomorrow:*\n• Clean scalp, free of gels, sprays or tonics\n• No blood thinners for the last 3 days\n• Any questions, reach us at +34 609 663 344',
    };
  }
  // Default
  return {
    es: '📋 *Recordatorio de su cita de mañana en Lonvye Clinic:*\n• Llegue con 5 minutos de antelación\n• Si necesita cancelar o cambiar, hágalo antes de hoy con al menos 24h de antelación\n• Cualquier duda, estamos en el +34 609 663 344',
    en: '📋 *Reminder of your appointment tomorrow at Lonvye Clinic:*\n• Please arrive 5 minutes early\n• If you need to cancel or change, please do so with at least 24 hours notice\n• Any questions, reach us at +34 609 663 344',
  };
}

function getPostInstrucciones(tratamiento) {
  const t = (tratamiento || '').toLowerCase();

  if (t.includes('botox') || t.includes('bótox') || t.includes('neuromodulador')) {
    return {
      es: '• No se tumbe las 4h siguientes al tratamiento\n• No masajee la zona tratada las 24h siguientes\n• Evite calor intenso (sauna, sol directo, deporte) las 48h siguientes\n• El resultado completo se aprecia entre los días 7 y 14\n• Ante cualquier duda: +34 609 663 344',
      en: '• Do not lie down for 4 hours after treatment\n• Do not massage the treated area for 24 hours\n• Avoid intense heat (sauna, direct sun, exercise) for 48 hours\n• Full results visible between days 7 and 14\n• Any questions: +34 609 663 344',
    };
  }
  if (t.includes('relleno') || t.includes('hialurónico') || t.includes('hialuronico')) {
    return {
      es: '• No masajee la zona tratada las 24h siguientes\n• Evite ejercicio intenso y calor extremo las 24-48h siguientes\n• Leve hinchazón o moratón son normales los primeros días\n• El resultado final se estabiliza en 2 semanas\n• Ante cualquier duda: +34 609 663 344',
      en: '• Do not massage the treated area for 24 hours\n• Avoid intense exercise and extreme heat for 24-48 hours\n• Mild swelling or bruising is normal in the first few days\n• Final results stabilize within 2 weeks\n• Any questions: +34 609 663 344',
    };
  }
  if (t.includes('laser') || t.includes('láser') || t.includes('fraxel') || t.includes('brilliant') || t.includes('co2')) {
    return {
      es: '• Fotoprotector SPF 50+ cada 2h si hay sol — obligatorio 30 días\n• Puede aparecer enrojecimiento leve 24-48h — es normal\n• No rasque ni exfolie la zona durante 7 días\n• Hidratación intensa los días siguientes\n• Ante cualquier duda: +34 609 663 344',
      en: '• SPF 50+ sunscreen every 2h if sun-exposed — mandatory for 30 days\n• Mild redness may appear for 24-48h — this is normal\n• Do not scratch or exfoliate the area for 7 days\n• Intense moisturization in the following days\n• Any questions: +34 609 663 344',
    };
  }
  if (t.includes('coolsculpting')) {
    return {
      es: '• Posible enrojecimiento, hinchazón o adormecimiento temporal en la zona — completamente normal\n• Puede masajear la zona 2-5 minutos para acelerar el proceso\n• Actividad normal inmediata. Sin restricciones\n• Resultados visibles entre las 4 y 12 semanas\n• Ante cualquier duda: +34 609 663 344',
      en: '• Redness, swelling or temporary numbness in the area is completely normal\n• You may massage the area for 2-5 minutes to speed the process\n• Immediate return to normal activity. No restrictions\n• Results visible between 4 and 12 weeks\n• Any questions: +34 609 663 344',
    };
  }
  if (t.includes('thermage')) {
    return {
      es: '• Posible leve enrojecimiento las primeras horas — normal\n• Actividad normal inmediata\n• Los resultados se acumulan progresivamente hasta los 6 meses\n• Ante cualquier duda: +34 609 663 344',
      en: '• Mild redness in the first few hours is normal\n• Immediate return to normal activity\n• Results build progressively over 6 months\n• Any questions: +34 609 663 344',
    };
  }
  if (t.includes('emtone') || t.includes('emsculpt')) {
    return {
      es: '• Actividad normal inmediata. Sin restricciones\n• Puede notar agujetas leves 24-48h (Emsculpt) — señal de trabajo muscular real\n• Resultados óptimos a las 6-12 semanas de la última sesión\n• Ante cualquier duda: +34 609 663 344',
      en: '• Immediate return to normal activity. No restrictions\n• You may feel mild muscle soreness for 24-48h (Emsculpt) — sign of real muscle work\n• Optimal results 6-12 weeks after the last session\n• Any questions: +34 609 663 344',
    };
  }
  if (t.includes('endolift')) {
    return {
      es: '• Posible leve hinchazón o enrojecimiento los primeros 2-3 días — normal y transitorio\n• Evite maquillaje las primeras 24h\n• Evite exposición solar directa la primera semana\n• El resultado mejora progresivamente durante 3-6 meses\n• Ante cualquier duda: +34 609 663 344',
      en: '• Mild swelling or redness in the first 2-3 days is normal and temporary\n• Avoid makeup for the first 24 hours\n• Avoid direct sun exposure for the first week\n• Results improve progressively over 3-6 months\n• Any questions: +34 609 663 344',
    };
  }
  if (t.includes('hiperbarica') || t.includes('hiperbárica') || t.includes('hbot') || t.includes('longevity')) {
    return {
      es: '• Hidratarse bien después de cada sesión\n• Sin restricciones de actividad\n• La sensación de energía suele notarse tras la 3ª-5ª sesión\n• Ante cualquier duda: +34 609 663 344',
      en: '• Stay well hydrated after each session\n• No activity restrictions\n• Increased energy is usually felt after the 3rd-5th session\n• Any questions: +34 609 663 344',
    };
  }
  if (t.includes('emsella') || t.includes('suelo pélvico') || t.includes('pelvico')) {
    return {
      es: '• Sin restricciones. Actividad normal inmediata\n• Las mejoras en la continencia se aprecian progresivamente entre sesiones\n• Resultados óptimos al completar el ciclo completo\n• Ante cualquier duda: +34 609 663 344',
      en: '• No restrictions. Immediate return to normal activity\n• Improvements in continence are felt progressively between sessions\n• Optimal results after completing the full cycle\n• Any questions: +34 609 663 344',
    };
  }
  if (t.includes('hair') || t.includes('capilar') || t.includes('exosoma')) {
    return {
      es: '• No lave el cabello las primeras 12-24h\n• Evite el secador de calor las primeras 24h\n• La reducción de caída se nota en 4-6 semanas\n• Ante cualquier duda: +34 609 663 344',
      en: '• Do not wash your hair for the first 12-24 hours\n• Avoid heat dryer for the first 24 hours\n• Reduction in hair loss is noticed within 4-6 weeks\n• Any questions: +34 609 663 344',
    };
  }
  return null;
}

module.exports = { preTratamiento, postTratamiento, frecuencias, getPreInstrucciones, getPostInstrucciones };
