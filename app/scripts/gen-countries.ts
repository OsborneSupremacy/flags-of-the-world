// Generates src/data/countries.json from the world-countries package.
//
// Run with `npm run gen:countries` after upgrading world-countries. The output is committed, so a
// normal build does not depend on this script and the bundle carries only the fields the app uses.
// Hand-curated changes to names and aliases belong in src/data/aliasOverrides.ts, not here: this
// script is a straight extraction and running it again should never lose an edit.

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

interface SourceCountry {
  cca2: string;
  name: { common: string; official: string };
  altSpellings: string[];
  region: string;
  subregion: string;
  unMember: boolean;
  capital?: string[];
}

const require = createRequire(import.meta.url);
const sourcePath = require.resolve("world-countries/countries.json");
const source = JSON.parse(readFileSync(sourcePath, "utf8")) as SourceCountry[];

// Latin script only. altSpellings mixes in native names in other scripts, which nobody will type
// on an English keyboard and which would only make the alias lists harder to review.
const latin = /^[\p{Script=Latin}\p{M}\s'’.,()-]+$/u;

const countries = source
  .map((c) => {
    const code = c.cca2.toLowerCase();
    const name = c.name.common;
    const aliases = [c.name.official, ...c.altSpellings].filter(
      (alias, index, all) =>
        alias !== name &&
        alias.toLowerCase() !== code &&
        latin.test(alias) &&
        all.indexOf(alias) === index,
    );
    return {
      code,
      name,
      aliases,
      region: c.region,
      subregion: c.subregion,
      unMember: c.unMember,
      capital: c.capital ?? [],
    };
  })
  .sort((a, b) => a.code.localeCompare(b.code));

const target = new URL("../src/data/countries.json", import.meta.url);
writeFileSync(target, JSON.stringify(countries, null, 1) + "\n");
console.log(`Wrote ${countries.length} countries to ${target.pathname}`);
