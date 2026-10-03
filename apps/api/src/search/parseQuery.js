// Splits a search query into the words the search engine matches. No database access.

const STOP_WORDS = new Set(["for", "the", "and", "with", "of", "to", "in", "on", "an", "my", "at"]);

// Longer queries are cut, so one request can't build a huge SQL statement.
const MAX_WORDS = 8;
const MAX_TOKEN_LENGTH = 40;

// Ignore case and punctuation: "56110-1R000", "561101R000" and "56110 1r000" -> "561101r000".
// Must match normalize_part_number() in db/migrations/002_search.sql.
export function normalizePartNumber(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

// "Mann-Filter" -> ["mann", "filter"]. Single characters are too noisy to search on.
export function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length >= 2 && token.length <= MAX_TOKEN_LENGTH && !STOP_WORDS.has(token));
}

// Typos allowed in a word, by length: up to 3 letters none, 4-5 letters one, longer words two.
export function typoBudget(token) {
  return token.length <= 3 ? 0 : token.length <= 5 ? 1 : 2;
}

/**
 * One space-separated word of the query.
 * @typedef {Object} QueryWord
 * @property {string} text          as typed: "56110-1R000", "C-Class"
 * @property {string[]} tokens      its searchable pieces: ["56110", "1r000"], ["class"]
 * @property {string} number        normalized for part number matching: "561101r000"
 * @property {boolean} isNumber     could be (the start of) a part number: has a digit, 3+ characters
 * @property {number | null} year   "2015" -> 2015
 */

/**
 * @param {string} query
 * @returns {{ words: QueryWord[], number: string, isNumber: boolean }}
 *   `number` is the whole query normalized, for an exact part number match
 */
export function parseQuery(query) {
  const text = String(query ?? "").trim();
  const words = text
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word.toLowerCase()))
    .slice(0, MAX_WORDS)
    .map((word) => {
      const number = normalizePartNumber(word);
      return {
        text: word,
        tokens: tokenize(word),
        number,
        isNumber: looksLikePartNumber(number),
        year: /^(19|20)\d{2}$/.test(word) ? Number(word) : null,
      };
    })
    .filter((word) => word.tokens.length > 0 || word.isNumber);

  const number = normalizePartNumber(text);
  return { words, number, isNumber: words.length > 0 && looksLikePartNumber(number) };
}

function looksLikePartNumber(normalized) {
  return normalized.length >= 3 && /\d/.test(normalized);
}
