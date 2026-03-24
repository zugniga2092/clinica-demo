# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What this system is

A **Hybrid Multichannel AI Agent** for aesthetic clinics. It attends patients 24/7 via **Telegram, WhatsApp, and Voice (Vapi)**, manages appointments, answers treatment questions, and acts as an intelligent copilot for the reception team. Always addresses patients formally (usted / formal you), supports ES/EN.

---

## Dev commands

```bash
npm install          # Install dependencies
npm run dev          # Start with auto-restart (node --watch, no nodemon) — requires Node 18+
npm start            # Production start
```

Copy `.env.example` to `.env` before starting. The app exits immediately if any required env var is missing.

There is no test suite. Validate behaviour manually via Telegram or the HTTP endpoints.

---

## Architecture and dependency rules

### Channel entry points

Each channel has its own webhook/listener that normalises the incoming message into a standard internal format `{ businessId, chatId, message, channel, is_voice }` and routes it to the core agent.

**Currently implemented:** Telegram only. WhatsApp (Evolution API) and Voice (Vapi.ai) are planned — add `webhooks/whatsapp.js` and `webhooks/vapi.js` when implementing them.

```
Telegram (polling)   →  messenger.js           ✅ implemented
WhatsApp (webhook)   →  webhooks/whatsapp.js   🔜 planned (Evolution API)
Voice (webhook)      →  webhooks/vapi.js        🔜 planned (Vapi.ai)
```

All channels converge on the same core pipeline:

```
webhooks/* + messenger.js
  → commands/cliente.js      (patient flow)
  → agent.js                 (LLM call + system prompt)
  → actionHandler.js         (tag execution + error recovery)
  → memory.js                (Supabase persistence)
```

### Strict dependency order — never invert

```
index.js
  → messenger.js
  → workflows/n8n-endpoints.js
  (+ webhooks/whatsapp.js and webhooks/vapi.js when implemented)

messenger.js / webhooks/*
  → commands/cliente.js
  → commands/admin.js
  → memory.js

commands/cliente.js   → agent.js + actionHandler.js + memory.js
commands/admin.js     → memory.js + agent.js
agent.js              → memory.js + contextManager.js + clientes/<BUSINESS_ID>/config.js
actionHandler.js      → memory.js + clientes/<BUSINESS_ID>/config.js
workflows/n8n-endpoints.js → memory.js + sessionStore.js + commands/admin.js
```

### Per-client files — `clientes/<BUSINESS_ID>/`

Loaded dynamically at runtime via `` require(`./clientes/${BUSINESS_ID}/...`) ``:

- `config.js` — clinic identity, contact info, hours, treatment catalog (each with `frecuencia_dias`), cancellation policy
- `instrucciones.js` — pre/post treatment instructions: plain-text strings for the system prompt + bilingual ES/EN objects for notification messages

Root `config.js` is a template/readme only — it is not used at runtime.

---

## System prompt — dynamic assembly

`agent.js:buildSystemPrompt(businessId, chatId, userQuery)` assembles all context on every call from Supabase. There is no static system prompt. The `is_voice` parameter is planned for Vapi integration — when adding it, section 4 must add a constraint: responses ≤2 sentences, spoken-word safe (no markdown, no bullet points, no emojis).

Sections injected at build time (numbered 1–19 in the actual prompt):
1. Date/time and locale
2. Language detection + formal register rule
3. Clinic identity (from `config.js`)
4. Tone and communication rules
5. Scope limits
6. Clinic info (address, phone, hours)
7. Treatment catalogue
8. General contraindications
9. Pre-treatment instructions (from `instrucciones.js`)
10. Post-treatment instructions (from `instrucciones.js`)
11. Recurrence frequencies
12. Day context (from `agenda_dia`)
13. Patient profile (from `pacientes`)
14. Active appointments (from `citas`) — ID shown as first 8 chars
15. **Support context** — top-3 KB entries most relevant to `userQuery`, selected by `contextManager.js` via keyword-overlap scoring (not the full dump)
16. Booking policy and availability rules
17. Appointment flow and data collection rules
18. Tag system documentation (all supported tags)
19. Urgency and referral protocol

---

## Tag pattern — key architectural decision

The agent does **not** use function calling. Claude embeds special tags in its response that `actionHandler.js` intercepts and executes **before** the text is sent to the patient. The patient never sees the tags.

