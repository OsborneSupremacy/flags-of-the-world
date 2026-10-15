import raw from "./countries.json";
import { aliasOverrides } from "./aliasOverrides";

export const REGIONS = ["Africa", "Americas", "Asia", "Europe", "Oceania"] as const;

// Antarctic holds Antarctica and a few uninhabited territories. It is never a filter option, but
// those entries can still appear under "all regions" once territories are switched on.
export type Region = (typeof REGIONS)[number] | "Antarctic";

export interface Country {
  /** ISO 3166-1 alpha-2, lowercase. Also the flag-icons file name. */
  code: string;
  /** Common English name: what the quiz shows and expects. */
  name: string;
  /** Other names accepted as a typed answer. */
  aliases: string[];
  region: Region;
  subregion: string;
  unMember: boolean;
  capital: string[];
}

// The two UN observer states. Everyone expects them in a list of the world's countries.
const OBSERVER_STATES = new Set(["va", "ps"]);

function applyOverrides(country: Country): Country {
  const override = aliasOverrides[country.code];
  if (!override) return country;
  const removed = new Set(override.remove ?? []);
  const aliases = [...country.aliases, ...(override.add ?? [])].filter(
    (alias, index, all) =>
      alias !== country.name && !removed.has(alias) && all.indexOf(alias) === index,
  );
  return { ...country, aliases };
}

export const ALL_COUNTRIES: readonly Country[] = (raw as Country[]).map(applyOverrides);

export function isInDefaultSet(country: Country): boolean {
  return country.unMember || OBSERVER_STATES.has(country.code);
}

export function activeCountries(includeTerritories: boolean): Country[] {
  return includeTerritories ? [...ALL_COUNTRIES] : ALL_COUNTRIES.filter(isInDefaultSet);
}

const byCode = new Map(ALL_COUNTRIES.map((c) => [c.code, c]));

export function countryByCode(code: string): Country | undefined {
  return byCode.get(code);
}
