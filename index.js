// index.js — Punto de entrada: arranca Express + bot de Telegram
require('dotenv').config();
const express = require('express');
const { createBot } = require('./messenger');
const { router } = require('./workflows/n8n-endpoints');

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
  console.error(`❌ Faltan variables de entorno: ${missing.join(', ')}`);
  console.error('Copia .env.example a .env y rellena los valores.');
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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', business: process.env.BUSINESS_ID, ts: new Date().toISOString() });
});

// ── Arrancar todo ─────────────────────────────────────────────────────────────
async function start() {
  // Arrancar servidor Express
  app.listen(PORT, () => {
    console.log(`✅ Servidor HTTP escuchando en puerto ${PORT}`);
  });

  // Arrancar bot en modo polling (launch() no resuelve en Telegraf v4)
  bot.launch().catch(err => {
    console.error('❌ Error arrancando el bot de Telegram:', err.message);
    process.exit(1);
  });
  console.log(`✅ Bot de Telegram iniciado (BUSINESS_ID: ${process.env.BUSINESS_ID})`);
  console.log('🤖 Agente listo para atender pacientes.');
}

start().catch(err => {
  console.error('❌ Error arrancando el agente:', err);
  process.exit(1);
});

// ── Cierre limpio ─────────────────────────────────────────────────────────────
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
