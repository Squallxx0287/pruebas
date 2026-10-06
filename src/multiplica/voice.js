const spanish = (voice) => /^es(?:[-_]|$)/i.test(voice.lang || "");
const normalize = (text) =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export const voiceKey = (voice) =>
  voice.voiceURI || `${voice.name}|${voice.lang}`;
export function spanishVoices(voices = []) {
  const seen = new Set();
  return voices.filter((voice) => {
    if (!spanish(voice) || seen.has(voiceKey(voice))) return false;
    seen.add(voiceKey(voice));
    return true;
  });
}
export function voiceScore(voice) {
  const name = normalize(voice.name);
  // The browser has no gender field. Prefer known feminine Spanish voices,
  // then let the listener choose from every available Spanish voice.
  const feminine =
    /\b(elvira|dalia|paulina|monica|helena|sabina|laura|francisca|paloma|lupe|lucia|isabel|catalina|luciana|andrea|sandra|susana|maria)\b/.test(
      name,
    );
  const masculine =
    /\b(jorge|carlos|diego|alvaro|pablo|juan|rodrigo|raul|manuel|daniel)\b/.test(
      name,
    );
  return (
    (feminine ? 180 : 0) -
    (masculine ? 150 : 0) +
    (/google.*espanol/.test(name) ? 85 : 0) +
    (/natural|neural|premium|enhanced/.test(name) ? 35 : 0) +
    (/^es[-_](mx|us|pe|cl|co|ar)$/i.test(voice.lang || "") ? 15 : 0) +
    (voice.localService ? 5 : 0)
  );
}
export function chooseVoice(voices, preferred = "") {
  const options = spanishVoices(voices);
  return (
    options.find((v) => voiceKey(v) === preferred) ||
    options.reduce(
      (best, v) => (!best || voiceScore(v) > voiceScore(best) ? v : best),
      null,
    )
  );
}
export function sanitizeVoicePreferences(value) {
  return {
    enabled: value?.enabled !== false,
    voiceURI:
      typeof value?.voiceURI === "string" ? value.voiceURI.slice(0, 500) : "",
    rate: Number.isFinite(value?.rate)
      ? Math.max(0.75, Math.min(1.15, value.rate))
      : 0.9,
  };
}
export const questionSpeech = ({ a, b }, name = "") =>
  `${name ? `${name}, ` : ""}${a} por ${b}. ¿Cuánto es? Elige una respuesta. Si lo necesitas, puedes pedir una pista.`;
export const hintSpeech = ({ a, b }) =>
  `Imagina ${a} ${a === 1 ? "grupo" : "grupos"} con ${b} ${b === 1 ? "estrella" : "estrellas"} en cada grupo. Para saber cuántas hay en total, suma ${b}, ${a} ${a === 1 ? "vez" : "veces"}. Mira los dibujos y cuenta a tu ritmo.`;

export class VoiceGuide {
  constructor({
    synth,
    Utterance,
    preferences,
    onChange = () => {},
    onError = () => {},
  } = {}) {
    this.synth = synth;
    this.Utterance = Utterance;
    this.preferences = sanitizeVoicePreferences(preferences);
    this.onChange = onChange;
    this.onError = onError;
    this.supported = !!(
      synth &&
      typeof synth.speak === "function" &&
      typeof synth.cancel === "function" &&
      Utterance
    );
    this.activated = false;
    this.failed = false;
    this.speaking = false;
    this.waiting = false;
    this.text = "";
    this.voices = [];
    this.generation = 0;
    this.current = null;
    this.pending = null;
    this.timer = null;
    this.refresh = this.refresh.bind(this);
    if (this.supported) {
      this.refresh();
      this.synth.addEventListener?.("voiceschanged", this.refresh);
    }
  }
  get voice() {
    return chooseVoice(this.voices, this.preferences.voiceURI);
  }
  activate() {
    this.activated = true;
  }
  refresh() {
    try {
      this.voices = Array.from(this.synth.getVoices?.() || []);
    } catch {
      this.voices = [];
    }
    this.onChange();
    if (this.pending && this.voices.length) this.flush();
  }
  configure(patch) {
    this.preferences = sanitizeVoicePreferences({
      ...this.preferences,
      ...patch,
    });
    this.stop();
    this.failed = false;
    this.onChange();
  }
  stop() {
    this.generation++;
    clearTimeout(this.timer);
    this.pending = null;
    this.current = null;
    this.waiting = this.speaking = false;
    try {
      this.synth?.cancel();
    } catch {}
    this.onChange();
  }
  speak(text, { force = false } = {}) {
    if (
      !this.supported ||
      !this.activated ||
      (!force && (!this.preferences.enabled || this.failed)) ||
      !text
    )
      return false;
    this.stop();
    this.failed = false;
    this.text = String(text);
    this.pending = { text: this.text, generation: this.generation };
    if (!this.voices.length) {
      this.waiting = true;
      this.timer = setTimeout(() => this.flush(), 650);
      this.onChange();
    } else this.flush();
    return true;
  }
  flush() {
    const pending = this.pending;
    if (!pending || pending.generation !== this.generation) return;
    this.pending = null;
    clearTimeout(this.timer);
    this.waiting = false;
    if (this.voices.length && !this.voice) {
      this.fail("language-unavailable");
      return;
    }
    try {
      const utterance = new this.Utterance(pending.text);
      const voice = this.voice;
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || "es-ES";
      utterance.rate = this.preferences.rate;
      utterance.pitch = 1.04;
      utterance.volume = 0.9;
      this.current = utterance;
      const current = () =>
        this.current === utterance && this.generation === pending.generation;
      utterance.onstart = () => {
        if (current()) {
          this.speaking = true;
          this.onChange();
        }
      };
      utterance.onend = () => {
        if (current()) {
          this.speaking = false;
          this.current = null;
          this.onChange();
        }
      };
      utterance.onerror = (event) => {
        if (!current()) return;
        this.current = null;
        this.speaking = false;
        if (!["canceled", "interrupted"].includes(event.error))
          this.fail(event.error || "synthesis-unavailable");
        else this.onChange();
      };
      if (this.synth.paused) this.synth.resume?.();
      this.synth.speak(utterance);
    } catch {
      this.fail("synthesis-unavailable");
    }
    this.onChange();
  }
  fail(error) {
    this.failed = true;
    this.waiting = this.speaking = false;
    this.current = null;
    this.onChange();
    this.onError(error);
  }
  dispose() {
    this.stop();
    this.synth?.removeEventListener?.("voiceschanged", this.refresh);
  }
}
