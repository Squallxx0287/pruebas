import {
  TABLES,
  LearningSession,
  emptyProgress,
  sanitizeProgress,
  addFact,
  tableProgress,
  badgesFor,
  validatePlayerName,
} from "./model.js";
import { icon, fox, groupDrawing } from "./art.js";
import {
  VoiceGuide,
  spanishVoices,
  voiceKey,
  voiceScore,
  questionSpeech,
  hintSpeech,
} from "./voice.js";
const $ = (id) => document.getElementById(id);
const STORAGE = "multiplicaclub-progress-v1";
let progress = emptyProgress(),
  sound = true,
  selectedTable = 2,
  multiplier = 3;
let session = null,
  route = "home",
  sessionNew = 0,
  badgesBefore = [],
  toastTimer,
  confettiTimer,
  warnedStorage = false,
  audioContext = null;
let guide = null,
  voiceOptionsSignature = null,
  introduced = false;
let playerName = "",
  pendingGame = null;
try {
  progress = sanitizeProgress(JSON.parse(localStorage.getItem(STORAGE)));
  sound = localStorage.getItem("multiplicaclub-sound") !== "off";
} catch {}
export const state = {
  get progress() {
    return progress;
  },
  get session() {
    return session;
  },
  get route() {
    return route;
  },
  get playerName() {
    return playerName;
  },
};
for (const el of document.querySelectorAll("[data-icon]"))
  el.innerHTML = icon(el.dataset.icon);
for (const id of ["sidebar-fox", "profile-fox", "setup-fox", "quiz-fox"])
  $(id).innerHTML = fox();
