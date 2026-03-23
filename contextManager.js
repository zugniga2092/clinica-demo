// contextManager.js — RAG simple para la base de conocimiento
// Pure utility: no I/O, no Supabase calls.

/**
 * Selects the most relevant knowledge base entries for a given user query
 * using simple keyword overlap scoring.
 *
 * @param {Array<{pregunta: string, respuesta: string}>} allEntries - Full KB array
 * @param {string|null} userQuery - Current user message
 * @param {number} limit - Max entries to return (default 3)
 * @returns {Array} Top-N relevant entries
 */
function getRelevantKB(allEntries, userQuery, limit = 3) {
  if (!allEntries || allEntries.length === 0) return [];
  if (!userQuery || allEntries.length <= limit) return allEntries.slice(0, limit);

  const queryTokens = tokenize(userQuery);
  if (queryTokens.size === 0) return allEntries.slice(0, limit);

  const scored = allEntries.map(entry => {
    const entryTokens = tokenize((entry.pregunta || '') + ' ' + (entry.respuesta || ''));
    let overlap = 0;
    for (const word of queryTokens) {
      if (entryTokens.has(word)) overlap++;
    }
    return { entry, score: overlap };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.entry);
}

/**
 * Tokenizes text into a Set of lowercase words, ignoring short stop words.
 */
function tokenize(text) {
  return new Set(
    text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents for matching
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
  );
}

module.exports = { getRelevantKB };
