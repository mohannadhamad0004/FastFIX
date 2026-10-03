import { parseQuery, tokenize, typoBudget } from "./parseQuery.js";

// Typo-tolerant, multi-word search over one of the public search views (db/migrations/002_search.sql).
// Used by the marketplace (parts), the mechanics directory and the tow companies directory.
// How it works, step by step: README.md in this folder.

// A typo candidate is kept only if its trigram similarity is close to the best candidate's, so
// "hundai" resolves to "hyundai" and not to every word one letter away.
const NEAR_BEST = 0.1;
// Long words may have more than `typoBudget` typos when their trigrams still mostly match
// ("mercedesbenz" -> "mercedes").
const LONG_WORD = 7;
const LONG_WORD_SIMILARITY = 0.5;

/**
 * @typedef {Object} SearchConfig
 * @property {string} view      public search view with `id`, `words` and `name_words` columns
 * @property {{ column: string, field: string }[]} [numberColumns]
 *   normalized part number columns, and the API field name each one belongs to
 * @property {{ view: string, key: string }} [fitments]
 *   one row per item and vehicle with `words`, `year_from` and `year_to`; `view` then also needs
 *   `text_words`. Make, model and year words of the query must match the same vehicle.
 * @property {string} orderBy   tie-break between equal matches, e.g. "id"
 * @property {number} limit
 * View and column names are code constants, never user input: they go into the SQL as they are.
 */

/**
 * How one query token was matched against the words of the searchable items.
 * @typedef {Object} ResolvedToken
 * @property {string} token
 * @property {string[]} words       item words it matches: itself, prefixes, typo fixes, synonyms
 * @property {string[][]} phrases   multi-word synonyms; an item must contain every word of one
 * @property {boolean} typo         matched only by fixing a typo
 * @property {boolean} vehicle      every match is a make or model word (only with `fitments`)
 */

/**
 * @typedef {Object} SearchHit
 * @property {Record<string, any>} row   the view row
 * @property {boolean} exact             the whole query is one of its part numbers
 * @property {'exact' | 'all' | 'partial' | null} matchType   null when there is no query
 * @property {{ terms: string[], numberFields: string[] } | null} highlight
 *   the matched words to mark, and which part number fields matched
 */

/**
 * @param {{ query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> }} db
 * @param {SearchConfig} config
 * @param {string} query
 * @returns {Promise<{ hits: SearchHit[], words: (import('./parseQuery.js').QueryWord & { terms: ResolvedToken[] })[], goodResult: boolean }>}
 *   `goodResult`: some item matched every word without a typo (otherwise offer "Did you mean")
 */
export async function search(db, config, query) {
  const parsed = parseQuery(query);
  if (parsed.words.length === 0) {
    const { rows } = await db.query(`SELECT * FROM ${config.view} d ORDER BY ${config.orderBy} LIMIT ${config.limit}`);
    return {
      hits: rows.map((row) => ({ row, exact: false, matchType: null, highlight: null })),
      words: [],
      goodResult: true,
    };
  }

  const words = await resolveWords(db, config, parsed.words);
  const { text, values } = buildQuery(config, parsed, words);
  const { rows } = await db.query(text, values);

  // Items matching every word (or the part number). Only when there are none, partial matches.
  const complete = rows.filter((row) => row.search_exact || row.search_all);
  const kept = complete.length > 0 ? complete : rows;

  const matchedWords = unique(words.flatMap((w) => w.terms.flatMap((t) => [...t.words, ...t.phrases.flat()])));
  const numberPrefixes = [...words.filter((w) => w.isNumber).map((w) => w.number), ...(parsed.isNumber ? [parsed.number] : [])];

  return {
    hits: kept.map((row) => ({
      row,
      exact: row.search_exact,
      matchType: row.search_exact ? "exact" : row.search_all ? "all" : "partial",
      highlight: {
        terms: matchedWords.filter((word) => row.words.includes(word)),
        numberFields: (config.numberColumns ?? [])
          .filter(({ column }) => row[column] && numberPrefixes.some((prefix) => row[column].startsWith(prefix)))
          .map(({ field }) => field),
      },
    })),
    words,
    goodResult: complete.some((row) => row.search_exact || row.search_typos === 0),
  };
}

// ---- Step 1: match each query token against the words of the searchable items ----------------

