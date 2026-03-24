-- ============================================================
-- BASE DE CONOCIMIENTO — Lonvye Clinic by Dra. Antón
-- Ejecutar en Supabase SQL Editor (una sola vez al crear el cliente)
-- Todas las entradas en lenguaje de PACIENTE, no técnico.
-- El agente las recupera por relevancia semántica (top-3 por consulta).
-- ============================================================
-- Para añadir más entradas en producción: #admin aprender pregunta | respuesta
-- ============================================================
-- PERSONAL IDENTIFICADO (contexto interno, no para pacientes):
-- Dra. María Dolores Antón Rico — médico titular / directora
-- Cristina Vera — administración / recepción
-- ============================================================

INSERT INTO preguntas_desconocidas
  (business_id, pregunta, respuesta, estado, created_at)
VALUES

-- ============================================================
-- TRATAMIENTOS ADICIONALES (facial médico)
-- ============================================================

('lonvye-clinic',
 '¿Qué es la rinomodelación? ¿Se puede corregir la nariz sin operar?',
 'Sí. La rinomodelación sin cirugía consiste en microinyecciones de ácido hialurónico que permiten corregir pequeñas imperfecciones de la nariz — elevar la punta, disimular una joroba, mejorar la simetría — de forma inmediata y sin cirugía. El resultado es natural, dura aproximadamente un año y el procedimiento dura solo 20-30 minutos sin recuperación. La Dra. Antón evalúa en la consulta si su caso es candidato a este tratamiento.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué son los peelings químicos? ¿Para qué sirven?',
 'Los peelings químicos son tratamientos con ácidos médicos que renuevan la capa superficial de la piel para tratar manchas, cicatrices de acné, poros dilatados y textura irregular. En Lonvye Clinic los aplicamos con concentraciones y combinaciones médicas adaptadas a cada tipo de piel. El resultado es una piel más luminosa, uniforme y renovada. El ciclo habitual son varias sesiones mensuales seguidas de mantenimiento semestral.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué es el Láser Alma Q? ¿En qué se diferencia del Fraxel?',
 'El Láser Alma Q es un láser Q-switched especialmente eficaz para manchas pigmentadas profundas, lentigos solares y lesiones de color. Actúa con pulsos de energía muy cortos que fragmentan el pigmento sin afectar el tejido circundante. El Dual Fraxel es más versátil — trabaja también arrugas y textura. En algunos casos se usan de forma complementaria. La Dra. Antón determina cuál o qué combinación es más adecuada para su tipo de mancha en la valoración.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué son los Medical LEDs? ¿Para qué se usan?',
 'Los Medical LEDs son dispositivos de fototerapia de uso médico que emiten luz de distintas longitudes de onda para estimular la regeneración celular, reducir la inflamación y mejorar el aspecto de la piel. En Lonvye Clinic los usamos como tratamiento complementario tras otros procedimientos o como mantenimiento. Son completamente indoloros, sin recuperación y muy bien tolerados.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué son los Factores de Crecimiento? ¿Cuánto cuestan?',
 'Los Factores de Crecimiento son proteínas extraídas de la sangre del propio paciente que, al reintroducirse en la piel o el cuero cabelludo, estimulan la regeneración y rejuvenecimiento de los tejidos. Es un tratamiento 100% natural y biocompatible. El precio en Lonvye Clinic es de 500 €. Se usa tanto para rejuvenecimiento facial como para frenar la caída del cabello. La Dra. Antón le indicará si es la opción más adecuada para su caso.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Cuánto cuestan los exosomas?',
 'Los exosomas autólogos en Lonvye Clinic tienen un precio de entre 500 y 1.000 €, en función del protocolo y la zona a tratar. Son la terapia regenerativa más avanzada que ofrecemos — más potente que el PRP o los factores de crecimiento convencionales. Para saber exactamente qué protocolo le correspondería y el coste total, lo ideal es reservar una consulta de valoración con la Dra. Antón.',
 'respondida', NOW()),

-- ============================================================
-- INFORMACIÓN GENERAL DE LA CLÍNICA
-- ============================================================

