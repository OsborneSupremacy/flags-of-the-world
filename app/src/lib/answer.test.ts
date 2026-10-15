import { describe, expect, it } from "vitest";
import { activeCountries, countryByCode, type Country } from "../data/countries";
import { levenshtein, matchAnswer, normalize } from "./answer";

const all = activeCountries(true);
const c = (code: string): Country => {
  const country = countryByCode(code);
  if (!country) throw new Error(`no country ${code}`);
  return country;
};
const judge = (input: string, code: string) => matchAnswer(input, c(code), all);

describe("normalize", () => {
  it.each([
    ["  FRANCE ", "france"],
    ["Côte d'Ivoire", "cote divoire"],
    ["Cote d’Ivoire", "cote divoire"],
    ["Türkiye", "turkiye"],
    ["Timor-Leste", "timor leste"],
    ["The Bahamas", "bahamas"],
    ["the gambia", "gambia"],
    ["Bosnia & Herzegovina", "bosnia and herzegovina"],
    ["St. Lucia", "saint lucia"],
    ["São Tomé and Príncipe", "sao tome and principe"],
    ["Netherlands!", "netherlands"],
  ])("%s → %s", (input, expected) => {
    expect(normalize(input)).toBe(expected);
  });

  it("only strips 'the' as a whole leading word", () => {
    expect(normalize("Thailand")).toBe("thailand");
  });
});

describe("levenshtein", () => {
  it.each([
    ["", "", 0],
    ["abc", "abc", 0],
    ["abc", "abd", 1],
    ["abc", "ab", 1],
    ["ab", "ba", 2],
    ["kitten", "sitting", 3],
  ])("%s / %s = %i", (a, b, d) => {
    expect(levenshtein(a, b)).toBe(d);
    expect(levenshtein(b, a)).toBe(d);
  });
});

describe("matchAnswer", () => {
  it("accepts the name regardless of case, accents and punctuation", () => {
    expect(judge("france", "fr")).toBe("exact");
    expect(judge("cote divoire", "ci")).toBe("exact");
    expect(judge("COTE D'IVOIRE", "ci")).toBe("exact");
    expect(judge("timor leste", "tl")).toBe("exact");
    expect(judge("newzealand", "nz")).toBe("exact");
  });

  it.each([
    ["Czech Republic", "cz"],
    ["Ivory Coast", "ci"],
    ["Burma", "mm"],
    ["Swaziland", "sz"],
    ["Macedonia", "mk"],
    ["Turkey", "tr"],
    ["DRC", "cd"],
    ["Democratic Republic of the Congo", "cd"],
    ["Congo-Brazzaville", "cg"],
    ["UK", "gb"],
    ["USA", "us"],
    ["Holland", "nl"],
    ["the vatican", "va"],
    ["St Lucia", "lc"],
    ["Saint Lucia", "lc"],
  ])("accepts the alias %s for %s", (input, code) => {
    expect(judge(input, code)).toBe("exact");
  });

  it("does not accept a bare 'Congo' for either Congo", () => {
    expect(judge("Congo", "cd")).toBe("wrong");
    expect(judge("Congo", "cg")).toBe("wrong");
  });

  it("does not let one Congo stand for the other", () => {
    expect(judge("DR Congo", "cg")).toBe("wrong");
    expect(judge("Republic of the Congo", "cd")).toBe("wrong");
  });

  it("forgives one typo in a name of six or more letters", () => {
    expect(judge("Germny", "de")).toBe("typo");
    expect(judge("Argentian", "ar")).toBe("wrong"); // a swap is two edits
    expect(judge("Argentin", "ar")).toBe("typo");
    expect(judge("Brazill", "br")).toBe("typo");
  });

  it("forgives no typos in shorter names", () => {
    expect(judge("Peri", "pe")).toBe("wrong");
    expect(judge("Chda", "td")).toBe("wrong");
    expect(judge("Mali", "ml")).toBe("exact");
  });

  it("never treats another real country as a typo", () => {
    expect(judge("Zambia", "gm")).toBe("wrong");
    expect(judge("Gambia", "zm")).toBe("wrong");
    expect(judge("Gambia", "gm")).toBe("exact");
  });

  it("rejects blanks and wrong answers", () => {
    expect(judge("", "fr")).toBe("wrong");
    expect(judge("   ", "fr")).toBe("wrong");
    expect(judge("Spain", "fr")).toBe("wrong");
  });
});