async function resolveWords(db, config, queryWords) {
  // With fitments, a year is matched against fitment year ranges, not as a word.
  const isYear = (word) => Boolean(config.fitments && word.year);
  const tokens = unique(queryWords.filter((w) => !isYear(w)).flatMap((w) => w.tokens));
  const synonyms = await loadSynonyms(db, tokens);
  const vocabulary = await matchVocabulary(db, config, unique([...tokens, ...[...synonyms.values()].flat(2)]));

  return queryWords.map((word) => ({
    ...word,
    terms: isYear(word) ? [] : word.tokens.map((token) => resolveToken(token, vocabulary, synonyms.get(token) ?? [])),
  }));
}

// token -> synonym phrases, each split into words. "pads" also gets the synonyms of "pad".
async function loadSynonyms(db, tokens) {
  const singular = (token) => (token.length > 3 && token.endsWith("s") ? token.slice(0, -1) : token);
  const { rows } = await db.query("SELECT word, synonym FROM search_synonyms WHERE word = ANY($1::text[])", [
    unique(tokens.flatMap((token) => [token, singular(token)])),
  ]);
  return new Map(
    tokens.map((token) => [
      token,
      rows.filter((row) => row.word === token || row.word === singular(token)).map((row) => tokenize(row.synonym)),
    ]),
  );
}

// Every item word that equals a token, starts with it, or is a typo away from it (levenshtein
// within typoBudget, or a long word with high trigram similarity).
async function matchVocabulary(db, config, tokens) {
  const inText = config.fitments ? "w = ANY(d.text_words)" : "true";
  const { rows } = await db.query(
    `WITH vocabulary AS (
       SELECT w AS word, bool_or(${inText}) AS in_text
       FROM ${config.view} d, unnest(d.words) AS w
       GROUP BY w
     )
     SELECT t.token, v.word, v.in_text, similarity(v.word, t.token) AS similarity,
            CASE WHEN v.word = t.token THEN 'exact'
                 WHEN starts_with(v.word, t.token) THEN 'prefix'
                 ELSE 'typo' END AS kind
     FROM unnest($1::text[], $2::int[]) AS t(token, budget)
     JOIN vocabulary v
       ON starts_with(v.word, t.token)
       OR (t.budget > 0 AND length(v.word) <= 100 AND (
             levenshtein(v.word, t.token) <= t.budget
             OR (length(t.token) >= $3 AND similarity(v.word, t.token) >= $4)))`,
    [tokens, tokens.map(typoBudget), LONG_WORD, LONG_WORD_SIMILARITY],
  );
  return rows;
}

/** @returns {ResolvedToken} */
function resolveToken(token, vocabulary, synonymPhrases) {
  const own = vocabulary.filter((row) => row.token === token);
  const exact = own.filter((row) => row.kind === "exact");
  const typos = own.filter((row) => row.kind === "typo");
  const bestTypo = Math.max(0, ...typos.map((row) => row.similarity));
  // An exact word wins; otherwise prefixes ("hyun" -> "hyundai") and the closest typo fixes.
  const matched =
    exact.length > 0
      ? exact
      : [...own.filter((row) => row.kind === "prefix"), ...typos.filter((row) => row.similarity >= bestTypo - NEAR_BEST)];

  // Synonyms only count when their words exist in the items
  const known = new Set(vocabulary.filter((row) => row.kind === "exact").map((row) => row.word));
  const phrases = synonymPhrases.filter((phrase) => phrase.length > 0 && phrase.every((w) => known.has(w)));

  return {
    token,
    words: unique([...matched.map((row) => row.word), ...phrases.filter((p) => p.length === 1).flat()]),
    phrases: phrases.filter((phrase) => phrase.length > 1),
    typo: matched.length > 0 && matched.every((row) => row.kind === "typo") && phrases.length === 0,
    vehicle: matched.length > 0 && matched.every((row) => !row.in_text) && phrases.length === 0,
  };
}

// ---- Step 2: one SQL query that matches, scores and ranks the items ---------------------------

