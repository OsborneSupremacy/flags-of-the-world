import { describe, expect, it } from "vitest";
import { activeCountries, countryByCode, type Country } from "../data/countries";
import { LOOKALIKE_GROUPS } from "../data/lookalikes";
import { lookalikeChoices, usableGroups } from "./lookalikes";
import { seededRng } from "./random";

describe("LOOKALIKE_GROUPS", () => {
  it("names only real countries in the default set", () => {
    const codes = new Set(activeCountries(false).map((c) => c.code));
    expect(LOOKALIKE_GROUPS.flat().filter((code) => !codes.has(code))).toEqual([]);
  });

  it("puts each country in at most one group", () => {
    const all = LOOKALIKE_GROUPS.flat();
    expect(all.filter((code, i) => all.indexOf(code) !== i)).toEqual([]);
  });

  it("has at least two flags in every group", () => {
    expect(LOOKALIKE_GROUPS.every((g) => g.length >= 2)).toBe(true);
  });
});

describe("usableGroups", () => {
  const c = (code: string) => countryByCode(code) as Country;

  it("drops members outside the available set, and groups left with one", () => {
    const groups = usableGroups(
      [
        ["td", "ro", "ad"],
        ["au", "nz"],
      ],
      [c("td"), c("ro"), c("au")],
    );
    expect(groups.map((g) => g.map((x) => x.code))).toEqual([["td", "ro"]]);
  });
});

describe("lookalikeChoices", () => {
  it("offers each member its whole group, with the answer included", () => {
    const groups = usableGroups(LOOKALIKE_GROUPS, activeCountries(false));
    const choices = lookalikeChoices(groups, seededRng(1));
    expect(
      choices
        .get("td")
        ?.map((x) => x.code)
        .sort(),
    ).toEqual(["ad", "md", "ro", "td"]);
    expect(
      choices
        .get("nz")
        ?.map((x) => x.code)
        .sort(),
    ).toEqual(["au", "nz"]);
    expect(choices.size).toBe(LOOKALIKE_GROUPS.flat().length);
  });
});
