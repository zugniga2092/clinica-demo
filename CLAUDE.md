# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What this system is

A conversational AI agent for an aesthetic clinic. It attends patients 24/7 via Telegram, manages appointments, answers treatment questions, and acts as a copilot for the reception team in admin mode. Always addresses patients formally (usted), supports ES/EN.

---

## Dev commands

```bash
npm install          # Install dependencies
npm run dev          # Start with auto-restart (node --watch, no nodemon)
npm start            # Production start
```

Copy `.env.example` to `.env` before starting. The app exits immediately if any required env var is missing.

---

## Architecture and dependency rules

**Strict dependency order — never invert:**
```
index.js → messenger.js + workflows/n8n-endpoints.js
messenger.js → commands/cliente.js + commands/admin.js + memory.js
commands/cliente.js → agent.js + memory.js + config.js
commands/admin.js → memory.js + config.js + agent.js
agent.js → memory.js + config.js
workflows/n8n-endpoints.js → memory.js + config.js + commands/admin.js
```

**`config.js` is the only file that changes per client.** It contains clinic identity, treatment catalog (with `frecuencia_dias` per treatment), and cancellation policy.

**System prompt is built dynamically** — `agent.js:buildSystemPrompt()` assembles all context (date/time, config, day availability, patient profile, active appointments, learned KB) from Supabase on every call. There is no static system prompt.

---

## Tag pattern — key architectural decision

The agent does **not** use function calling. Instead, Claude embeds special tags in its response that `cliente.js:procesarEtiquetas()` intercepts and processes **before** sending the text to the patient. The patient never sees the tags.

Tags use this format: `[TAG_NAME: key=value, key=value]`

The `parsearCampos()` regex handles values that contain commas (e.g., notes).

All supported tags and their effects are documented in `agent.js` (section 18 of the system prompt).

---

## Models

- **claude-sonnet-4-6** — patient conversations (`agent.js:getResponse`)
- **claude-haiku-4-5-20251001** — admin fallback / fast tasks (`agent.js:getAdminResponse`)

---

## Admin mode

Activated by prefixing a message with `#admin`. Only `TELEGRAM_ADMIN_CHAT_ID` can use admin mode (if the env var is set; if unset, any chat can). Session persists 30 minutes without activity, tracked in an in-memory `Map` in `messenger.js`.

During an active admin session, any plain text (without `#admin` prefix) is automatically routed through admin mode and forwarded to Claude Haiku with real-time clinic context.

Structured commands (handled directly without Claude): `citas hoy`, `citas mañana`, `confirmar [nombre]`, `rechazar [nombre] [motivo]`, `cancelar [nombre]`, `completar [nombre]`, `no-show [nombre]`, `lista espera`, `preguntas`, `respuesta [id] [texto]`, `resumen`, `reporte semanal`, `ayuda`. Anything else falls back to Claude Haiku.

---

## Database (Supabase)

All tables include `business_id` for multi-tenant architecture. Run `supabase/schema.sql` in Supabase SQL Editor to create tables.

Key tables: `conversaciones` (short-term memory, last 10 messages), `pacientes` (long-term patient profile), `citas` (appointments with estados: pendiente → confirmada → completada / cancelada / rechazada / no_show), `lista_espera`, `preguntas_desconocidas` (also serves as knowledge base when estado='respondida'), `agenda_dia` (daily availability config), `recordatorios_tratamiento`, `notificaciones`.

**Note:** `memory.js:upsertPatient()` uses `onConflict: 'business_id,chat_id'`.

**`getCitasByFecha` excludes `cancelada` and `rechazada` states.** Use `getCitasDelDiaCompleto` to get all states (used in `#admin resumen` to count cancellations).

**`completarCita` does more than setting `estado='completada'`** — it also updates the patient profile: increments `visitas_total`, appends to `tratamientos_realizados`, and sets `ultima_visita`. Always use `completarCita` (not `updateCita`) when marking appointments done.

---

## Date handling

- Dates in the tag system use `DD/MM/YYYY` format
- Supabase stores dates as `YYYY-MM-DD`
- `memory.js:parseFecha()` converts between them

---

## What is hardcoded vs configurable

**In `config.js` (change per client):** clinic identity, contact info, hours, treatment catalog, cancellation policy.

**Hardcoded in `agent.js`:** pre/post treatment instructions per treatment type, recurrence frequencies in natural language. These are embedded directly in the system prompt string, not driven by config.

---

## Telegram bot runtime

The bot runs in **polling mode** (not webhooks). `bot.launch()` starts long-polling; `bot.stop()` is called on SIGINT/SIGTERM. There is no webhook setup. Voice messages and files are acknowledged but not processed.

---

## n8n integration

The REST endpoint exposed for n8n automations:
```
POST /agent
Body: { businessId, action, data }
```
Handled in `workflows/n8n-endpoints.js`. The bot instance is injected into Express requests via middleware in `index.js` so endpoints can send Telegram messages.

Supported actions: `recordatorio_48h`, `recordatorio_24h`, `recordatorio_2h`, `post_tratamiento`, `encuesta_satisfaccion`, `solicitar_resena`, `recordatorio_recurrencia`, `reactivar_pacientes`, `notificar_lista_espera`, `aviso_agenda`, `reporte_semanal`.

**Important:** Pre/post treatment instructions exist in two places — as plain text in `agent.js:buildSystemPrompt()` (for the conversation system prompt) and as bilingual ES/EN objects in `workflows/n8n-endpoints.js:getPreInstrucciones()`/`getPostInstrucciones()` (for notification messages). Changes to instructions must be applied in both places.

Health check: `GET /health`

---

## Environment variables

```env
ANTHROPIC_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=     # Omit to allow any chat to use #admin
SUPABASE_URL=
SUPABASE_ANON_KEY=
BUSINESS_ID=clinica-nombre
PORT=3000
```