('lonvye-clinic',
 '¿Qué es Lonvye Clinic? ¿Qué tipo de clínica es?',
 'Lonvye Clinic es una clínica médica especializada en estética avanzada y longevidad, ubicada en el corazón de Valencia. Aquí no solo trabajamos la parte estética — también nos ocupamos de que usted viva más años con mejor salud y energía. Todo bajo la dirección de la Dra. María Dolores Antón Rico, médica con más de 25 años de experiencia y exdirectora de Estética en SHA Wellness Clinic, una de las referencias de bienestar premium en España.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Quién es la Dra. Antón?',
 'La Dra. María Dolores Antón Rico es médica especializada en estética con más de 25 años de experiencia. Es licenciada en Medicina por la Universidad de Alicante y realizó uno de los primeros másteres oficiales en Medicina Estética de España. Ha dirigido el área de Estética en SHA Wellness Clinic y ha trabajado en clínicas de referencia en Madrid. Hoy dirige Lonvye Clinic en Valencia con un enfoque centrado en la medicina de la longevidad y los tratamientos no invasivos de última generación.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Cuánto cuesta la primera consulta? ¿Es gratuita la valoración?',
 'La primera consulta tiene un coste de 65 €, que se descuenta del tratamiento que decida realizarse. En esa visita, la Dra. Antón analiza su caso en detalle, le explica qué opciones son las más adecuadas para usted y le diseña un plan personalizado. No hay ningún compromiso de compra. ¿Le gustaría reservar su valoración?',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Atienden en inglés? ¿Tienen atención en otros idiomas?',
 'Sí, en Lonvye Clinic atendemos en español, inglés, árabe, chino, francés y ruso. Puede consultarnos con total comodidad en el idioma que prefiera.',
 'respondida', NOW()),

-- ============================================================
-- APARATOLOGÍA CORPORAL
-- ============================================================

('lonvye-clinic',
 '¿Qué es el CoolSculpting Elite? ¿Cómo funciona para eliminar grasa?',
 'CoolSculpting Elite es el tratamiento de referencia para eliminar esa grasa que no desaparece con dieta ni ejercicio — como la del abdomen, los flancos, los muslos o la papada. Funciona congelando las células de grasa de forma controlada para que el cuerpo las elimine de manera natural en las semanas siguientes. Es completamente seguro, sin cirugía, sin agujas y sin recuperación. La sesión dura entre 35 y 60 minutos y puede irse a trabajar después. Los resultados se aprecian progresivamente en 4-12 semanas.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Cuántas sesiones de CoolSculpting necesito? ¿Cuánto cuesta?',
 'El número de sesiones depende de las zonas a tratar y de sus objetivos — generalmente entre 1 y 3 sesiones por zona. El precio se personaliza en la valoración médica porque cada tratamiento es diferente según la persona. Lo que sí podemos decirle es que los resultados son permanentes en las células eliminadas. Para saber exactamente qué necesitaría usted y el coste, lo ideal es reservar una consulta con la Dra. Antón. ¿Le gustaría que le buscáramos hueco?',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué es el Thermage FLX? ¿Para qué sirve?',
 'El Thermage FLX es el tratamiento más avanzado para tensar y reafirmar la piel sin cirugía. Usa radiofrecuencia que llega a las capas profundas de la piel para estimular la producción de colágeno desde dentro. El resultado es un efecto lifting natural que se va acentuando durante los seis meses siguientes a la sesión. Lo mejor: es una sola sesión de 60-90 minutos, sin recuperación y sin agujas.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Cuánto dura el resultado del Thermage FLX? ¿Cuánto cuesta?',
 'Los resultados del Thermage FLX duran típicamente entre 12 y 18 meses. Muchos pacientes repiten una vez al año para mantener el efecto. El precio varía según la zona a tratar (rostro, cuello, cuerpo) y se determina en la valoración. ¿Le gustaría reservar una consulta para que la Dra. Antón evalúe su caso y le explique qué puede esperar?',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué es el Emsculpt Neo? ¿Sirve para marcar abdomen o glúteos?',
 'El Emsculpt Neo es como hacer 20.000 abdominales o sentadillas en 30 minutos — sin mover un músculo. Combina contracciones musculares de alta intensidad con calor para tonificar y a la vez reducir la grasa de la zona. Es especialmente popular para abdomen, glúteos, brazos y muslos. El ciclo son 4 sesiones de 30 minutos (una por semana). Sin dolor, sin recuperación y con resultados que se ven a partir de la segunda sesión.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué diferencia hay entre Emsculpt Neo y CoolSculpting?',
 'Son tratamientos complementarios que actúan de forma diferente. El CoolSculpting Elite elimina grasa localizada de forma definitiva, pero no tonifica el músculo. El Emsculpt Neo tona el músculo y también ayuda a reducir grasa, pero su fuerte es la definición muscular. Muchos pacientes combinan ambos para un resultado más completo. La Dra. Antón le recomendará cuál o qué combinación es más adecuada para su objetivo en la consulta de valoración.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué es Emtone? ¿Sirve para la celulitis?',
 'El Emtone es el tratamiento más eficaz que tenemos para la celulitis. Combina calor y vibración para romper los tabiques que forman los hoyuelos de la celulitis y reafirmar la piel. Se nota como un masaje de piedras calientes — muy cómodo. Desde la primera sesión se aprecia mejoría en la textura. El ciclo típico son 4-6 sesiones, una o dos por semana, sin recuperación.',
 'respondida', NOW()),

