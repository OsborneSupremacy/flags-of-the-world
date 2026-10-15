// Numbers for the progress screen. Pure, like leitner.ts: the caller supplies today's date.

import { REGIONS, type Country } from "../data/countries";
import { isMastered, type CardState, type Deck } from "./leitner";
import { dayKey } from "./profiles";

export interface RegionMastery {
  region: (typeof REGIONS)[number];
  mastered: number;
  total: number;
}

/** Box-5 cards per region, out of the countries currently in play there. */
export function masteryByRegion(countries: readonly Country[], deck: Deck): RegionMastery[] {
  return REGIONS.map((region) => {
    const inRegion = countries.filter((c) => c.region === region);
    return {
      region,
      mastered: inRegion.filter((c) => isMastered(deck[c.code])).length,
      total: inRegion.length,
    };
  });
}

export interface WeakCard {
  country: Country;
  state: CardState;
}

/**
 * The flags most worth practising: missed at least once, lowest box first, then worst accuracy,
 * then the most attempts (a card missed five times is weaker than one missed once).
 */
export function weakestCards(countries: readonly Country[], deck: Deck, limit = 10): WeakCard[] {
  const accuracy = (s: CardState) => s.correct / s.seen;
  return countries
    .flatMap((country) => {
      const state = deck[country.code];
      return state && state.correct < state.seen ? [{ country, state }] : [];
    })
    .sort(
      (a, b) =>
        a.state.box - b.state.box ||
        accuracy(a.state) - accuracy(b.state) ||
        b.state.seen - a.state.seen ||
        a.country.name.localeCompare(b.country.name),
    )
    .slice(0, limit);
}

function previousDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y ?? 0, (m ?? 1) - 1, (d ?? 1) - 1));
}

/**
 * Consecutive days played, counting back from today. A streak survives until the end of the day
 * after the last one played: at breakfast, yesterday's streak has not been lost yet.
 */
export function currentStreak(activeDays: readonly string[], today: Date): number {
  const days = new Set(activeDays);
  let cursor = dayKey(today);
  if (!days.has(cursor)) cursor = previousDay(cursor);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = previousDay(cursor);
  }
  return streak;
}
