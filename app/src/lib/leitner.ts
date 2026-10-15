// A five-box Leitner system. Pure functions only: no storage, no clock, no Math.random unless it is
// passed in, so every rule here is covered by a test.
//
// A new card counts as box 1. A correct answer moves a card up one box; a miss sends it back to box 1. Box 5 is "mastered".
// A session draws mostly from the low boxes, weighted so a box-1 card is sixteen times as likely as
// a box-5 one, and keeps a share of each session for cards the player has never seen.

import { shuffle, type Rng } from "./random";

export type Box = 1 | 2 | 3 | 4 | 5;
export const MAX_BOX: Box = 5;

export interface CardState {
  box: Box;
  /** Times answered, and times answered correctly. */
  seen: number;
  correct: number;
  /** Epoch milliseconds of the last answer. */
  lastSeen: number;
}

/** Card states keyed by card id (the country code, for flags). A missing key is a new card. */
export type Deck = Record<string, CardState>;

export function recordAnswer(deck: Deck, id: string, correct: boolean, now: number): Deck {
  const previous = deck[id];
  const box: Box = correct ? (Math.min((previous?.box ?? 1) + 1, MAX_BOX) as Box) : 1;
  return {
    ...deck,
    [id]: {
      box,
      seen: (previous?.seen ?? 0) + 1,
      correct: (previous?.correct ?? 0) + (correct ? 1 : 0),
      lastSeen: now,
    },
  };
}

/** Box 1 weighs 16, box 5 weighs 1. */
export function boxWeight(box: Box): number {
  return 2 ** (MAX_BOX - box);
}

/** Roughly this share of a session goes to cards never seen before, while any remain. */
export const NEW_CARD_SHARE = 0.3;

/**
 * Weighted sampling without replacement (Efraimidis-Spirakis): each item draws a key of
 * u^(1/weight) and the largest keys win. Heavier items tend to come first without lighter ones
 * ever being impossible.
 */
function weightedOrder<T>(items: readonly T[], weight: (item: T) => number, rng: Rng): T[] {
  return items
    .map((item) => ({ item, key: rng() ** (1 / weight(item)) }))
    .sort((a, b) => b.key - a.key)
    .map((entry) => entry.item);
}

/**
 * Chooses the cards for a session from `pool`, which is already filtered by region and set.
 *
 * `length` of null means the whole pool. Seen cards are drawn weighted toward the low boxes; new
 * cards fill NEW_CARD_SHARE of the session, or more when there are not enough seen cards to fill
 * it, or less when there are not enough new ones. The result is shuffled so new cards are mixed in
 * rather than bunched at one end.
 */
export function selectSession(
  pool: readonly string[],
  deck: Deck,
  length: number | null,
  rng: Rng = Math.random,
): string[] {
  const size = length === null ? pool.length : Math.min(length, pool.length);
  const seen = pool.filter((id) => deck[id]);
  const fresh = pool.filter((id) => !deck[id]);

  const newTarget = Math.round(size * NEW_CARD_SHARE);
  const newCount = Math.min(fresh.length, Math.max(newTarget, size - seen.length));
  const seenCount = size - newCount;

  const pickedSeen = weightedOrder(seen, (id) => boxWeight(deck[id]?.box ?? 1), rng).slice(
    0,
    seenCount,
  );
  const pickedFresh = shuffle(fresh, rng).slice(0, newCount);
  return shuffle([...pickedSeen, ...pickedFresh], rng);
}

export function isMastered(state: CardState | undefined): boolean {
  return state?.box === MAX_BOX;
}
