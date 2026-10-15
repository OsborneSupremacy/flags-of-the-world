import { REGIONS } from "../data/countries";
import type { Mode, RegionFilter, SessionLength, SessionOptions } from "../lib/session";

interface HomeProps {
  options: SessionOptions;
  onChange: (options: SessionOptions) => void;
  onStart: () => void;
}

const MODES: { mode: Mode; label: string; blurb: string; ready: boolean }[] = [
  { mode: "flip", label: "Flip cards", blurb: "See the flag, guess, flip", ready: true },
  { mode: "choice", label: "Multiple choice", blurb: "Pick from four", ready: false },
  { mode: "type", label: "Type it", blurb: "Spell the name", ready: false },
  { mode: "lookalikes", label: "Look-alikes", blurb: "Tricky twins", ready: false },
];

const LENGTHS: SessionLength[] = [10, 20, "all"];

export function Home({ options, onChange, onStart }: HomeProps) {
  const set = (patch: Partial<SessionOptions>) => onChange({ ...options, ...patch });

  return (
    <div className="screen home">
      <h1>Flags of the World</h1>

      <fieldset className="choice-group">
        <legend>Mode</legend>
        <div className="mode-grid">
          {MODES.map((m) => (
            <button
              key={m.mode}
              type="button"
              className="mode-tile"
              aria-pressed={options.mode === m.mode}
              disabled={!m.ready}
              onClick={() => set({ mode: m.mode })}
            >
              <span className="mode-label">{m.label}</span>
              <span className="mode-blurb">{m.ready ? m.blurb : "Coming soon"}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="choice-group">
        <legend>Region</legend>
        <div className="chips">
          {(["all", ...REGIONS] as RegionFilter[]).map((r) => (
            <button
              key={r}
              type="button"
              className="chip"
              aria-pressed={options.region === r}
              onClick={() => set({ region: r })}
            >
              {r === "all" ? "Everywhere" : r}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="choice-group">
        <legend>How many</legend>
        <div className="chips">
          {LENGTHS.map((l) => (
            <button
              key={l}
              type="button"
              className="chip"
              aria-pressed={options.length === l}
              onClick={() => set({ length: l })}
            >
              {l === "all" ? "All" : l}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="toggle">
        <input
          type="checkbox"
          checked={options.includeTerritories}
          onChange={(e) => set({ includeTerritories: e.target.checked })}
        />
        <span>Include territories (Greenland, Puerto Rico, Taiwan…)</span>
      </label>

      <button type="button" className="btn btn-primary btn-start" onClick={onStart}>
        Start
      </button>
    </div>
  );
}
