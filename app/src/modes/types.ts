import type { Country } from "../data/countries";
import type { CardResult } from "../lib/session";

export interface ModeProps {
  cards: Country[];
  /** Every country in play, region filter aside: distractors and typed-answer checks use it. */
  pool: Country[];
  /** Called on every answer, so progress is kept even if the session is abandoned. */
  onAnswer: (code: string, correct: boolean) => void;
  onFinish: (results: CardResult[]) => void;
}
