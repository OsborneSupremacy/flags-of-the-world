// Every flag is bundled from flag-icons, so Vite fingerprints it and nothing is fetched from another
// host. The negative pattern drops subdivision flags (gb-eng, es-ct, ...), which no entry uses and
// which would otherwise be emitted into the build for nothing.
const flagUrls = import.meta.glob<string>(
  ["/node_modules/flag-icons/flags/4x3/*.svg", "!/node_modules/flag-icons/flags/4x3/*-*.svg"],
  { eager: true, query: "?url", import: "default" },
);

// Local fixes for flag-icons artwork, keyed by the same code. gr.svg paints the canton after the
// stripes; upstream paints a stripe over it, which leaves a hairline seam at some sizes.
const overrideUrls = import.meta.glob<string>("./flagOverrides/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

export function flagUrl(code: string): string | undefined {
  return (
    overrideUrls[`./flagOverrides/${code}.svg`] ??
    flagUrls[`/node_modules/flag-icons/flags/4x3/${code}.svg`]
  );
}

/** Starts fetching a flag before it is shown, so the next card does not flash empty. */
export function preloadFlag(code: string | undefined): void {
  const url = code && flagUrl(code);
  if (url) new Image().src = url;
}