// Ranking: exact part number, then items matching every query word, then more words matched,
// fewer typos, more words in the name, and finally `orderBy`.
function buildQuery(config, parsed, words) {
  const values = [];
  const param = (value) => {
    values.push(value);
    return `$${values.length}`;
  };
  const numberColumns = config.numberColumns ?? [];
  const fitments = config.fitments;

  const allOf = (conditions) => (conditions.length ? `(${conditions.join(" AND ")})` : "true");
  const countOf = (conditions) => (conditions.length ? conditions.map((c) => `(${c})::int`).join(" + ") : "0");
  const numberMatch = (number, exact) =>
    `(${numberColumns
      .map(({ column }) => (exact ? `d.${column} = ${param(number)}` : `d.${column} LIKE ${param(`${number}%`)}`))
      .join(" OR ")})`;
  // The token, or one of its synonyms, is one of the words in `column`
  const tokenMatch = (column, term) => {
    const options = [];
    if (term.words.length > 0) options.push(`${column} && ${param(term.words)}::text[]`);
    for (const phrase of term.phrases) options.push(`${column} @> ${param(phrase)}::text[]`);
    return options.length ? `(${options.join(" OR ")})` : "false";
  };
  const fitmentExists = (conditions) =>
    `EXISTS (SELECT 1 FROM ${fitments.view} f WHERE f.${fitments.key} = d.id AND ${conditions.join(" AND ")})`;
  const yearCondition = (year) => `${param(year)}::int BETWEEN f.year_from AND f.year_to`;

  // Makes, models and years ("hyundai accent 2015") must all match one compatible vehicle.
  const vehicleWords = fitments
    ? words.filter((w) => (w.year && w.terms.length === 0) || (w.terms.length > 0 && w.terms.every((t) => t.vehicle)))
    : [];
  const textWords = words.filter((w) => !vehicleWords.includes(w));

  // A text word matches by part number prefix, or when each of its tokens matches.
  const text = textWords.map((word) => {
    const tokens = word.terms.length > 0 ? allOf(word.terms.map((t) => tokenMatch("d.words", t))) : "false";
    const number = word.isNumber && numberColumns.length > 0 ? numberMatch(word.number, false) : null;
    const match = number ? `(${number} OR ${tokens})` : tokens;
    const typos = word.terms.filter((t) => t.typo).length;
    return { match, typos: `(CASE WHEN ${match} THEN ${number ? `(CASE WHEN ${number} THEN 0 ELSE ${typos} END)` : typos} ELSE 0 END)` };
  });

  const sameVehicle = vehicleWords.length
    ? fitmentExists(vehicleWords.flatMap((w) => (w.year ? [yearCondition(w.year)] : w.terms.map((t) => tokenMatch("f.words", t)))))
    : "true";
  // For partial matches: each vehicle word on its own
  const vehicleOneByOne = vehicleWords.map((w) =>
    w.year ? fitmentExists([yearCondition(w.year)]) : allOf(w.terms.map((t) => tokenMatch("d.words", t))),
  );
  const vehicleTypos = vehicleWords.flatMap((w) => w.terms).filter((t) => t.typo).length;

  const matchedCount = `${countOf(text.map((t) => t.match))} + (CASE WHEN ${sameVehicle} THEN ${vehicleWords.length} ELSE ${countOf(vehicleOneByOne)} END)`;
  const allMatched = allOf([...text.map((t) => t.match), sameVehicle]);
  const typoCount = [...text.map((t) => t.typos), String(vehicleTypos)].join(" + ");
  const nameHits = countOf(words.flatMap((w) => w.terms).map((t) => tokenMatch("d.name_words", t)));

  const hasNumbers = parsed.isNumber && numberColumns.length > 0;
  const exact = hasNumbers ? numberMatch(parsed.number, true) : "false";
  // A part number typed with spaces ("56110 1r0") is several words - also match it as one.
  const wholeNumberPrefix = hasNumbers && words.length > 1 ? numberMatch(parsed.number, false) : "false";

  return {
    text: `
      SELECT *
      FROM (
        SELECT d.*,
               ${exact} AS search_exact,
               (${allMatched} OR ${wholeNumberPrefix}) AS search_all,
               ${matchedCount} AS search_matched,
               ${typoCount} AS search_typos,
               ${nameHits} AS search_name_hits
        FROM ${config.view} d
      ) d
      WHERE search_exact OR search_all OR search_matched > 0
      ORDER BY search_exact DESC, search_all DESC, search_matched DESC, search_typos, search_name_hits DESC, ${config.orderBy}
      LIMIT ${config.limit}`,
    values,
  };
}

function unique(list) {
  return [...new Set(list)];
}
