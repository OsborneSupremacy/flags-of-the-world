import type { Country } from "../data/countries";
import { shuffle, type Rng } from "./random";

/**
 * The look-alike groups usable with these countries: members outside the set are dropped, and a
 * group left with fewer than two members is no question at all.
 */
export function usableGroups(
  groups: readonly (readonly string[])[],
  available: readonly Country[],
): Country[][] {
  const byCode = new Map(available.map((c) => [c.code, c]));
  return groups
    .map((group) => group.flatMap((code) => byCode.get(code) ?? []))
    .filter((group) => group.length >= 2);
}

/** For each country in a group, the shuffled group it should be asked against. */
export function lookalikeChoices(groups: readonly Country[][], rng: Rng = Math.random) {
  const choices = new Map<string, Country[]>();
  for (const group of groups) {
    for (const country of group) choices.set(country.code, shuffle(group, rng));
  }
  return choices;
}
