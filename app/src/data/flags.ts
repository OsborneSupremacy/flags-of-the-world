// Every flag is bundled from flag-icons, so Vite fingerprints it and nothing is fetched from another
// host. The negative pattern drops subdivision flags (gb-eng, es-ct, ...), which no entry uses and
// which would otherwise be emitted into the build for nothing.
const flagUrls = import.meta.glob<string>(
  ["/node_modules/flag-icons/flags/4x3/*.svg", "!/node_modules/flag-icons/flags/4x3/*-*.svg"],
  { eager: true, query: "?url", import: "default" },
);

export function flagUrl(code: string): string | undefined {
  return flagUrls[`/node_modules/flag-icons/flags/4x3/${code}.svg`];
}
