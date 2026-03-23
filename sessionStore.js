// sessionStore.js — Shared in-memory store for outbound session context
// Tracks when the system sent an outbound message to a patient (broadcast/reminder)
// so that when they reply, the agent knows they're following up on that message.

const outboundSessions = new Map();
const OUTBOUND_SESSION_TTL = 4 * 60 * 60 * 1000; // 4 hours

function setOutboundContext(chatId, context) {
  outboundSessions.set(String(chatId), { context, ts: Date.now() });
}

function getOutboundContext(chatId) {
  const entry = outboundSessions.get(String(chatId));
  if (!entry) return null;
  if (Date.now() - entry.ts > OUTBOUND_SESSION_TTL) {
    outboundSessions.delete(String(chatId));
    return null;
  }
  return entry.context;
}

function clearOutboundContext(chatId) {
  outboundSessions.delete(String(chatId));
}

module.exports = { setOutboundContext, getOutboundContext, clearOutboundContext };