$("voice-avatar").innerHTML = fox();
$("luna-portrait").innerHTML = fox("", true);
$("player-portrait").innerHTML = fox("", true);
let voicePreferences;
try {
  voicePreferences = JSON.parse(
    localStorage.getItem("multiplicaclub-voice-v1"),
  );
} catch {}
guide = new VoiceGuide({
  synth: window.speechSynthesis,
  Utterance: window.SpeechSynthesisUtterance,
  preferences: voicePreferences,
  onChange: voiceUI,
  onError: (error) => {
    const message =
      error === "language-unavailable"
        ? "Este dispositivo no tiene una voz en español disponible. Puedes seguir jugando sin voz."
        : error === "not-allowed"
          ? "Toca Escuchar la cuenta para que pueda hablar contigo."
          : "Mi voz no pudo reproducirse. Prueba otra voz en los ajustes de Luna. Puedes seguir jugando.";
    $("voice-caption").textContent = message;
    toast(message);
  },
});
document.addEventListener("pointerdown", () => guide.activate(), true);
document.addEventListener("click", () => guide.activate(), true);
document.addEventListener("keydown", () => guide.activate(), true);
function withPlayer(text) {
  return playerName ? `${playerName}, ${text}` : text;
}
function welcomeSpeech() {
  return `¡Hola${playerName ? `, ${playerName}` : ""}! Soy Luna, tu amiga de los números. Estoy aquí para ayudarte. Vamos a aprender jugando, a tu ritmo. ¡Tú puedes!`;
}
function voiceUI() {
  if (!guide) return;
  const available = spanishVoices(guide.voices).sort(
    (a, b) => voiceScore(b) - voiceScore(a),
  );
  const signature = available.map(voiceKey).join("\n");
  if (signature !== voiceOptionsSignature) {
    voiceOptionsSignature = signature;
    $("voice-select").replaceChildren(new Option("Automática · español", ""));
    for (const voice of available)
      $("voice-select").append(
        new Option(`${voice.name} · ${voice.lang}`, voiceKey(voice)),
      );
  }
  $("voice-select").value = available.some(
    (v) => voiceKey(v) === guide.preferences.voiceURI,
  )
    ? guide.preferences.voiceURI
    : "";
  $("voice-enabled").checked = guide.preferences.enabled && guide.supported;
  $("voice-enabled").disabled = !guide.supported;
  $("voice-select").disabled = !guide.supported || !available.length;
  $("voice-rate").disabled = !guide.supported;
  $("voice-rate").value = guide.preferences.rate;
  $("voice-rate-label").textContent =
    guide.preferences.rate < 0.9
      ? "Tranquila"
      : guide.preferences.rate > 1
        ? "Ágil"
        : "Natural";
  $("voice-test").disabled =
    !guide.supported || (guide.voices.length > 0 && !guide.voice);
  $("voice-stop").disabled = !guide.current && !guide.pending;
  $("voice-status").textContent = !guide.supported
    ? "Voz no disponible"
    : guide.speaking
      ? "Hablando contigo"
      : guide.waiting
        ? "Preparando mi voz"
        : !guide.preferences.enabled
          ? "Voz desactivada"
          : guide.failed
            ? "Toca para probar"
            : "Tu guía de voz";
  $("voice-button").classList.toggle("speaking", guide.speaking);
  $("luna-portrait").classList.toggle("speaking", guide.speaking);
  $("voice-button").classList.toggle(
    "voice-off",
    !guide.preferences.enabled || !guide.supported || guide.failed,
  );
  $("voice-dialog").classList.toggle("voice-speaking", guide.speaking);
  $("voice-choice-note").textContent = !guide.supported
    ? "Luna no puede hablar en este navegador. El juego y los dibujos siguen disponibles."
    : guide.voices.length && !available.length
      ? "Este dispositivo no tiene una voz en español disponible. Puedes seguir jugando sin voz."
      : guide.voice
        ? `Voz elegida: ${guide.voice.name}. Puedes escuchar las voces y elegir tu favorita.`
        : "Busco una voz femenina y suave en español. Puedes probar las voces y elegir tu favorita.";
  if (guide.text && !guide.failed) $("voice-caption").textContent = guide.text;
}
function saveVoice() {
  try {
    localStorage.setItem(
      "multiplicaclub-voice-v1",
      JSON.stringify(guide.preferences),
    );
  } catch {}
}
function readQuestion(force = false) {
  if (!session?.current) return;
  const prompt = questionSpeech(
    session.current,
    introduced || force ? playerName : "",
  );
  const greeting =
    !introduced && !force
      ? `¡Hola, ${playerName}! Soy Luna, tu amiga de los números. ¡Aprendamos juntos! `
      : "";
  if (guide.speak(greeting + prompt, { force })) introduced = true;
}
$("page-title").tabIndex = -1;
const pageLabels = {
  home: [
    "UN MUNDO POR DESCUBRIR",
    '¡Hola, peque explorador! <span class="hello-star">✦</span>',
    "Hoy es un gran día para aprender algo nuevo.",
  ],
  study: [
    "DESCUBRIMOS CON DIBUJOS",
    "Los números tienen magia.",
    "Mira, cuenta y descubre cómo funciona multiplicar.",
  ],
  setup: [
    "¡MANOS A LA AVENTURA!",
    "Jugar también es aprender.",
    "Elige tu misión. Nuestro zorrito te acompaña.",
  ],
  play: [
    "UN RETO, UN DESCUBRIMIENTO",
    "¡Tú puedes, explorador!",
    "Cada intento es un pasito más. Estamos contigo.",
  ],
  results: [
    "CELEBRAMOS TUS PASITOS",
    "¡Una misión muy especial!",
    "Aprender algo nuevo es un motivo para sonreír.",
  ],
  rewards: [
    "TU JARDÍN DE APRENDIZAJE",
    "¡Mira cuánto has crecido!",
    "Tus descubrimientos se convierten en estrellas y medallas.",
  ],
};
function toast(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").classList.add("visible");
  toastTimer = setTimeout(() => $("toast").classList.remove("visible"), 3500);
}
function save() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(progress));
  } catch {
    if (!warnedStorage) {
      toast(
        "Puedes seguir jugando. Este navegador no pudo guardar tu progreso.",
      );
      warnedStorage = true;
    }
  }
}
function soundUI() {
  $("sound-button").innerHTML = icon(sound ? "sound" : "mute");
  $("sound-button").setAttribute("aria-pressed", String(sound));
  $("sound-button").setAttribute(
    "aria-label",
    sound ? "Desactivar efectos de sonido" : "Activar efectos de sonido",
  );
}
function chime(kind = "correct") {
  if (!sound) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audioContext ||= new Audio();
    audioContext.resume().catch(() => {});
    const notes =
      kind === "wrong"
        ? [440, 392]
        : kind === "finish"
          ? [523.25, 659.25, 783.99, 1046.5]
          : [659.25, 783.99];
    notes.forEach((frequency, i) => {
      const oscillator = audioContext.createOscillator(),
        gain = audioContext.createGain(),
        start = audioContext.currentTime + i * 0.12;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.045, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.3);
    });
  } catch {}
}
function confetti(big = false) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  clearTimeout(confettiTimer);
  $("confetti").innerHTML = Array.from(
    { length: big ? 50 : 20 },
    (_, i) =>
      `<i class="confetti-piece" style="--left:${Math.random() * 100}%;--delay:${Math.random() * 0.4}s;--piece-color:${["#c3a3e1", "#f6d380", "#f0b8c8", "#acd5b6", "#9fc9e2"][i % 5]}"></i>`,
  ).join("");
  confettiTimer = setTimeout(() => $("confetti").replaceChildren(), 2400);
}
function showPage(page, focus = true) {
  if (!pageLabels[page]) page = "home";
  guide.stop();
  route = page;
  document
    .querySelectorAll(".page")
    .forEach((el) => (el.hidden = el.id !== `${page}-page`));
  const [eyebrow, title, description] = pageLabels[page];
  $("page-eyebrow").textContent = eyebrow;
  $("page-title").innerHTML = title;
  if (playerName && ["play", "results"].includes(page))
    $("page-title").textContent =
      page === "play"
        ? `¡Tú puedes, ${playerName}!`
        : `¡Gran trabajo, ${playerName}!`;
  $("page-description").textContent = description;
  const navPage = ["play", "results"].includes(page) ? "setup" : page;
  for (const nav of document.querySelectorAll("[data-page]")) {
    const active = nav.dataset.page === navPage;
    nav.classList.toggle("active", active);
    if (active) nav.setAttribute("aria-current", "page");
    else nav.removeAttribute("aria-current");
  }
  if (page === "home") renderTables();
  if (page === "study") renderStudy();
  if (page === "setup") $("table-select").value = String(selectedTable);
  if (page === "rewards") renderRewards();
  history.replaceState(null, "", `#${page}`);
  window.scrollTo({ top: 0, behavior: "instant" });
  if (focus) $("page-title").focus({ preventScroll: true });
  if (focus && page === "home")
    guide.speak(
      withPlayer(
        "¡Seguimos explorando! Elige una tabla o empezamos una nueva aventura. Estoy aquí para ayudarte.",
      ),
    );
  if (focus && page === "setup")
    guide.speak(
      withPlayer(
        "Elige la tabla que quieras practicar. No hay prisa. Puedes usar todas las pistas que necesites.",
      ),
    );
}
function refreshProgress() {
  $("total-stars").textContent = progress.learned.length;
  $("badge-count").textContent = badgesFor(progress).filter(
    (b) => b.earned,
  ).length;
  if (route === "home") renderTables();
}
function renderTables() {
  $("table-grid").innerHTML = TABLES.map((t) => {
    const p = tableProgress(progress, t.number);
    return `<button class="table-card ${t.color} ${p.complete ? "completed" : ""}" data-table="${t.number}" aria-label="Practicar tabla del ${t.number}. ${p.count} de 12 multiplicaciones aprendidas"><span class="table-decoration">${icon(t.icon)}</span><span class="table-number">${t.number}</span><strong>Tabla del ${t.number}</strong><small>${t.name}</small><span class="table-stars" aria-hidden="true">${Array.from({ length: 3 }, (_, i) => icon("star", i < p.stars ? "earned" : "")).join("")}</span></button>`;
  }).join("");
}
function renderStudy() {
  $("study-tables").innerHTML = TABLES.map(
    (t) =>
      `<button class="table-pick" data-study-table="${t.number}" aria-pressed="${selectedTable === t.number}" aria-label="Aprender tabla del ${t.number}">${t.number}</button>`,
  ).join("");
  $("study-title").textContent = `La tabla del ${selectedTable}`;
  $("study-facts").innerHTML = Array.from(
    { length: 12 },
    (_, i) =>
      `<button class="study-fact" data-multiplier="${i + 1}" aria-pressed="${multiplier === i + 1}" aria-label="Ver ${selectedTable} por ${i + 1} con dibujos"><span>${selectedTable} × ${i + 1}</span><strong>${selectedTable * (i + 1)}</strong></button>`,
  ).join("");
  $("study-equation").textContent =
    `${selectedTable} × ${multiplier} = ${selectedTable * multiplier}`;
  $("study-explanation").textContent =
    `Imagina ${selectedTable} ${selectedTable === 1 ? "grupo" : "grupos"} con ${multiplier} ${multiplier === 1 ? "estrella" : "estrellas"} en cada uno.`;
  $("study-drawing").innerHTML = groupDrawing(selectedTable, multiplier, true);
  guide.speak(
    withPlayer(
      `${selectedTable} por ${multiplier} es ${selectedTable * multiplier}. ${hintSpeech({ a: selectedTable, b: multiplier })}`,
    ),
  );
}
function startSession(table, mode = "practice") {
  pendingGame = { table, mode };
  guide.stop();
  $("player-name").value = "";
  $("player-name").removeAttribute("aria-invalid");
  $("player-name-error").textContent = "";
  $("player-dialog").showModal();
  $("player-name").focus();
  guide.speak(
    "¡Hola! Soy Luna, tu amiga de los números. ¿Quién va a jugar? Escribe tu nombre o apodo para que pueda acompañarte en esta aventura.",
  );
}
function beginSession(table, mode) {
  selectedTable = table === "mixed" ? selectedTable : table;
  session = new LearningSession({ table, mode, learned: progress.learned });
  sessionNew = 0;
  badgesBefore = badgesFor(progress)
    .filter((b) => b.earned)
    .map((b) => b.id);
  showPage("play");
  renderQuestion();
}
function updateMission() {
  const total = session.total,
    solved = session.solved;
  $("round-label").textContent =
    `Reto ${Math.min(session.index + 1, total)} de ${total}`;
  $("session-stars").textContent = solved;
  $("mission-progress").setAttribute("aria-valuemax", total);
  $("mission-progress").setAttribute("aria-valuenow", solved);
  $("mission-progress").querySelector("i").style.width =
    `${(solved / total) * 100}%`;
}
function renderQuestion() {
  const q = session.current;
  updateMission();
  $("quiz-table-label").textContent = `EXPLORAMOS LA TABLA DEL ${q.a}`;
  $("quiz-equation").innerHTML =
    `<span>${q.a}</span><span class="multiply">×</span><span>${q.b}</span><span class="equals">=</span><span class="unknown">?</span>`;
  $("quiz-equation").setAttribute(
    "aria-label",
    `${q.a} por ${q.b}, ¿cuánto es?`,
  );
  $("answer-options").innerHTML = q.options
    .map(
      (n, i) =>
        `<button class="answer-option" data-answer="${n}" aria-label="Respuesta ${i + 1}: ${n}">${n}<small aria-hidden="true">${i + 1}</small></button>`,
    )
    .join("");
  $("friend-message").textContent = [
    "¡Vamos! Tú puedes con esta cuenta.",
    "Un pequeño reto. ¡Una gran idea!",
    "Puedes contar los dibujos si lo necesitas.",
    "¡Qué bien lo estás haciendo! Sigue explorando.",
  ][session.index % 4];
  $("friend-message").textContent = withPlayer($("friend-message").textContent);
  $("answer-feedback").replaceChildren();
  $("answer-feedback").className = "answer-feedback";
  $("hint-panel").hidden = true;
  $("hint-drawing").replaceChildren();
  $("hint-button").hidden = false;
  $("hint-button").disabled = false;
  $("hint-button").innerHTML = `${icon("bulb")}Ver con dibujos`;
  $("next-question").hidden = true;
  $("quiz-fox").innerHTML = fox();
  readQuestion();
}
function showHint(narrate = true) {
  if (!session || session.state === "complete") return;
  if (session.state === "question") session.hint();
  const { a, b } = session.current;
  $("hint-panel").hidden = false;
  $("hint-description").textContent =
    `${a} ${a === 1 ? "grupo" : "grupos"}, ${b} ${b === 1 ? "estrella" : "estrellas"} en cada grupo. Suma la misma cantidad ${a} ${a === 1 ? "vez" : "veces"}.`;
  $("hint-drawing").innerHTML = groupDrawing(
    a,
    b,
    session.state === "answered",
  );
  $("hint-button").disabled = true;
  $("hint-button").innerHTML = `${icon("check")}Aquí están tus dibujos`;
  if (narrate)
    guide.speak(
      withPlayer(`Vamos a descubrirlo juntos. ${hintSpeech(session.current)}`),
    );
}
function answer(value) {
  if (route !== "play" || !session) return;
  const result = session.answer(value);
  if (!result.accepted) return;
  const button = [...$("answer-options").children].find(
    (b) => Number(b.dataset.answer) === value,
  );
  if (!result.correct) {
    button.classList.add("wrong");
    button.disabled = true;
    $("answer-feedback").className = "answer-feedback try-again";
    $("answer-feedback").innerHTML =
      `${icon("bulb")}<span>¡Buen intento! Mira los dibujos y prueba otra respuesta.</span>`;
    $("friend-message").textContent = withPlayer(
      "Equivocarse también es aprender. ¡Vamos juntos!",
    );
    showHint(false);
    guide.speak(
      withPlayer(
        `¡Buen intento! Equivocarse también es aprender. Probemos otra vez. ${hintSpeech(session.current)}`,
      ),
    );
    chime("wrong");
    return;
  }
  const { a, b, key, answer: correct } = result.question;
  if (!progress.learned.includes(key)) sessionNew++;
  progress = addFact(progress, a, b);
  save();
  refreshProgress();
  updateMission();
  for (const option of $("answer-options").children) {
    option.disabled = true;
    option.classList.toggle(
      "correct",
      Number(option.dataset.answer) === correct,
    );
    option.classList.toggle("dim", Number(option.dataset.answer) !== correct);
  }
  const unknown = $("quiz-equation").querySelector(".unknown");
  unknown.textContent = correct;
  unknown.classList.add("solved");
  $("quiz-equation").setAttribute("aria-label", `${a} por ${b} es ${correct}`);
  $("answer-feedback").className = "answer-feedback correct";
  $("answer-feedback").innerHTML =
    `${icon("check")}<span>¡Lo descubriste! ${a} × ${b} = ${correct}. ¡Una estrella más!</span>`;
  $("friend-message").textContent =
    `¡Bravo, ${playerName}! Cada pasito te hace crecer.`;
  $("quiz-fox").innerHTML = fox("", true);
  if (!$("hint-panel").hidden) showHint(false);
  $("hint-button").hidden = true;
  $("next-question").hidden = false;
  $("next-question").innerHTML =
    `${session.index === session.total - 1 ? "¡Ver mis logros!" : "¡Siguiente reto!"} ${icon("arrow")}`;
  chime();
  confetti();
  $("next-question").focus({ preventScroll: true });
  guide.speak(
    `¡Muy bien, ${playerName}! ${a} por ${b} es ${correct}. Lo descubriste. ¡Una estrella para celebrar tu esfuerzo!`,
  );
}
function nextQuestion() {
  if (route !== "play" || !session?.next()) return;
  if (session.state === "complete") {
    progress = { ...progress, sessions: progress.sessions + 1 };
    save();
    refreshProgress();
    $("result-copy").textContent =
      `Has resuelto ${session.total} multiplicaciones ${session.table === "mixed" ? "de las tablas del 1 al 12" : `de la tabla del ${session.table}`}. ¡Qué gran trabajo, ${playerName}!`;
    $("result-solved").textContent = session.solved;
    $("result-new").textContent = sessionNew;
    $("new-badges").innerHTML = badgesFor(progress)
      .filter((b) => b.earned && !badgesBefore.includes(b.id))
      .map(
        (b) =>
          `<span class="new-badge">${icon(b.icon)} Nueva medalla: ${b.title}</span>`,
      )
      .join("");
    showPage("results");
    chime("finish");
    confetti(true);
    guide.speak(
      `¡Lo hiciste, ${playerName}! Has resuelto ${session.total} multiplicaciones. Cada intento te ayuda a crecer. ¡Estoy muy contenta por ti! ¿Exploramos otra tabla?`,
    );
  } else {
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "instant" });
    $("answer-options").querySelector("button").focus({ preventScroll: true });
  }
}
function renderRewards() {
  $("rewards-total").textContent = progress.learned.length;
  $("badges-grid").innerHTML = badgesFor(progress)
    .map(
      (b) =>
        `<article class="badge-card ${b.earned ? "earned" : "locked"}"><span class="badge-icon ${b.color}">${icon(b.icon)}</span><h3>${b.title}</h3><p>${b.description}</p><span class="badge-state">${b.earned ? "✓ ¡CONSEGUIDA!" : "POR DESCUBRIR"}</span></article>`,
    )
    .join("");
  $("table-progress-list").innerHTML = TABLES.map((t) => {
    const p = tableProgress(progress, t.number);
    return `<div class="table-progress"><div><span>Tabla del ${t.number}</span><span>${p.count} / 12</span></div><div class="mini-track" role="progressbar" aria-label="Aprendizaje de la tabla del ${t.number}" aria-valuemin="0" aria-valuemax="12" aria-valuenow="${p.count}"><i style="width:${(p.count / 12) * 100}%"></i></div></div>`;
  }).join("");
}
for (const t of TABLES) {
  const option = document.createElement("option");
  option.value = t.number;
  option.textContent = `Tabla del ${t.number} · ${t.name}`;
  $("table-select").append(option);
}
for (const nav of document.querySelectorAll("[data-page]"))
  nav.addEventListener("click", () => showPage(nav.dataset.page));
