import { useEffect, useState } from "react";
import { preloadFlag } from "../data/flags";
import type { CardResult } from "../lib/session";
import type { ModeProps } from "./types";
import { encouragement, praise } from "../components/praise";

/** Walks a list of cards one answer at a time: the part every mode shares. */
export function useSession({ cards, onAnswer, onFinish }: ModeProps) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<CardResult[]>([]);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const card = cards[index];
  const upcoming = cards[index + 1]?.code;
  useEffect(() => {
    preloadFlag(upcoming);
  }, [upcoming]);

  function answer(correct: boolean, message?: string) {
    if (!card || answered !== null) return;
    setAnswered(correct);
    setResults((r) => [...r, { code: card.code, correct }]);
    onAnswer(card.code, correct);
    setAnnouncement(
      message ??
        (correct ? `${praise()} It's ${card.name}.` : `${encouragement()} It's ${card.name}.`),
    );
  }

  function next() {
    if (answered === null) return;
    if (index + 1 >= cards.length) {
      onFinish(results);
      return;
    }
    setIndex(index + 1);
    setAnswered(null);
    setAnnouncement("");
  }

  return { card, index, total: cards.length, answered, announcement, answer, next };
}
