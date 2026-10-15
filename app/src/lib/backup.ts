// Export and import of the whole state as a JSON file, so progress survives a change of browser.

import { parseState, type AppState } from "./profiles";

export const BACKUP_KIND = "flags-of-the-world-backup";

/** The file contents: the stored state, tagged so a random JSON file is not mistaken for one. */
export function serializeBackup(state: AppState, exportedAt: Date): string {
  return JSON.stringify(
    { kind: BACKUP_KIND, exportedAt: exportedAt.toISOString(), ...state },
    null,
    2,
  );
}

export type ImportResult =
  { ok: true; state: AppState; added: string[]; replaced: string[] } | { ok: false; error: string };

/**
 * Merges a backup into the current state. Players are matched by id: one in the file replaces the
 * same player here, and players only here are kept. Which player is active, and the session
 * options, stay as they are on this device.
 */
export function importBackup(current: AppState, text: string): ImportResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't a Flags of the World backup." };
  }
  if (
    typeof json !== "object" ||
    json === null ||
    (json as { kind?: unknown }).kind !== BACKUP_KIND
  ) {
    return { ok: false, error: "That file isn't a Flags of the World backup." };
  }
  const incoming = parseState(json);
  if (incoming.profiles.length === 0) {
    return { ok: false, error: "That backup has no players in it." };
  }

  const existingIds = new Set(current.profiles.map((p) => p.id));
  const replaced = incoming.profiles.filter((p) => existingIds.has(p.id));
  const added = incoming.profiles.filter((p) => !existingIds.has(p.id));

  // Existing players keep their place in the list; new ones go at the end.
  const profiles = current.profiles
    .map((p) => incoming.profiles.find((q) => q.id === p.id) ?? p)
    .concat(added);

  return {
    ok: true,
    state: { ...current, profiles },
    added: added.map((p) => p.name),
    replaced: replaced.map((p) => p.name),
  };
}

export function backupFileName(date: Date): string {
  return `flags-progress-${date.toISOString().slice(0, 10)}.json`;
}
