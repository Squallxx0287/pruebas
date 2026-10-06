import { DeadzoneGame, LEVELS, WEAPONS, clamp } from "./survival.js";
import { DeadzoneRenderer } from "./graphics.js";
import { Vector3 } from "./vendor/three.module.js";
const $ = (id) => document.getElementById(id);
export const game = new DeadzoneGame();
export let visual = null;
const mobile = matchMedia("(pointer: coarse)").matches,
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let keys = new Set(),
  firing = false,
  trigger = false,
  aiming = false,
  reloadQueued = false,
  grenadeQueued = false,
  selected = 3,
  arsenalReturn = "menu",
  helpReturn = null;
let joystick = { x: 0, z: 0, id: null },
  lookTouch = { id: null, x: 0, y: 0 };
let lastFrame = performance.now(),
  hudTime = 0,
  announcementTime = 0,
  toastTime = 0,
  hitTime = 0,
  killTime = 0,
  endDelay = null,
  footstepTime = 0;
let best = 0,
  soundEnabled = true,
  highQuality = true;
try {
  best = Number(localStorage.getItem("deadzone-best")) || 0;
  soundEnabled = localStorage.getItem("deadzone-sound") !== "off";
  highQuality = localStorage.getItem("deadzone-quality") !== "low";
} catch {}
$("best-score").textContent = String(best).padStart(6, "0");
const timeLabel = (t) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.nextAmbient = 0;
    this.nextGrowl = 0;
  }
  init() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = soundEnabled ? 0.55 : 0;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    } catch {}
  }
  tone(f, end, duration, volume = 0.12, type = "triangle", delay = 0) {
    if (!this.ctx || !soundEnabled) return;
    const t = this.ctx.currentTime + delay,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(15, end), t + duration);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + duration + 0.01);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  noise(duration, volume, cutoff = 1600) {
    if (!this.ctx || !soundEnabled) return;
    const b = this.ctx.createBuffer(
        1,
        Math.ceil(this.ctx.sampleRate * duration),
        this.ctx.sampleRate,
      ),
      data = b.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const s = this.ctx.createBufferSource(),
      f = this.ctx.createBiquadFilter(),
      g = this.ctx.createGain();
    s.buffer = b;
    f.type = "lowpass";
    f.frequency.value = cutoff;
    g.gain.setValueAtTime(volume, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    s.start();
    s.onended = () => {
      s.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }
  handle(e) {
    if (e.type === "fire") {
      const w = WEAPONS[e.weapon],
        d =
          w.id === "sniper"
            ? 0.32
            : w.id === "shotgun" || w.id === "double"
              ? 0.25
              : w.id === "rocket"
                ? 0.45
                : 0.12;
      if (w.id === "flame") {
        this.noise(0.11, 0.07, 600);
        return;
      }
      this.noise(
        d,
        w.id === "rocket" ? 0.27 : 0.16,
        w.id === "smg" ? 3500 : 2200,
      );
      this.tone(
        w.id === "revolver" ? 130 : w.id === "sniper" ? 85 : 180,
        30,
        d,
        0.19,
        "triangle",
      );
      if (w.id === "shotgun") this.tone(150, 120, 0.08, 0.035, "square", 0.36);
    }
    if (e.type === "reload") {
      this.noise(0.14, 0.06, 2800);
      this.tone(640, 420, 0.09, 0.04, "square");
    }
    if (e.type === "loaded") {
      this.noise(0.08, 0.07, 3500);
      this.tone(420, 280, 0.07, 0.04, "square");
    }
    if (e.type === "hit") this.noise(0.065, 0.07, 1100);
    if (e.type === "kill") this.tone(65, 28, 0.22, 0.07, "sawtooth");
    if (e.type === "damage") {
      this.noise(0.26, 0.19, 600);
      this.tone(70, 30, 0.33, 0.16, "sawtooth");
    }
    if (e.type === "explosion") {
      this.noise(0.8, 0.32, 1100);
      this.tone(55, 20, 0.75, 0.25, "sine");
    }
    if (e.type === "pickup") this.tone(420, 700, 0.13, 0.06, "sine");
    if (e.type === "boss") {
      this.tone(46, 35, 1.8, 0.18, "sawtooth");
      this.noise(1.4, 0.09, 350);
    }
    if (e.type === "switch") this.noise(0.08, 0.045, 1800);
    if (e.type === "grenade") this.tone(230, 140, 0.12, 0.03, "square");
    if (e.type === "charge") this.tone(90, 35, 0.55, 0.08, "sawtooth");
  }
  ambient(dt) {
    if (!this.ctx || !soundEnabled || game.state !== "playing") return;
    this.nextAmbient -= dt;
    this.nextGrowl -= dt;
    if (this.nextAmbient <= 0) {
      this.tone(55, 54.5, 2.8, 0.03, "sine");
      this.tone(82.4, 81.9, 2.8, 0.015, "sine");
      this.noise(2.4, 0.018, 300);
      this.nextAmbient = 3;
    }
    if (this.nextGrowl <= 0 && game.enemies.length) {
      const close = game.enemies.some(
        (e) => Math.hypot(e.x - game.player.x, e.z - game.player.z) < 12,
      );
      if (close) {
        this.tone(48 + Math.random() * 25, 28, 0.7, 0.055, "sawtooth");
        this.noise(0.6, 0.025, 450);
      }
      this.nextGrowl = 2 + Math.random() * 2;
    }
  }
}
const audio = new AudioEngine();
function soundUI() {
  $("sound-label").textContent = soundEnabled ? "ON" : "OFF";
  if (audio.master)
    audio.master.gain.setTargetAtTime(
      soundEnabled ? 0.55 : 0,
      audio.ctx.currentTime,
      0.03,
    );
}
function qualityUI() {
  if (!visual) return;
  visual.renderer.setPixelRatio(
    highQuality
      ? Math.min(devicePixelRatio, 1.4)
      : Math.min(devicePixelRatio, 0.85),
  );
  visual.renderer.shadowMap.enabled = highQuality;
  visual.postMaterial.uniforms.bloomStrength.value = highQuality ? 1 : 0;
  $("quality-label").textContent = highQuality ? "ALTO" : "BAJO";
  visual.resize();
}
function clearInput() {
  keys.clear();
  firing = false;
  trigger = false;
  aiming = false;
  reloadQueued = false;
  grenadeQueued = false;
  joystick.x = joystick.z = 0;
  joystick.id = null;
  lookTouch.id = null;
  $("joystick-knob").style.transform = "";
}
function unlock() {
  if (document.pointerLockElement) document.exitPointerLock();
}
function capture() {
  if (mobile) return;
  try {
    const request = $("world").requestPointerLock();
    if (request?.catch) request.catch(() => ($("lock-hint").hidden = false));
  } catch {
    $("lock-hint").hidden = false;
  }
}
function hideScreens() {
  [
    "menu",
    "pause-screen",
    "level-screen",
    "end-screen",
    "arsenal-screen",
  ].forEach((id) => ($(id).hidden = true));
}
function toast(text) {
  $("toast").textContent = text;
  $("toast").classList.add("visible");
  toastTime = 2.8;
}
function announce(kicker, title, copy, duration = 3) {
  $("announcement-kicker").textContent = kicker;
  $("announcement-title").textContent = title;
  $("announcement-copy").textContent = copy;
  announcementTime = duration;
  $("announcement").classList.add("visible");
}
function processEvents() {
  for (const e of game.events.splice(0)) {
    visual.handle(e, game);
    audio.handle(e);
    if (e.type === "level") {
      const l = LEVELS[e.level - 1];
      announce(`PROTOCOLO CERO // SECTOR 0${e.level}`, l.name, l.briefing, 3.3);
    }
    if (e.type === "boss") {
      announce(
        "HORDA ELIMINADA // AMENAZA CLASE Ω",
        e.name,
        "NO TE DETENGAS. APUNTA A LA CABEZA.",
        3,
      );
      toast("JEFE DETECTADO · INTEGRIDAD +20");
    }
    if (e.type === "hit") {
      hitTime = 0.13;
      $("hit-marker").classList.add("visible");
      $("hit-marker").classList.toggle("headshot", e.headshot);
      if (e.damage >= 5 && $("damage-numbers").children.length < 14) {
        const pos = new Vector3(e.x, e.y + 0.15, e.z).project(visual.camera);
        if (pos.z < 1 && Math.abs(pos.x) < 1 && Math.abs(pos.y) < 1) {
          const el = document.createElement("span");
          el.className = "damage-number" + (e.headshot ? " head" : "");
          el.textContent = e.damage;
          el.style.left = `${(pos.x * 0.5 + 0.5) * innerWidth}px`;
          el.style.top = `${(-pos.y * 0.5 + 0.5) * innerHeight}px`;
          $("damage-numbers").append(el);
          setTimeout(() => el.remove(), 700);
        }
      }
    }
    if (e.type === "kill") {
      killTime = 1.2;
      $("kill-message").textContent = e.headshot
        ? "DISPARO A LA CABEZA +50"
        : "INFECTADO NEUTRALIZADO";
      $("kill-message").classList.add("visible");
    }
    if (e.type === "pickup")
      toast(
        e.kind === "health"
          ? "BOTIQUÍN · +30 INTEGRIDAD"
          : "SUMINISTROS · MUNICIÓN REABASTECIDA",
      );
    if (e.type === "clear") endDelay = { kind: "clear", remaining: 1.0 };
    if (e.type === "end")
      endDelay = {
        kind: e.victory ? "victory" : "dead",
        remaining: e.victory ? 1.2 : 0.6,
      };
  }
}
function start() {
  if (!visual) return;
  audio.init();
  clearInput();
  hideScreens();
  endDelay = null;
  game.start();
  game.switchWeapon(selected);
  visual.setWeapon(selected);
  $("topbar").hidden = true;
  $("hud").hidden = false;
  $("mobile-controls").hidden = !mobile;
  document.body.classList.add("playing");
  processEvents();
  updateHUD();
  capture();
}
function menu() {
  game.reset();
  clearInput();
  unlock();
  hideScreens();
  endDelay = null;
  game.player.weapon = selected;
  visual.setWeapon(selected);
  visual.buildLevel(1);
  $("menu").hidden = false;
  $("topbar").hidden = false;
  $("hud").hidden = true;
  $("mobile-controls").hidden = true;
  document.body.classList.remove("playing");
  $("best-score").textContent = String(best).padStart(6, "0");
  $("start-button").focus();
}
function pause() {
  if (game.state !== "playing") return;
  game.state = "paused";
  clearInput();
  unlock();
  $("pause-screen").hidden = false;
  $("mobile-controls").hidden = true;
  document.body.classList.remove("playing");
  $("resume-button").focus();
}
function resume() {
  if (game.state !== "paused") return;
  game.state = "playing";
  clearInput();
  $("pause-screen").hidden = true;
  $("mobile-controls").hidden = !mobile;
  document.body.classList.add("playing");
  capture();
  audio.init();
}
function equip(index) {
  selected = index;
  game.switchWeapon(index);
  visual.setWeapon(index);
  processEvents();
  document
    .querySelectorAll(".weapon-card")
    .forEach((c, i) => c.classList.toggle("selected", i === index));
  updateHUD();
}
function arsenal() {
  if (["dead", "victory"].includes(game.state)) return;
  arsenalReturn = game.state;
  game.state = "arsenal";
  clearInput();
  unlock();
  $("arsenal-screen").hidden = false;
  $("mobile-controls").hidden = true;
  document.body.classList.remove("playing");
  document
    .querySelectorAll(".weapon-card")
    .forEach((c, i) => c.classList.toggle("selected", i === selected));
  $("close-arsenal").focus();
}
function closeArsenal() {
  if (game.state !== "arsenal") return;
  game.state = arsenalReturn;
  $("arsenal-screen").hidden = true;
  clearInput();
  if (game.state === "playing") {
    $("mobile-controls").hidden = !mobile;
    document.body.classList.add("playing");
    capture();
  }
}
function showClear() {
  clearInput();
  unlock();
  $("mobile-controls").hidden = true;
  document.body.classList.remove("playing");
  const current = LEVELS[game.level - 1],
    next = LEVELS[game.level];
  $("clear-title").innerHTML = `SECTOR 0${game.level}<br><em>LIBERADO.</em>`;
  $("clear-copy").textContent = `${current.boss} ha caído. ${next.subtitle}`;
  $("clear-kills").textContent = game.kills;
  $("clear-score").textContent = String(game.score).padStart(6, "0");
  $("next-name").textContent = next.name;
  $("level-screen").hidden = false;
  $("next-button").focus();
}
function next() {
  if (game.state !== "intermission") return;
  $("level-screen").hidden = true;
  clearInput();
  game.nextLevel();
  processEvents();
  $("mobile-controls").hidden = !mobile;
  document.body.classList.add("playing");
  updateHUD();
  capture();
}
function showEnd(victory) {
  clearInput();
  unlock();
  $("mobile-controls").hidden = true;
  document.body.classList.remove("playing");
  $("end-title").innerHTML = victory
    ? "LA ZONA<br><em>ES TUYA.</em>"
    : "NO ERAS<br><em>INMORTAL.</em>";
  $("end-kicker").textContent = victory
    ? "PACIENTE CERO ELIMINADO // EXTRACCIÓN CONFIRMADA"
    : "PROTOCOLO FALLIDO // SEÑAL PERDIDA";
  $("end-description").textContent = victory
    ? "Cinco zonas. Cinco jefes. El último superviviente eres tú."
    : "La zona sigue ahí. Tu próxima incursión también.";
  $("end-score").textContent = String(game.score).padStart(6, "0");
  $("end-level").textContent = `${game.level} / 5`;
  $("end-kills").textContent = game.kills;
  $("end-headshots").textContent = game.headshots;
  $("end-time").textContent = timeLabel(game.time);
  $("new-record").hidden = game.score <= best;
  if (game.score > best) {
    best = game.score;
    try {
      localStorage.setItem("deadzone-best", String(best));
    } catch {}
  }
  $("end-screen").hidden = false;
  $("retry-button").focus();
}
function updateHUD() {
  const p = game.player,
    w = game.weapon,
    a = game.ammo[p.weapon];
  $("health").textContent = Math.ceil(p.hp);
  $("health-fill").style.width = `${(p.hp / p.maxHp) * 100}%`;
  $("stamina-fill").style.width = `${p.stamina}%`;
  $("health-status").textContent =
    p.hp < 30 ? "CRÍTICA" : p.hp < 60 ? "HERIDO" : "ESTABLE";
  $("hud").classList.toggle("low-health", p.hp < 30);
  $("grenades").textContent = p.grenades;
  $("magazine").textContent = String(a.magazine).padStart(2, "0");
  $("reserve").textContent = a.reserve;
  $("weapon-name").textContent = w.name;
  $("weapon-category").textContent = w.category;
  $("fire-mode").textContent =
    w.mode + (w.pellets > 1 ? ` / ${w.pellets} PERDIGONES` : "");
  $("reload-text").innerHTML =
    p.reload > 0 ? "RECARGANDO…" : "<kbd>R</kbd> RECARGAR";
  $("reload-fill").style.width =
    `${p.reload > 0 ? (1 - p.reload / p.reloadDuration) * 100 : 0}%`;
  $("clock").textContent = timeLabel(game.time);
  $("level-title").textContent = LEVELS[Math.max(0, game.level - 1)].name;
  $("level-number").innerHTML = `0${game.level || 1}<span>/05</span>`;
  const l = LEVELS[Math.max(0, game.level - 1)];
  $("objective-text").textContent = game.bossSpawned
    ? "NEUTRALIZA AL JEFE"
    : `${game.regularKills} / ${l.count} INFECTADOS`;
  $("objective-fill").style.width =
    `${Math.min(100, (game.regularKills / l.count) * 100)}%`;
  $("score").textContent = String(game.score).padStart(6, "0") + " PTS";
  $("kills").textContent = `${game.kills} BAJAS`;
  $("boss-hud").hidden = !game.boss || game.boss.hp <= 0;
  if (game.boss) {
    $("boss-name").textContent = l.boss;
    $("boss-fill").style.width =
      `${Math.max(0, game.boss.hp / game.boss.maxHp) * 100}%`;
    $("boss-health").textContent =
      Math.ceil(Math.max(0, game.boss.hp)) + " / " + game.boss.maxHp;
  }
  $("scope").hidden = !(p.aim && p.weapon === 6 && game.state === "playing");
  $("crosshair").hidden = p.aim && p.weapon === 6;
  $("crosshair").style.setProperty(
    "--gap",
    (p.aim ? 3 : 7) + visual.recoil * 55 + "px",
  );
  $("damage-direction").classList.toggle("visible", visual.damageFlash > 0.4);
  document
    .querySelectorAll(".belt-slot")
    .forEach((b, i) => b.classList.toggle("active", p.weapon === i));
}
function createArsenal(thumbnails) {
  WEAPONS.forEach((w, i) => {
    const card = document.createElement("button");
    card.className = "weapon-card";
    card.dataset.weapon = i;
    const dmg = Math.min(100, (w.damage * w.pellets) / 6.2),
      rate = Math.min(100, (0.075 / w.interval) * 100);
    card.innerHTML = `<small>${w.category}</small><span class="weapon-key">${(i + 1) % 10}</span><img src="${thumbnails[i]}" alt="Modelo 3D de ${w.name}"><strong>${w.name}</strong><p>${w.description}</p><div class="weapon-stats"><div class="weapon-stat"><span>POTENCIA</span><div><i style="width:${Math.max(8, dmg)}%"></i></div></div><div class="weapon-stat"><span>CADENCIA</span><div><i style="width:${Math.max(7, rate)}%"></i></div></div></div><div class="weapon-rounds"><span>${w.mode}</span><span>CARGADOR <b>${w.magazine}</b></span></div>`;
    card.addEventListener("click", () => {
      equip(i);
      closeArsenal();
    });
    $("arsenal-grid").append(card);
    const belt = document.createElement("button");
    belt.className = "belt-slot";
    belt.setAttribute("aria-label", `Equipar ${w.name}`);
    belt.innerHTML = `<img src="${thumbnails[i]}" alt=""><small>${(i + 1) % 10}</small>`;
    belt.addEventListener("click", () => equip(i));
    $("weapon-belt").append(belt);
  });
  LEVELS.forEach((l, i) => {
    const node = document.createElement("div");
    node.className = "chapter";
    node.innerHTML = `<span>0${i + 1} /</span><strong>${l.name}</strong><small>${String(l.count).padStart(2, "0")} INFECTADOS + JEFE</small>`;
    $("menu-levels").append(node);
  });
}
$("start-button").addEventListener("click", start);
$("retry-button").addEventListener("click", start);
$("menu-button").addEventListener("click", menu);
$("quit-button").addEventListener("click", menu);
$("resume-button").addEventListener("click", resume);
$("game-pause").addEventListener("click", pause);
$("next-button").addEventListener("click", next);
["arsenal-button", "game-arsenal", "intermission-arsenal"].forEach((id) =>
  $(id).addEventListener("click", arsenal),
);
$("close-arsenal").addEventListener("click", closeArsenal);
$("sound-button").addEventListener("click", () => {
  audio.init();
  soundEnabled = !soundEnabled;
  soundUI();
  try {
    localStorage.setItem("deadzone-sound", soundEnabled ? "on" : "off");
  } catch {}
});
$("quality-button").addEventListener("click", () => {
  highQuality = !highQuality;
  qualityUI();
  try {
    localStorage.setItem("deadzone-quality", highQuality ? "high" : "low");
  } catch {}
});
$("help-button").addEventListener("click", () => {
  helpReturn = game.state;
  if (game.state === "playing") pause();
  $("help-dialog").showModal();
});
$("close-help").addEventListener("click", () => $("help-dialog").close());
$("got-it").addEventListener("click", () => $("help-dialog").close());
$("help-dialog").addEventListener("close", () => {
  if (helpReturn === "playing") resume();
  helpReturn = null;
});
addEventListener("keydown", (e) => {
  if ($("help-dialog").open) return;
  if (
    [
      "Tab",
      "Space",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ].includes(e.code)
  )
    e.preventDefault();
  if (e.repeat) return;
  if (e.code === "Tab") {
    if (game.state === "arsenal") closeArsenal();
    else arsenal();
    return;
  }
  if (["Escape", "KeyP"].includes(e.code)) {
    if (game.state === "arsenal") closeArsenal();
    else if (game.state === "paused") resume();
    else pause();
    return;
  }
  if (/^Digit[0-9]$/.test(e.code)) {
    equip((Number(e.code.slice(-1)) + 9) % 10);
    return;
  }
  keys.add(e.code);
  if (e.code === "KeyR") reloadQueued = true;
  if (e.code === "KeyG") grenadeQueued = true;
  if (e.code === "KeyF" && visual) {
    visual.flashlight = !visual.flashlight;
    toast(visual.flashlight ? "LINTERNA ENCENDIDA" : "LINTERNA APAGADA");
  }
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("mousemove", (e) => {
  if (game.state !== "playing" || mobile) return;
  if (document.pointerLockElement === $("world") || firing) {
    const sensitivity = game.player.aim ? 0.0012 : 0.0022;
    game.player.yaw -= e.movementX * sensitivity;
    game.player.pitch = clamp(
      game.player.pitch - e.movementY * sensitivity,
      -1.35,
      1.35,
    );
  }
});
$("world").addEventListener("mousedown", (e) => {
  if (game.state !== "playing" || mobile) return;
  if (e.button === 0) {
    firing = true;
    trigger = true;
    if (!document.pointerLockElement) capture();
  }
  if (e.button === 2) aiming = true;
  audio.init();
});
addEventListener("mouseup", (e) => {
  if (e.button === 0) firing = false;
  if (e.button === 2) aiming = false;
});
$("world").addEventListener("contextmenu", (e) => e.preventDefault());
addEventListener(
  "wheel",
  (e) => {
    if (game.state !== "playing") return;
    e.preventDefault();
    equip((game.player.weapon + (e.deltaY > 0 ? 1 : 9)) % 10);
  },
  { passive: false },
);
document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === $("world");
  $("lock-hint").hidden = locked || mobile;
  if (!locked && game.state === "playing") pause();
});
addEventListener("blur", () => {
  clearInput();
  pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInput();
    pause();
  }
});
addEventListener("resize", () => visual?.resize());
const stick = $("joystick");
function moveStick(e) {
  const b = stick.getBoundingClientRect();
  let x = e.clientX - b.left - b.width / 2,
    y = e.clientY - b.top - b.height / 2;
  const d = Math.hypot(x, y),
    r = b.width * 0.35;
  if (d > r) {
    x *= r / d;
    y *= r / d;
  }
  joystick.x = x / r;
  joystick.z = -y / r;
  $("joystick-knob").style.transform = `translate(${x}px,${y}px)`;
}
stick.addEventListener("pointerdown", (e) => {
  if (joystick.id !== null) return;
  joystick.id = e.pointerId;
  stick.setPointerCapture(e.pointerId);
  moveStick(e);
  e.preventDefault();
});
stick.addEventListener("pointermove", (e) => {
  if (e.pointerId === joystick.id) moveStick(e);
});
function releaseStick(e) {
  if (e.pointerId === joystick.id) {
    joystick.id = null;
    joystick.x = joystick.z = 0;
    $("joystick-knob").style.transform = "";
  }
}
["pointerup", "pointercancel", "lostpointercapture"].forEach((name) =>
  stick.addEventListener(name, releaseStick),
);
const look = $("look-pad");
look.addEventListener("pointerdown", (e) => {
  if (lookTouch.id !== null) return;
  lookTouch = { id: e.pointerId, x: e.clientX, y: e.clientY };
  look.setPointerCapture(e.pointerId);
  e.preventDefault();
});
look.addEventListener("pointermove", (e) => {
  if (e.pointerId !== lookTouch.id) return;
  const sensitivity = aiming ? 0.0021 : 0.004;
  game.player.yaw -= (e.clientX - lookTouch.x) * sensitivity;
  game.player.pitch = clamp(
    game.player.pitch - (e.clientY - lookTouch.y) * sensitivity,
    -1.35,
    1.35,
  );
  lookTouch.x = e.clientX;
  lookTouch.y = e.clientY;
});
["pointerup", "pointercancel"].forEach((name) =>
  look.addEventListener(name, (e) => {
    if (lookTouch.id === e.pointerId) lookTouch.id = null;
  }),
);
$("touch-fire").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  $("touch-fire").setPointerCapture(e.pointerId);
  firing = true;
  trigger = true;
  audio.init();
});
["pointerup", "pointercancel", "lostpointercapture"].forEach((name) =>
  $("touch-fire").addEventListener(name, () => (firing = false)),
);
$("touch-aim").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  aiming = !aiming;
});
$("touch-reload").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  reloadQueued = true;
});
$("touch-weapon").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  equip((game.player.weapon + 1) % 10);
});
$("touch-grenade").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  grenadeQueued = true;
});
function frame(now) {
  const elapsed = Math.min(0.25, (now - lastFrame) / 1000),
    dt = Math.min(0.05, elapsed);
  lastFrame = now;
  let mx =
      (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) +
      joystick.x,
    mz =
      (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) +
      joystick.z;
  let remaining = elapsed,
    first = true;
  while (remaining > 0) {
    const tick = Math.min(1 / 60, remaining);
    game.update(tick, {
      moveX: mx,
      moveZ: mz,
      fire: firing || (first && trigger),
      trigger: (first && trigger) || (mobile && firing),
      aim: aiming,
      reload: first && reloadQueued,
      grenade: first && grenadeQueued,
      sprint: keys.has("ShiftLeft") || keys.has("ShiftRight"),
      crouch: keys.has("KeyC"),
    });
    remaining -= tick;
    first = false;
  }
  trigger = false;
  reloadQueued = false;
  grenadeQueued = false;
  processEvents();
  if (endDelay) {
    endDelay.remaining -= dt;
    if (endDelay.remaining <= 0) {
      const kind = endDelay.kind;
      endDelay = null;
      if (kind === "clear") showClear();
      else showEnd(kind === "victory");
    }
  }
  visual.render(
    game,
    dt,
    game.state === "playing" ? Math.min(1, Math.hypot(mx, mz)) : 0,
  );
  audio.ambient(dt);
  footstepTime -= dt;
  if (
    game.state === "playing" &&
    Math.hypot(mx, mz) > 0.2 &&
    footstepTime <= 0
  ) {
    audio.noise(0.07, 0.018, 800);
    footstepTime = keys.has("ShiftLeft") ? 0.27 : 0.4;
  }
  announcementTime -= dt;
  toastTime -= dt;
  hitTime -= dt;
  killTime -= dt;
  if (announcementTime <= 0) $("announcement").classList.remove("visible");
  if (toastTime <= 0) $("toast").classList.remove("visible");
  if (hitTime <= 0) $("hit-marker").classList.remove("visible");
  if (killTime <= 0) $("kill-message").classList.remove("visible");
  hudTime -= dt;
  if (hudTime <= 0) {
    updateHUD();
    hudTime = 0.06;
  }
  requestAnimationFrame(frame);
}
async function init() {
  await new Promise(requestAnimationFrame);
  await new Promise((r) => setTimeout(r, 40));
  try {
    visual = new DeadzoneRenderer($("world"));
    $("loading-message").textContent =
      "Preparando los diez sistemas de armamento…";
    await new Promise(requestAnimationFrame);
    const thumbnails = visual.weaponThumbnails();
    createArsenal(thumbnails);
    qualityUI();
    soundUI();
    $("loading").hidden = true;
    $("menu").hidden = false;
    lastFrame = performance.now();
    requestAnimationFrame(frame);
  } catch (error) {
    console.error(error);
    $("loading-message").textContent =
      "Este juego necesita WebGL 2. Activa la aceleración gráfica del navegador y vuelve a cargar.";
    $("loading").querySelector(".load-track").hidden = true;
  }
}
init();
