// Hand-curated changes to the names world-countries supplies, for the answers people actually type.
//
// Several of these are already in the package's alternate spellings. They are listed anyway: this
// file is the record of which names the quiz promises to accept, and an upgrade of world-countries
// that dropped one would otherwise go unnoticed.
//
// `remove` exists for names that are ambiguous between two entries. "Congo" is the clearest case: it
// is a fair description of either Congo, so accepting it for one would mark it right when the
// player meant the other. The quiz makes them say which.

export interface AliasOverride {
  add?: string[];
  remove?: string[];
}

export const aliasOverrides: Record<string, AliasOverride> = {
  ae: { add: ["UAE", "Emirates"] },
  ba: { add: ["Bosnia", "Bosnia-Herzegovina"] },
  cd: {
    add: [
      "Democratic Republic of the Congo",
      "Democratic Republic of Congo",
      "DRC",
      "Congo-Kinshasa",
    ],
  },
  cg: {
    add: ["Republic of the Congo", "Republic of Congo", "Congo Republic", "Congo-Brazzaville"],
    remove: ["Congo"],
  },
  ci: { add: ["Côte d'Ivoire", "Cote d'Ivoire"] },
  cv: { add: ["Cabo Verde"] },
  cz: { add: ["Czech Republic"] },
  fm: { add: ["Federated States of Micronesia"] },
  gb: { add: ["UK", "Great Britain", "Britain"] },
  kn: { add: ["Saint Kitts and Nevis", "St Kitts and Nevis", "St Kitts"] },
  lc: { add: ["St Lucia"] },
  mk: { add: ["Macedonia"] },
  mm: { add: ["Burma"] },
  nl: { add: ["Holland"] },
  ps: { add: ["State of Palestine"] },
  ru: { add: ["Russian Federation"] },
  st: { add: ["Sao Tome", "São Tomé"] },
  sz: { add: ["Swaziland"] },
  tl: { add: ["East Timor"] },
  tr: { add: ["Turkey", "Turkiye"] },
  us: { add: ["USA", "United States of America", "America"] },
  va: { add: ["Vatican", "Holy See", "The Vatican"] },
  vc: { add: ["St Vincent and the Grenadines", "St Vincent"] },
  vn: { add: ["Viet Nam"] },
};
