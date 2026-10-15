import { useRef, useState } from "react";
import { activeCountries, countryByCode, type Country } from "./data/countries";
import { selectSession } from "./lib/leitner";
import {
  activeProfile,
  addProfile,
  recordFlagAnswer,
  removeProfile,
  type AppState,
} from "./lib/profiles";
import { filterByRegion, type CardResult, type SessionOptions } from "./lib/session";
import { useAppState } from "./lib/useAppState";
import { newId } from "./lib/id";
import { Home } from "./screens/Home";
import { Profiles } from "./screens/Profiles";
import { Summary } from "./screens/Summary";
import { FlipCards } from "./modes/FlipCards";
import { MultipleChoice } from "./modes/MultipleChoice";
import { TypeIt } from "./modes/TypeIt";

// No router: the whole site is one index.html and the view is plain state. Which profile is
// playing lives in AppState instead, so it survives a reload.
type View =
  | { name: "home" }
  | { name: "session"; options: SessionOptions; cards: Country[]; pool: Country[]; key: number }
  | { name: "summary"; results: CardResult[] };

export function App() {
  const { state, setState, saveFailed } = useAppState();
  const [view, setView] = useState<View>({ name: "home" });
  const profile = activeProfile(state);
  // Remounts the mode on "Play again" so it starts fresh.
  const sessionCount = useRef(0);

  const update = (change: (s: AppState) => AppState) => setState(change);
  const home = () => setView({ name: "home" });

  function start() {
    if (!profile) return;
    const options = state.options;
    const pool = activeCountries(options.includeTerritories);
    const candidates = filterByRegion(pool, options.region).map((c) => c.code);
    const length = options.length === "all" ? null : options.length;
    const cards = selectSession(candidates, profile.decks.flags, length).flatMap(
      (code) => countryByCode(code) ?? [],
    );
    setView({ name: "session", options, cards, pool, key: ++sessionCount.current });
  }

  function onAnswer(code: string, correct: boolean) {
    if (!profile) return;
    update((s) => recordFlagAnswer(s, profile.id, code, correct, new Date()));
  }

  const onFinish = (results: CardResult[]) => setView({ name: "summary", results });

  function renderView() {
    if (!profile) {
      return (
        <Profiles
          profiles={state.profiles}
          onSelect={(id) => update((s) => ({ ...s, activeProfileId: id }))}
          onCreate={(name, emoji) => update((s) => addProfile(s, name, emoji, newId(), Date.now()))}
          onDelete={(id) => update((s) => removeProfile(s, id))}
        />
      );
    }
    switch (view.name) {
      case "home":
        return (
          <Home
            profile={profile}
            onSwitchProfile={() => update((s) => ({ ...s, activeProfileId: null }))}
            options={state.options}
            onChange={(options) => update((s) => ({ ...s, options }))}
            onStart={start}
          />
        );
      case "session": {
        const props = { cards: view.cards, pool: view.pool, onAnswer, onFinish };
        if (view.options.mode === "choice")
          return <MultipleChoice key={view.key} {...props} reverse={view.options.reverse} />;
        if (view.options.mode === "type") return <TypeIt key={view.key} {...props} />;
        return <FlipCards key={view.key} {...props} />;
      }
      case "summary":
        return <Summary results={view.results} onAgain={start} onHome={home} />;
    }
  }

  return (
    <main className="app">
      {saveFailed && (
        <p className="banner" role="status">
          This browser isn't saving progress, so it will be lost when the page closes.
        </p>
      )}
      {profile && view.name !== "home" && (
        <header className="topbar">
          <button type="button" className="btn-link" onClick={home}>
            ← Home
          </button>
        </header>
      )}
      {renderView()}
    </main>
  );
}
