// logger.js — Logging estructurado (JSON) para producción
// Campos estándar: level, ts, canal, businessId, chatId, msg, duracion_ms, error

const LEVEL_SILENT = process.env.LOG_LEVEL === 'silent';

function write(level, fields) {
  if (LEVEL_SILENT) return;
  const entry = {
    level,
    ts: new Date().toISOString(),
    ...(typeof fields === 'string' ? { msg: fields } : fields),
  };
  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

const logger = {
  info:  (fields) => write('info',  fields),
  warn:  (fields) => write('warn',  fields),
  error: (fields) => write('error', fields),

  // Shortcut para medir duración de una operación async:
  // const done = logger.timer({ canal: 'llm', businessId, chatId });
  // ... await operation ...
  // done({ msg: 'respuesta generada', tokens: n });
  timer(baseFields) {
    const t0 = Date.now();
    return (extraFields = {}) => write('info', {
      ...baseFields,
      ...extraFields,
      duracion_ms: Date.now() - t0,
    });
  },
};

module.exports = logger;
