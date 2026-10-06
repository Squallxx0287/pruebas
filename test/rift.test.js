import test from 'node:test';
import assert from 'node:assert/strict';
import { RiftGame, WORLD, UPGRADES, segmentHit } from '../src/rift.js';

function running() { const game = new RiftGame(() => .7); game.start(); game.player.invulnerable = 0; game.spawnTimer = 999; game.waveDelay = 0; return game; }
function enemyAt(game, x, y, type = 'seeker') { const e = game.spawnEnemy(type); e.x = x; e.y = y; e.speed = 0; return e; }
function advance(game, seconds, input = {}) { for (let i = 0; i < Math.ceil(seconds * 120); i++) game.update(1 / 120, input); }

test('starting a run resets combat, upgrades, and score', () => {
  const g = running(); g.score = 999; g.stats.damage = 100; g.spawnEnemy('brute'); g.start();
  assert.equal(g.wave, 1); assert.equal(g.score, 0); assert.equal(g.stats.damage, 22); assert.equal(g.enemies.length, 0); assert.equal(g.state, 'playing');
});
test('diagonal movement is normalized and stays inside the arena', () => {
  const straight = running(), diagonal = running(); const x = straight.player.x;
  advance(straight, 1, { x: 1 }); advance(diagonal, 1, { x: 1, y: 1 });
  assert.ok(Math.abs(Math.hypot(diagonal.player.x - x, diagonal.player.y - 750) - (straight.player.x - x)) < .01);
  advance(straight, 20, { x: 1, y: -1 });
  assert.ok(straight.player.x < WORLD.width); assert.ok(straight.player.y > 0);
});
test('dash crosses a hostile projectile without damage, then requires cooldown', () => {
  const g = running(), p = g.player; const x = p.x;
  g.bullets.push({ x: x + 70, y: p.y, vx: -500, vy: 0, radius: 6, damage: 50, enemy: true, life: 1 });
  g.update(.04, { x: 1, dash: true }); g.update(.04, { x: 1 });
  assert.equal(p.hp, 100); assert.ok(p.x - x > 70); const cooldown = p.dashCooldown;
  g.dash({ x: -1 }); assert.equal(p.dashCooldown, cooldown);
  advance(g, 1.5); g.dash({ x: -1 }); assert.equal(p.dashX, -1);
});
test('damage grants a brief grace period and death cannot become victory', () => {
  const g = running(); assert.equal(g.damagePlayer(40), true); assert.equal(g.damagePlayer(40), false); assert.equal(g.player.hp, 60);
  advance(g, 1); const boss = g.spawnEnemy('boss'); g.damagePlayer(100); g.damageEnemy(boss, 9999);
  assert.equal(g.state, 'dead'); assert.equal(boss.hp, boss.maxHp);
});
test('swept collision detects a projectile crossing an enemy between frames', () => {
  assert.equal(segmentHit(0, 0, 100, 0, { x: 50, y: 0 }, 4), true);
  assert.equal(segmentHit(0, 0, 100, 0, { x: 50, y: 12 }, 4), false);
  const g = running(), p = g.player; const e = enemyAt(g, p.x + 42, p.y); e.hp = 20;
  g.fire(0); g.update(.04);
  assert.equal(g.kills, 1); assert.ok(g.events.some(e => e.type === 'kill')); assert.equal(g.enemies.length, 0);
});
test('piercing bullets hit separate targets only once each', () => {
  const g = running(), p = g.player; g.stats.pierce = 1;
  const first = enemyAt(g, p.x + 60, p.y, 'brute'), second = enemyAt(g, p.x + 155, p.y, 'brute');
  const hp1 = first.hp, hp2 = second.hp;
  g.fire(0); advance(g, .22);
  assert.equal(first.hp, hp1 - g.stats.damage); assert.equal(second.hp, hp2 - g.stats.damage);
});
test('charged collapse damages nearby enemies, clears enemy bullets, and consumes charge', () => {
  const g = running(), p = g.player; const e = enemyAt(g, p.x + 100, p.y, 'brute');
  g.bullets.push({ x: p.x + 10, y: p.y, enemy: true }, { x: p.x + 600, y: p.y, enemy: true }, { x: p.x, y: p.y, enemy: false });
  assert.equal(g.pulse(), false); p.pulse = 100; assert.equal(g.pulse(), true);
  assert.ok(e.hp <= 0); assert.equal(p.pulse, 0); assert.equal(g.bullets.length, 2); assert.equal(g.pulse(), false);
});
test('charge pickups cap at 100 and report readiness exactly once', () => {
  const g = running(), p = g.player; p.pulse = 95;
  g.pickups.push({ x: p.x, y: p.y, type: 'charge', amount: 20, age: 0 }, { x: p.x, y: p.y, type: 'charge', amount: 20, age: 0 });
  g.update(.01); assert.equal(p.pulse, 100); assert.equal(g.pickups.length, 0); assert.equal(g.events.filter(e => e.type === 'pulseReady').length, 1);
});
test('wave waits for remaining enemies, then offers three unique upgrades and freezes', () => {
  const g = running(); g.spawned = g.waveQuota; const e = g.spawnEnemy('seeker'); g.update(.01); assert.equal(g.state, 'playing');
  g.damageEnemy(e, 999); g.update(.01); assert.equal(g.state, 'upgrade'); assert.equal(new Set(g.choices.map(c => c.id)).size, 3);
  const time = g.time, x = g.player.x; advance(g, 1, { x: 1, fire: true }); assert.equal(g.time, time); assert.equal(g.player.x, x);
  assert.equal(g.chooseUpgrade('invalid'), false); assert.equal(g.chooseUpgrade(g.choices[0].id), true); assert.equal(g.wave, 2); assert.equal(g.state, 'playing');
});
test('all upgrades affect their combat capability and accumulate', () => {
  const g = running();
  for (const upgrade of UPGRADES) { g.state = 'upgrade'; g.choices = [upgrade]; assert.equal(g.chooseUpgrade(upgrade.id), true); }
  assert.ok(g.stats.damage > 22); assert.ok(g.stats.fireInterval < .17); assert.equal(g.stats.projectiles, 2);
  assert.ok(g.stats.speed > 280); assert.equal(g.player.maxHp, 125); assert.equal(g.stats.pierce, 1); assert.equal(g.stats.drones, 1); assert.ok(g.stats.pulseScale > 1);
});
test('sixth wave spawns the core and its radial attack; destroying it wins', () => {
  const g = running(); g.wave = 5; g.nextWave(); advance(g, 3.2);
  assert.equal(g.wave, 6); assert.equal(g.boss?.type, 'boss'); g.boss.fireTimer = 0; g.update(.01);
  assert.ok(g.bullets.filter(b => b.enemy).length >= 14);
  g.damageEnemy(g.boss, 9999); assert.equal(g.state, 'victory'); assert.equal(g.events.filter(e => e.type === 'end' && e.victory).length, 1);
});
test('paused state freezes cooldown, movement, enemies, and time', () => {
  const g = running(); const e = g.spawnEnemy('seeker'); g.state = 'paused';
  const before = [g.time, g.player.x, e.x, g.player.dashCooldown]; advance(g, 2, { x: 1, dash: true, fire: true });
  assert.deepEqual([g.time, g.player.x, e.x, g.player.dashCooldown], before);
});
test('kill chains multiply points, expire, and reset when taking damage', () => {
  const g = running(); const e1 = g.spawnEnemy('seeker'), e2 = g.spawnEnemy('seeker');
  g.damageEnemy(e1, 999); const first = g.score; g.damageEnemy(e2, 999); assert.ok(g.score - first > first); assert.equal(g.combo, 1.5);
  advance(g, 4.2); assert.equal(g.combo, 1); g.damageEnemy(g.spawnEnemy('seeker'), 999); g.damagePlayer(10); assert.equal(g.combo, 1);
});
test('full seeded run can progress through all upgrades and defeat the core using combat inputs', () => {
  let seed = 43; const g = new RiftGame(() => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; }); g.start();
  for (let i = 0; i < 120 * 300 && !['dead', 'victory'].includes(g.state); i++) {
    if (g.state === 'upgrade') { const preference = ['spread', 'damage', 'drone', 'rapid', 'pierce', 'health', 'speed', 'pulse']; g.chooseUpgrade([...g.choices].sort((a, b) => preference.indexOf(a.id) - preference.indexOf(b.id))[0].id); }
    const p = g.player, target = g.nearestEnemy(); let x = 0, y = 0, aimX = p.x, aimY = p.y - 100;
    if (target) {
      const dx = target.x - p.x, dy = target.y - p.y, d = Math.hypot(dx, dy) || 1;
      const retreat = d < 270 ? -1 : d > 450 ? 1 : 0;
      x = dx / d * retreat - dy / d * .5; y = dy / d * retreat + dx / d * .5;
      aimX = target.x + target.vx * d / 1000; aimY = target.y + target.vy * d / 1000;
    }
    x += (WORLD.width / 2 - p.x) / 1800; y += (WORLD.height / 2 - p.y) / 1300;
    g.update(1 / 120, { x, y, aimX, aimY, fire: true, dash: target && Math.hypot(target.x - p.x, target.y - p.y) < 130, pulse: p.pulse >= 100 });
    g.events.length = 0;
  }
  assert.equal(g.state, 'victory', `state=${g.state}, wave=${g.wave}, hp=${g.player.hp}, kills=${g.kills}`);
  assert.equal(g.wave, 6); assert.equal(g.upgrades.length, 5); assert.ok(g.score > 15000);
});
