import { useState } from "react";
import { MAX_NAME_LENGTH, type Profile } from "../lib/profiles";

const EMOJI = [
  "🦊",
  "🐢",
  "🦁",
  "🐼",
  "🐸",
  "🦄",
  "🐙",
  "🦉",
  "🐝",
  "🐬",
  "🦖",
  "🐱",
  "🐶",
  "🚀",
  "⚽",
  "🌈",
];

interface ProfilesProps {
  profiles: Profile[];
  onSelect: (id: string) => void;
  onCreate: (name: string, emoji: string) => void;
  onDelete: (id: string) => void;
}

export function Profiles({ profiles, onSelect, onCreate, onDelete }: ProfilesProps) {
  const [creating, setCreating] = useState(profiles.length === 0);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJI[0] ?? "🦊");
  const [editing, setEditing] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onCreate(name, emoji);
  }

  function remove(profile: Profile) {
    if (window.confirm(`Delete ${profile.name} and all their progress?`)) onDelete(profile.id);
  }

  return (
    <div className="screen profiles">
      <h1>Flags of the World</h1>

      {profiles.length > 0 && (
        <section>
          <h2>Who's playing?</h2>
          <ul className="profile-list">
            {profiles.map((p) => (
              <li key={p.id} className="profile-row">
                <button type="button" className="profile-button" onClick={() => onSelect(p.id)}>
                  <span className="profile-emoji" aria-hidden="true">
                    {p.emoji}
                  </span>
                  <span>{p.name}</span>
                </button>
                {editing && (
                  <button
                    type="button"
                    className="btn btn-miss btn-small"
                    onClick={() => remove(p)}
                    aria-label={`Delete ${p.name}`}
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!creating && (
            <div className="row-between">
              <button type="button" className="btn-link" onClick={() => setCreating(true)}>
                + Add player
              </button>
              <button type="button" className="btn-link" onClick={() => setEditing(!editing)}>
                {editing ? "Done" : "Manage"}
              </button>
            </div>
          )}
        </section>
      )}

      {creating && (
        <form className="stack" onSubmit={submit}>
          <h2>{profiles.length === 0 ? "Make your player" : "New player"}</h2>
          <label className="field">
            <span>Name</span>
            <input
              className="type-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="off"
              autoFocus
            />
          </label>
          <fieldset className="choice-group">
            <legend>Pick a buddy</legend>
            <div className="emoji-grid">
              {EMOJI.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="emoji-option"
                  aria-pressed={emoji === e}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            Let's go!
          </button>
          {profiles.length > 0 && (
            <button type="button" className="btn" onClick={() => setCreating(false)}>
              Cancel
            </button>
          )}
        </form>
      )}
    </div>
  );
}
