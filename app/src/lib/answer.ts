import type { Country } from "../data/countries";

/**
 * Reduces a typed name to the form answers are compared in.
 *
 * Case and diacritics go ("Côte" is "cote"), apostrophes vanish without leaving a gap ("d'Ivoire"
 * is "divoire", whichever way it was typed), other punctuation becomes a space, "&" is "and",
 * "St" is "Saint", and a leading "the" is dropped.
 */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’‘`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/^the\s+/, "")
    .replace(/\bst\b/g, "saint");
}

/** Spaces are not significant: "newzealand" is New Zealand. */
function compact(normalized: string): string {
  return normalized.replace(/\s+/g, "");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/** Every form of a country's name that counts as an exact answer, already compacted. */
export function acceptedForms(country: Country): string[] {
  return [country.name, ...country.aliases].map((n) => compact(normalize(n))).filter(Boolean);
}

/** Typos are forgiven only for names this long, so "Mali" for "Bali" is never a near miss. */
export const TYPO_MIN_LENGTH = 6;

export type MatchResult = "exact" | "typo" | "wrong";

/**
 * Judges a typed answer.
 *
 * One wrong letter is forgiven on a name of six or more characters -- but never when what was
 * typed is exactly some other country. "Zambia" is one letter from "Gambia" and is still wrong.
 */
export function matchAnswer(
  input: string,
  target: Country,
  allCountries: readonly Country[],
): MatchResult {
  const typed = compact(normalize(input));
  if (!typed) return "wrong";

  const forms = acceptedForms(target);
  if (forms.includes(typed)) return "exact";

  const isOtherCountry = allCountries.some(
    (c) => c.code !== target.code && acceptedForms(c).includes(typed),
  );
  if (isOtherCountry) return "wrong";

  const nearMiss = forms.some(
    (form) => form.length >= TYPO_MIN_LENGTH && levenshtein(typed, form) <= 1,
  );
  return nearMiss ? "typo" : "wrong";
}
