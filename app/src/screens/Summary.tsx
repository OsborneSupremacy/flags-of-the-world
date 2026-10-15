import { countryByCode } from "../data/countries";
import type { CardResult } from "../lib/session";
import { Flag } from "../components/Flag";

interface SummaryProps {
  results: CardResult[];
  onAgain: () => void;
  onHome: () => void;
}

function headline(score: number, total: number): string {
  const ratio = total === 0 ? 0 : score / total;
  if (ratio === 1) return "Perfect round!";
  if (ratio >= 0.8) return "Fantastic!";
  if (ratio >= 0.5) return "Nice work!";
  return "Good practice!";
}

export function Summary({ results, onAgain, onHome }: SummaryProps) {
  const score = results.filter((r) => r.correct).length;
  const missed = results.filter((r) => !r.correct).flatMap((r) => countryByCode(r.code) ?? []);

  return (
    <div className="screen summary">
      <h1>{headline(score, results.length)}</h1>
      <p className="summary-score" role="status">
        {score} of {results.length} correct
      </p>

      {missed.length > 0 && (
        <section>
          <h2>Ones to practise</h2>
          <ul className="flag-list">
            {missed.map((c) => (
              <li key={c.code}>
                <Flag country={c} revealed size="small" />
                <span>{c.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="stack">
        <button type="button" className="btn btn-primary" onClick={onAgain}>
          Play again
        </button>
        <button type="button" className="btn" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}
