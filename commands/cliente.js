// commands/cliente.js — Modo paciente: llama al agente y procesa etiquetas
const agent = require('../agent');
const memory = require('../memory');
const actionHandler = require('../actionHandler');

// ── Handler principal ─────────────────────────────────────────────────────────

async function handleMessage(businessId, chatId, userMessage, bot) {
  await memory.saveMessage(businessId, chatId, 'user', userMessage);

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

  // retryFn: called by actionHandler if a DB action fails.
  // Sends an error context message back to the LLM so it apologises and offers an alternative.
  const retryFn = async (errorMsg) => {
    return agent.getResponse(
      businessId, chatId,
      `[ERROR_SISTEMA: La acción solicitada falló con el siguiente motivo: "${errorMsg}". ` +
      `Discúlpate con el paciente de forma natural y ofrécele una alternativa concreta.]`
    );
  };

  const textoLimpio = await actionHandler.processActions(rawResponse, businessId, chatId, bot, retryFn);

  await memory.saveMessage(businessId, chatId, 'assistant', textoLimpio);
  return textoLimpio;
}

module.exports = { handleMessage };