for (const button of document.querySelectorAll("[data-action]"))
  button.addEventListener("click", () => {
    if (button.dataset.action === "study") showPage("study");
    else if (button.dataset.action === "practice") showPage("setup");
    else startSession("mixed", "adventure");
  });
$("hero-play").addEventListener("click", () =>
  startSession("mixed", "adventure"),
);
$("tip-study").addEventListener("click", () => showPage("study"));
$("table-grid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-table]");
  if (button) startSession(Number(button.dataset.table));
});
$("study-tables").addEventListener("click", (event) => {
  const button = event.target.closest("[data-study-table]");
  if (button) {
    selectedTable = Number(button.dataset.studyTable);
    renderStudy();
    $("study-tables")
      .querySelector(`[data-study-table="${selectedTable}"]`)
      .focus({ preventScroll: true });
  }
});
$("study-facts").addEventListener("click", (event) => {
  const button = event.target.closest("[data-multiplier]");
  if (button) {
    multiplier = Number(button.dataset.multiplier);
    renderStudy();
    $("study-facts")
      .querySelector(`[data-multiplier="${multiplier}"]`)
      .focus({ preventScroll: true });
  }
});
$("study-practice").addEventListener("click", () =>
  startSession(selectedTable),
);
$("begin-play").addEventListener("click", () => {
  const value = $("table-select").value;
  startSession(
    value === "mixed" ? "mixed" : Number(value),
    document.querySelector('input[name="mode"]:checked').value,
  );
});
$("answer-options").addEventListener("click", (event) => {
  const button = event.target.closest("[data-answer]");
  if (button && !button.disabled) answer(Number(button.dataset.answer));
});
$("hint-button").addEventListener("click", showHint);
$("next-question").addEventListener("click", nextQuestion);
$("leave-game").addEventListener("click", () => showPage("home"));
$("play-again").addEventListener("click", () =>
  startSession(session.table, session.mode),
);
$("result-home").addEventListener("click", () => showPage("home"));
$("help-button").addEventListener("click", () => {
  $("help-dialog").showModal();
  guide.speak(
    "Primero descubrimos las tablas con dibujos. Después elegimos una respuesta y practicamos. Si necesitas ayuda, pide una pista. No hay cronómetro ni perdemos vidas. Cada pasito cuenta.",
  );
});
for (const button of document.querySelectorAll("[data-close]"))
  button.addEventListener("click", () => $(button.dataset.close).close());
