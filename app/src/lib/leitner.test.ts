import { describe, expect, it } from "vitest";
import { boxWeight, recordAnswer, selectSession, type Box, type Deck } from "./leitner";
import { seededRng } from "./random";

const NOW = 1_700_000_000_000;

function deckWith(boxes: Record<string, Box>): Deck {
  return Object.fromEntries(
    Object.entries(boxes).map(([id, box]) => [id, { box, seen: 1, correct: 0, lastSeen: NOW }]),
  );
}

describe("recordAnswer", () => {
  it("treats a new card as box 1, so a first correct answer moves it to box 2", () => {
    const deck = recordAnswer({}, "fr", true, NOW);
    expect(deck.fr).toEqual({ box: 2, seen: 1, correct: 1, lastSeen: NOW });
  });

  it("puts a new card in box 1 when it is missed", () => {
    expect(recordAnswer({}, "fr", false, NOW).fr?.box).toBe(1);
  });

  it("promotes a correct card one box at a time", () => {
    let deck: Deck = {};
    const boxes: number[] = [];
    for (let i = 0; i < 4; i++) {
      deck = recordAnswer(deck, "fr", true, NOW + i);
      boxes.push(deck.fr?.box ?? 0);
    }
    expect(boxes).toEqual([2, 3, 4, 5]);
  });

  it("stops at box 5", () => {
    let deck = deckWith({ fr: 4 });
    deck = recordAnswer(deck, "fr", true, NOW);
    deck = recordAnswer(deck, "fr", true, NOW);
    expect(deck.fr?.box).toBe(5);
  });

  it("sends a missed card back to box 1 from anywhere", () => {
    for (const box of [1, 2, 3, 4, 5] as Box[]) {
      expect(recordAnswer(deckWith({ fr: box }), "fr", false, NOW).fr?.box).toBe(1);
    }
  });

  it("counts answers and updates lastSeen", () => {
    let deck: Deck = {};
    deck = recordAnswer(deck, "fr", true, NOW);
    deck = recordAnswer(deck, "fr", false, NOW + 10);
    deck = recordAnswer(deck, "fr", true, NOW + 20);
    expect(deck.fr).toMatchObject({ seen: 3, correct: 2, lastSeen: NOW + 20 });
  });

  it("does not mutate the deck it is given", () => {
    const deck = deckWith({ fr: 2 });
    const copy = structuredClone(deck);
    recordAnswer(deck, "fr", true, NOW);
    recordAnswer(deck, "de", true, NOW);
    expect(deck).toEqual(copy);
  });
});

describe("boxWeight", () => {
  it("halves with every box", () => {
    expect([1, 2, 3, 4, 5].map((b) => boxWeight(b as Box))).toEqual([16, 8, 4, 2, 1]);
  });
});

describe("selectSession", () => {
  const pool = Array.from({ length: 40 }, (_, i) => `c${i}`);

  it("returns the requested number of distinct cards from the pool", () => {
    const picked = selectSession(pool, {}, 10, seededRng(1));
    expect(picked).toHaveLength(10);
    expect(new Set(picked).size).toBe(10);
    expect(picked.every((id) => pool.includes(id))).toBe(true);
  });

  it("returns the whole pool when length is null", () => {
    const picked = selectSession(pool, deckWith({ c0: 5, c1: 1 }), null, seededRng(1));
    expect([...picked].sort()).toEqual([...pool].sort());
  });

  it("never returns more than the pool holds", () => {
    expect(selectSession(["a", "b"], {}, 10)).toHaveLength(2);
    expect(selectSession([], {}, 10)).toEqual([]);
  });

  it("keeps about 30% of a session for new cards", () => {
    const deck = deckWith(Object.fromEntries(pool.slice(0, 30).map((id) => [id, 3 as Box])));
    const picked = selectSession(pool, deck, 10, seededRng(4));
    expect(picked.filter((id) => !deck[id])).toHaveLength(3);
  });

  it("fills with new cards when too few have been seen", () => {
    const deck = deckWith({ c0: 1, c1: 1 });
    const picked = selectSession(pool, deck, 10, seededRng(5));
    expect(picked).toEqual(expect.arrayContaining(["c0", "c1"]));
    expect(picked.filter((id) => !deck[id])).toHaveLength(8);
  });

  it("fills with seen cards when nothing new is left", () => {
    const deck = deckWith(Object.fromEntries(pool.map((id) => [id, 5 as Box])));
    expect(selectSession(pool, deck, 10, seededRng(6))).toHaveLength(10);
  });

  it("draws mostly from the low boxes", () => {
    // Half the deck in box 1, half in box 5, nothing new.
    const deck = deckWith(Object.fromEntries(pool.map((id, i) => [id, (i < 20 ? 1 : 5) as Box])));
    let low = 0;
    let total = 0;
    for (let seed = 0; seed < 200; seed++) {
      const picked = selectSession(pool, deck, 10, seededRng(seed));
      low += picked.filter((id) => deck[id]?.box === 1).length;
      total += picked.length;
    }
    expect(low / total).toBeGreaterThan(0.85);
  });

  it("still shows mastered cards now and then", () => {
    const deck = deckWith(Object.fromEntries(pool.map((id, i) => [id, (i < 20 ? 1 : 5) as Box])));
    const sawMastered = Array.from({ length: 200 }, (_, seed) =>
      selectSession(pool, deck, 10, seededRng(seed)),
    ).some((picked) => picked.some((id) => deck[id]?.box === 5));
    expect(sawMastered).toBe(true);
  });

  it("mixes new cards in rather than bunching them at the end", () => {
    const deck = deckWith(Object.fromEntries(pool.slice(0, 30).map((id) => [id, 2 as Box])));
    const firstPositions = new Set(
      Array.from({ length: 30 }, (_, seed) =>
        selectSession(pool, deck, 10, seededRng(seed)).findIndex((id) => !deck[id]),
      ),
    );
    expect(firstPositions.size).toBeGreaterThan(3);
  });
});
