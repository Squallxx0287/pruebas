import { RiftGame, WORLD, UPGRADES } from './rift.js';

const $ = id => document.getElementById(id);
const canvas = $('arena');
const ctx = canvas.getContext('2d', { alpha: false });
const radar = $('minimap').getContext('2d');
export const game = new RiftGame();
const colors = { lime: '#d5ff5f', cyan: '#75e8ff', pink: '#ff547e', violet: '#b39aff', orange: '#ffb269' };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let width = innerWidth, height = innerHeight, dpr = 1;
let mobile = matchMedia('(pointer: coarse)').matches;
let zoom = 1, lastFrame = performance.now(), visualTime = 0, camera = { x: 1100, y: 750 };
let shake = 0, damageFlash = 0, announcementTime = 0, toastTime = 0, hudTimer = 0;
let particles = [], rings = [], texts = [], ghosts = [];
let pendingEnd = null;
let keyState = new Set(), pointer = { x: width / 2, y: height / 2, down: false, moved: false };
let touch = { x: 0, y: 0, pointerId: null }, dashQueued = false, pulseQueued = false;
let best = 0, soundEnabled = true, helpPaused = false;
try { best = Number(localStorage.getItem('neon-rift-best')) || 0; soundEnabled = localStorage.getItem('neon-rift-sound') !== 'off'; } catch { /* Storage is optional. */ }
$('menu-best').textContent = String(best).padStart(6, '0');

const stars = Array.from({ length: 180 }, (_, i) => ({ x: ((i * 7919 + 71) % 10000) / 10000, y: ((i * 3571 + 31) % 10000) / 10000, size: i % 9 === 0 ? 1.5 : .7, phase: i * 1.3 }));
const debris = Array.from({ length: 45 }, (_, i) => ({ x: (i * 743 + 130) % WORLD.width, y: (i * 457 + 90) % WORLD.height, radius: 12 + i % 20, angle: i * 2.7 }));
const clock = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

