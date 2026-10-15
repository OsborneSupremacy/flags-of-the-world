import { useRef, useState } from "react";
import type { Country } from "../data/countries";
import { backupFileName, importBackup, serializeBackup } from "../lib/backup";
import type { AppState, Profile } from "../lib/profiles";
import { currentStreak, masteryByRegion, weakestCards } from "../lib/stats";
import { Flag } from "../components/Flag";

interface ProgressProps {
  state: AppState;
  profile: Profile;
  countries: Country[];
  onImport: (state: AppState) => void;
}

function download(text: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function Progress({ state, profile, countries, onImport }: ProgressProps) {
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const deck = profile.decks.flags;
  const regions = masteryByRegion(countries, deck);
  const weakest = weakestCards(countries, deck);
  const mastered = regions.reduce((sum, r) => sum + r.mastered, 0);
  const streak = currentStreak(profile.activeDays, new Date());
  const seen = countries.filter((c) => deck[c.code]).length;

  function exportProgress() {
    const now = new Date();
    download(serializeBackup(state, now), backupFileName(now));
    setMessage({ text: "Backup saved. Keep the file somewhere safe.", ok: true });
  }

  async function importProgress(file: File | undefined) {
    if (!file) return;
    const result = importBackup(state, await file.text());
    if (fileInput.current) fileInput.current.value = "";
    if (!result.ok) {
      setMessage({ text: result.error, ok: false });
      return;
    }
    if (
      result.replaced.length > 0 &&
      !window.confirm(
        `This replaces the progress saved here for ${result.replaced.join(", ")}. Continue?`,
      )
    ) {
      return;
    }
    onImport(result.state);
    const names = [...result.replaced, ...result.added];
    setMessage({ text: `Imported progress for ${names.join(", ")}.`, ok: true });
  }

  return (
    <div className="screen progress-screen">
      <h1>
        <span aria-hidden="true">{profile.emoji}</span> {profile.name}'s progress
      </h1>

      <div className="stat-tiles">
        <div className="stat-tile">
          <span className="stat-value">{mastered}</span>
          <span className="stat-label">mastered</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">
            {streak}
            {streak > 0 && <span aria-hidden="true"> 🔥</span>}
          </span>
          <span className="stat-label">day streak</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">
            {seen}
            <span className="stat-of">/{countries.length}</span>
          </span>
          <span className="stat-label">seen</span>
        </div>
      </div>

      <section>
        <h2>Mastered by region</h2>
        <ul className="region-bars">
          {regions.map((r) => (
            <li key={r.region}>
              <div className="region-bar-label">
                <span>{r.region}</span>
                <span className="muted">
                  {r.mastered} / {r.total}
                </span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label={`${r.region} mastered`}
                aria-valuemin={0}
                aria-valuemax={r.total}
                aria-valuenow={r.mastered}
              >
                <div
                  className="progress-fill progress-fill-good"
                  style={{ width: `${r.total ? (r.mastered / r.total) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="muted small">
          A flag is mastered after getting it right enough times in a row.
        </p>
      </section>

      <section>
        <h2>Tricky flags</h2>
        {weakest.length === 0 ? (
          <p className="muted">Nothing tricky yet. Flags you miss will show up here.</p>
        ) : (
          <ul className="flag-list">
            {weakest.map(({ country, state: card }) => (
              <li key={country.code}>
                <Flag country={country} revealed size="small" />
                <span className="flag-list-name">{country.name}</span>
                <span className="muted small">
                  {card.correct} of {card.seen} right
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Backup</h2>
        <p className="muted small">
          Progress lives in this browser only. Save a backup to move it to another browser or
          device. The backup includes every player.
        </p>
        <div className="grade-buttons">
          <button type="button" className="btn" onClick={exportProgress}>
            Save backup
          </button>
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            Load backup
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void importProgress(e.target.files?.[0])}
        />
        {message && (
          <p className={`feedback ${message.ok ? "feedback-good" : "feedback-bad"}`} role="status">
            {message.text}
          </p>
        )}
      </section>
    </div>
  );
}
