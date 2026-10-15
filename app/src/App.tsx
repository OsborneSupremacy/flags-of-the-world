import { useEffect, useRef, useState } from "react";
import { activeCountries, countryByCode, type Country } from "./data/countries";
import { selectSession } from "./lib/leitner";
import { LOOKALIKE_GROUPS } from "./data/lookalikes";
import { lookalikeChoices, usableGroups } from "./lib/lookalikes";
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
import { Progress } from "./screens/Progress";
import { FlipCards } from "./modes/FlipCards";
import { MultipleChoice } from "./modes/MultipleChoice";
import { TypeIt } from "./modes/TypeIt";

// No router: the whole site is one index.html and the view is plain state. Which profile is
// playing lives in AppState instead, so it survives a reload.
type View =
  | { name: "home" }
  | {
      name: "session";
      options: SessionOptions;
      cards: Country[];
      pool: Country[];
      choicesFor?: Map<string, Country[]>;
      key: number;
    }
  | { name: "summary"; results: CardResult[] }
  | { name: "progress" };

export function App() {
  const { state, setState, saveFailed } = useAppState();
  const [view, setView] = useState<View>({ name: "home" });
  const profile = activeProfile(state);
  // Remounts the mode on "Play again" so it starts fresh.
  const sessionCount = useRef(0);
  const [notice, setNotice] = useState<string | null>(null);

  // A new view starts at the top. Without this, leaving a scrolled progress screen opens Home
  // half-way down on a phone.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view.name, profile?.id]);

  const update = (change: (s: AppState) => AppState) => setState(change);
  const home = () => setView({ name: "home" });

  function start() {
    if (!profile) return;
    const options = state.options;
    const pool = activeCountries(options.includeTerritories);
    const inRegion = filterByRegion(pool, options.region);
    let candidates = inRegion.map((c) => c.code);
    let choicesFor: Map<string, Country[]> | undefined;

    if (options.mode === "lookalikes") {
      // A group is in play when any of its flags is in the chosen region; all of its members come
      // along, since the drill is about telling them apart.
      const regionCodes = new Set(candidates);
      const groups = usableGroups(LOOKALIKE_GROUPS, pool).filter((g) =>
        g.some((c) => regionCodes.has(c.code)),
      );
      candidates = groups.flat().map((c) => c.code);
      choicesFor = lookalikeChoices(groups);
    }

    const length = options.length === "all" ? null : options.length;
    const cards = selectSession(candidates, profile.decks.flags, length).flatMap(
      (code) => countryByCode(code) ?? [],
    );
    if (cards.length === 0) {
      setNotice("There are no flags to practise with those settings. Try another region.");
      setView({ name: "home" });
      return;
    }
    setNotice(null);
    setView({ name: "session", options, cards, pool, choicesFor, key: ++sessionCount.current });
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
            onShowProgress={() => setView({ name: "progress" })}
            notice={notice}
            options={state.options}
            onChange={(options) => update((s) => ({ ...s, options }))}
            onStart={start}
          />
        );
      case "session": {
        const props = { cards: view.cards, pool: view.pool, onAnswer, onFinish };
        if (view.options.mode === "choice")
          return <MultipleChoice key={view.key} {...props} reverse={view.options.reverse} />;
        if (view.options.mode === "lookalikes")
          return (
            <MultipleChoice
              key={view.key}
              {...props}
              reverse={false}
              choicesFor={view.choicesFor}
            />
          );
        if (view.options.mode === "type") return <TypeIt key={view.key} {...props} />;
        return <FlipCards key={view.key} {...props} />;
      }
      case "summary":
        return <Summary results={view.results} onAgain={start} onHome={home} />;
      case "progress":
        return (
          <Progress
            state={state}
            profile={profile}
            countries={activeCountries(state.options.includeTerritories)}
            onImport={(next) => update(() => next)}
          />
        );
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
