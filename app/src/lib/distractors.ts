import type { Country } from "../data/countries";
import { shuffle, type Rng } from "./random";

/**
 * Picks wrong answers for a multiple-choice question.
 *
 * Same region first, so the question is about the flag rather than geography: "Kenya, Japan,
 * Brazil or Norway?" is answered by knowing which continent the flag looks like it comes from. The
 * rest of the pool tops the list up when the region is too small (or when territories leave
 * Antarctic with a handful of entries).
 */
export function pickDistractors(
  target: Country,
  pool: readonly Country[],
  count: number,
  rng: Rng = Math.random,
): Country[] {
  const others = pool.filter((c) => c.code !== target.code);
  const sameRegion = shuffle(
    others.filter((c) => c.region === target.region),
    rng,
  );
  const elsewhere = shuffle(
    others.filter((c) => c.region !== target.region),
    rng,
  );
  return [...sameRegion, ...elsewhere].slice(0, count);
}

/** The target plus distractors, in random order. */
export function buildChoices(
  target: Country,
  pool: readonly Country[],
  count = 4,
  rng: Rng = Math.random,
): Country[] {
  return shuffle([target, ...pickDistractors(target, pool, count - 1, rng)], rng);
}
