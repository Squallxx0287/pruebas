import test from "node:test";
import assert from "node:assert/strict";
import {
  VoiceGuide,
  chooseVoice,
  spanishVoices,
  sanitizeVoicePreferences,
  questionSpeech,
  hintSpeech,
} from "../src/multiplica/voice.js";
const monica = {
  name: "Mónica",
  lang: "es-ES",
  voiceURI: "monica",
  localService: true,
};
const jorge = {
  name: "Microsoft Jorge Natural",
  lang: "es-MX",
  voiceURI: "jorge",
};
const english = { name: "Samantha", lang: "en-US", voiceURI: "english" };
class Utterance {
  constructor(text) {
    this.text = text;
  }
}
class Synth extends EventTarget {
  constructor(voices = [jorge, english, monica]) {
    super();
    this.voices = voices;
    this.spoken = [];
    this.cancels = 0;
    this.paused = false;
  }
  getVoices() {
    return this.voices;
  }
  speak(utterance) {
    this.spoken.push(utterance);
    utterance.onstart?.();
  }
  cancel() {
    this.cancels++;
  }
}
function make(t, options = {}) {
  const synth = new Synth(options.voices);
  const guide = new VoiceGuide({ synth, Utterance, ...options });
  guide.activate();
  t.after(() => guide.dispose());
  return { synth, guide };
}

test("automatic selection prefers known Spanish feminine voices and respects a manual Spanish choice", () => {
  assert.equal(chooseVoice([english, jorge, monica]), monica);
  assert.equal(chooseVoice([english, jorge, monica], "jorge"), jorge);
  assert.equal(chooseVoice([english, jorge, monica], "english"), monica);
  assert.equal(chooseVoice([english]), null);
  assert.equal(spanishVoices([monica, monica, english, jorge]).length, 2);
  assert.equal(
    chooseVoice([{ name: "Paulina", lang: "es_MX", voiceURI: "p" }]).name,
    "Paulina",
  );
});
test("voice preferences tolerate malformed storage and keep speed within a clear, gentle range", () => {
  assert.deepEqual(sanitizeVoicePreferences(null), {
    enabled: true,
    voiceURI: "",
    rate: 0.9,
  });
  assert.equal(sanitizeVoicePreferences({ rate: 100 }).rate, 1.15);
  assert.equal(sanitizeVoicePreferences({ rate: -5 }).rate, 0.75);
  assert.equal(
    sanitizeVoicePreferences({ enabled: false, rate: "fast", voiceURI: 42 })
      .rate,
    0.9,
  );
  assert.equal(sanitizeVoicePreferences({ enabled: false }).enabled, false);
});
test("narration uses the selected Spanish voice and cannot autoplay before interaction; mute stops and blocks automatic narration", (t) => {
  const synth = new Synth(),
    guide = new VoiceGuide({
      synth,
      Utterance,
      preferences: { voiceURI: "monica", rate: 0.85 },
    });
  t.after(() => guide.dispose());
  assert.equal(guide.speak("Hola"), false);
  assert.equal(synth.spoken.length, 0);
  guide.activate();
  assert.equal(guide.speak("Hola"), true);
  const u = synth.spoken.at(-1);
  assert.equal(u.voice, monica);
  assert.equal(u.lang, "es-ES");
  assert.equal(u.rate, 0.85);
  assert.ok(u.pitch < 1.1);
  assert.equal(guide.speaking, true);
  guide.configure({ enabled: false });
  assert.equal(guide.speaking, false);
  assert.equal(guide.speak("Automático"), false);
  assert.equal(synth.spoken.length, 1);
  assert.equal(guide.speak("Prueba explícita", { force: true }), true);
  assert.equal(guide.preferences.enabled, false);
  assert.equal(synth.spoken.at(-1).text, "Prueba explícita");
});
test("new narration cancels stale text, and late callbacks cannot clear the current speaking indicator", (t) => {
  const { guide, synth } = make(t);
  guide.speak("Primera");
  const old = synth.spoken.at(-1);
  guide.speak("Segunda");
  const current = synth.spoken.at(-1);
  old.onend();
  old.onerror({ error: "interrupted" });
  assert.equal(guide.speaking, true);
  assert.equal(guide.current, current);
  current.onend();
  assert.equal(guide.speaking, false);
  assert.equal(guide.current, null);
  guide.speak("Tercera");
  guide.stop();
  synth.spoken.at(-1).onstart();
  assert.equal(guide.speaking, false);
  assert.equal(guide.current, null);
});
test("voices loaded asynchronously use the preferred voice and a canceled pending question never plays later", (t) => {
  const { guide, synth } = make(t, { voices: [] });
  guide.speak("Pregunta antigua");
  assert.equal(synth.spoken.length, 0);
  assert.equal(guide.waiting, true);
  guide.stop();
  synth.voices = [monica];
  synth.dispatchEvent(new Event("voiceschanged"));
  assert.equal(synth.spoken.length, 0);
  synth.voices = [];
  guide.refresh();
  guide.speak("Pregunta actual");
  synth.voices = [monica];
  synth.dispatchEvent(new Event("voiceschanged"));
  assert.equal(synth.spoken.length, 1);
  assert.equal(synth.spoken[0].voice, monica);
  assert.equal(synth.spoken[0].text, "Pregunta actual");
  assert.equal(guide.waiting, false);
});
test("speech failure is reported once and a manual retry can recover without changing mute preferences", (t) => {
  const errors = [],
    { guide, synth } = make(t, { onError: (e) => errors.push(e) });
  guide.speak("Hola");
  synth.spoken.at(-1).onerror({ error: "not-allowed" });
  assert.equal(guide.failed, true);
  assert.deepEqual(errors, ["not-allowed"]);
  assert.equal(guide.speak("Más"), false);
  guide.speak("Reintento", { force: true });
  assert.equal(guide.failed, false);
  assert.equal(guide.speaking, true);
  const unsupported = new VoiceGuide();
  assert.equal(unsupported.supported, false);
  assert.equal(unsupported.speak("Hola"), false);
  const missing = make(t, {
    voices: [english],
    onError: (e) => errors.push(e),
  });
  missing.guide.speak("Español");
  assert.equal(missing.synth.spoken.length, 0);
  assert.equal(errors.at(-1), "language-unavailable");
});
test("questions read the factors without giving away the answer and hints explain equal groups", () => {
  const q = { a: 7, b: 8, answer: 56 };
  assert.match(questionSpeech(q), /7 por 8/);
  assert.match(questionSpeech(q, "Sofía"), /^Sofía, 7 por 8/);
  assert.ok(!questionSpeech(q).includes("56"));
  assert.match(hintSpeech(q), /7 grupos con 8 estrellas/);
  assert.ok(!hintSpeech(q).includes("56"));
  assert.match(hintSpeech({ a: 1, b: 1 }), /1 grupo con 1 estrella/);
});
