// The ?q= search text of a request. "" when it is missing or repeated (?q=a&q=b).
export function queryText(req) {
  return typeof req.query.q === "string" ? req.query.q : "";
}