// Every sound is synthesized locally; no audio files or network requests are needed.
class Synth {
  constructor() { this.context = null; this.master = null; this.nextBeat = 0; this.beat = 0; }
  init() {
    try {
      if (!this.context) { this.context = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.context.createGain(); this.master.gain.value = soundEnabled ? .6 : 0; this.master.connect(this.context.destination); }
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    } catch { /* The game is fully playable without audio. */ }
  }
  tone(frequency, duration = .1, volume = .1, type = 'sine', end = frequency, time = 0) {
    if (!this.context || !soundEnabled) return;
    const now = time || this.context.currentTime;
    const oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
    gain.gain.setValueAtTime(.001, now); gain.gain.linearRampToValueAtTime(volume, now + .008); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(gain); gain.connect(this.master); oscillator.start(now); oscillator.stop(now + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  noise(duration, volume, cutoff = 800) {
    if (!this.context || !soundEnabled) return;
    const buffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * duration), this.context.sampleRate);
    const data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain();
    filter.type = 'lowpass'; filter.frequency.value = cutoff; source.buffer = buffer;
    gain.gain.setValueAtTime(volume, this.context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, this.context.currentTime + duration);
    source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start();
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  event(type) {
    if (type === 'shot') this.tone(920, .075, .035, 'square', 220);
    if (type === 'hit') this.tone(155, .055, .035, 'triangle', 70);
    if (type === 'kill') { this.noise(.16, .16, 1300); this.tone(90, .18, .14, 'sine', 25); }
    if (type === 'damage') { this.noise(.25, .22, 500); this.tone(100, .3, .14, 'sawtooth', 35); }
    if (type === 'dash') { this.noise(.15, .08, 2300); this.tone(140, .16, .08, 'sine', 650); }
    if (type === 'pickup') this.tone(800, .08, .025, 'sine', 1300);
    if (type === 'pulse') { this.noise(.65, .32, 1700); this.tone(55, .7, .3, 'sine', 25); }
    if (type === 'wave' || type === 'upgrade') [0, .1, .2].forEach((delay, i) => this.tone([220, 330, 440][i], .25, .09, 'triangle', [220, 330, 440][i], this.context ? this.context.currentTime + delay : 0));
    if (type === 'end') this.tone(220, .7, .1, 'triangle', game.state === 'victory' ? 880 : 45);
    if (type === 'pulseReady') [660, 880].forEach((f, i) => this.tone(f, .25, .055, 'sine', f, this.context ? this.context.currentTime + i * .12 : 0));
  }
  music() {
    if (!this.context || !soundEnabled || game.state !== 'playing') { if (this.context) this.nextBeat = this.context.currentTime; return; }
    const now = this.context.currentTime;
    if (this.nextBeat < now - .4) this.nextBeat = now;
    if (this.nextBeat > now + .08) return;
    const notes = [110, 110, 164.81, 130.81, 110, 196, 164.81, 146.83];
    const note = notes[Math.floor(this.beat / 8) % notes.length];
    this.tone(note / 2, .21, .038, 'triangle', note / 2, this.nextBeat);
    if (this.beat % 2 === 0) this.tone(110, .12, .065, 'sine', 35, this.nextBeat);
    if (this.beat % 4 === 2) this.tone(note * [2, 3, 4, 3][Math.floor(this.beat / 4) % 4], .17, .021, 'triangle', note * 2, this.nextBeat);
    this.beat++; this.nextBeat += .235;
  }
}
const synth = new Synth();
function updateSound() { $('sound-label').textContent = soundEnabled ? 'ON' : 'OFF'; $('sound-button').setAttribute('aria-label', soundEnabled ? 'Desactivar sonido' : 'Activar sonido'); if (synth.master) synth.master.gain.setTargetAtTime(soundEnabled ? .6 : 0, synth.context.currentTime, .03); }
updateSound();

function resize() {
  width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  zoom = width < 600 ? .66 : width < 1000 ? .85 : 1;
}
addEventListener('resize', resize); resize();

function polygon(points, fill, stroke, lineWidth = 1) {
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}
function circle(x, y, radius, fill, stroke, lineWidth = 1) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(.01, radius), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}
function glow(x, y, radius, color, strength = 1) {
  ctx.save(); ctx.globalAlpha *= strength;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius); gradient.addColorStop(0, color); gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2); ctx.restore();
}
function drawShip(x, y, angle, scale = 1, thrust = .5, time = visualTime) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  const flame = 20 + thrust * 27 + Math.sin(time * 40) * 5;
  ctx.globalCompositeOperation = 'lighter'; glow(-25, 0, 48 + thrust * 25, '#a6d95b', .16);
  const exhaust = ctx.createLinearGradient(-18, 0, -18 - flame, 0); exhaust.addColorStop(0, '#e6ffac'); exhaust.addColorStop(.28, '#c3ff6999'); exhaust.addColorStop(1, '#75e8ff00');
  polygon([[-18, -7], [-18 - flame, 0], [-18, 7]], exhaust);
  ctx.globalCompositeOperation = 'source-over';
  const shell = ctx.createLinearGradient(0, -25, 0, 25); shell.addColorStop(0, '#647c6c'); shell.addColorStop(.45, '#273c36'); shell.addColorStop(.5, '#172922'); shell.addColorStop(1, '#0e1716');
  ctx.shadowColor = '#d5ff5f'; ctx.shadowBlur = 9;
  polygon([[35, 0], [-28, -29], [-19, -4], [-25, 0], [-19, 4], [-28, 29]], shell, '#bbdc8a', .9);
  ctx.shadowBlur = 0;
  polygon([[35, 0], [-18, -9], [-7, 0]], '#63745f', '#bada85', .55);
  polygon([[35, 0], [-18, 9], [-7, 0]], '#243b2b', '#6f8b5a', .5);
  polygon([[-22, -24], [-15, -8], [5, -5]], '#171e23', '#5c7179', .6);
  polygon([[-22, 24], [-15, 8], [5, 5]], '#0f191d', '#5c7179', .6);
  polygon([[13, 0], [-5, -6], [-12, 0], [-5, 6]], '#d5ff5f', '#efffc5', .7);
  polygon([[9, 0], [-4, -3], [-8, 0], [-4, 3]], '#f4ffd9');
  ctx.shadowColor = colors.cyan; ctx.shadowBlur = 12;
  polygon([[-26, -27], [-20, -13], [-23, -13]], colors.cyan);
  polygon([[-26, 27], [-20, 13], [-23, 13]], colors.cyan);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff66'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(14, 0); ctx.moveTo(-13, -10); ctx.lineTo(-20, -20); ctx.stroke();
  ctx.restore();
}
function drawStars(time, gameplay = false) {
  for (const star of stars) {
    const parallax = gameplay ? .025 : 0;
    const x = ((star.x * width - camera.x * parallax) % width + width) % width;
    const y = ((star.y * height - camera.y * parallax) % height + height) % height;
    ctx.globalAlpha = .2 + (Math.sin(time * .6 + star.phase) + 1) * .17;
    ctx.fillStyle = star.phase % 3 < 1 ? '#aaa1d7' : '#dfdfed'; ctx.fillRect(x, y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
}
function drawMenu(time) {
  ctx.fillStyle = '#09090e'; ctx.fillRect(0, 0, width, height);
  const cx = width * (width < 600 ? .9 : .76), cy = height * (width < 600 ? .33 : .40);
  const size = Math.min(width * .22, height * .32);
  glow(cx, cy, size * 1.8, '#6d3ee0', .17); glow(cx, cy, size * .85, '#c6ef83', .06);
  drawStars(time);
  ctx.save(); ctx.globalAlpha = .065; ctx.strokeStyle = '#9385c1'; ctx.lineWidth = 1;
  const horizon = height * .63;
  for (let i = -8; i < 12; i++) { ctx.beginPath(); ctx.moveTo(width * .7 + i * 30, horizon); ctx.lineTo(width * .7 + i * 180, height); ctx.stroke(); }
  for (let i = 0; i < 8; i++) { const y = horizon + Math.pow(i / 7, 2.3) * (height - horizon); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.25);
  const ringScale = width < 600 ? 1.4 : 1;
  ctx.scale(ringScale, ringScale);
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = i === 1 ? '#a592ef55' : '#7a6ca52c'; ctx.lineWidth = i === 1 ? 1.2 : .7;
    ctx.beginPath(); ctx.ellipse(0, 0, size * (1.05 + i * .25), size * (.52 + i * .12), 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.setLineDash([2, 13]); ctx.strokeStyle = '#d5ff5f55'; ctx.beginPath(); ctx.ellipse(0, 0, size * 1.31, size * .64, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < 3; i++) {
    const a = time * (.12 + i * .035) + i * 2.1;
    ctx.strokeStyle = i === 1 ? '#d5ff5f66' : '#ad98ff66'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, size * (1.2 + i * .26), size * (.59 + i * .12), 0, a, a + .45); ctx.stroke();
    glow(Math.cos(a) * size * (1.2 + i * .26), Math.sin(a) * size * (.59 + i * .12), 12, '#b7a1ff', .3);
  }
  ctx.restore();
  if (width >= 600) {
    ctx.font = '9px monospace'; ctx.fillStyle = '#6b627f'; ctx.fillText('X: 08.142 / Y: 91.007', cx - size * .9, cy - size * .76);
    const shipScale = Math.min(size / 50, 5);
    drawShip(cx + Math.sin(time * .6) * 9, cy + Math.cos(time * .8) * 12, -.62 + Math.sin(time * .3) * .05, shipScale, .6, time);
    ctx.strokeStyle = '#d5ff5f44'; ctx.lineWidth = .6;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = cx + sx * size * .69, y = cy + sy * size * .55; ctx.beginPath(); ctx.moveTo(x, y - sy * 16); ctx.lineTo(x, y); ctx.lineTo(x - sx * 16, y); ctx.stroke(); }
  } else {
    ctx.save(); ctx.globalAlpha = .2; drawShip(cx, cy, -.7, 2.4, .5, time); ctx.restore();
  }
}
function drawFloor() {
  ctx.strokeStyle = '#8b81c416'; ctx.lineWidth = .6;
  const left = camera.x - width / zoom / 2, top = camera.y - height / zoom / 2;
  for (let x = Math.floor(left / 100) * 100; x < left + width / zoom; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke(); }
  for (let y = Math.floor(top / 100) * 100; y < top + height / zoom; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke(); }
  ctx.strokeStyle = '#81809216';
  for (const r of [160, 360, 600]) { ctx.setLineDash([4, 14]); circle(1100, 750, r, null, '#7e6daa22'); }
  ctx.setLineDash([]);
  ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#8c7dc726'; ctx.fillText('N E O N   R I F T', 1100, 710); ctx.fillText('S E C T O R   0' + game.wave, 1100, 800); ctx.textAlign = 'left';
  for (const rock of debris) {
    if (Math.abs(rock.x - camera.x) > width / zoom / 2 + 80 || Math.abs(rock.y - camera.y) > height / zoom / 2 + 80) continue;
    ctx.save(); ctx.translate(rock.x, rock.y); ctx.rotate(rock.angle);
    const r = rock.radius; polygon([[r, 0], [r * .3, r * .6], [-r * .5, r * .4], [-r * .8, -r * .3], [r * .2, -r * .7]], '#12121e', '#272436', .6); ctx.restore();
  }
  ctx.lineWidth = 3; ctx.strokeStyle = '#a18be755'; ctx.strokeRect(20, 20, WORLD.width - 40, WORLD.height - 40);
  ctx.lineWidth = 1; ctx.strokeStyle = '#51466c55'; ctx.strokeRect(8, 8, WORLD.width - 16, WORLD.height - 16);
  for (let x = 50; x < WORLD.width; x += 80) { ctx.fillStyle = '#d5ff5f33'; ctx.fillRect(x, 17, 20, 6); ctx.fillRect(x, WORLD.height - 23, 20, 6); }
  for (let y = 50; y < WORLD.height; y += 80) { ctx.fillStyle = '#d5ff5f33'; ctx.fillRect(17, y, 6, 20); ctx.fillRect(WORLD.width - 23, y, 6, 20); }
}
function drawEnemy(enemy) {
  const { x, y, radius: r, type, angle } = enemy;
  const color = type === 'brute' ? colors.orange : type === 'gunner' ? colors.violet : colors.pink;
  glow(x, y, r * 2.7, color, .09);
  ctx.save(); ctx.translate(x, y); ctx.rotate(type === 'boss' ? enemy.age * .25 : angle);
  ctx.shadowColor = color; ctx.shadowBlur = enemy.flash > 0 ? 20 : 7;
  const fill = enemy.flash > 0 ? '#f6eeee' : type === 'brute' ? '#382623' : type === 'gunner' ? '#292135' : '#371927';
  if (type === 'boss') {
    for (let layer = 0; layer < 3; layer++) {
      ctx.save(); ctx.rotate(enemy.age * (layer % 2 ? -.35 : .3) + layer * Math.PI / 6);
      const radius = r * (1 + layer * .23); const points = Array.from({ length: 6 }, (_, i) => [Math.cos(i * Math.PI / 3) * radius, Math.sin(i * Math.PI / 3) * radius]);
      polygon(points, layer === 0 ? '#331126' : null, layer === 1 ? '#ff547e66' : '#ff547e', layer === 0 ? 2 : 1); ctx.restore();
    }
    circle(0, 0, r * .56, '#1b0a19', '#ff91b6', 2);
    const pulse = .8 + Math.sin(enemy.age * 4) * .1;
    glow(0, 0, 55, '#ff397d', .3);
    polygon([[0, -27 * pulse], [22 * pulse, 0], [0, 27 * pulse], [-22 * pulse, 0]], '#ff6a94', '#ffdbe5', 2);
  } else if (type === 'seeker') {
    polygon([[r + 5, 0], [-r, -r], [-r * .45, 0], [-r, r]], fill, color, 1.4);
    polygon([[r * .6, 0], [-r * .25, -4], [-r * .25, 4]], color);
  } else if (type === 'gunner') {
    polygon([[r, 0], [0, r], [-r, 0], [0, -r]], fill, color, 1.5);
    circle(0, 0, 7, color); ctx.fillStyle = '#e6d9ff'; ctx.fillRect(5, -3, r + 4, 6);
    ctx.rotate(-enemy.age * 1.5); ctx.setLineDash([4, 7]); circle(0, 0, r + 7, null, '#b39aff66'); ctx.setLineDash([]);
  } else {
    polygon(Array.from({ length: 6 }, (_, i) => [Math.cos(i * Math.PI / 3) * r, Math.sin(i * Math.PI / 3) * r]), fill, color, 2);
    polygon([[13, 0], [0, 12], [-13, 0], [0, -12]], '#ffb269', '#ffe3a5', 1);
    ctx.strokeStyle = '#ffe3a566'; ctx.strokeRect(-r - 5, -12, 8, 24);
  }
  ctx.shadowBlur = 0; ctx.restore();
  if (enemy.hp < enemy.maxHp && type !== 'boss') {
    ctx.fillStyle = '#ffffff12'; ctx.fillRect(x - r, y - r - 12, r * 2, 2); ctx.fillStyle = color; ctx.fillRect(x - r, y - r - 12, r * 2 * enemy.hp / enemy.maxHp, 2);
  }
}
function addBurst(x, y, color, count = 15, strength = 1) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, speed = (45 + Math.random() * 180) * strength;
    particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .25 + Math.random() * .55, maxLife: .8, size: 1 + Math.random() * 2.5, color });
  }
  if (particles.length > 650) particles.splice(0, particles.length - 650);
}
function processEvents() {
  for (const event of game.events.splice(0)) {
    synth.event(event.type);
    if (event.type === 'kill') {
      const color = event.enemyType === 'brute' ? colors.orange : event.enemyType === 'gunner' ? colors.violet : colors.pink;
      addBurst(event.x, event.y, color, event.size > 50 ? 70 : 23, event.size > 50 ? 2.5 : 1);
      addBurst(event.x, event.y, colors.lime, 6); rings.push({ x: event.x, y: event.y, radius: 5, target: event.size * 3.5, life: .45, maxLife: .45, color });
      texts.push({ x: event.x, y: event.y - 20, text: '+' + event.value, color: colors.lime, life: .8 }); shake = Math.max(shake, event.size > 50 ? 16 : 3);
    }
    if (event.type === 'hit') addBurst(event.x, event.y, '#fff1ed', 4, .6);
    if (event.type === 'damage') { shake = 12; damageFlash = .35; addBurst(event.x, event.y, colors.pink, 20); }
    if (event.type === 'shot') addBurst(event.x + Math.cos(event.angle) * 25, event.y + Math.sin(event.angle) * 25, colors.lime, 2, .2);
    if (event.type === 'dash') { addBurst(event.x, event.y, colors.cyan, 20, 1.2); shake = Math.max(shake, 3); }
    if (event.type === 'pulse') { shake = 15; rings.push({ x: event.x, y: event.y, radius: 5, target: event.radius, life: .65, maxLife: .65, color: colors.cyan }); addBurst(event.x, event.y, colors.cyan, 50, 2); }
    if (event.type === 'spawn') rings.push({ x: event.x, y: event.y, radius: event.size * 2, target: event.size * .5, life: .5, maxLife: .5, color: '#ff547e' });
    if (event.type === 'wave') {
      $('announcement-kicker').textContent = `INCURSIÓN // SECTOR ${String(event.wave).padStart(2, '0')}`;
      $('announcement-title').textContent = event.name;
      $('announcement-subtitle').textContent = event.wave === 6 ? 'DESTRUYE EL NÚCLEO. TERMINA LO QUE EMPEZASTE.' : 'NINGÚN PILOTO SE QUEDA ATRÁS.';
      announcementTime = 2.3; $('wave-announcement').classList.add('visible');
    }
    if (event.type === 'pulseReady') showToast(mobile ? 'COLAPSO LISTO · TOCA PULSO' : 'COLAPSO LISTO · PULSA E');
    if (event.type === 'waveClear') showUpgrades();
    if (event.type === 'boss') showToast('ENTIDAD Ω DETECTADA');
    if (event.type === 'end') {
      pendingEnd = { victory: event.victory, delay: event.victory ? .8 : .35 };
      if (event.victory) { shake = 22; rings.push({ x: game.boss.x, y: game.boss.y, radius: 1, target: 600, life: 1.2, maxLife: 1.2, color: colors.lime }); }
      else addBurst(game.player.x, game.player.y, colors.lime, 45, 1.8);
    }
  }
}
function showToast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); toastTime = 2.6; }
function drawCombat(time, dt) {
  ctx.fillStyle = '#0a0a13'; ctx.fillRect(0, 0, width, height);
  glow(width * .55, height * .55, Math.max(width, height) * .7, '#392269', .09);
  drawStars(time, true);
  if (!reducedMotion) { camera.x += (game.player.x - camera.x) * Math.min(1, dt * 9); camera.y += (game.player.y - camera.y) * Math.min(1, dt * 9); }
  else { camera.x = game.player.x; camera.y = game.player.y; }
  const shakeX = reducedMotion ? 0 : (Math.random() - .5) * shake, shakeY = reducedMotion ? 0 : (Math.random() - .5) * shake;
  ctx.save(); ctx.translate(width / 2 + shakeX, height * .55 + shakeY); ctx.scale(zoom, zoom); ctx.translate(-camera.x, -camera.y);
  drawFloor();
  for (const pickup of game.pickups) {
    const color = pickup.type === 'health' ? colors.lime : colors.cyan;
    glow(pickup.x, pickup.y, 22, color, .13); ctx.save(); ctx.translate(pickup.x, pickup.y); ctx.rotate(time * 1.5);
    if (pickup.type === 'health') { ctx.fillStyle = color; ctx.fillRect(-6, -2, 12, 4); ctx.fillRect(-2, -6, 4, 12); }
    else polygon([[0, -7], [4, 0], [0, 7], [-4, 0]], '#182d34', color, 1.2);
    ctx.restore();
  }
  for (const ghost of ghosts) { ctx.globalAlpha = ghost.life * 1.8; drawShip(ghost.x, ghost.y, ghost.angle, .68, .1); } ctx.globalAlpha = 1;
  for (const enemy of game.enemies) drawEnemy(enemy);
  for (const bullet of game.bullets) {
    const color = bullet.enemy ? colors.pink : bullet.drone ? colors.cyan : colors.lime;
    ctx.shadowColor = color; ctx.shadowBlur = bullet.enemy ? 13 : 8;
    if (bullet.enemy) { circle(bullet.x, bullet.y, bullet.radius, '#ffc2d3', color, 1); }
    else { const a = Math.atan2(bullet.vy, bullet.vx); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bullet.x - Math.cos(a) * 18, bullet.y - Math.sin(a) * 18); ctx.lineTo(bullet.x, bullet.y); ctx.stroke(); }
  }
  ctx.shadowBlur = 0;
  for (const ring of rings) { ctx.globalAlpha = ring.life / ring.maxLife; circle(ring.x, ring.y, ring.radius, null, ring.color, 2); } ctx.globalAlpha = 1;
  const p = game.player;
  if (game.state !== 'dead') {
    if (p.pulse >= 100) { ctx.setLineDash([4, 8]); circle(p.x, p.y, 37 + Math.sin(time * 4) * 2, null, '#75e8ff77'); ctx.setLineDash([]); }
    if (p.invulnerable > 0 && p.dashTime <= 0) ctx.globalAlpha = .6 + Math.sin(time * 35) * .3;
    glow(p.x, p.y, 65, '#d5ff5f', .1);
    drawShip(p.x, p.y, p.angle, .7, Math.hypot(p.vx, p.vy) / 280);
    ctx.globalAlpha = 1;
    for (let i = 0; i < game.stats.drones; i++) {
      const a = game.time * 2.2 + i * Math.PI * 2 / game.stats.drones;
      const x = p.x + Math.cos(a) * 44, y = p.y + Math.sin(a) * 44;
      ctx.strokeStyle = '#75e8ff22'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(x, y); ctx.stroke();
      polygon([[x, y - 7], [x + 7, y], [x, y + 7], [x - 7, y]], '#182932', colors.cyan);
    }
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const particle of particles) { ctx.globalAlpha = Math.min(1, particle.life * 2); ctx.strokeStyle = particle.color; ctx.lineWidth = particle.size; ctx.beginPath(); ctx.moveTo(particle.x, particle.y); ctx.lineTo(particle.x - particle.vx * .025, particle.y - particle.vy * .025); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
  for (const text of texts) { ctx.globalAlpha = Math.min(1, text.life * 2); ctx.fillStyle = text.color; ctx.fillText(text.text, text.x, text.y); } ctx.globalAlpha = 1; ctx.textAlign = 'left';
  ctx.restore();
  drawEnemyArrows();
  if (!mobile && game.state === 'playing' && pointer.moved) {
    ctx.save(); ctx.translate(pointer.x, pointer.y); ctx.strokeStyle = '#d5ff5f99'; ctx.lineWidth = 1;
    circle(0, 0, pointer.down ? 7 : 10, null, '#d5ff5f77');
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(19, 0); ctx.stroke(); }
    circle(0, 0, 1.5, colors.lime); ctx.restore();
  }
  if (damageFlash > 0) { ctx.fillStyle = `rgba(255,40,90,${damageFlash * .25})`; ctx.fillRect(0, 0, width, height); }
}
function drawEnemyArrows() {
  for (const enemy of game.enemies.slice(0, 8)) {
    const sx = (enemy.x - camera.x) * zoom + width / 2, sy = (enemy.y - camera.y) * zoom + height * .55;
    if (sx > 20 && sx < width - 20 && sy > 80 && sy < height - 20) continue;
    const dx = sx - width / 2, dy = sy - height * .55, a = Math.atan2(dy, dx);
    const rx = (width / 2 - 25) / Math.max(Math.abs(dx), 1), ry = (height * .39 - 40) / Math.max(Math.abs(dy), 1), ratio = Math.min(rx, ry);
    ctx.save(); ctx.translate(width / 2 + dx * ratio, height * .55 + dy * ratio); ctx.rotate(a);
    polygon([[6, 0], [-5, -4], [-5, 4]], enemy.type === 'boss' ? colors.pink : '#ff547e88'); ctx.restore();
  }
}
function updateEffects(dt) {
  if (pendingEnd) { pendingEnd.delay -= dt; if (pendingEnd.delay <= 0) { const victory = pendingEnd.victory; pendingEnd = null; showEnd(victory); } }
  shake = Math.max(0, shake - dt * 35); damageFlash = Math.max(0, damageFlash - dt);
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.exp(-dt * 3); p.vy *= Math.exp(-dt * 3); p.life -= dt; }
  particles = particles.filter(p => p.life > 0);
  for (const ring of rings) { ring.life -= dt; ring.radius += (ring.target - ring.radius) * dt * 9; } rings = rings.filter(r => r.life > 0);
  for (const text of texts) { text.life -= dt; text.y -= dt * 35; } texts = texts.filter(t => t.life > 0);
  for (const ghost of ghosts) ghost.life -= dt; ghosts = ghosts.filter(g => g.life > 0);
  if (game.player.dashTime > 0 && game.state === 'playing') ghosts.push({ x: game.player.x, y: game.player.y, angle: game.player.angle, life: .25 });
  announcementTime -= dt; if (announcementTime <= 0) $('wave-announcement').classList.remove('visible');
  toastTime -= dt; if (toastTime <= 0) $('toast').classList.remove('visible');
}
function updateHud() {
  const p = game.player;
  $('health-number').textContent = Math.ceil(p.hp); $('health-fill').style.width = `${p.hp / p.maxHp * 100}%`;
  $('hud').classList.toggle('danger', p.hp <= p.maxHp * .25);
  $('dash-fill').style.width = `${Math.max(0, 1 - p.dashCooldown / game.stats.dashInterval) * 100}%`;
  $('pulse-fill').style.width = `${p.pulse}%`; document.querySelector('.pulse-ability').classList.toggle('ready', p.pulse >= 100);
  $('wave-number').textContent = `${String(game.wave).padStart(2, '0')} / 06`;
  $('wave-fill').style.width = `${Math.min(100, game.waveKills / game.waveQuota * 100)}%`;
  $('wave-objective').textContent = game.wave === 6 ? 'DESTRUYE EL NÚCLEO' : `${game.waveKills} / ${game.waveQuota} HOSTILES ELIMINADOS`;
  $('score').textContent = String(game.score).padStart(6, '0'); $('combo').textContent = '×' + game.combo.toFixed(game.combo % 1 ? 2 : 0);
  $('run-time').textContent = clock(game.time); $('kills-label').textContent = `${game.kills} HOSTILES ELIMINADOS`;
  $('boss-hud').hidden = !game.boss || game.boss.hp <= 0;
  if (game.boss) $('boss-fill').style.width = `${Math.max(0, game.boss.hp / game.boss.maxHp * 100)}%`;
  $('touch-dash').disabled = p.dashCooldown > 0; $('touch-pulse').disabled = p.pulse < 100;
  drawRadar();
}
function drawRadar() {
  radar.clearRect(0, 0, 180, 120); radar.strokeStyle = '#ffffff09'; radar.lineWidth = 1;
  for (let x = 0; x < 180; x += 30) { radar.beginPath(); radar.moveTo(x, 0); radar.lineTo(x, 120); radar.stroke(); }
  for (let y = 0; y < 120; y += 30) { radar.beginPath(); radar.moveTo(0, y); radar.lineTo(180, y); radar.stroke(); }
  for (const enemy of game.enemies) { radar.fillStyle = colors.pink; radar.beginPath(); radar.arc(enemy.x / WORLD.width * 180, enemy.y / WORLD.height * 120, enemy.type === 'boss' ? 4 : 2, 0, Math.PI * 2); radar.fill(); }
  radar.fillStyle = colors.lime; radar.beginPath(); radar.arc(game.player.x / WORLD.width * 180, game.player.y / WORLD.height * 120, 3, 0, Math.PI * 2); radar.fill();
  radar.font = '6px monospace'; radar.fillStyle = '#aaa1bf'; radar.fillText('RADAR // LIVE', 5, 10);
}
function clearInput() { keyState.clear(); pointer.down = false; touch.x = 0; touch.y = 0; touch.pointerId = null; $('joystick-knob').style.transform = ''; dashQueued = false; pulseQueued = false; }
function hideOverlays() { ['menu', 'pause-screen', 'upgrade-screen', 'end-screen'].forEach(id => $(id).hidden = true); }
function startGame() {
  synth.init(); clearInput(); hideOverlays(); particles = []; rings = []; ghosts = []; texts = []; shake = 0; damageFlash = 0; pendingEnd = null;
  game.start(); camera.x = game.player.x; camera.y = game.player.y;
  $('hud').hidden = false; $('pause-button').hidden = false; $('touch-controls').hidden = !mobile;
  $('connection-label').textContent = 'INCURSIÓN ACTIVA'; document.body.classList.add('playing');
  $('loadout').textContent = ''; processEvents(); updateHud(); canvas.focus();
}
function backToMenu() {
  game.reset(); pendingEnd = null; clearInput(); hideOverlays(); $('menu').hidden = false; $('hud').hidden = true; $('pause-button').hidden = true; $('touch-controls').hidden = true;
  $('connection-label').textContent = 'SISTEMA EN LÍNEA'; document.body.classList.remove('playing'); $('menu-best').textContent = String(best).padStart(6, '0'); $('start-button').focus();
}
function pauseGame() {
  if (game.state !== 'playing') return;
  game.state = 'paused'; clearInput(); $('pause-screen').hidden = false; $('touch-controls').hidden = true; document.body.classList.remove('playing'); $('resume-button').focus();
}
function resumeGame() {
  if (game.state !== 'paused') return;
  game.state = 'playing'; clearInput(); $('pause-screen').hidden = true; $('touch-controls').hidden = !mobile; document.body.classList.add('playing'); synth.init();
}
function togglePause() { if ($('help-dialog').open) { $('help-dialog').close(); return; } if (game.state === 'paused') resumeGame(); else pauseGame(); }
function showUpgrades() {
  clearInput(); document.body.classList.remove('playing'); $('touch-controls').hidden = true; $('upgrade-screen').hidden = false;
  $('upgrade-cards').replaceChildren();
  game.choices.forEach((upgrade, index) => {
    const button = document.createElement('button'); button.className = 'upgrade-card'; button.dataset.upgrade = upgrade.id;
    button.innerHTML = `<span class="upgrade-icon">${upgradeIcon(upgrade.id)}</span><span class="upgrade-tag">${upgrade.tag}</span><strong>${upgrade.name}</strong><p>${upgrade.description}</p><span class="choice-key">0${index + 1}</span><span class="card-arrow">↗</span>`;
    button.addEventListener('click', () => selectUpgrade(upgrade.id)); $('upgrade-cards').append(button);
  });
  $('upgrade-cards').querySelector('button')?.focus();
}
function upgradeIcon(id) {
  const paths = {
    damage: '<circle cx="16" cy="16" r="5"/><path d="M16 2v6m0 16v6M2 16h6m16 0h6M6 6l4 4m12 12 4 4M6 26l4-4m12-12 4-4"/>',
    rapid: '<path d="m4 6 10 10L4 26m8-20 10 10-10 10m8-20 10 10-10 10"/>',
    spread: '<path d="M16 29V14M16 20 4 8m12 12L28 8M16 3v11M1 8h7V1m16 0v7h7m-20 0 5-5 5 5"/>',
    speed: '<path d="m19 2-14 17h10l-2 11 14-18H17z"/>',
    health: '<circle cx="16" cy="16" r="13"/><path d="M16 8v16M8 16h16"/>',
    pierce: '<path d="M2 16h28m-8-8 8 8-8 8M9 4v8m0 8v8M17 4v8m0 8v8"/>',
    drone: '<path d="m16 2 14 14-14 14L2 16zM16 9l7 7-7 7-7-7z"/>',
    pulse: '<circle cx="16" cy="16" r="4"/><circle cx="16" cy="16" r="10"/><path d="M16 1a15 15 0 0 1 15 15M16 31A15 15 0 0 1 1 16"/>',
  };
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id]}</svg>`;
}
function selectUpgrade(id) {
  if (!game.chooseUpgrade(id)) return;
  $('upgrade-screen').hidden = true; $('touch-controls').hidden = !mobile; document.body.classList.add('playing'); clearInput();
  const counts = new Map(); game.upgrades.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
  $('loadout').textContent = [...counts].map(([id, count]) => UPGRADES.find(u => u.id === id).name + (count > 1 ? ` ×${count}` : '')).join(' / ');
  processEvents(); updateHud();
}
function showEnd(victory) {
  clearInput(); document.body.classList.remove('playing'); $('touch-controls').hidden = true; $('end-screen').hidden = false; $('pause-button').hidden = true;
  $('end-title').innerHTML = victory ? 'ROMPISTE<br><em>EL VACÍO.</em>' : 'EL VACÍO<br><em>RECLAMA.</em>';
  $('end-kicker').textContent = victory ? 'NÚCLEO DESTRUIDO // MISIÓN CUMPLIDA' : 'SEÑAL PERDIDA // NR—01';
  $('end-description').textContent = victory ? 'Seis sectores. Un piloto. El silencio después del caos es tuyo.' : 'Una incursión más. Una razón para volver.';
  $('end-score').textContent = game.score.toLocaleString('es'); $('end-wave').textContent = `${game.wave}/6`; $('end-kills').textContent = game.kills; $('end-time').textContent = clock(game.time);
  $('new-record').hidden = game.score <= best;
  if (game.score > best) { best = game.score; try { localStorage.setItem('neon-rift-best', String(best)); } catch { /* Optional persistence. */ } }
  $('retry-button').focus();
}
$('start-button').addEventListener('click', startGame); $('retry-button').addEventListener('click', startGame);
$('menu-button').addEventListener('click', backToMenu); $('quit-button').addEventListener('click', backToMenu);
$('pause-button').addEventListener('click', togglePause); $('resume-button').addEventListener('click', resumeGame);
$('sound-button').addEventListener('click', () => { synth.init(); soundEnabled = !soundEnabled; updateSound(); try { localStorage.setItem('neon-rift-sound', soundEnabled ? 'on' : 'off'); } catch { /* Optional persistence. */ } });
$('help-button').addEventListener('click', () => { helpPaused = game.state === 'playing'; if (helpPaused) { pauseGame(); $('pause-screen').hidden = true; } $('help-dialog').showModal(); });
$('close-help').addEventListener('click', () => $('help-dialog').close()); $('got-it').addEventListener('click', () => $('help-dialog').close());
$('help-dialog').addEventListener('close', () => { if (helpPaused) resumeGame(); helpPaused = false; });

addEventListener('keydown', event => {
  const relevant = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','KeyE','KeyF','Escape','KeyP','Digit1','Digit2','Digit3'];
  if (!relevant.includes(event.code) || $('help-dialog').open) return;
  if (game.state === 'playing') event.preventDefault();
  if (event.repeat) return;
  if (['Escape', 'KeyP'].includes(event.code)) { togglePause(); return; }
  if (game.state === 'upgrade' && ['Digit1', 'Digit2', 'Digit3'].includes(event.code)) { const choice = game.choices[Number(event.code.slice(-1)) - 1]; if (choice) selectUpgrade(choice.id); return; }
  keyState.add(event.code);
  if (['Space', 'ShiftLeft', 'ShiftRight'].includes(event.code) && game.state === 'playing') dashQueued = true;
  if (event.code === 'KeyE' && game.state === 'playing') { pulseQueued = true; if (game.player.pulse < 100) showToast('RAMPA DE COLAPSO · RECOGE FRAGMENTOS AZULES'); }
});
addEventListener('keyup', event => keyState.delete(event.code));
addEventListener('blur', () => { clearInput(); pauseGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); pauseGame(); } });
canvas.addEventListener('pointermove', event => { if (event.pointerType !== 'touch') { pointer.x = event.clientX; pointer.y = event.clientY; pointer.moved = true; } });
canvas.addEventListener('pointerdown', event => {
  if (game.state !== 'playing' || event.pointerType === 'touch') return;
  pointer.x = event.clientX; pointer.y = event.clientY; pointer.moved = true;
  if (event.button === 0) { pointer.down = true; canvas.setPointerCapture(event.pointerId); }
  if (event.button === 2) dashQueued = true;
});
canvas.addEventListener('contextmenu', event => event.preventDefault());
addEventListener('pointerup', event => { if (event.button === 0 && event.pointerType !== 'touch') pointer.down = false; });
canvas.addEventListener('pointercancel', () => pointer.down = false);
const joystick = $('joystick');
function moveJoystick(event) {
  const rect = joystick.getBoundingClientRect(); let dx = event.clientX - rect.left - rect.width / 2, dy = event.clientY - rect.top - rect.height / 2;
  const length = Math.hypot(dx, dy); const range = 37;
  if (length > range) { dx *= range / length; dy *= range / length; }
  touch.x = dx / range; touch.y = dy / range; $('joystick-knob').style.transform = `translate(${dx}px, ${dy}px)`;
}
joystick.addEventListener('pointerdown', event => { if (touch.pointerId !== null) return; touch.pointerId = event.pointerId; joystick.setPointerCapture(event.pointerId); moveJoystick(event); event.preventDefault(); });
joystick.addEventListener('pointermove', event => { if (event.pointerId === touch.pointerId) moveJoystick(event); });
function releaseJoystick(event) { if (event.pointerId === touch.pointerId) { touch.x = 0; touch.y = 0; touch.pointerId = null; $('joystick-knob').style.transform = ''; } }
joystick.addEventListener('pointerup', releaseJoystick); joystick.addEventListener('pointercancel', releaseJoystick); joystick.addEventListener('lostpointercapture', releaseJoystick);
$('touch-dash').addEventListener('pointerdown', event => { event.preventDefault(); dashQueued = true; });
$('touch-pulse').addEventListener('pointerdown', event => { event.preventDefault(); pulseQueued = true; });

function frame(now) {
  const dt = Math.min(.04, (now - lastFrame) / 1000); lastFrame = now; visualTime += dt;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (game.state === 'menu') drawMenu(reducedMotion ? 0 : visualTime);
  else {
    const input = {
      x: (keyState.has('KeyD') || keyState.has('ArrowRight') ? 1 : 0) - (keyState.has('KeyA') || keyState.has('ArrowLeft') ? 1 : 0) + touch.x,
      y: (keyState.has('KeyS') || keyState.has('ArrowDown') ? 1 : 0) - (keyState.has('KeyW') || keyState.has('ArrowUp') ? 1 : 0) + touch.y,
      fire: pointer.down || keyState.has('KeyF'), autoAim: mobile,
      dash: dashQueued, pulse: pulseQueued,
    };
    if (pointer.moved && !mobile) { input.aimX = (pointer.x - width / 2) / zoom + camera.x; input.aimY = (pointer.y - height * .55) / zoom + camera.y; }
    game.update(dt, input); dashQueued = false; pulseQueued = false;
    processEvents(); updateEffects(dt); drawCombat(visualTime, dt);
    hudTimer -= dt; if (hudTimer <= 0) { updateHud(); hudTimer = .06; }
  }
  synth.music(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
