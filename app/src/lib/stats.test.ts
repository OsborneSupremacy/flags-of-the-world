import { describe, expect, it } from "vitest";
import { activeCountries, countryByCode, type Country } from "../data/countries";
import type { Box, Deck } from "./leitner";
import { currentStreak, masteryByRegion, weakestCards } from "./stats";

const card = (box: Box, seen: number, correct: number) => ({ box, seen, correct, lastSeen: 0 });
const countries = activeCountries(false);

describe("masteryByRegion", () => {
  it("counts only box-5 cards, per region, out of the countries in play", () => {
    const deck: Deck = {
      fr: card(5, 5, 5),
      de: card(5, 6, 5),
      it: card(4, 4, 4),
      jp: card(5, 4, 4),
    };
    const result = masteryByRegion(countries, deck);
    const europe = result.find((r) => r.region === "Europe");
    const asia = result.find((r) => r.region === "Asia");
    expect(europe?.mastered).toBe(2);
    expect(asia?.mastered).toBe(1);
    expect(result.reduce((sum, r) => sum + r.total, 0)).toBe(195);
  });

  it("lists all five regions even with an empty deck", () => {
    expect(masteryByRegion(countries, {}).map((r) => r.mastered)).toEqual([0, 0, 0, 0, 0]);
  });
});

describe("weakestCards", () => {
  it("lists only cards that have been missed, lowest box first", () => {
    const deck: Deck = {
      fr: card(1, 3, 1),
      de: card(3, 5, 4),
      it: card(5, 4, 4),
      es: card(1, 1, 0),
    };
    expect(weakestCards(countries, deck).map((w) => w.country.code)).toEqual(["es", "fr", "de"]);
  });

  it("breaks ties by accuracy, then by attempts", () => {
    const deck: Deck = { fr: card(1, 2, 1), de: card(1, 4, 2), it: card(1, 4, 1) };
    expect(weakestCards(countries, deck).map((w) => w.country.code)).toEqual(["it", "de", "fr"]);
  });

  it("respects the limit and ignores codes outside the set", () => {
    const deck: Deck = Object.fromEntries(
      countries.slice(0, 20).map((c) => [c.code, card(1, 2, 0)]),
    );
    deck.xk = card(1, 9, 0);
    const weak = weakestCards(countries, deck, 5);
    expect(weak).toHaveLength(5);
    expect(weak.map((w) => w.country.code)).not.toContain("xk");
  });

  it("returns the country objects", () => {
    expect(weakestCards(countries, { fr: card(1, 1, 0) })[0]?.country).toBe(
      countryByCode("fr") as Country,
    );
  });
});

describe("currentStreak", () => {
  const today = new Date(2026, 9, 14, 18);

  it("is zero with no days played", () => {
    expect(currentStreak([], today)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(currentStreak(["2026-10-12", "2026-10-13", "2026-10-14"], today)).toBe(3);
  });

  it("is still alive when the last day played was yesterday", () => {
    expect(currentStreak(["2026-10-12", "2026-10-13"], today)).toBe(2);
  });

  it("is broken by a missed day", () => {
    expect(currentStreak(["2026-10-10", "2026-10-11", "2026-10-12"], today)).toBe(0);
    expect(currentStreak(["2026-10-10", "2026-10-12", "2026-10-13", "2026-10-14"], today)).toBe(3);
  });

  it("crosses month and year boundaries", () => {
    expect(currentStreak(["2026-09-30", "2026-10-01"], new Date(2026, 9, 1))).toBe(2);
    expect(currentStreak(["2025-12-31", "2026-01-01"], new Date(2026, 0, 1))).toBe(2);
  });
});