**Format:** `[TAG_NAME: key=value, key=value]`

`parsearCampos()` uses a regex that correctly handles values containing commas (e.g., `notas=Me interesa el bótox, también las ojeras`).

### Supported tags

| Tag | Effect |
|-----|--------|
| `[CITA: nombre=X, fecha=DD/MM/YYYY, hora=HH:MM, tratamiento=X, profesional=X, telefono=X, idioma=es\|en, notas=X]` | Creates appointment in Supabase, notifies admin, schedules recurrence reminder |
| `[CANCELAR_CITA: id=XXXXXXXX]` | Sets estado='cancelada', notifies admin, triggers waitlist check |
| `[MODIFICAR_CITA: id=XXXXXXXX, campo=hora\|fecha_cita\|tratamiento, valor=X]` | Updates a single field on an existing appointment |
| `[LISTA_ESPERA: nombre=X, tratamiento=X, franja=mañana\|tarde\|indiferente, telefono=X]` | Adds patient to waitlist, notifies admin |
| `[PREGUNTA_DESCONOCIDA: texto]` | Saves unknown question for admin review; admin answers with `#admin respuesta [id] [text]` |
| `[PACIENTE_NOTA: texto]` | Appends a note to the patient profile |
| `[DETECTAR_IDIOMA: es\|en]` | Persists the patient's preferred language (use on first message only) |
| `[ALERTA_CONTRAINDICACION: texto]` | Appends contraindication to patient profile, sends urgent alert to admin |

### Error recovery — critical behaviour

`actionHandler.js:processActions(rawText, businessId, chatId, bot, retryFn)` processes all tags in one global-regex pass. **If a tag's DB action fails** (e.g., `saveCita` returns null), the error is not silently swallowed:

1. `actionHandler` calls `retryFn(errorMessage)` — a callback provided by `commands/cliente.js`
2. `retryFn` injects the error as a system context message and re-calls the LLM
3. Claude apologises naturally and offers a concrete alternative in the same turn
4. The retry response is processed recursively with `retryFn=null` to prevent infinite loops

`cleanTags(text)` is always applied as a final safety net — any `[TAG: ...]` that survived processing is stripped before the message reaches the patient.

---

## Models

- **claude-sonnet-4-6** — patient conversations, full reasoning (`agent.js:getResponse`)
- **claude-haiku-4-5-20251001** — admin free-text fallback, fast tasks, voice transcription summaries (`agent.js:getAdminResponse`)

---

## Admin mode (Telegram only)

Activated by prefixing any message with `#admin`. Only `TELEGRAM_ADMIN_CHAT_ID` can use it (if unset, any chat can). Session persists **30 minutes from last activity**, tracked in an in-memory `Map` in `messenger.js`. During an active session, plain text is automatically routed through admin mode without needing the prefix.

### Structured commands (handled directly, no LLM)

`citas hoy` · `citas mañana` · `confirmar [nombre]` · `rechazar [nombre] [motivo]` · `cancelar [nombre]` · `completar [nombre]` · `no-show [nombre]` · `lista espera` · `preguntas` · `respuesta [id] [texto]` · `resumen` · `reporte semanal` · `agenda [fecha] [campos]` · `cerrar [fecha]` · `aprender <pregunta> | <respuesta>` · `ayuda`

Anything not matching the above falls back to Claude Haiku with real-time clinic context.

### Cross-channel admin notifications

The admin receives automatic Telegram notifications for critical events regardless of their origin channel:

| Event | Trigger |
|-------|---------|
| New appointment request | Any channel — `[CITA]` tag processed |
| Unknown question | Any channel — `[PREGUNTA_DESCONOCIDA]` tag processed |
| Contraindication alert | Any channel — `[ALERTA_CONTRAINDICACION]` tag processed |
| Cancellation + waitlist match | Any channel — `[CANCELAR_CITA]` tag + waitlist hit |
| Voice call summary | After Vapi webhook completes a session |

Notifications are sent via `bot.telegram.sendMessage(TELEGRAM_ADMIN_CHAT_ID, ...)` regardless of which channel triggered the event.

---

## n8n integration

### Reactive endpoint (existing)

```
POST /agent
Body: { businessId, action, data }
```

Handled in `workflows/n8n-endpoints.js`. The bot instance is injected into Express requests via middleware in `index.js`.

