import { useState } from "react";
import { matchAnswer, type MatchResult } from "../lib/answer";
import { Flag } from "../components/Flag";
import { ProgressBar } from "../components/ProgressBar";
import { Feedback } from "../components/Feedback";
import type { ModeProps } from "./types";
import { useSession } from "./useSession";

export function TypeIt(props: ModeProps) {
  const { card, index, total, answered, announcement, answer, next } = useSession(props);
  const [text, setText] = useState("");
  const [result, setResult] = useState<MatchResult | "skipped" | null>(null);

  if (!card) return null;

  function check() {
    if (!card || !text.trim()) return;
    const verdict = matchAnswer(text, card, props.pool);
    setResult(verdict);
    answer(
      verdict !== "wrong",
      verdict === "typo" ? `Close enough! It's spelled ${card.name}.` : undefined,
    );
  }

  function skip() {
    setResult("skipped");
    answer(false);
  }

  function advance() {
    setText("");
    setResult(null);
    next();
  }

  // Enter submits the form either way: once to check, again to move on.
  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (answered === null) check();
    else advance();
  }

  const revealed = answered !== null;

  return (
    <div className="mode">
      <ProgressBar current={index} total={total} />
      <Flag country={card} revealed={revealed} />

      <form className="type-form" onSubmit={onSubmit}>
        <label htmlFor="answer" className="sr-only">
          Country name
        </label>
        <input
          // A new element per card puts the cursor back in the field without an effect.
          key={card.code}
          id="answer"
          className={`type-input ${revealed ? (answered ? "input-good" : "input-bad") : ""}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          readOnly={revealed}
          placeholder="Which country?"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint={revealed ? "next" : "done"}
          autoFocus
        />

        {revealed ? (
          <>
            <Feedback correct={answered}>
              {result === "exact" && "Correct!"}
              {result === "typo" && <>Close enough! It's spelled {card.name}</>}
              {(result === "wrong" || result === "skipped") && <>It's {card.name}</>}
            </Feedback>
            <button type="submit" className="btn btn-primary">
              {index + 1 >= total ? "See results" : "Next"} <kbd>Enter</kbd>
            </button>
          </>
        ) : (
          <div className="grade-buttons">
            <button type="button" className="btn" onClick={skip}>
              I don't know
            </button>
            <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
              Check <kbd>Enter</kbd>
            </button>
          </div>
        )}
      </form>

      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
