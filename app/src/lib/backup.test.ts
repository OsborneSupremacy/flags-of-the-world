import { describe, expect, it } from "vitest";
import { backupFileName, importBackup, serializeBackup } from "./backup";
import { EMPTY_STATE, addProfile, recordFlagAnswer, type AppState } from "./profiles";

const NOW = new Date(2026, 9, 14, 12);

function stateWith(...players: [id: string, name: string][]): AppState {
  return players.reduce((s, [id, name]) => addProfile(s, name, "🦊", id, 0), EMPTY_STATE);
}

describe("serializeBackup / importBackup", () => {
  it("round-trips into an empty browser", () => {
    let source = stateWith(["p1", "Ada"], ["p2", "Ben"]);
    source = recordFlagAnswer(source, "p1", "fr", true, NOW);
    const result = importBackup(EMPTY_STATE, serializeBackup(source, NOW));
    expect(result.ok && result.state.profiles).toEqual(source.profiles);
    expect(result.ok && result.added).toEqual(["Ada", "Ben"]);
  });

  it("replaces players with the same id and keeps the others", () => {
    const here = stateWith(["p1", "Ada"], ["p3", "Cy"]);
    let there = stateWith(["p1", "Ada"], ["p2", "Ben"]);
    there = recordFlagAnswer(there, "p1", "jp", true, NOW);

    const result = importBackup(here, serializeBackup(there, NOW));
    if (!result.ok) throw new Error(result.error);
    expect(result.state.profiles.map((p) => p.id)).toEqual(["p1", "p3", "p2"]);
    expect(result.state.profiles[0]?.decks.flags.jp?.box).toBe(2);
    expect(result.replaced).toEqual(["Ada"]);
    expect(result.added).toEqual(["Ben"]);
  });

  it("keeps this device's active player and options", () => {
    const here = {
      ...stateWith(["p1", "Ada"]),
      options: { ...EMPTY_STATE.options, mode: "type" as const },
    };
    const there = {
      ...stateWith(["p2", "Ben"]),
      options: { ...EMPTY_STATE.options, mode: "flip" as const },
    };
    const result = importBackup(here, serializeBackup(there, NOW));
    expect(result.ok && result.state.activeProfileId).toBe("p1");
    expect(result.ok && result.state.options.mode).toBe("type");
  });

  it.each([
    ["not json", "{"],
    ["some other JSON", '{"version":1,"profiles":[]}'],
    ["an array", "[]"],
  ])("rejects %s", (_label, text) => {
    expect(importBackup(EMPTY_STATE, text)).toEqual({
      ok: false,
      error: "That file isn't a Flags of the World backup.",
    });
  });

  it("rejects a backup with no usable players", () => {
    const text = JSON.stringify({ kind: "flags-of-the-world-backup", version: 1, profiles: [{}] });
    expect(importBackup(EMPTY_STATE, text).ok).toBe(false);
  });
});

describe("backupFileName", () => {
  it("is dated", () => {
    expect(backupFileName(new Date(Date.UTC(2026, 9, 14)))).toBe("flags-progress-2026-10-14.json");
  });
});