-- ============================================================
-- APARATOLOGÍA FACIAL
-- ============================================================

('lonvye-clinic',
 '¿Qué es el Endolift? ¿Es una cirugía?',
 'El Endolift no es cirugía, pero produce un efecto lifting real. Se introduce una microfibra óptica de láser bajo la piel — con anestesia local — que tensa los tejidos y elimina grasa localizada desde dentro. En una sola sesión de 30-60 minutos se consigue un efecto lifting inmediato que sigue mejorando durante los meses siguientes. La recuperación es mínima: posible leve hinchazón los primeros 2-3 días y puede hacer vida normal en 24-48 horas.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué es el Láser Dual Fraxel? ¿Para qué manchas sirve?',
 'El Láser Dual Fraxel es uno de los láseres más versátiles y precisos que tenemos. Actúa sobre manchas solares, manchas por acné, melasma, cicatrices, poros dilatados y arrugas finas. La sesión dura solo 10-15 minutos, se aplica anestesia tópica para que sea muy cómodo, y puede hacer vida normal inmediatamente. Los resultados son progresivos y muy naturales.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué diferencia hay entre el Fraxel y el Clear and Brilliant?',
 'Ambos son láseres, pero con intensidades diferentes. El Láser Dual Fraxel actúa más en profundidad y es ideal para manchas marcadas, cicatrices o arrugas ya establecidas. El Clear and Brilliant es más suave, perfecto para prevenir el envejecimiento, mejorar la luminosidad y el tono de forma progresiva. Muchos pacientes usan el Clear and Brilliant como mantenimiento mensual y hacen Fraxel cuando quieren trabajar algo más específico. La Dra. Antón le indicará cuál es el adecuado para usted.',
 'respondida', NOW()),

-- ============================================================
-- INYECTABLES
-- ============================================================

('lonvye-clinic',
 '¿El bótox queda natural? ¿Se va a notar?',
 'El objetivo en Lonvye Clinic es siempre que nadie note que se ha hecho nada — solo que usted tiene mejor cara. La Dra. Antón trabaja con cantidades muy precisas para suavizar las arrugas de expresión sin congelar la cara. El resultado se aprecia progresivamente entre los días 7 y 14 y dura entre 4 y 6 meses. La sesión dura solo 15-20 minutos y puede irse a trabajar después.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Cuánto cuesta el bótox? ¿Y los rellenos?',
 'El precio del bótox y los rellenos varía según las zonas a tratar y la cantidad necesaria, que es algo que la Dra. Antón determina en la valoración porque cada rostro es diferente. Lo que sí puedo decirle es que hacemos un diagnóstico facial completo antes de cualquier inyección — nunca inyectamos sin evaluar. ¿Le gustaría reservar una consulta de valoración? Le explicaremos exactamente qué le vendría bien y el coste total.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué son los rellenos de ácido hialurónico? ¿Para qué sirven?',
 'Los rellenos de ácido hialurónico son microinyecciones que recuperan el volumen que se pierde con los años en zonas como los pómulos, los labios, las ojeras o los surcos que van de la nariz a la boca. El resultado es inmediato y muy natural. Dura entre 9 y 18 meses según la zona. En la consulta, la Dra. Antón analiza su rostro y le explica qué zonas se pueden mejorar y qué resultado puede esperar.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué son los exosomas? ¿Son mejores que el PRP?',
 'Los exosomas autólogos son una terapia regenerativa de última generación. Se extraen de las propias células del paciente y se reintroducen en la piel para activar la regeneración celular de forma muy precisa. A diferencia del PRP, los exosomas tienen una concentración mucho más alta de factores de señalización, lo que los hace más potentes y predecibles. Los resultados se aprecian de forma progresiva desde la segunda semana y se acumulan con el tiempo. Son ideales para rejuvenecimiento profundo o como potenciador de otros tratamientos.',
 'respondida', NOW()),

