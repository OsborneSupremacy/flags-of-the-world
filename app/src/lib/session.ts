import { REGIONS, type Country } from "../data/countries";
import { shuffle, type Rng } from "./random";

export type Mode = "flip" | "choice" | "type" | "lookalikes";
export type RegionFilter = "all" | (typeof REGIONS)[number];
export type SessionLength = 10 | 20 | "all";

export interface SessionOptions {
  mode: Mode;
  region: RegionFilter;
  length: SessionLength;
  includeTerritories: boolean;
}

export interface CardResult {
  code: string;
  correct: boolean;
}

export function filterByRegion(countries: readonly Country[], region: RegionFilter): Country[] {
  return region === "all" ? [...countries] : countries.filter((c) => c.region === region);
}

export function pickRandom(
  countries: readonly Country[],
  length: SessionLength,
  rng: Rng = Math.random,
): Country[] {
  const shuffled = shuffle(countries, rng);
  return length === "all" ? shuffled : shuffled.slice(0, length);
}
