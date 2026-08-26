/**
 * Accept: text/markdown negotiation helpers (acceptmarkdown.com / Express recipe).
 * Shared by Vercel middleware and unit tests.
 */

export const PRODUCES_HTML_MARKDOWN = Object.freeze(["text/html", "text/markdown"]);

export function parseAccept(header) {
  if (!header) return [];
  return header
    .split(",")
    .map((raw) => {
      const parts = raw.trim().split(";").map((s) => s.trim());
      const type = (parts[0] || "").toLowerCase();
      if (!type) return null;
      let q = 1;
      for (const param of parts.slice(1)) {
        const [name, value] = param.split("=").map((s) => s.trim());
        if (name === "q") {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
        }
      }
      const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
      return { type, q, specificity };
    })
    .filter(Boolean);
}

function matches(entry, candidate) {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*")) return candidate.startsWith(entry.type.slice(0, -1));
  return entry.type === candidate;
}

/**
 * @param {string | null | undefined} header
 * @param {readonly string[]} produces
 * @returns {string | null} preferred type, or null when Accept is present but nothing matches
 */
export function preferredType(header, produces) {
  if (!header) return produces[0] || null;
  const entries = parseAccept(header);
  if (!entries.length) return produces[0] || null;

  let best = null;
  let bestQ = -1;
  let bestPos = Infinity;

  for (const candidate of produces) {
    let matched = null;
    let matchedPos = Infinity;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!matches(e, candidate)) continue;
      if (
        matched === null ||
        e.specificity > matched.specificity ||
        (e.specificity === matched.specificity && i < matchedPos)
      ) {
        matched = e;
        matchedPos = i;
      }
    }
    if (!matched || matched.q <= 0) continue;
    if (matched.q > bestQ || (matched.q === bestQ && matchedPos < bestPos)) {
      best = candidate;
      bestQ = matched.q;
      bestPos = matchedPos;
    }
  }

  return best;
}

export function prefersMarkdown(header) {
  return preferredType(header, PRODUCES_HTML_MARKDOWN) === "text/markdown";
}
