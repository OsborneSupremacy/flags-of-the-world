import { EMPTY_STATE, parseState, type AppState } from "./profiles";

// One versioned key for everything. A future incompatible shape gets flags:v2 and a migration that
// reads this one, rather than a reader that has to guess which shape it is looking at.
export const STORAGE_KEY = "flags:v1";

/**
 * localStorage, or null when there is none. Merely touching window.localStorage throws in some
 * browsers when storage is disabled, so even the lookup is guarded.
 */
export function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Empty, corrupt and unavailable storage all come back as a usable state. */
export function loadState(storage: Storage | null = browserStorage()): AppState {
  if (!storage) return EMPTY_STATE;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw === null ? EMPTY_STATE : parseState(JSON.parse(raw));
  } catch {
    return EMPTY_STATE;
  }
}

/** Returns false when the write failed (quota, private mode, disabled storage). */
export function saveState(state: AppState, storage: Storage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
