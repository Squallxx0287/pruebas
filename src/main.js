import { CUSHIONS, POCKETS, TABLE, predictAim } from './physics.js';
import { PoolGame } from './game.js';

const $ = selector => document.querySelector(selector);
const canvas = $('#table');
const ctx = canvas.getContext('2d');
const game = new PoolGame();
const view = { x: 100, y: 75, width: 1000, height: 500 };
let aimAngle = 0;
let power = 0.48;
let topSpin = 0;
let sideSpin = 0;
let soundsOn = true;
let audioContext;
let lastFrame = performance.now();
let accumulator = 0;
let lastCollisionCount = 0;
let lastPocketCount = 0;
let lastPhase = game.phase;
let placement = null;

function tone(frequency, duration, volume, type = 'sine') {
  if (!soundsOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency * 0.55), audioContext.currentTime + duration);
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  } catch { /* Audio is optional if the browser blocks it. */ }
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(1200 * dpr);
  canvas.height = Math.round(650 * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function roundedRect(x, y, width, height, radius, fill, stroke, lineWidth = 1) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
}

function drawTable() {
  ctx.clearRect(0, 0, 1200, 650);
  const outer = ctx.createLinearGradient(0, 0, 1200, 650);
  outer.addColorStop(0, '#3b2315'); outer.addColorStop(0.42, '#8e5d34'); outer.addColorStop(1, '#342012');
  roundedRect(9, 9, 1182, 632, 38, '#0a0d0c');
  roundedRect(15, 15, 1170, 620, 34, outer, '#b4834d', 3);
  roundedRect(32, 32, 1136, 586, 24, '#16271f', '#21130c', 13);
  roundedRect(49, 49, 1102, 552, 13, '#081c18', '#c5985a', 2);
  const felt = ctx.createRadialGradient(510, 270, 40, 600, 330, 680);
  felt.addColorStop(0, '#1d6b58'); felt.addColorStop(0.6, '#125240'); felt.addColorStop(1, '#073127');
  roundedRect(view.x - 1, view.y - 1, view.width + 2, view.height + 2, 2, felt);
  // Subtle cloth grain and precise head string / foot spot.
  ctx.save(); ctx.globalAlpha = 0.035; ctx.fillStyle = '#e4fff0';
  for (let y = 77; y < 575; y += 5) for (let x = 102; x < 1100; x += 5) if ((x * 17 + y * 31) % 7 < 3) ctx.fillRect(x, y, 1, 1);
  ctx.restore();
  ctx.strokeStyle = 'rgba(222,244,221,.16)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(350, 76); ctx.lineTo(350, 574); ctx.stroke();
  ctx.fillStyle = 'rgba(244,240,211,.32)';
  for (const [x, y] of [[350, 325], [790, 325]]) { ctx.beginPath(); ctx.arc(x, y, 2.7, 0, Math.PI * 2); ctx.fill(); }
  // Draw the same cushion faces used by the collision solver.
  for (const { x1, y1, x2, y2, nx, ny } of CUSHIONS) {
    ctx.lineCap = 'round'; ctx.strokeStyle = '#0a392e'; ctx.lineWidth = 19;
    ctx.beginPath();
    ctx.moveTo(view.x + x1 - nx * 9.5, view.y + y1 - ny * 9.5);
    ctx.lineTo(view.x + x2 - nx * 9.5, view.y + y2 - ny * 9.5); ctx.stroke();
    ctx.strokeStyle = '#3ca27b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(view.x + x1, view.y + y1);
    ctx.lineTo(view.x + x2, view.y + y2); ctx.stroke();
  }
  for (let i = 1; i < 8; i++) {
    const x = 100 + i * 125;
    for (const y of [42, 608]) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#d7bb81'; ctx.fillRect(-3, -3, 6, 6); ctx.restore(); }
  }
  for (let i = 1; i < 4; i++) {
    const y = 75 + i * 125;
    for (const x of [41, 1159]) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#d7bb81'; ctx.fillRect(-3, -3, 6, 6); ctx.restore(); }
  }
  for (const hole of POCKETS) {
    const x = view.x + hole.x, y = view.y + hole.y;
    const shadow = ctx.createRadialGradient(x, y, 3, x, y, hole.r + 13);
    shadow.addColorStop(0, '#020706'); shadow.addColorStop(0.65, '#030a09'); shadow.addColorStop(0.72, '#ad8350'); shadow.addColorStop(0.9, '#281c13'); shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow; ctx.beginPath(); ctx.arc(x, y, hole.r + 13, 0, Math.PI * 2); ctx.fill();
  }
}

