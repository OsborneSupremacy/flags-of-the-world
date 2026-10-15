import { useEffect, useState } from "react";
import { preloadFlag } from "../data/flags";
import type { CardResult } from "../lib/session";
import { useHotkeys } from "../lib/useHotkeys";
import { Flag } from "../components/Flag";
import { ProgressBar } from "../components/ProgressBar";
import { encouragement, praise } from "../components/praise";
import type { ModeProps } from "./types";

export function FlipCards({ cards, onAnswer, onFinish }: ModeProps) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<CardResult[]>([]);
  const [announcement, setAnnouncement] = useState("");

  const card = cards[index];
  const upcoming = cards[index + 1]?.code;
  useEffect(() => preloadFlag(upcoming), [upcoming]);

  function reveal() {
    if (!card || revealed) return;
    setRevealed(true);
    setAnnouncement(`It's ${card.name}.`);
  }

  function grade(correct: boolean) {
    if (!card || !revealed) return;
    const next = [...results, { code: card.code, correct }];
    onAnswer(card.code, correct);
    setAnnouncement(correct ? praise() : encouragement());
    if (index + 1 >= cards.length) {
      onFinish(next);
      return;
    }
    setResults(next);
    setIndex(index + 1);
    setRevealed(false);
  }

  useHotkeys({
    " ": reveal,
    Enter: reveal,
    ArrowRight: () => grade(true),
    ArrowLeft: () => grade(false),
  });

  if (!card) return null;

  return (
    <div className="mode">
      <ProgressBar current={index} total={cards.length} />

      <button
        type="button"
        className="flip-card"
        onClick={reveal}
        aria-label={revealed ? undefined : "Show the answer"}
        disabled={revealed}
      >
        <Flag country={card} revealed={revealed} />
        {revealed ? (
          <span className="flip-answer">
            <span className="answer-name">{card.name}</span>
            <span className="answer-detail">
              {card.subregion || card.region}
              {card.capital.length > 0 && <> · Capital: {card.capital.join(", ")}</>}
            </span>
          </span>
        ) : (
          <span className="flip-hint">
            Tap to flip <kbd>Space</kbd>
          </span>
        )}
      </button>

      {revealed && (
        <div className="grade-buttons">
          <button type="button" className="btn btn-miss" onClick={() => grade(false)}>
            Missed it <kbd>←</kbd>
          </button>
          <button type="button" className="btn btn-got" onClick={() => grade(true)}>
            Got it <kbd>→</kbd>
          </button>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
