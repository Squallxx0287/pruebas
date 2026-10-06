import test from "node:test";
import assert from "node:assert/strict";
import {
  TABLES,
  makeQuestion,
  LearningSession,
  emptyProgress,
  sanitizeProgress,
  addFact,
  tableProgress,
  badgesFor,
  validatePlayerName,
} from "../src/multiplica/model.js";
import { groupDrawing } from "../src/multiplica/art.js";
function seeded(seed = 29) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test("player names accept accents, compound names and nicknames while normalizing whitespace", () => {
  for (const name of [
    "Sofía",
    "Ana María",
    "María-José",
    "O’Connor",
    "PequeLeo7",
  ])
    assert.deepEqual(validatePlayerName(`  ${name}  `), { name, error: "" });
  assert.equal(validatePlayerName("Ana   María").name, "Ana María");
  assert.equal(validatePlayerName("Jose\u0301").name, "José");
});
test("a player name is required and rejects markup, control characters and overly long values", () => {
  for (const value of [
    null,
    "",
    "   ",
    "123",
    "<img src=x onerror=alert(1)>",
    "Ana\u202e",
    "S".repeat(25),
  ]) {
    const result = validatePlayerName(value);
    assert.equal(result.name, "");
    assert.ok(result.error);
  }
  assert.equal(validatePlayerName("A".repeat(24)).error, "");
});
test("every one of the 144 facts has the correct product and four different, positive choices", () => {
  assert.deepEqual(
    TABLES.map((t) => t.number),
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  const random = seeded();
  for (let a = 1; a <= 12; a++)
    for (let b = 1; b <= 12; b++)
      for (let n = 0; n < 6; n++) {
        const q = makeQuestion(a, b, random);
        assert.equal(q.answer, a * b);
        assert.equal(q.options.length, 4);
        assert.equal(new Set(q.options).size, 4);
        assert.ok(q.options.includes(a * b));
        assert.ok(
          q.options.every((n) => Number.isInteger(n) && n >= 1 && n <= 144),
        );
      }
  assert.throws(() => makeQuestion(0, 2), RangeError);
  assert.throws(() => makeQuestion(13, 2), RangeError);
  assert.throws(() => makeQuestion(2, 1.5), RangeError);
});
test("correct answers are shuffled among all four positions", () => {
  const seen = new Set(),
    random = seeded(52);
  for (let n = 0; n < 60; n++) {
    const q = makeQuestion(7, 8, random);
    seen.add(q.options.indexOf(q.answer));
  }
  assert.equal(seen.size, 4);
});
test("practice covers every multiplier from 1 through 12 for each selected table", () => {
  for (let table = 1; table <= 12; table++) {
    const s = new LearningSession({
      table,
      mode: "practice",
      random: seeded(table),
    });
    assert.equal(s.total, 12);
    assert.deepEqual(
      s.questions.map((q) => q.b),
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
    assert.ok(s.questions.every((q) => q.a === table));
  }
});
test("adventures have ten unique facts, can mix all tables, and prefer facts not yet learned", () => {
  const s = new LearningSession({
    table: "mixed",
    learned: ["1x1"],
    random: seeded(2),
  });
  assert.equal(s.total, 10);
  assert.equal(new Set(s.questions.map((q) => q.key)).size, 10);
  assert.ok(s.questions.every((q) => q.key !== "1x1"));
  assert.ok(new Set(s.questions.map((q) => q.a)).size > 1);
  const learned = Array.from({ length: 11 }, (_, i) => `12x${i + 1}`),
    a = new LearningSession({ table: 12, learned, random: seeded(6) });
  assert.equal(a.current.key, "12x12");
  assert.equal(a.total, 10);
  assert.throws(() => new LearningSession({ table: 13 }), RangeError);
  assert.throws(() => new LearningSession({ mode: "timed" }), RangeError);
});
test("wrong or invalid answers cannot advance or award progress, while retries remain available", () => {
  const s = new LearningSession({
    table: 1,
    mode: "practice",
    random: seeded(),
  });
  assert.equal(s.next(), false);
  assert.deepEqual(s.answer(NaN), { accepted: false, correct: false });
  assert.equal(s.attempts, 0);
  const wrong = s.current.options.find((n) => n !== s.current.answer);
  assert.equal(s.answer(wrong).correct, false);
  assert.equal(s.solved, 0);
  assert.equal(s.index, 0);
  assert.equal(s.state, "question");
  assert.equal(s.next(), false);
  assert.equal(s.hint(), true);
  assert.equal(s.hint(), false);
  assert.equal(s.hints, 1);
  assert.equal(s.answer(s.current.answer).correct, true);
  assert.equal(s.solved, 1);
  assert.equal(s.answer(s.current.answer).accepted, false);
  assert.equal(s.solved, 1);
  assert.equal(s.next(), true);
  assert.equal(s.index, 1);
  assert.equal(s.hintUsed, false);
});
test("a complete twelve-fact session finishes only after the last correct answer", () => {
  const s = new LearningSession({
    table: 12,
    mode: "practice",
    random: seeded(),
  });
  for (let i = 0; i < 12; i++) {
    assert.equal(s.index, i);
    assert.equal(s.state, "question");
    s.answer(s.current.answer);
    assert.equal(s.state, "answered");
    s.next();
  }
  assert.equal(s.state, "complete");
  assert.equal(s.solved, 12);
  assert.equal(s.current, null);
  assert.equal(s.next(), false);
  assert.equal(s.answer(144).accepted, false);
});
test("drawings show equal groups and the repeated addition; hints conceal the final answer", () => {
  for (const [a, b] of [
    [1, 1],
    [2, 3],
    [12, 12],
  ]) {
    const svg = groupDrawing(a, b, true);
    assert.equal((svg.match(/class="star-group"/g) || []).length, a);
    assert.equal((svg.match(/class="icon count-star"/g) || []).length, a * b);
    assert.ok(svg.includes(`= ${a * b}</b>`));
    assert.ok(groupDrawing(a, b, false).includes("= ?</b>"));
  }
});
test("progress rejects damaged storage, deduplicates facts, and awards a table star every four new facts", () => {
  assert.deepEqual(sanitizeProgress(null), emptyProgress());
  assert.deepEqual(
    sanitizeProgress({ version: 9, learned: ["2x3"] }),
    emptyProgress(),
  );
  const damaged = sanitizeProgress({
    version: 1,
    learned: ["2x3", "2x3", "0x1", "13x1", "2x99", "bad", null, {}, "01x02"],
    sessions: -3,
  });
  assert.deepEqual(damaged.learned, ["2x3", "1x2"]);
  assert.equal(damaged.sessions, 0);
  let p = emptyProgress();
  for (let b = 1; b <= 12; b++) {
    p = addFact(p, 4, b);
    p = addFact(p, 4, b);
    assert.equal(p.learned.length, b);
    assert.equal(tableProgress(p, 4).stars, Math.floor(b / 4));
  }
  assert.equal(tableProgress(p, 4).complete, true);
  assert.equal(tableProgress(p, 3).count, 0);
  assert.throws(() => addFact(p, 20, 1), RangeError);
});
test("badges unlock from real learning and all 144 facts unlock the final medal", () => {
  let p = emptyProgress();
  assert.ok(badgesFor(p).every((b) => !b.earned));
  p = addFact(p, 1, 1);
  assert.equal(badgesFor(p).find((b) => b.id === "first").earned, true);
  assert.equal(badgesFor(p).find((b) => b.id === "champion").earned, false);
  for (let a = 1; a <= 12; a++)
    for (let b = 1; b <= 12; b++) p = addFact(p, a, b);
  p.sessions = 1;
  assert.equal(p.learned.length, 144);
  assert.ok(badgesFor(p).every((b) => b.earned));
  assert.equal(
    sanitizeProgress(JSON.parse(JSON.stringify(p))).learned.length,
    144,
  );
});
