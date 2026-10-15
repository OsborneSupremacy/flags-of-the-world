import { useState } from "react";
import type { Country } from "../data/countries";
import { buildChoices } from "../lib/distractors";
import { useHotkeys } from "../lib/useHotkeys";
import { Flag } from "../components/Flag";
import { ProgressBar } from "../components/ProgressBar";
import { Feedback } from "../components/Feedback";
import type { ModeProps } from "./types";
import { useSession } from "./useSession";

interface MultipleChoiceProps extends ModeProps {
  /** Show the name and pick the flag, instead of the other way round. */
  reverse: boolean;
}

export function MultipleChoice({ reverse, ...props }: MultipleChoiceProps) {
  const { card, index, total, answered, announcement, answer, next } = useSession(props);
  // Built once per session so the options never reshuffle under the player's finger.
  const [choices] = useState(() => props.cards.map((c) => buildChoices(c, props.pool)));
  const [picked, setPicked] = useState<string | null>(null);

  const options = choices[index] ?? [];

  function choose(option: Country | undefined) {
    if (!card || !option || answered !== null) return;
    setPicked(option.code);
    answer(option.code === card.code);
  }

  function advance() {
    setPicked(null);
    next();
  }

  useHotkeys({
    "1": () => choose(options[0]),
    "2": () => choose(options[1]),
    "3": () => choose(options[2]),
    "4": () => choose(options[3]),
    Enter: advance,
    " ": advance,
  });

  if (!card) return null;
  const revealed = answered !== null;

  function optionState(option: Country): string {
    if (!revealed) return "";
    if (option.code === card?.code) return "option-correct";
    if (option.code === picked) return "option-wrong";
    return "option-faded";
  }

  return (
    <div className="mode">
      <ProgressBar current={index} total={total} />

      {reverse ? (
        <h2 className="prompt-name">
          Which flag is <strong>{card.name}?</strong>
        </h2>
      ) : (
        <Flag country={card} revealed={revealed} />
      )}

      <div className={reverse ? "options options-flags" : "options"}>
        {options.map((option, i) => (
          <button
            key={option.code}
            type="button"
            className={`option ${optionState(option)}`}
            onClick={() => choose(option)}
            aria-disabled={revealed}
          >
            <kbd>{i + 1}</kbd>
            {reverse ? (
              <Flag country={option} revealed={revealed} size="option" label={`Option ${i + 1}`} />
            ) : (
              <span className="option-text">{option.name}</span>
            )}
          </button>
        ))}
      </div>

      {revealed && (
        <>
          <Feedback correct={answered}>
            {answered ? (
              "Correct!"
            ) : (
              <>
                That was {reverse ? "the flag of" : ""} {card.name}
              </>
            )}
          </Feedback>
          <button type="button" className="btn btn-primary" onClick={advance} autoFocus>
            {index + 1 >= total ? "See results" : "Next"} <kbd>Enter</kbd>
          </button>
        </>
      )}

      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