Supported actions: `recordatorio_48h` · `recordatorio_24h` · `recordatorio_2h` · `post_tratamiento` · `encuesta_satisfaccion` · `solicitar_resena` · `recordatorio_recurrencia` · `reactivar_pacientes` · `notificar_lista_espera` · `aviso_agenda` · `reporte_semanal`

### Proactive broadcast endpoint

```
POST /api/v1/broadcast
Headers: x-api-key: <N8N_API_KEY>
Body: { chatId, message, businessId?, context?: { expectsReply?, label? } }
```

Sends an outbound message to a patient on any channel. Requires `N8N_API_KEY` header validation (bypassed if `N8N_API_KEY` env var is not set).

**In-memory state — lost on restart:** Admin sessions (`adminSessions` Map in `messenger.js`) and outbound reply context (`outboundSessions` Map in `sessionStore.js`) are held in memory only. A process restart clears both — admins must re-activate with `#admin`, and any pending follow-up session context is lost.

**Session Locking — how follow-up context works:**

When n8n sends a proactive message that expects a reply (message ends with `?` or `context.expectsReply=true`), `sessionStore.setOutboundContext(chatId, { originalMessage, label })` opens a follow-up session (TTL: 4 hours, in-memory via `sessionStore.js`).

When the patient replies, `messenger.js:handlePatient()` detects the active session, clears it, and prepends a `[CONTEXTO: El paciente responde a: "..."]` system note to the message before passing it to the agent. This way Claude knows the reply is contextually tied to the reminder — not the start of a new conversation.

**Pre/post treatment instructions** are defined once in `clientes/<BUSINESS_ID>/instrucciones.js` — consumed both by the system prompt (plain text) and by notification messages (bilingual objects). Edit there only.

Health check: `GET /health`

---

## Database (Supabase)

All tables include `business_id` for multi-tenant isolation. Run `supabase/schema.sql` in Supabase SQL Editor to create tables.

| Table | Purpose |
|-------|---------|
| `conversaciones` | Short-term memory — last 10 messages per `(business_id, chat_id)` |
| `pacientes` | Long-term patient profile — language, skin type, allergies, visit history |
| `citas` | Appointments — estados: `pendiente → confirmada → completada / cancelada / rechazada / no_show` |
| `lista_espera` | Waitlist entries per treatment |
| `preguntas_desconocidas` | Unknown questions (estado='pendiente') + answered KB (estado='respondida') |
| `agenda_dia` | Daily availability config — professional on duty, open slots, promotions |
| `recordatorios_tratamiento` | Scheduled recurrence reminders per patient/treatment |
| `notificaciones` | Audit log of all outbound messages |

**Critical DB rules:**

- `memory.js:upsertPatient()` uses `onConflict: 'business_id,chat_id'`
- `getCitasByFecha` **excludes** `cancelada` and `rechazada`. Use `getCitasDelDiaCompleto` when you need all states (e.g., `#admin resumen`)
- **Always use `completarCita`** (not `updateCita`) when marking an appointment done — it also increments `visitas_total`, appends to `tratamientos_realizados`, and sets `ultima_visita` on the patient profile
- `saveKnowledgeDirect(businessId, pregunta, respuesta)` inserts directly as `estado='respondida'`, bypassing the pending queue (used by `#admin aprender`)

---

## Date handling

- Tags use `DD/MM/YYYY`
- Supabase stores `YYYY-MM-DD`
- `memory.js:parseFecha()` converts between them

---

## Adding a new client

1. Create `clientes/<BUSINESS_ID>/config.js` (copy from `clientes/clinica-demo/config.js`)
2. Create `clientes/<BUSINESS_ID>/instrucciones.js` (copy from `clientes/clinica-demo/instrucciones.js`)
3. Create Telegram bot + Supabase project + run `supabase/schema.sql`
4. Set `.env` with `BUSINESS_ID=<your-id>` and all required tokens

---

## Environment variables

```env
# Core
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
BUSINESS_ID=clinica-nombre
PORT=3000

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=       # Omit to allow any chat to use #admin

# WhatsApp (Evolution API)
EVOLUTION_API_URL=             # e.g. https://evolution.yourserver.com
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=            # WhatsApp instance name

# Voice (Vapi)
VAPI_API_KEY=
VAPI_WEBHOOK_SECRET=           # For webhook signature validation

# n8n
N8N_API_KEY=                   # Protects POST /api/v1/broadcast
```
