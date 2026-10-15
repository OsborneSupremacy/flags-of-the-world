import { describe, expect, it } from "vitest";
import { activeCountries, countryByCode, type Country } from "../data/countries";
import { buildChoices, pickDistractors } from "./distractors";
import { seededRng } from "./random";

const pool = activeCountries(false);
const c = (code: string) => countryByCode(code) as Country;

describe("pickDistractors", () => {
  it("returns the requested number of distinct countries, never the target", () => {
    for (let seed = 0; seed < 50; seed++) {
      const target = pool[seed % pool.length] as Country;
      const picks = pickDistractors(target, pool, 3, seededRng(seed));
      expect(picks).toHaveLength(3);
      expect(new Set(picks.map((p) => p.code)).size).toBe(3);
      expect(picks.map((p) => p.code)).not.toContain(target.code);
    }
  });

  it("prefers countries from the same region", () => {
    for (const code of ["fr", "ke", "jp", "br", "fj"]) {
      const target = c(code);
      const picks = pickDistractors(target, pool, 3, seededRng(1));
      expect(picks.every((p) => p.region === target.region)).toBe(true);
    }
  });

  it("tops up from other regions when the region is too small", () => {
    const tiny = [c("fr"), c("de"), c("jp"), c("br"), c("ke")];
    const picks = pickDistractors(c("fr"), tiny, 3, seededRng(2));
    expect(picks).toHaveLength(3);
    expect(picks[0]?.code).toBe("de");
  });

  it("returns as many as exist when the pool is smaller than asked", () => {
    expect(pickDistractors(c("fr"), [c("fr"), c("de")], 3)).toEqual([c("de")]);
  });

  it("varies with the random source", () => {
    const a = pickDistractors(c("fr"), pool, 3, seededRng(1)).map((p) => p.code);
    const b = pickDistractors(c("fr"), pool, 3, seededRng(99)).map((p) => p.code);
    expect(a).not.toEqual(b);
  });
});

describe("buildChoices", () => {
  it("includes the target exactly once among four options", () => {
    const choices = buildChoices(c("it"), pool, 4, seededRng(3));
    expect(choices).toHaveLength(4);
    expect(choices.filter((x) => x.code === "it")).toHaveLength(1);
  });

  it("does not always put the answer in the same place", () => {
    const positions = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        buildChoices(c("it"), pool, 4, seededRng(seed)).findIndex((x) => x.code === "it"),
      ),
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});
