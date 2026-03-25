// index.js — Punto de entrada: arranca Express + bot de Telegram
require('dotenv').config();
const express = require('express');
const { createBot } = require('./messenger');
const { router } = require('./workflows/n8n-endpoints');
const logger = require('./logger');

const PORT = process.env.PORT || 3000;

// ── Validar variables de entorno obligatorias ─────────────────────────────────
const required = [
  'ANTHROPIC_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'BUSINESS_ID',
];

const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  logger.error({ msg: 'Faltan variables de entorno', missing });
  process.exit(1);
}

// ── Bot de Telegram ───────────────────────────────────────────────────────────
const bot = createBot();

// ── Express (para n8n y health check) ────────────────────────────────────────
const app = express();
app.use(express.json());

// Inyectar bot en requests para que los endpoints n8n puedan enviar mensajes
app.use((req, _res, next) => {
  req.bot = bot;
  next();
});

app.use('/', router);

app.get('/health', async (_req, res) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  let supabaseOk = false;
  try {
    const { error } = await supabase.from('pacientes').select('id').limit(1);
    supabaseOk = !error;
  } catch (_) {}

  const status = supabaseOk ? 'ok' : 'degraded';
  res.status(supabaseOk ? 200 : 503).json({
    status,
    business: process.env.BUSINESS_ID,
    supabase: supabaseOk ? 'ok' : 'unreachable',
    ts: new Date().toISOString(),
  });
});

// ── Arrancar todo ─────────────────────────────────────────────────────────────
async function start() {
  app.listen(PORT, () => {
    logger.info({ msg: 'servidor HTTP iniciado', puerto: PORT, businessId: process.env.BUSINESS_ID });
  });

  bot.launch().catch(err => {
    logger.error({ msg: 'error arrancando bot Telegram', error: err.message });
    process.exit(1);
  });
  logger.info({ msg: 'agente listo', canal: 'telegram', businessId: process.env.BUSINESS_ID });
}

start().catch(err => {
  logger.error({ msg: 'error fatal en arranque', error: err.message });
  process.exit(1);
});

// ── Cierre limpio ─────────────────────────────────────────────────────────────
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
