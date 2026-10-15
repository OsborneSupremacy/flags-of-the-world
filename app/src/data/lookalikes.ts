// Groups of flags that are easy to mix up. In the look-alikes drill, the other members of a flag's
// group are its only wrong answers, so every question is a genuine "which one is it?".
//
// A country belongs to at most one group (the integrity test enforces it), so the options for a
// flag are never ambiguous about which set they came from.

export const LOOKALIKE_GROUPS: readonly (readonly string[])[] = [
  // The brief's list.
  ["td", "ro", "ad", "md"], // Chad, Romania, Andorra, Moldova
  ["id", "mc", "pl"], // Indonesia, Monaco, Poland
  ["ie", "ci", "it"], // Ireland, Côte d'Ivoire, Italy
  ["au", "nz"], // Australia, New Zealand
  ["nl", "lu"], // Netherlands, Luxembourg
  ["sn", "ml", "gn"], // Senegal, Mali, Guinea
  ["no", "is"], // Norway, Iceland
  ["si", "sk", "ru"], // Slovenia, Slovakia, Russia
  // Other well-known confusions.
  ["co", "ec", "ve"], // Colombia, Ecuador, Venezuela
  ["hn", "ni", "sv"], // Honduras, Nicaragua, El Salvador
  ["qa", "bh"], // Qatar, Bahrain
  ["eg", "sy", "iq", "ye"], // Egypt, Syria, Iraq, Yemen
  ["ht", "li"], // Haiti, Liechtenstein
  ["ne", "in"], // Niger, India
  ["lr", "us", "my"], // Liberia, United States, Malaysia
];