$("player-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!pendingGame) return;
  const result = validatePlayerName($("player-name").value);
  if (result.error) {
    $("player-name-error").textContent = result.error;
    $("player-name").setAttribute("aria-invalid", "true");
    $("player-name").focus();
    return;
  }
  const { table, mode } = pendingGame;
  pendingGame = null;
  playerName = result.name;
  introduced = false;
  $("player-dialog").close();
  beginSession(table, mode);
});
$("player-name").addEventListener("input", () => {
  $("player-name").removeAttribute("aria-invalid");
  $("player-name-error").textContent = "";
});
$("player-dialog").addEventListener("close", () => {
  if ($("player-dialog").open) return;
  $("player-name").value = "";
  if (pendingGame) {
    pendingGame = null;
    guide.stop();
  }
});
$("reset-progress").addEventListener("click", () =>
  $("reset-dialog").showModal(),
);
$("confirm-reset").addEventListener("click", () => {
  progress = emptyProgress();
  save();
  refreshProgress();
  renderRewards();
  $("reset-dialog").close();
  toast("Un nuevo jardín de números te espera. ¡Vamos a explorar!");
});
$("sound-button").addEventListener("click", () => {
  sound = !sound;
  try {
    localStorage.setItem("multiplicaclub-sound", sound ? "on" : "off");
  } catch {}
  soundUI();
  if (sound) chime();
});
$("voice-button").addEventListener("click", () => {
  guide.stop();
  voiceUI();
  $("voice-dialog").showModal();
});
$("voice-enabled").addEventListener("change", () => {
  guide.configure({ enabled: $("voice-enabled").checked });
  saveVoice();
  if (guide.preferences.enabled) guide.speak(welcomeSpeech());
});
$("voice-select").addEventListener("change", () => {
  guide.configure({ voiceURI: $("voice-select").value });
  saveVoice();
  guide.speak(welcomeSpeech(), { force: true });
});
$("voice-rate").addEventListener("input", () => {
  guide.configure({ rate: Number($("voice-rate").value) });
  saveVoice();
});
$("voice-test").addEventListener("click", () =>
  guide.speak(welcomeSpeech(), { force: true }),
);
$("voice-stop").addEventListener("click", () => guide.stop());
$("voice-dialog").addEventListener("close", () => guide.stop());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) guide.stop();
});
addEventListener("pagehide", () => guide.stop());
$("listen-button").disabled = !guide.supported;
if ($("listen-button").disabled)
  $("listen-button").title =
    "Este navegador no permite leer la cuenta en voz alta.";
$("listen-button").addEventListener("click", () => {
  readQuestion(true);
});
addEventListener("keydown", (event) => {
  if (
    route !== "play" ||
    document.querySelector("dialog[open]") ||
    event.repeat ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey
  )
    return;
  if (/^[1-4]$/.test(event.key) && session?.state === "question") {
    event.preventDefault();
    $("answer-options").children[Number(event.key) - 1]?.click();
  } else if (event.code === "KeyH" && session?.state === "question") {
    event.preventDefault();
    showHint();
  } else if (event.key === "Enter" && session?.state === "answered") {
    event.preventDefault();
    nextQuestion();
  }
});
soundUI();
voiceUI();
refreshProgress();
showPage(
  ["home", "study", "setup", "rewards"].includes(location.hash.slice(1))
    ? location.hash.slice(1)
    : "home",
  false,
);
