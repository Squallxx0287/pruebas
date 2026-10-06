import test from "node:test";
import assert from "node:assert/strict";
import {
  DeadzoneGame,
  LEVELS,
  WEAPONS,
  raySphere,
  rayBox,
} from "../src/survival.js";
function run() {
  const g = new DeadzoneGame(() => 0.73);
  g.start();
  g.intro = 0;
  g.spawnTimer = 999;
  g.player.invulnerable = 0;
  return g;
}
function target(g, type = "shambler", x = 0, z = 4) {
  const e = g.spawnEnemy(type);
  e.x = x;
  e.z = z;
  e.speed = 0;
  e.special = 999;
  return e;
}
function step(g, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) g.update(1 / 60, input);
}
function aim(g, e, head = true) {
  const p = g.player,
    d = Math.hypot(e.x - p.x, e.z - p.z);
  p.yaw = Math.atan2(-(e.x - p.x), -(e.z - p.z));
  p.pitch = Math.atan2((head ? 1.65 : 1.05) * e.scale - g.eye.y, d);
}

test("campaign has five growing hordes, unique bosses, and ten distinct weapon systems", () => {
  assert.equal(LEVELS.length, 5);
  assert.equal(new Set(LEVELS.map((l) => l.bossType)).size, 5);
  assert.ok(LEVELS.every((l, i) => !i || l.count > LEVELS[i - 1].count));
  assert.equal(WEAPONS.length, 10);
  assert.equal(new Set(WEAPONS.map((w) => w.id)).size, 10);
  assert.equal(new Set(WEAPONS.map((w) => w.magazine)).size, 10);
});
test("ray tests resolve head hits, behind-camera misses and intervening cover", () => {
  const o = { x: 0, y: 1.7, z: 10 },
    d = { x: 0, y: 0, z: -1 };
  assert.ok(raySphere(o, d, { x: 0, y: 1.65, z: 0 }, 0.24) < 10);
  assert.equal(raySphere(o, d, { x: 0, y: 1.65, z: 15 }, 0.24), Infinity);
  assert.equal(rayBox(o, d, { x: 0, z: 5, w: 3, d: 1, h: 3 }), 4.5);
  assert.equal(rayBox(o, d, { x: 4, z: 5, w: 1, d: 1, h: 3 }), Infinity);
});
test("movement respects diagonal speed, collision, crouch and stamina", () => {
  const a = run(),
    b = run();
  a.obstacles = b.obstacles = [];
  const x = a.player.x,
    z = a.player.z;
  step(a, 1, { moveZ: 1 });
  step(b, 1, { moveZ: 1, moveX: 1 });
  assert.ok(
    Math.abs(
      Math.hypot(a.player.x - x, a.player.z - z) -
        Math.hypot(b.player.x - x, b.player.z - z),
    ) < 0.01,
  );
  a.obstacles = [{ x: 0, z: 8, w: 4, d: 2, h: 3 }];
  step(a, 3, { moveZ: 1 });
  assert.ok(a.player.z >= 9.39);
  const c = run();
  c.obstacles = [];
  step(c, 1, { moveZ: 1, sprint: true });
  assert.ok(c.player.stamina < 100);
  step(c, 1);
  assert.ok(c.player.stamina > 78);
});
test("semiautomatic fire requires a new trigger and automatic fire repeats", () => {
  const g = run();
  g.switchWeapon(0);
  step(g, 0.3);
  const n = g.ammo[0].magazine;
  step(g, 1, { fire: true, trigger: false });
  assert.equal(g.ammo[0].magazine, n);
  g.update(0.01, { fire: true, trigger: true });
  assert.equal(g.ammo[0].magazine, n - 1);
  g.switchWeapon(2);
  step(g, 0.3);
  step(g, 0.8, { fire: true });
  assert.ok(g.ammo[2].magazine < 30);
});
test("headshots deal more damage and can eliminate a zombie in one pistol round", () => {
  const g = run();
  g.switchWeapon(0);
  step(g, 0.3);
  const e = target(g);
  aim(g, e);
  assert.equal(g.shoot(), true);
  assert.ok(e.hp <= 0);
  assert.equal(g.headshots, 1);
  assert.ok(g.events.some((e) => e.type === "kill" && e.headshot));
});
test("solid cover blocks shots and shotgun pellets disperse instead of hitting behind cover", () => {
  const g = run();
  g.obstacles = [{ x: 0, z: 8, w: 8, d: 1, h: 4 }];
  const e = target(g);
  aim(g, e);
  const hp = e.hp;
  g.shoot();
  assert.equal(e.hp, hp);
  g.switchWeapon(4);
  step(g, 0.3);
  g.shoot();
  assert.equal(e.hp, hp);
});
test("reload transfers only available reserve ammunition and switching cancels it", () => {
  const g = run(),
    a = g.ammo[3];
  a.magazine = 7;
  a.reserve = 10;
  assert.equal(g.reload(), true);
  step(g, 2.1);
  assert.equal(a.magazine, 17);
  assert.equal(a.reserve, 0);
  assert.equal(g.reload(), false);
  a.reserve = 100;
  g.reload();
  g.switchWeapon(1);
  step(g, 4);
  assert.equal(a.magazine, 17);
  assert.equal(g.player.reload, 0);
});
test("sniper rounds penetrate separate targets; armor affects torso but not head", () => {
  const g = run();
  g.switchWeapon(6);
  step(g, 0.3);
  const a = target(g, "shambler", 0, 5),
    b = target(g, "shambler", 0, 2);
  aim(g, a);
  g.shoot();
  assert.ok(a.hp <= 0 && b.hp <= 0);
  const h = run(),
    e = target(h, "soldier");
  const hp = e.hp;
  h.damageEnemy(e, 100);
  assert.equal(e.hp, hp - 50);
  h.damageEnemy(e, 100, true);
  assert.equal(e.hp, hp - 150);
});
test("flamethrower reaches a cone, burns over time, and cannot pass through cover", () => {
  const g = run();
  g.switchWeapon(8);
  step(g, 0.3);
  const e = target(g, "soldier", 0, 7),
    far = target(g, "soldier", 0, -10);
  g.player.yaw = 0;
  g.shoot();
  assert.ok(e.burn > 0);
  assert.equal(far.burn, 0);
  const hp = e.hp;
  step(g, 0.7);
  assert.ok(e.hp < hp);
  const h = run();
  h.switchWeapon(8);
  step(h, 0.3);
  const t = target(h, "soldier", 0, 7);
  h.obstacles = [{ x: 0, z: 10, w: 5, d: 1, h: 4 }];
  h.shoot();
  assert.equal(t.burn, 0);
});
test("rocket impact causes area damage and nearby explosions can hurt the player", () => {
  const g = run();
  g.switchWeapon(9);
  step(g, 0.3);
  const a = target(g, "soldier", 0, 4),
    b = target(g, "soldier", 2, 4);
  aim(g, a, false);
  g.shoot();
  assert.equal(g.projectiles[0].kind, "rocket");
  step(g, 0.6);
  assert.ok(a.hp <= 0 && b.hp <= 0);
  assert.equal(g.ammo[9].magazine, 0);
  g.player.invulnerable = 0;
  g.explode(g.player.x, 1, g.player.z, 7, 620);
  assert.equal(g.state, "dead");
});
test("grenades use gravity, a fuse and a limited inventory", () => {
  const g = run();
  assert.equal(g.grenade(), true);
  assert.equal(g.player.grenades, 2);
  assert.equal(g.projectiles[0].kind, "grenade");
  step(g, 2.4);
  assert.equal(g.projectiles.length, 0);
  assert.ok(g.events.some((e) => e.type === "explosion"));
  g.player.grenades = 0;
  assert.equal(g.grenade(), false);
});
test("horde must be eliminated before the unique boss appears and the next level requires confirmation", () => {
  const g = run(),
    l = LEVELS[0];
  g.spawned = l.count;
  g.regularKills = l.count - 1;
  const e = target(g);
  g.update(0.01);
  assert.equal(g.boss, null);
  g.damageEnemy(e, 1000);
  g.update(0.01);
  assert.equal(g.boss.type, "butcher");
  g.damageEnemy(g.boss, 10000, true);
  assert.equal(g.state, "intermission");
  const time = g.time;
  step(g, 3, { fire: true, moveZ: 1 });
  assert.equal(g.time, time);
  g.player.hp = 25;
  g.nextLevel();
  assert.equal(g.level, 2);
  assert.equal(g.player.hp, 70);
  assert.equal(g.ammo[9].reserve, 16);
  assert.equal(g.player.grenades, 3);
});
test("bosses have charge, toxic ranged attack, shockwave, armor and summoned reinforcements", () => {
  for (const type of ["butcher", "stalker", "hive", "armored", "zero"]) {
    const g = run();
    g.level = type === "zero" ? 5 : 3;
    const e = target(g, type, 0, -3);
    e.special = 0;
    g.update(0.01);
    if (["butcher", "stalker"].includes(type)) assert.equal(e.phase, "windup");
    if (type === "hive")
      assert.equal(g.projectiles.filter((p) => p.kind === "acid").length, 3);
    if (type === "armored")
      assert.ok(g.hazards.some((h) => h.kind === "shock"));
    if (type === "zero") {
      assert.ok(g.enemies.some((e) => e.minion));
      assert.ok(g.hazards.length > 0);
    }
  }
});
test("pathfinding routes infected around solid containers", () => {
  const g = run();
  g.obstacles = [{ x: 0, z: 0, w: 3, d: 8, h: 3 }];
  const route = g.findPath({ x: -6, z: 0 }, { x: 6, z: 0 });
  assert.ok(route.length > 0);
  assert.ok(route.every((p) => !g.blocked(p.x, p.z, 0.6)));
  assert.ok(route.some((p) => Math.abs(p.z) > 4));
});
test("supply pickups heal and replenish all ten weapons without exceeding caps", () => {
  const g = run();
  g.player.hp = 50;
  g.ammo.forEach((a) => (a.reserve = 0));
  g.pickups.push(
    { x: g.player.x, z: g.player.z, kind: "health", age: 0 },
    { x: g.player.x, z: g.player.z, kind: "ammo", age: 0 },
  );
  g.update(0.01);
  assert.equal(g.player.hp, 80);
  assert.ok(g.ammo.every((a) => a.reserve > 0));
  assert.equal(g.pickups.length, 0);
});
test("pause freezes combat, reload, stamina, projectiles and timers", () => {
  const g = run();
  g.ammo[3].magazine = 0;
  g.reload();
  g.grenade();
  g.state = "paused";
  const before = [
    g.time,
    g.player.reload,
    g.player.z,
    g.player.stamina,
    g.projectiles[0].y,
  ];
  step(g, 5, { moveZ: 1, fire: true });
  assert.deepEqual(
    [g.time, g.player.reload, g.player.z, g.player.stamina, g.projectiles[0].y],
    before,
  );
});
test("death is terminal and cannot be overwritten by a simultaneous boss kill", () => {
  const g = run();
  const e = target(g, "zero");
  g.damagePlayer(200);
  g.damageEnemy(e, 10000, true);
  assert.equal(g.state, "dead");
  assert.equal(e.hp, e.maxHp);
  assert.equal(g.events.filter((e) => e.type === "end").length, 1);
});
test("all five levels can be cleared, only the fifth boss ends the campaign, and restart resets it", () => {
  const g = run();
  for (let i = 1; i <= 5; i++) {
    assert.equal(g.level, i);
    g.spawned = g.regularKills = LEVELS[i - 1].count;
    g.update(0.01);
    assert.equal(g.boss.type, LEVELS[i - 1].bossType);
    g.damageEnemy(g.boss, 100000, true);
    assert.equal(g.state, i === 5 ? "victory" : "intermission");
    if (i < 5) g.nextLevel();
  }
  assert.equal(g.kills, 5);
  assert.equal(g.nextLevel(), false);
  assert.ok(g.score >= 30000);
  g.start();
  assert.equal(g.level, 1);
  assert.equal(g.score, 0);
  assert.equal(g.kills, 0);
  assert.equal(g.state, "playing");
});
test("a seeded player completes the first horde and its boss using aim, movement, shooting and reload inputs", () => {
  let seed = 19;
  const g = new DeadzoneGame(() => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });
  g.start();
  for (let i = 0; i < 60 * 210 && g.state === "playing"; i++) {
    const p = g.player;
    const targets = g.enemies
      .filter((e) => e.hp > 0)
      .sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z),
      );
    const e = targets[0];
    let moveX = 0,
      moveZ = 0;
    if (e) {
      aim(g, e);
      const d = Math.hypot(e.x - p.x, e.z - p.z);
      moveX = 0.65;
      moveZ = d < 12 ? -1 : d > 23 ? 1 : 0;
    } else {
      p.yaw = 0;
      p.pitch = 0;
    }
    g.update(1 / 60, {
      moveX,
      moveZ,
      fire: !!e,
      reload: g.ammo[3].magazine === 0,
      sprint: !!e && Math.hypot(e.x - p.x, e.z - p.z) < 5,
    });
    g.events.length = 0;
  }
  assert.equal(
    g.state,
    "intermission",
    `state=${g.state}, hp=${g.player.hp}, kills=${g.kills}, remaining=${g.enemies.length}`,
  );
  assert.equal(g.regularKills, LEVELS[0].count);
  assert.equal(g.boss.hp <= 0, true);
});
