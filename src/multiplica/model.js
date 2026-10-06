export const TABLES = Array.from({ length: 12 }, (_, i) => ({
  number: i + 1,
  name: [
    "El inicio",
    "El jardín",
    "Las mariposas",
    "El bosque",
    "Las estrellas",
    "El arcoíris",
    "El espacio",
    "El océano",
    "Las flores",
    "La fiesta",
    "Las nubes",
    "La gran aventura",
  ][i],
  icon: [
    "sprout",
    "flower",
    "butterfly",
    "tree",
    "star",
    "rainbow",
    "planet",
    "fish",
    "flower",
    "balloon",
    "cloud",
    "rocket",
  ][i],
  color: [
    "green",
    "pink",
    "purple",
    "mint",
    "yellow",
    "peach",
    "purple",
    "blue",
    "pink",
    "yellow",
    "blue",
    "mint",
  ][i],
}));

const validFactor = (n) => Number.isInteger(n) && n >= 1 && n <= 12;
export const factKey = (a, b) => `${a}x${b}`;
export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function makeQuestion(a, b, random = Math.random) {
  if (!validFactor(a) || !validFactor(b))
    throw new RangeError("Las tablas van del 1 al 12.");
  const answer = a * b;
  const candidates = shuffle(
    [
      a * (b + 1),
      a * (b - 1),
      (a + 1) * b,
      (a - 1) * b,
      a + b,
      answer + 1,
      answer - 1,
    ],
    random,
  );
  const options = new Set([answer]);
  for (const n of candidates) {
    if (n > 0 && n <= 144) options.add(n);
    if (options.size === 4) break;
  }
  for (let delta = 1; options.size < 4; delta++) {
    for (const n of [answer + delta, answer - delta]) {
      if (n >= 1 && n <= 144) options.add(n);
      if (options.size === 4) break;
    }
  }
  return {
    a,
    b,
    answer,
    options: shuffle([...options], random),
    key: factKey(a, b),
  };
}
export function emptyProgress() {
  return { version: 1, learned: [], sessions: 0 };
}
export function sanitizeProgress(value) {
  if (!value || value.version !== 1) return emptyProgress();
  const learned = new Set();
  for (const key of Array.isArray(value.learned)
    ? value.learned.slice(0, 1000)
    : []) {
    if (typeof key !== "string") continue;
    const match = /^(\d{1,2})x(\d{1,2})$/.exec(key);
    if (match && validFactor(Number(match[1])) && validFactor(Number(match[2])))
      learned.add(factKey(Number(match[1]), Number(match[2])));
  }
  return {
    version: 1,
    learned: [...learned],
    sessions:
      Number.isSafeInteger(value.sessions) && value.sessions >= 0
        ? Math.min(value.sessions, 1_000_000)
        : 0,
  };
}
export function addFact(progress, a, b) {
  if (!validFactor(a) || !validFactor(b))
    throw new RangeError("Multiplicación fuera de las tablas.");
  const safe = sanitizeProgress(progress);
  return { ...safe, learned: [...new Set([...safe.learned, factKey(a, b)])] };
}
export function tableProgress(progress, table) {
  const learned = sanitizeProgress(progress).learned;
  const count = learned.filter((key) => key.startsWith(`${table}x`)).length;
  return { count, stars: Math.floor(count / 4), complete: count === 12 };
}
export function badgesFor(progress) {
  const p = sanitizeProgress(progress);
  const visited = new Set(p.learned.map((key) => key.split("x")[0])).size;
  return [
    {
      id: "first",
      title: "Primer pasito",
      description: "Resuelve tu primera multiplicación.",
      icon: "sprout",
      color: "green",
      earned: p.learned.length >= 1,
    },
    {
      id: "adventure",
      title: "¡Misión cumplida!",
      description: "Termina una práctica o una aventura.",
      icon: "flag",
      color: "purple",
      earned: p.sessions >= 1,
    },
    {
      id: "explorer",
      title: "Pequeño explorador",
      description: "Prueba multiplicaciones de 3 tablas.",
      icon: "compass",
      color: "blue",
      earned: visited >= 3,
    },
    {
      id: "table",
      title: "Jardín de números",
      description: "Completa las 12 cuentas de una tabla.",
      icon: "flower",
      color: "pink",
      earned: TABLES.some((t) => tableProgress(p, t.number).complete),
    },
    {
      id: "collector",
      title: "Cazador de estrellas",
      description: "Aprende 36 multiplicaciones distintas.",
      icon: "star",
      color: "yellow",
      earned: p.learned.length >= 36,
    },
    {
      id: "champion",
      title: "¡Supermultiplicador!",
      description: "Aprende las 144 cuentas del 1 al 12.",
      icon: "crown",
      color: "peach",
      earned: p.learned.length === 144,
    },
  ];
}
export class LearningSession {
  constructor({
    table = "mixed",
    mode = "adventure",
    learned = [],
    random = Math.random,
  } = {}) {
    if (table !== "mixed" && !validFactor(table))
      throw new RangeError("Tabla no válida.");
    if (!["practice", "adventure"].includes(mode))
      throw new RangeError("Modo no válido.");
    this.table = table;
    this.mode = mode;
    let facts =
      table === "mixed"
        ? TABLES.flatMap((t) =>
            Array.from({ length: 12 }, (_, i) => [t.number, i + 1]),
          )
        : Array.from({ length: 12 }, (_, i) => [table, i + 1]);
    if (mode === "adventure" || table === "mixed") {
      const unseen = facts.filter(([a, b]) => !learned.includes(factKey(a, b)));
      const seen = facts.filter(([a, b]) => learned.includes(factKey(a, b)));
      facts = [...shuffle(unseen, random), ...shuffle(seen, random)];
    }
    this.questions = (
      mode === "adventure" ? facts.slice(0, 10) : facts.slice(0, 12)
    ).map(([a, b]) => makeQuestion(a, b, random));
    this.index = 0;
    this.solved = 0;
    this.attempts = 0;
    this.hints = 0;
    this.hintUsed = false;
    this.state = "question";
  }
  get current() {
    return this.questions[this.index] ?? null;
  }
  get total() {
    return this.questions.length;
  }
  answer(value) {
    if (this.state !== "question" || !this.current.options.includes(value))
      return { accepted: false, correct: false };
    this.attempts++;
    if (value !== this.current.answer)
      return { accepted: true, correct: false };
    this.solved++;
    this.state = "answered";
    return { accepted: true, correct: true, question: this.current };
  }
  hint() {
    if (this.state !== "question" || this.hintUsed) return false;
    this.hintUsed = true;
    this.hints++;
    return true;
  }
  next() {
    if (this.state !== "answered") return false;
    this.index++;
    this.hintUsed = false;
    this.state = this.index === this.total ? "complete" : "question";
    return true;
  }
}