const ballColors = ['#f7f3e9', '#e8b936', '#1c72bb', '#bd424d', '#704da3', '#df7d2a', '#2d8066', '#872f30', '#16191d', '#e8b936', '#1c72bb', '#bd424d', '#704da3', '#df7d2a', '#2d8066', '#872f30'];

function drawBall(ball) {
  const x = view.x + ball.x, y = view.y + ball.y, r = TABLE.radius;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 4, r + 1.5, r * 0.82, 0, 0, Math.PI * 2); ctx.fill();
  const gradient = ctx.createRadialGradient(x - 4, y - 5, 1, x, y, r + 3);
  gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(0.22, ballColors[ball.number]); gradient.addColorStop(0.7, ballColors[ball.number]); gradient.addColorStop(1, '#111617');
  ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  if (ball.number >= 9) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 0.6, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = 'rgba(255,252,239,.92)'; ctx.fillRect(x - r, y - r, r * 2, r * .62); ctx.fillRect(x - r, y + r * .38, r * 2, r * .62);
    ctx.restore();
  }
  if (ball.number !== 0) {
    ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.arc(x, y, r * .55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#151b1b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${ball.number > 9 ? 8 : 9}px Arial`;
    ctx.fillText(ball.number, x, y + .3);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x - 3.5, y - 3.8, 2.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawAim() {
  if (game.phase !== 'aim' || game.ballInHand) return;
  const cue = game.cueBall();
  const dx = Math.cos(aimAngle), dy = Math.sin(aimAngle);
  const hit = predictAim(cue, game.balls, aimAngle);
  const x = view.x + cue.x, y = view.y + cue.y;
  const endX = x + dx * hit.t, endY = y + dy * hit.t;
  ctx.save();
  ctx.setLineDash([7, 8]); ctx.strokeStyle = 'rgba(247,246,216,.78)'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(x + dx * 15, y + dy * 15); ctx.lineTo(endX, endY); ctx.stroke(); ctx.setLineDash([]);
  if (hit.ball && hit.t < 1100) {
    ctx.strokeStyle = 'rgba(255,255,230,.82)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(endX, endY, TABLE.radius, 0, Math.PI * 2); ctx.stroke();
    const vx = hit.ball.x - (endX - view.x), vy = hit.ball.y - (endY - view.y);
    const length = Math.hypot(vx, vy) || 1;
    ctx.strokeStyle = 'rgba(239,199,117,.65)'; ctx.setLineDash([4, 5]);
    ctx.beginPath(); ctx.moveTo(view.x + hit.ball.x, view.y + hit.ball.y); ctx.lineTo(view.x + hit.ball.x + vx / length * 85, view.y + hit.ball.y + vy / length * 85); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.translate(x, y); ctx.rotate(aimAngle);
  const cueGradient = ctx.createLinearGradient(-210, 0, -22, 0);
  cueGradient.addColorStop(0, '#3d2116'); cueGradient.addColorStop(.23, '#e1ad68'); cueGradient.addColorStop(.8, '#e3c992'); cueGradient.addColorStop(1, '#eee1bd');
  roundedRect(-220 - power * 15, -3.7, 194, 7.4, 3, cueGradient, '#332319', 0.6);
  roundedRect(-26 - power * 15, -3, 8, 6, 2, '#24489b');
  ctx.restore();
}

function drawPlacement() {
  if (!game.ballInHand) return;
  const [px, py] = placement || game.findCueSpot();
  const valid = game.canPlace(px, py);
  ctx.save(); ctx.setLineDash([4, 5]); ctx.lineWidth = 1.8; ctx.strokeStyle = valid ? '#dfc178' : '#ff746b';
  ctx.beginPath(); ctx.arc(view.x + px, view.y + py, TABLE.radius + 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = .78; drawBall({ number: 0, x: px, y: py }); ctx.restore();
}

function draw() {
  drawTable(); drawAim();
  for (const ball of game.balls) if (!ball.pocketed) drawBall(ball);
  drawPlacement();
  if (game.phase === 'finished') {
    roundedRect(338, 256, 524, 137, 18, 'rgba(5,18,17,.91)', '#d7ae68', 2);
    ctx.fillStyle = '#d9b778'; ctx.textAlign = 'center'; ctx.font = '13px Arial'; ctx.fillText('PARTIDA TERMINADA', 600, 292);
    ctx.fillStyle = '#fff9e7'; ctx.font = 'bold 35px Georgia'; ctx.fillText(`¡Gana Jugador ${game.winner + 1}!`, 600, 345);
    ctx.font = '14px Arial'; ctx.fillStyle = '#c3d9ca'; ctx.fillText('Pulsa «Nueva partida» para volver a jugar', 600, 374);
  }
}

function refreshUI() {
  $('#status').textContent = game.message;
  $('#turn-counter').textContent = String(game.turnNumber).padStart(2, '0');
  $('#turn-caption').textContent = game.mode === 'practice' ? 'TIROS' : 'TURNO';
  $('#player-1-name').textContent = game.mode === 'practice' ? 'Modo libre' : 'Jugador 2';
  for (let i = 0; i < 2; i++) {
    $(`#player-${i}`).classList.toggle('active', game.mode === 'practice' ? i === 0 : game.turn === i);
    $(`#player-${i}`).classList.toggle('muted', game.mode === 'practice' && i === 1);
    $(`#group-${i}`).textContent = game.mode === 'practice' ? (i === 0 ? 'Práctica libre' : 'Sin rival') : game.groups[i] ? game.groups[i][0].toUpperCase() + game.groups[i].slice(1) : 'Mesa abierta';
    const remaining = $(`#remaining-${i}`);
    remaining.innerHTML = '';
    const numbers = game.groups[i] === 'lisas' ? [1,2,3,4,5,6,7] : game.groups[i] === 'rayadas' ? [9,10,11,12,13,14,15] : [1,9,2,10,3,11,8];
    for (const number of numbers) {
      const dot = document.createElement('span'); dot.className = `mini-ball ${game.balls.find(ball => ball.number === number)?.pocketed ? 'gone' : ''}`;
      dot.style.setProperty('--ball-color', ballColors[number]); remaining.append(dot);
    }
  }
  $('#shoot').disabled = game.phase !== 'aim' || game.ballInHand;
  canvas.style.cursor = game.ballInHand ? 'crosshair' : game.phase === 'aim' ? 'pointer' : 'default';
}

function shoot() {
  if (game.startShot(aimAngle, power, topSpin, sideSpin)) {
    lastCollisionCount = lastPocketCount = 0;
    tone(330, .075, .08, 'triangle'); refreshUI();
  }
}

function tablePoint(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * 1200 / rect.width - view.x,
    y: (event.clientY - rect.top) * 650 / rect.height - view.y };
}

canvas.addEventListener('pointermove', event => {
  const point = tablePoint(event);
  if (game.ballInHand) { placement = [point.x, point.y]; return; }
  if (game.phase === 'aim') {
    const cue = game.cueBall();
    if (Math.hypot(point.x - cue.x, point.y - cue.y) > TABLE.radius * 2) aimAngle = Math.atan2(point.y - cue.y, point.x - cue.x);
  }
});
canvas.addEventListener('pointerup', event => {
  if (event.button !== 0) return;
  const point = tablePoint(event);
  if (game.ballInHand) { if (game.placeCue(point.x, point.y)) { tone(480, .07, .04); refreshUI(); } }
  else if (game.phase === 'aim' && Math.hypot(point.x - game.cueBall().x, point.y - game.cueBall().y) > TABLE.radius * 2) {
    aimAngle = Math.atan2(point.y - game.cueBall().y, point.x - game.cueBall().x);
  }
});
canvas.addEventListener('contextmenu', event => event.preventDefault());
$('#shoot').addEventListener('click', shoot);
$('#power').addEventListener('input', event => { power = Number(event.target.value) / 100; $('#power-value').textContent = `${event.target.value}%`; });

function setSpinFromEvent(event) {
  const rect = $('#spin-disc').getBoundingClientRect();
  const radius = rect.width / 2;
  sideSpin = Math.max(-1, Math.min(1, ((event.clientX - rect.left) - radius) / (radius * .68)));
  topSpin = Math.max(-1, Math.min(1, (radius - (event.clientY - rect.top)) / (radius * .68)));
  const magnitude = Math.hypot(sideSpin, topSpin);
  if (magnitude > 1) { sideSpin /= magnitude; topSpin /= magnitude; }
  $('#spin-dot').style.left = `${50 + sideSpin * 34}%`;
  $('#spin-dot').style.top = `${50 - topSpin * 34}%`;
}
$('#spin-disc').addEventListener('pointerdown', event => { $('#spin-disc').setPointerCapture(event.pointerId); setSpinFromEvent(event); });
$('#spin-disc').addEventListener('pointermove', event => { if (event.buttons) setSpinFromEvent(event); });
$('#reset-spin').addEventListener('click', () => { sideSpin = topSpin = 0; $('#spin-dot').style.left = $('#spin-dot').style.top = '50%'; });

function reset(mode = game.mode) {
  game.reset(mode); aimAngle = 0; placement = null;
  $('#mode-duel').classList.toggle('selected', mode === 'duel'); $('#mode-duel').setAttribute('aria-pressed', mode === 'duel');
  $('#mode-practice').classList.toggle('selected', mode === 'practice'); $('#mode-practice').setAttribute('aria-pressed', mode === 'practice');
  refreshUI(); tone(390, .09, .05);
}
$('#mode-duel').addEventListener('click', () => { if (game.mode !== 'duel') reset('duel'); });
$('#mode-practice').addEventListener('click', () => { if (game.mode !== 'practice') reset('practice'); });
$('#new-button').addEventListener('click', () => reset());
$('#sound-button').addEventListener('click', () => { soundsOn = !soundsOn; $('#sound-button').classList.toggle('off', !soundsOn); $('#sound-button').setAttribute('aria-label', soundsOn ? 'Desactivar sonido' : 'Activar sonido'); if (soundsOn) tone(620, .09, .04); });
$('#help-button').addEventListener('click', () => $('#help-dialog').showModal());
$('#close-help').addEventListener('click', () => $('#help-dialog').close());
$('#got-it').addEventListener('click', () => $('#help-dialog').close());
document.addEventListener('keydown', event => {
  if ($('#help-dialog').open || event.repeat || event.target.closest('input,button,textarea,select')) return;
  if (event.code === 'Space') { event.preventDefault(); shoot(); }
  if (event.code === 'ArrowLeft') { event.preventDefault(); aimAngle -= event.shiftKey ? .002 : .012; }
  if (event.code === 'ArrowRight') { event.preventDefault(); aimAngle += event.shiftKey ? .002 : .012; }
});

function loop(now) {
  accumulator += Math.min((now - lastFrame) / 1000, .08);
  lastFrame = now;
  while (accumulator >= 1 / 240) { game.update(1 / 240); accumulator -= 1 / 240; }
  if (game.events && game.phase === 'moving') {
    if (game.events.collisions.length > lastCollisionCount) {
      const collision = game.events.collisions.at(-1); tone(240 + Math.min(collision.strength, 900) * .25, .045, Math.min(.09, .018 + collision.strength / 12000));
      lastCollisionCount = game.events.collisions.length;
    }
    if (game.events.pocketed.length > lastPocketCount) { tone(155, .24, .11, 'triangle'); lastPocketCount = game.events.pocketed.length; }
  }
  if (game.phase !== lastPhase) { lastPhase = game.phase; refreshUI(); if (game.phase === 'finished') tone(660, .45, .11); }
  draw(); requestAnimationFrame(loop);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); refreshUI(); requestAnimationFrame(loop);
