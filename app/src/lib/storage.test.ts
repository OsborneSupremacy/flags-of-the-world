import { describe, expect, it } from "vitest";
import {
  EMPTY_STATE,
  addProfile,
  dayKey,
  parseState,
  recordFlagAnswer,
  removeProfile,
  type AppState,
} from "./profiles";
import { STORAGE_KEY, loadState, saveState } from "./storage";
import { DEFAULT_OPTIONS } from "./session";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

class BrokenStorage extends MemoryStorage {
  override getItem(): string | null {
    throw new Error("SecurityError");
  }
  override setItem(): void {
    throw new Error("QuotaExceededError");
  }
}

const NOW = new Date(2026, 9, 14, 9, 30);

function sampleState(): AppState {
  let state = addProfile(EMPTY_STATE, "  Ada  ", "🦊", "p1", NOW.getTime());
  state = recordFlagAnswer(state, "p1", "fr", true, NOW);
  state = recordFlagAnswer(state, "p1", "de", false, NOW);
  return state;
}

describe("loadState / saveState", () => {
  it("starts empty when nothing is stored", () => {
    expect(loadState(new MemoryStorage())).toEqual(EMPTY_STATE);
  });

  it("starts empty when storage is unavailable", () => {
    expect(loadState(null)).toEqual(EMPTY_STATE);
    expect(saveState(sampleState(), null)).toBe(false);
  });

  it("starts empty when storage throws, and reports a failed save", () => {
    const broken = new BrokenStorage();
    expect(loadState(broken)).toEqual(EMPTY_STATE);
    expect(saveState(sampleState(), broken)).toBe(false);
  });

  it.each(["", "not json", "{", "null", "42", "[]", '"flags"', '{"version":2}'])(
    "starts empty when the stored value is %j",
    (raw) => {
      const storage = new MemoryStorage();
      storage.setItem(STORAGE_KEY, raw);
      expect(loadState(storage)).toEqual(EMPTY_STATE);
    },
  );

  it("round-trips a state under the versioned key", () => {
    const storage = new MemoryStorage();
    const state = sampleState();
    expect(saveState(state, storage)).toBe(true);
    expect(storage.getItem("flags:v1")).not.toBeNull();
    expect(loadState(storage)).toEqual(state);
  });
});

describe("parseState", () => {
  it("drops malformed profiles and cards but keeps the rest", () => {
    const parsed = parseState({
      version: 1,
      activeProfileId: "p1",
      profiles: [
        {
          id: "p1",
          name: "Ada",
          emoji: "🦊",
          createdAt: 1,
          decks: {
            flags: {
              fr: { box: 3, seen: 4, correct: 3, lastSeen: 5 },
              de: { box: 9, seen: 1, correct: 1, lastSeen: 5 },
              it: { box: 2, seen: 1, correct: 2, lastSeen: 5 },
              es: "nope",
              "../x": { box: 1, seen: 1, correct: 1, lastSeen: 5 },
            },
          },
          activeDays: ["2026-10-13", "garbage", 7, "2026-10-12", "2026-10-13"],
        },
        { id: "p2", name: "   " },
        { name: "No id" },
        { id: "p1", name: "Duplicate id" },
        "a string",
      ],
    });
    expect(parsed.profiles).toHaveLength(1);
    expect(parsed.profiles[0]?.decks.flags).toEqual({
      fr: { box: 3, seen: 4, correct: 3, lastSeen: 5 },
    });
    expect(parsed.profiles[0]?.activeDays).toEqual(["2026-10-12", "2026-10-13"]);
    expect(parsed.activeProfileId).toBe("p1");
  });

  it("clears an active profile id that names no profile", () => {
    expect(parseState({ version: 1, profiles: [], activeProfileId: "ghost" }).activeProfileId).toBe(
      null,
    );
  });

  it("falls back to default options field by field", () => {
    const parsed = parseState({
      version: 1,
      profiles: [],
      options: { mode: "type", region: "Narnia", length: 7, includeTerritories: "yes" },
    });
    expect(parsed.options).toEqual({ ...DEFAULT_OPTIONS, mode: "type" });
  });
});

describe("profile operations", () => {
  it("adds a profile, trims its name and makes it active", () => {
    const state = addProfile(EMPTY_STATE, "  Ada  ", "🦊", "p1", 1);
    expect(state.profiles[0]).toMatchObject({ id: "p1", name: "Ada", emoji: "🦊" });
    expect(state.activeProfileId).toBe("p1");
  });

  it("records answers against only the right profile", () => {
    let state = addProfile(EMPTY_STATE, "Ada", "🦊", "p1", 1);
    state = addProfile(state, "Ben", "🐢", "p2", 1);
    state = recordFlagAnswer(state, "p2", "fr", true, NOW);
    expect(state.profiles[0]?.decks.flags).toEqual({});
    expect(state.profiles[1]?.decks.flags.fr?.box).toBe(2);
  });

  it("records each active day once", () => {
    let state = sampleState();
    expect(state.profiles[0]?.activeDays).toEqual([dayKey(NOW)]);
    const tomorrow = new Date(2026, 9, 15, 8);
    state = recordFlagAnswer(state, "p1", "fr", true, tomorrow);
    state = recordFlagAnswer(state, "p1", "fr", true, tomorrow);
    expect(state.profiles[0]?.activeDays).toEqual(["2026-10-14", "2026-10-15"]);
  });

  it("removes a profile and clears it as active", () => {
    const state = removeProfile(sampleState(), "p1");
    expect(state.profiles).toEqual([]);
    expect(state.activeProfileId).toBeNull();
  });
});