-- ============================================================
-- CÁMARA HIPERBÁRICA
-- ============================================================

('lonvye-clinic',
 '¿Qué es la cámara hiperbárica? ¿Para qué sirve?',
 'La cámara hiperbárica es una cabina donde usted respira oxígeno puro al 100% a una presión ligeramente superior a la atmosférica. Esto hace que el oxígeno llegue a todos los tejidos del cuerpo en cantidades mucho mayores de lo normal, acelerando la regeneración celular y reduciendo la inflamación. En Lonvye Clinic la usamos para longevidad y antienvejecimiento, recuperación acelerada, fibromialgia, heridas crónicas, mejora del rendimiento físico y mental, y como parte del programa Longevity Method. Cada sesión dura 90 minutos y es muy cómoda.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Cuántas sesiones de cámara hiperbárica necesito? ¿Qué resultados puedo esperar?',
 'Para protocolos de longevidad y bienestar general se recomiendan mínimo 10 sesiones. Los primeros efectos — más energía, mejor calidad de sueño, mayor claridad mental — se empiezan a notar a partir de la 3ª o 5ª sesión. Para condiciones médicas específicas, la Dra. Antón diseña el protocolo según su caso. El precio varía según el número de sesiones y el protocolo; existe el Programa Longevity Method que combina 10 sesiones con suplementación personalizada.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿La cámara hiperbárica da claustrofobia? ¿Es segura?',
 'La cámara hiperbárica de Lonvye Clinic es espaciosa y permite ver el exterior en todo momento. La mayoría de pacientes la describen como muy cómoda — muchos leen, escuchan música o simplemente descansan durante la sesión. Es un procedimiento médico completamente seguro, supervisado en todo momento por nuestro equipo. Si tiene tendencia a la claustrofobia, coméntelo y lo tenemos en cuenta.',
 'respondida', NOW()),

-- ============================================================
-- PROGRAMAS SIGNATURE
-- ============================================================

('lonvye-clinic',
 '¿Qué incluye el Programa Longevity Method? ¿Cuánto cuesta?',
 'El Lonvye Signature Longevity Method es nuestro programa estrella de longevidad activa. Incluye 10 sesiones de cámara hiperbárica más un protocolo de suplementación personalizado diseñado por la Dra. Antón específicamente para usted. El precio del programa completo es de 2.050 €. Actúa a nivel celular para rejuvenecer el organismo, mejorar la energía y la claridad mental, y frenar el envejecimiento desde dentro. Es una inversión en su salud a largo plazo.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué incluye el Programa Sculpting Method? ¿Cuánto cuesta?',
 'El Lonvye Signature Sculpting Method es nuestro programa de transformación corporal sin cirugía. Combina 5 sesiones de Emsculpt Neo (para tonificar músculo y reducir grasa) con 5 sesiones de Emtone (para eliminar celulitis y mejorar la textura de la piel). En total son 10 sesiones distribuidas en 5-7 semanas. El precio del programa es de 1.200 €. Los resultados se ven desde la segunda sesión y son óptimos a las 6-12 semanas de terminar.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué incluye el Programa Tightening Method? ¿Cuánto cuesta?',
 'El Lonvye Signature Tightening Method es nuestro programa de reafirmación sin cirugía. Combina 1 sesión de Thermage FLX (para tensar la piel en profundidad) con 3 sesiones de Emsculpt Neo (para tonificar y reafirmar). En total son 4 sesiones. El precio del programa es de 2.875 €. El resultado es un lifting y firmeza notables sin cirugía ni recuperación. Los efectos duran entre 12 y 18 meses.',
 'respondida', NOW()),

-- ============================================================
-- SUELO PÉLVICO E ÍNTIMO
-- ============================================================

