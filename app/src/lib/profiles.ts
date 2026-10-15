// The whole persisted state and the pure operations on it. storage.ts reads and writes it; nothing
// here touches localStorage, so all of it is testable without a browser.

import { REGIONS } from "../data/countries";
import { MAX_BOX, recordAnswer, type Box, type CardState, type Deck } from "./leitner";
import {
  DEFAULT_OPTIONS,
  MODES,
  SESSION_LENGTHS,
  type RegionFilter,
  type SessionOptions,
} from "./session";

export interface Profile {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
  /**
   * One Leitner deck per kind of question. Only flags exist today; capitals or maps would be new
   * keys here, each with its own boxes, without touching the flags progress.
   */
  decks: { flags: Deck };
  /** Local calendar days (YYYY-MM-DD) with at least one answer, oldest first. For the streak. */
  activeDays: string[];
}

export interface AppState {
  version: 1;
  profiles: Profile[];
  activeProfileId: string | null;
  options: SessionOptions;
}

export const EMPTY_STATE: AppState = {
  version: 1,
  profiles: [],
  activeProfileId: null,
  options: DEFAULT_OPTIONS,
};

export const MAX_NAME_LENGTH = 24;

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function activeProfile(state: AppState): Profile | undefined {
  return state.profiles.find((p) => p.id === state.activeProfileId);
}

export function addProfile(
  state: AppState,
  name: string,
  emoji: string,
  id: string,
  now: number,
): AppState {
  const profile: Profile = {
    id,
    name: name.trim().slice(0, MAX_NAME_LENGTH),
    emoji,
    createdAt: now,
    decks: { flags: {} },
    activeDays: [],
  };
  return { ...state, profiles: [...state.profiles, profile], activeProfileId: id };
}

export function removeProfile(state: AppState, id: string): AppState {
  return {
    ...state,
    profiles: state.profiles.filter((p) => p.id !== id),
    activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
  };
}

export function recordFlagAnswer(
  state: AppState,
  profileId: string,
  code: string,
  correct: boolean,
  now: Date,
): AppState {
  const today = dayKey(now);
  return {
    ...state,
    profiles: state.profiles.map((p) =>
      p.id !== profileId
        ? p
        : {
            ...p,
            decks: { ...p.decks, flags: recordAnswer(p.decks.flags, code, correct, now.getTime()) },
            activeDays: p.activeDays.at(-1) === today ? p.activeDays : [...p.activeDays, today],
          },
    ),
  };
}

// Parsing. Everything read back -- from localStorage or from an imported file -- goes through here,
// and anything malformed is dropped piece by piece rather than throwing the whole state away: one
// bad card should not cost a child their progress on the other two hundred.

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

function parseCard(value: unknown): CardState | null {
  if (!isObject(value)) return null;
  const { box, seen, correct, lastSeen } = value;
  if (!isCount(box) || box < 1 || box > MAX_BOX) return null;
  if (!isCount(seen) || !isCount(correct) || correct > seen) return null;
  if (typeof lastSeen !== "number" || !Number.isFinite(lastSeen)) return null;
  return { box: box as Box, seen, correct, lastSeen };
}

function parseDeck(value: unknown): Deck {
  if (!isObject(value)) return {};
  const deck: Deck = {};
  for (const [id, raw] of Object.entries(value)) {
    const card = parseCard(raw);
    if (card && /^[a-z]{2}$/.test(id)) deck[id] = card;
  }
  return deck;
}

function parseProfile(value: unknown): Profile | null {
  if (!isObject(value)) return null;
  const { id, name, emoji, createdAt, decks, activeDays } = value;
  if (typeof id !== "string" || !id) return null;
  if (typeof name !== "string" || !name.trim()) return null;
  return {
    id,
    name: name.trim().slice(0, MAX_NAME_LENGTH),
    emoji: typeof emoji === "string" && emoji ? emoji : "🙂",
    createdAt: typeof createdAt === "number" ? createdAt : 0,
    decks: { flags: parseDeck(isObject(decks) ? decks.flags : undefined) },
    activeDays: Array.isArray(activeDays)
      ? [
          ...new Set(
            activeDays.filter(
              (d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d),
            ),
          ),
        ].sort()
      : [],
  };
}

function parseOptions(value: unknown): SessionOptions {
  if (!isObject(value)) return DEFAULT_OPTIONS;
  const regions: readonly unknown[] = ["all", ...REGIONS];
  const pick = <T>(candidate: unknown, allowed: readonly unknown[], fallback: T): T =>
    allowed.includes(candidate) ? (candidate as T) : fallback;
  return {
    mode: pick(value.mode, MODES, DEFAULT_OPTIONS.mode),
    region: pick<RegionFilter>(value.region, regions, DEFAULT_OPTIONS.region),
    length: pick(value.length, SESSION_LENGTHS, DEFAULT_OPTIONS.length),
    includeTerritories: value.includeTerritories === true,
    reverse: value.reverse === true,
  };
}

/** Never throws. Returns the empty state for anything that is not recognisably ours. */
export function parseState(value: unknown): AppState {
  if (!isObject(value) || value.version !== 1) return EMPTY_STATE;
  const seen = new Set<string>();
  const profiles = (Array.isArray(value.profiles) ? value.profiles : [])
    .map(parseProfile)
    .filter((p): p is Profile => p !== null && !seen.has(p.id) && Boolean(seen.add(p.id)));
  const activeProfileId =
    typeof value.activeProfileId === "string" &&
    profiles.some((p) => p.id === value.activeProfileId)
      ? value.activeProfileId
      : null;
  return { version: 1, profiles, activeProfileId, options: parseOptions(value.options) };
}
