import { useState } from "react";
import { activeCountries, type Country } from "./data/countries";
import { filterByRegion, pickRandom, type CardResult, type SessionOptions } from "./lib/session";
import { Home } from "./screens/Home";
import { Summary } from "./screens/Summary";
import { FlipCards } from "./modes/FlipCards";

// No router: the whole site is one index.html and the view is plain state.
type View =
  | { name: "home" }
  | { name: "session"; cards: Country[]; key: number }
  | { name: "summary"; results: CardResult[] };

const DEFAULT_OPTIONS: SessionOptions = {
  mode: "flip",
  region: "all",
  length: 10,
  includeTerritories: false,
};

export function App() {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [view, setView] = useState<View>({ name: "home" });

  function start() {
    const pool = filterByRegion(activeCountries(options.includeTerritories), options.region);
    setView({ name: "session", cards: pickRandom(pool, options.length), key: Date.now() });
  }

  const home = () => setView({ name: "home" });

  return (
    <main className="app">
      {view.name !== "home" && (
        <header className="topbar">
          <button type="button" className="btn-link" onClick={home}>
            ← Home
          </button>
        </header>
      )}
      {view.name === "home" && <Home options={options} onChange={setOptions} onStart={start} />}
      {view.name === "session" && (
        <FlipCards
          key={view.key}
          cards={view.cards}
          onFinish={(results) => setView({ name: "summary", results })}
        />
      )}
      {view.name === "summary" && <Summary results={view.results} onAgain={start} onHome={home} />}
    </main>
  );
}