('lonvye-clinic',
 '¿Para qué sirve la silla Emsella? ¿Ayuda con la incontinencia?',
 'La silla Emsella es una solución muy eficaz para la incontinencia urinaria y la debilidad del suelo pélvico. Se sienta sobre ella completamente vestida durante 28-30 minutos y la tecnología electromagnética provoca miles de contracciones del suelo pélvico — equivalente a más de 11.000 ejercicios de Kegel en una sola sesión. Muchas pacientes notan mejoría desde las primeras sesiones. También está indicada para la sequedad vaginal en la menopausia y para recuperar el tono tras el parto.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Tratan el liquen escleroso vulvar?',
 'Sí, en Lonvye Clinic tratamos el liquen escleroso vulvar con Láser CO2 Fraccionado. Es uno de los pocos tratamientos que ha demostrado eficacia real en esta condición, aliviando el picor intenso, la sequedad y los cambios en la piel de la zona. La Dra. Antón tiene experiencia específica en esta patología. Si padece esta condición, le recomendamos reservar una consulta de valoración para que diseñemos el protocolo más adecuado para su caso.',
 'respondida', NOW()),

-- ============================================================
-- CAPILAR
-- ============================================================

('lonvye-clinic',
 '¿Qué tratamientos tienen para la caída del cabello?',
 'En Lonvye Clinic ofrecemos el protocolo Hair Recovery, que combina exosomas autólogos con luz LED de alta potencia aplicada directamente sobre el cuero cabelludo. Los exosomas activan la regeneración del folículo capilar y el LED potencia ese efecto. Es un tratamiento médico no invasivo, sin recuperación, que frena la caída y estimula el crecimiento del cabello de forma natural. Los primeros resultados se notan en 4-6 semanas. También realizamos un diagnóstico capilar previo para determinar la causa de la caída.',
 'respondida', NOW()),

-- ============================================================
-- PREGUNTAS SOBRE EL PROCESO
-- ============================================================

('lonvye-clinic',
 '¿Cómo reservo una cita? ¿Puedo reservar por WhatsApp?',
 'Sí, puede reservar su cita directamente por WhatsApp en el +34 609 663 344, o también desde nuestra web. La primera consulta de valoración requiere un depósito de 65 € (que se aplica al tratamiento que elija) para confirmar la reserva. Le confirmamos disponibilidad y horarios en cuanto nos escriba. ¿Le busco un hueco ahora?',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Es seguro hacerse varios tratamientos a la vez? ¿Se pueden combinar?',
 'Sí, en muchos casos los tratamientos se complementan y ofrecen mejores resultados juntos — como Emtone y Emsculpt Neo en el cuerpo, o Fraxel con rellenos en el rostro. Pero la combinación siempre la decide la Dra. Antón tras evaluar su estado de salud y sus objetivos. Nunca diseñamos un plan sin una valoración previa. Es la única forma de asegurarse de que cada tratamiento es el adecuado para usted.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Los tratamientos duelen? ¿Necesito anestesia?',
 'La mayoría de nuestros tratamientos son muy bien tolerados. Los inyectables (bótox, rellenos, exosomas) se realizan con agujas muy finas o anestesia tópica previa. Los aparatos (CoolSculpting, Thermage, Emsculpt, Emtone) producen sensaciones de frío, calor o contracción, pero no son dolorosos. El Endolift y el Láser Dual Fraxel requieren anestesia local. En la valoración le explicamos exactamente qué va a sentir en cada procedimiento.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Qué diferencia hay entre una clínica médica estética y un centro de belleza?',
 'Una clínica médica como Lonvye Clinic está dirigida por médicos especializados y puede usar aparatología médica certificada, realizar tratamientos inyectables y tratar condiciones dermatológicas y médicas como la incontinencia, el liquen escleroso, la fibromialgia o la caída del cabello. Un centro de belleza no puede hacer nada de esto. Cuando busca resultados reales y seguros, la medicina estética es la diferencia.',
 'respondida', NOW()),

('lonvye-clinic',
 '¿Cuándo veré resultados? ¿Cuánto tiempo tardan?',
 'Depende del tratamiento. Algunos son inmediatos (rellenos, bótox a partir del día 7, Endolift). Otros son progresivos: CoolSculpting Elite muestra resultados plenos a las 8-12 semanas, Thermage FLX a los 4-6 meses, Emsculpt Neo entre las 4-12 semanas del ciclo. La Dra. Antón le explicará en detalle qué puede esperar y cuándo en la valoración. También hacemos seguimiento fotográfico para que pueda ver su evolución.',
 'respondida', NOW());
