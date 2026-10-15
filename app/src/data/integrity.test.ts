import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ALL_COUNTRIES, activeCountries, countryByCode } from "./countries";
import { aliasOverrides } from "./aliasOverrides";

const flagPath = (code: string) =>
  fileURLToPath(new URL(`../../node_modules/flag-icons/flags/4x3/${code}.svg`, import.meta.url));

describe.each([
  ["default set", activeCountries(false)],
  ["with territories", activeCountries(true)],
])("%s", (_label, countries) => {
  it("has a flag file for every country", () => {
    const missing = countries.filter((c) => !existsSync(flagPath(c.code))).map((c) => c.code);
    expect(missing).toEqual([]);
  });

  it("has unique names", () => {
    const names = countries.map((c) => c.name.toLowerCase());
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });
});

describe("default set", () => {
  it("is the 193 UN members plus Vatican City and Palestine", () => {
    const set = activeCountries(false);
    expect(set).toHaveLength(195);
    expect(set.map((c) => c.code)).toEqual(expect.arrayContaining(["va", "ps"]));
    expect(set.map((c) => c.code)).not.toEqual(expect.arrayContaining(["xk"]));
  });

  it("leaves territories for the toggle", () => {
    const codes = activeCountries(true).map((c) => c.code);
    expect(codes).toEqual(expect.arrayContaining(["xk", "tw", "gl", "pr"]));
  });
});

describe("alias overrides", () => {
  it("only names countries that exist", () => {
    expect(Object.keys(aliasOverrides).filter((code) => !countryByCode(code))).toEqual([]);
  });

  it("removes the ambiguous 'Congo'", () => {
    expect(countryByCode("cg")?.aliases).not.toContain("Congo");
    expect(countryByCode("cd")?.aliases).not.toContain("Congo");
  });

  it("never repeats the display name as an alias", () => {
    expect(ALL_COUNTRIES.filter((c) => c.aliases.includes(c.name))).toEqual([]);
  });
});
