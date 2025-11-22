function normalizeText(input) {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(input) {
  if (!input) return [];
  return input.split(' ').filter(Boolean);
}

/**
 * Very simple relevance score.
 * Higher is better.
 */
export function computeRelevanceScore(query, text) {
  if (!query || !text) return 0;

  query = Array.isArray(query) ? query.join(' ') : typeof query === 'string' ? query : '';
  text = Array.isArray(text) ? text.join(' ') : typeof text === 'string' ? text : '';

  const q = normalizeText(query);
  const t = normalizeText(text);
  if (!q || !t) return 0;

  if (t === q) return 10;
  if (t.startsWith(q)) return 8;
  if (t.includes(q)) return 6;

  const qTokens = tokenize(q);
  const tTokens = tokenize(t);

  if (!qTokens.length || !tTokens.length) return 0;

  const tSet = new Set(tTokens);
  const intersection = qTokens.filter((token) => tSet.has(token));
  if (!intersection.length) return 0;

  const unionSize = new Set([...qTokens, ...tTokens]).size;
  const jaccard = intersection.length / unionSize; // between 0 and 1

  return jaccard * 5; // scale up a bit
}

export function computeJaccardScore(a, b) {
  if (!a || !b) return 0;

  a = Array.isArray(a) ? a.join(' ') : typeof a === 'string' ? a : '';
  b = Array.isArray(b) ? b.join(' ') : typeof b === 'string' ? b : '';

  const q = normalizeText(a);
  const t = normalizeText(b);
  if (!q || !t) return 0;

  const qTokens = tokenize(q);
  const tTokens = tokenize(t);

  if (!qTokens.length || !tTokens.length) return 0;

  const tSet = new Set(tTokens);
  const intersection = qTokens.filter((token) => tSet.has(token));
  if (!intersection.length) return 0;

  const unionSize = new Set([...qTokens, ...tTokens]).size;
  const jaccard = intersection.length / unionSize; // between 0 and 1

  return jaccard * 5; // scale up a bit
}
