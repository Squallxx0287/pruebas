export const WEAPONS = [
  {
    id: "pistol",
    name: "P9 SENTINEL",
    category: "PISTOLA",
    mode: "SEMI",
    damage: 38,
    interval: 0.23,
    magazine: 15,
    reserve: 120,
    reload: 1.35,
    range: 65,
    spread: 0.008,
    pellets: 1,
    recoil: 0.045,
    weight: 1,
    description: "Precisa y ligera. Tu última línea de defensa.",
    color: "#9bc8b6",
  },
  {
    id: "revolver",
    name: "M44 EXECUTIONER",
    category: "REVÓLVER",
    mode: "SEMI",
    damage: 110,
    interval: 0.52,
    magazine: 6,
    reserve: 60,
    reload: 2.2,
    range: 70,
    spread: 0.006,
    pellets: 1,
    recoil: 0.13,
    weight: 1,
    description: "Seis cámaras. Ninguna segunda oportunidad.",
    color: "#dac1a0",
  },
  {
    id: "smg",
    name: "MP5 PHANTOM",
    category: "SUBFUSIL",
    mode: "AUTO",
    damage: 27,
    interval: 0.072,
    magazine: 35,
    reserve: 280,
    reload: 1.6,
    range: 48,
    spread: 0.026,
    pellets: 1,
    recoil: 0.035,
    weight: 1.06,
    description: "Una ráfaga de acero para abrirte paso.",
    color: "#a6cad7",
  },
  {
    id: "rifle",
    name: "AK-47 REVENANT",
    category: "FUSIL DE ASALTO",
    mode: "AUTO",
    damage: 46,
    interval: 0.115,
    magazine: 30,
    reserve: 240,
    reload: 1.9,
    range: 85,
    spread: 0.016,
    pellets: 1,
    recoil: 0.065,
    weight: 0.96,
    description: "Madera, acero y una fiabilidad brutal.",
    color: "#d39c67",
  },
  {
    id: "shotgun",
    name: "M870 BREACHER",
    category: "ESCOPETA DE CORREDERA",
    mode: "SEMI",
    damage: 22,
    interval: 0.82,
    magazine: 8,
    reserve: 64,
    reload: 2.15,
    range: 32,
    spread: 0.095,
    pellets: 9,
    recoil: 0.17,
    weight: 0.93,
    description: "Nueve perdigones. Mantén al horror cerca.",
    color: "#ceb38e",
  },
  {
    id: "double",
    name: "DB-2 JUDGEMENT",
    category: "DOBLE CAÑÓN",
    mode: "SEMI",
    damage: 24,
    interval: 0.62,
    magazine: 2,
    reserve: 42,
    reload: 1.85,
    range: 24,
    spread: 0.12,
    pellets: 14,
    recoil: 0.21,
    weight: 1,
    description: "Dos cañones y una descarga devastadora.",
    color: "#cda477",
  },
  {
    id: "sniper",
    name: "AWP LONGSHOT",
    category: "FRANCOTIRADOR",
    mode: "SEMI",
    damage: 225,
    interval: 1.15,
    magazine: 5,
    reserve: 40,
    reload: 2.4,
    range: 140,
    spread: 0.0015,
    pellets: 1,
    pierce: 2,
    recoil: 0.14,
    weight: 0.86,
    description: "Un disparo a la cabeza cambia la batalla.",
    color: "#b5c398",
  },
  {
    id: "lmg",
    name: "M249 DEVASTATOR",
    category: "AMETRALLADORA",
    mode: "AUTO",
    damage: 40,
    interval: 0.085,
    magazine: 100,
    reserve: 500,
    reload: 3.6,
    range: 75,
    spread: 0.035,
    pellets: 1,
    recoil: 0.06,
    weight: 0.78,
    description: "Cien razones para no dejar de disparar.",
    color: "#c6ba83",
  },
  {
    id: "flame",
    name: "IGNIS INCINERATOR",
    category: "LANZALLAMAS",
    mode: "AUTO",
    damage: 13,
    interval: 0.075,
    magazine: 120,
    reserve: 600,
    reload: 2.7,
    range: 10,
    spread: 0.1,
    pellets: 1,
    recoil: 0.014,
    weight: 0.84,
    description: "Fuego persistente. Purifica el enjambre.",
    color: "#eca46e",
  },
  {
    id: "rocket",
    name: "RPG-7 APOCALYPSE",
    category: "LANZACOHETES",
    mode: "SEMI",
    damage: 620,
    interval: 1.3,
    magazine: 1,
    reserve: 16,
    reload: 2.9,
    range: 100,
    spread: 0,
    pellets: 1,
    recoil: 0.23,
    weight: 0.8,
    radius: 7,
    description: "Explosiones de área. No dispares a tus pies.",
    color: "#afb386",
  },
];
export const LEVELS = [
  {
    name: "EL DISTRITO",
    subtitle: "La ciudad dejó de responder a las 03:17.",
    theme: "city",
    count: 12,
    cap: 7,
    boss: "EL CARNICERO",
    bossType: "butcher",
    bossHp: 1000,
    color: "#bba794",
    sky: "#202d38",
    fog: "#53616a",
    fogDensity: 0.013,
    light: "#bacbda",
    briefing: "Despeja las calles. Algo enorme se mueve entre los restos.",
  },
  {
    name: "MUELLE 13",
    subtitle: "El último barco nunca llegó a zarpar.",
    theme: "dock",
    count: 22,
    cap: 10,
    boss: "EL ACECHADOR",
    bossType: "stalker",
    bossHp: 1500,
    color: "#8daeb5",
    sky: "#192e3a",
    fog: "#426975",
    fogDensity: 0.018,
    light: "#9bd1e3",
    briefing: "Los infectados corren. Vigila los pasillos de contenedores.",
  },
  {
    name: "LA FUNDICIÓN",
    subtitle: "Las máquinas siguen vivas. Los trabajadores no.",
    theme: "foundry",
    count: 34,
    cap: 13,
    boss: "LA COLMENA",
    bossType: "hive",
    bossHp: 2100,
    color: "#e4a16b",
    sky: "#352923",
    fog: "#715342",
    fogDensity: 0.016,
    light: "#ecc2a0",
    briefing: "El calor atrae a la horda. Esquiva las esporas tóxicas.",
  },
  {
    name: "CUARENTENA",
    subtitle: "No queda nadie al otro lado de esas puertas.",
    theme: "hospital",
    count: 48,
    cap: 16,
    boss: "EL BLINDADO",
    bossType: "armored",
    bossHp: 2800,
    color: "#a8bca6",
    sky: "#29312f",
    fog: "#66776c",
    fogDensity: 0.018,
    light: "#c6dcc7",
    briefing: "Apunta a la cabeza. Su armadura no cederá fácilmente.",
  },
  {
    name: "ZONA CERO",
    subtitle: "Todo comenzó aquí. Todo termina contigo.",
    theme: "reactor",
    count: 64,
    cap: 20,
    boss: "PACIENTE CERO",
    bossType: "zero",
    bossHp: 4000,
    color: "#e2aaa4",
    sky: "#2b1d27",
    fog: "#664a57",
    fogDensity: 0.014,
    light: "#e8bbc4",
    briefing: "Destruye el origen de la infección. No habrá extracción sin ti.",
  },
];
export const ARENA = 37;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function layout(level) {
  const walls = [];
  for (const side of [-1, 1])
    for (const z of [-25, -5, 20])
      walls.push({
        x: side * 29,
        z,
        w: 12,
        d: 16,
        h: 8 + ((z + 25) % 3) * 3,
        kind: "building",
      });
  walls.push({ x: 0, z: -32, w: 42, d: 9, h: 10, kind: "building" });
  const props = [
    [
      { x: -8, z: 7, w: 2.4, d: 5, h: 1.4, kind: "car" },
      { x: 8, z: -10, w: 2.4, d: 5, h: 1.4, kind: "car" },
      { x: -12, z: -9, w: 3, d: 1, h: 1.1, kind: "barrier" },
      { x: 12, z: 12, w: 3, d: 1, h: 1.1, kind: "barrier" },
      { x: 1, z: -15, w: 2, d: 2, h: 1.6, kind: "crate" },
    ],
    [
      { x: -12, z: -10, w: 5, d: 13, h: 3.5, kind: "container" },
      { x: 12, z: 7, w: 5, d: 13, h: 3.5, kind: "container" },
      { x: 5, z: -20, w: 13, d: 5, h: 3.5, kind: "container" },
      { x: -13, z: 16, w: 4, d: 4, h: 1.8, kind: "crate" },
    ],
    [
      { x: -12, z: -7, w: 6, d: 6, h: 5, kind: "furnace" },
      { x: 12, z: -10, w: 6, d: 6, h: 5, kind: "furnace" },
      { x: 0, z: -19, w: 10, d: 5, h: 4, kind: "tank" },
      { x: -10, z: 15, w: 3, d: 3, h: 2.5, kind: "crate" },
      { x: 14, z: 14, w: 3, d: 3, h: 2.5, kind: "crate" },
    ],
    [
      { x: -9, z: 5, w: 3, d: 6, h: 2.5, kind: "ambulance" },
      { x: 12, z: -9, w: 3, d: 6, h: 2.5, kind: "ambulance" },
      { x: -14, z: -14, w: 5, d: 2, h: 1.3, kind: "barrier" },
      { x: 1, z: -15, w: 2, d: 3, h: 1.2, kind: "bed" },
      { x: 15, z: 13, w: 2, d: 3, h: 1.2, kind: "bed" },
    ],
    [
      { x: 0, z: -9, w: 10, d: 10, h: 7, kind: "reactor" },
      { x: -14, z: 9, w: 3, d: 3, h: 6, kind: "pylon" },
      { x: 14, z: 9, w: 3, d: 3, h: 6, kind: "pylon" },
      { x: -14, z: -17, w: 3, d: 3, h: 6, kind: "pylon" },
      { x: 14, z: -17, w: 3, d: 3, h: 6, kind: "pylon" },
    ],
  ][level - 1];
  return [...walls, ...props];
}
export function raySphere(origin, dir, center, radius) {
  const x = origin.x - center.x,
    y = origin.y - center.y,
    z = origin.z - center.z;
  const b = x * dir.x + y * dir.y + z * dir.z,
    c = x * x + y * y + z * z - radius * radius,
    disc = b * b - c;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t >= 0 ? t : -b + Math.sqrt(disc) >= 0 ? 0 : Infinity;
}
export function rayBox(origin, dir, box) {
  let near = 0,
    far = Infinity;
  for (const [axis, min, max] of [
    ["x", box.x - box.w / 2, box.x + box.w / 2],
    ["y", 0, box.h],
    ["z", box.z - box.d / 2, box.z + box.d / 2],
  ]) {
    if (Math.abs(dir[axis]) < 1e-8) {
      if (origin[axis] < min || origin[axis] > max) return Infinity;
      continue;
    }
    let a = (min - origin[axis]) / dir[axis],
      b = (max - origin[axis]) / dir[axis];
    if (a > b) [a, b] = [b, a];
    near = Math.max(near, a);
    far = Math.min(far, b);
    if (near > far) return Infinity;
  }
  return near;
}
export class DeadzoneGame {
  constructor(random = Math.random) {
    this.random = random;
    this.reset();
  }
  reset() {
    this.state = "menu";
    this.level = 0;
    this.time = 0;
    this.score = 0;
    this.kills = 0;
    this.headshots = 0;
    this.shots = 0;
    this.hits = 0;
    this.id = 0;
    this.player = {
      x: 0,
      z: 14,
      yaw: 0,
      pitch: 0,
      hp: 100,
      maxHp: 100,
      stamina: 100,
      cooldown: 0,
      invulnerable: 0,
      reload: 0,
      reloadDuration: 0,
      weapon: 3,
      aim: false,
      crouch: false,
      grenades: 3,
    };
    this.ammo = WEAPONS.map((w) => ({
      magazine: w.magazine,
      reserve: w.reserve,
    }));
    this.damageScale = 1;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.hazards = [];
    this.events = [];
    this.boss = null;
    this.regularKills = 0;
    this.spawned = 0;
    this.spawnTimer = 0;
    this.intro = 0;
    this.obstacles = [];
    this.bossSpawned = false;
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  start() {
    this.reset();
    this.state = "playing";
    this.nextLevel();
  }
  nextLevel() {
    if (this.level >= 5) return false;
    this.level++;
    this.state = "playing";
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.hazards = [];
    this.boss = null;
    this.bossSpawned = false;
    this.regularKills = 0;
    this.spawned = 0;
    this.spawnTimer = 1;
    this.intro = 3;
    this.obstacles = layout(this.level);
    Object.assign(this.player, {
      x: 0,
      z: 14,
      yaw: 0,
      pitch: 0,
      hp: Math.min(this.player.maxHp, this.player.hp + 45),
      stamina: 100,
      invulnerable: 3,
      reload: 0,
      cooldown: 0,
      grenades: 3,
    });
    this.ammo = WEAPONS.map((w) => ({
      magazine: w.magazine,
      reserve: w.reserve,
    }));
    this.emit("level", { level: this.level });
    return true;
  }
  get weapon() {
    return WEAPONS[this.player.weapon];
  }
  get eye() {
    return {
      x: this.player.x,
      y: this.player.crouch ? 1.15 : 1.7,
      z: this.player.z,
    };
  }
  switchWeapon(index) {
    if (index < 0 || index >= WEAPONS.length || index === this.player.weapon)
      return false;
    this.player.weapon = index;
    this.player.reload = 0;
    this.player.cooldown = 0.22;
    this.emit("switch", { index });
    return true;
  }
  reload() {
    const p = this.player,
      a = this.ammo[p.weapon];
    if (p.reload > 0 || a.magazine >= this.weapon.magazine || a.reserve <= 0)
      return false;
    p.reload = p.reloadDuration = this.weapon.reload;
    this.emit("reload", { index: p.weapon });
    return true;
  }
  blocked(x, z, radius = 0.4) {
    if (Math.abs(x) > ARENA - radius || Math.abs(z) > ARENA - radius)
      return true;
    return this.obstacles.some(
      (b) =>
        x > b.x - b.w / 2 - radius &&
        x < b.x + b.w / 2 + radius &&
        z > b.z - b.d / 2 - radius &&
        z < b.z + b.d / 2 + radius,
    );
  }
  move(entity, dx, dz, radius = 0.4) {
    if (!this.blocked(entity.x + dx, entity.z, radius)) entity.x += dx;
    if (!this.blocked(entity.x, entity.z + dz, radius)) entity.z += dz;
  }
  wallDistance(origin, dir) {
    let closest = dir.y < -0.0001 ? Math.max(0, origin.y / -dir.y) : Infinity;
    for (const b of this.obstacles)
      closest = Math.min(closest, rayBox(origin, dir, b));
    return closest;
  }
  spawnEnemy(type = "shambler", minion = false) {
    const boss = ["butcher", "stalker", "hive", "armored", "zero"].includes(
      type,
    );
    let scale = boss
      ? type === "stalker"
        ? 1.35
        : type === "zero"
          ? 2.25
          : 1.85
      : 1;
    const p = this.player;
    let x = 0,
      z = -20;
    for (let i = 0; i < 50; i++) {
      const a = this.random() * Math.PI * 2,
        r = 18 + this.random() * 10;
      x = clamp(p.x + Math.sin(a) * r, -32, 32);
      z = clamp(p.z + Math.cos(a) * r, -28, 30);
      if (
        !this.blocked(x, z, boss ? 0.6 * scale : 0.6) &&
        Math.hypot(x - p.x, z - p.z) > 12
      )
        break;
    }
    const stats = {
      shambler: [95 + this.level * 9, 1.3 + this.level * 0.09, 13],
      runner: [72 + this.level * 6, 2.85 + this.level * 0.1, 10],
      soldier: [155 + this.level * 9, 1.2, 18],
      spitter: [120 + this.level * 8, 1.1, 12],
      butcher: [1000, 1.9, 28],
      stalker: [1500, 3.6, 22],
      hive: [2100, 1.1, 20],
      armored: [2800, 1.45, 30],
      zero: [4000, 1.8, 35],
    }[type];
    const e = {
      id: ++this.id,
      type,
      x,
      z,
      hp: stats[0],
      maxHp: stats[0],
      speed: stats[1],
      damage: stats[2],
      radius: boss ? 0.6 * scale : 0.42,
      scale,
      boss,
      minion,
      age: 0,
      angle: 0,
      attack: 1,
      special: 3,
      flash: 0,
      burn: 0,
      path: [],
      navTimer: 0,
      phase: "walk",
      phaseTime: 0,
      chargeX: 0,
      chargeZ: 0,
    };
    this.enemies.push(e);
    if (boss) {
      this.boss = e;
      this.emit("boss", { name: LEVELS[this.level - 1].boss });
    }
    this.emit("spawn", { id: e.id });
    return e;
  }
  damageEnemy(e, damage, headshot = false) {
    if (e.hp <= 0 || this.state !== "playing") return;
    let armor =
      (e.type === "soldier" || e.type === "armored") && !headshot ? 0.5 : 1;
    e.hp -= damage * armor;
    e.flash = 0.12;
    this.hits++;
    this.emit("hit", {
      x: e.x,
      y: headshot ? 1.62 * e.scale : e.scale,
      z: e.z,
      damage: Math.round(damage * armor),
      headshot,
      id: e.id,
    });
    if (e.hp > 0) return;
    this.kills++;
    if (headshot) this.headshots++;
    if (!e.boss && !e.minion) this.regularKills++;
    const points = e.boss ? 2000 * this.level : e.type === "runner" ? 150 : 100;
    this.score += points + (headshot ? 50 : 0);
    this.emit("kill", { id: e.id, x: e.x, z: e.z, boss: e.boss, headshot });
    if (e.boss) {
      if (this.level === 5) {
        this.state = "victory";
        this.emit("end", { victory: true });
      } else {
        this.state = "intermission";
        this.emit("clear", { level: this.level });
      }
    } else if (this.random() < 0.32)
      this.pickups.push({
        id: ++this.id,
        x: e.x,
        z: e.z,
        kind: this.random() < 0.3 ? "health" : "ammo",
        age: 0,
      });
  }
  damagePlayer(damage) {
    const p = this.player;
    if (this.state !== "playing" || p.invulnerable > 0) return false;
    p.hp = Math.max(0, p.hp - damage);
    p.invulnerable = 0.45;
    this.emit("damage", { damage });
    if (p.hp <= 0) {
      this.state = "dead";
      this.emit("end", { victory: false });
    }
    return true;
  }
  shoot() {
    const p = this.player,
      w = this.weapon,
      a = this.ammo[p.weapon];
    if (this.state !== "playing" || p.reload > 0 || p.cooldown > 0)
      return false;
    if (a.magazine <= 0) {
      this.reload();
      return false;
    }
    a.magazine--;
    p.cooldown = w.interval;
    this.shots++;
    this.emit("fire", { weapon: p.weapon });
    const origin = this.eye;
    if (w.id === "rocket") {
      const c = Math.cos(p.pitch);
      this.projectiles.push({
        id: ++this.id,
        kind: "rocket",
        x: origin.x,
        y: origin.y,
        z: origin.z,
        dx: -Math.sin(p.yaw) * c * 24,
        dy: Math.sin(p.pitch) * 24,
        dz: -Math.cos(p.yaw) * c * 24,
        life: 5,
        damage: w.damage * this.damageScale,
        radius: w.radius,
      });
      return true;
    }
    if (w.id === "flame") {
      const forward = { x: -Math.sin(p.yaw), z: -Math.cos(p.yaw) };
      for (const e of this.enemies) {
        const d = distance(p, e);
        if (
          e.hp > 0 &&
          d < w.range &&
          (forward.x * (e.x - p.x) + forward.z * (e.z - p.z)) / (d || 1) > 0.88
        ) {
          const dir = { x: (e.x - p.x) / d, y: 0, z: (e.z - p.z) / d };
          if (this.wallDistance(origin, dir) > d) {
            this.damageEnemy(e, w.damage * this.damageScale);
            e.burn = 2.5;
          }
        }
      }
      return true;
    }
    for (let pellet = 0; pellet < w.pellets; pellet++) {
      const spread = w.spread * (p.aim ? 0.36 : 1) * (p.crouch ? 0.7 : 1),
        yaw = p.yaw + (this.random() - 0.5) * spread * 2,
        pitch = p.pitch + (this.random() - 0.5) * spread * 2;
      const dir = {
        x: -Math.sin(yaw) * Math.cos(pitch),
        y: Math.sin(pitch),
        z: -Math.cos(yaw) * Math.cos(pitch),
      };
      const wall = this.wallDistance(origin, dir);
      let targets = [];
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const head = raySphere(
          origin,
          dir,
          { x: e.x, y: 1.65 * e.scale, z: e.z },
          0.24 * e.scale,
        );
        const body = raySphere(
          origin,
          dir,
          { x: e.x, y: 1.05 * e.scale, z: e.z },
          0.45 * e.scale,
        );
        const legs = raySphere(
          origin,
          dir,
          { x: e.x, y: 0.42 * e.scale, z: e.z },
          0.31 * e.scale,
        );
        const d = Math.min(head, body, legs);
        if (d < w.range && d < wall)
          targets.push({
            e,
            d,
            headshot: head <= body && head <= legs,
            legs: legs < body && legs < head,
          });
      }
      targets.sort((a, b) => a.d - b.d);
      let end = Math.min(w.range, wall);
      for (const hit of targets.slice(0, 1 + (w.pierce || 0))) {
        this.damageEnemy(
          hit.e,
          w.damage *
            this.damageScale *
            (hit.headshot ? 2.8 : hit.legs ? 0.7 : 1),
          hit.headshot,
        );
        end = hit.d;
        if (this.state !== "playing") break;
      }
      if (pellet === 0)
        this.emit("tracer", {
          from: origin,
          to: {
            x: origin.x + dir.x * end,
            y: origin.y + dir.y * end,
            z: origin.z + dir.z * end,
          },
          wall: end === wall,
        });
      if (this.state !== "playing") break;
    }
    return true;
  }
  explode(x, y, z, radius, damage, hostile = false) {
    this.emit("explosion", { x, y, z, radius, hostile });
    if (!hostile)
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - x, e.z - z);
        if (e.hp > 0 && d < radius)
          this.damageEnemy(e, damage * (1 - (d / radius) * 0.65));
      }
    const d = distance(this.player, { x, z });
    if (d < radius)
      this.damagePlayer(damage * (hostile ? 1 : 0.18) * (1 - d / radius));
  }
  grenade() {
    const p = this.player;
    if (p.grenades <= 0 || this.state !== "playing") return false;
    p.grenades--;
    this.projectiles.push({
      id: ++this.id,
      kind: "grenade",
      x: p.x,
      y: 1.5,
      z: p.z,
      dx: -Math.sin(p.yaw) * 13,
      dy: 5 + Math.sin(p.pitch) * 6,
      dz: -Math.cos(p.yaw) * 13,
      life: 2.1,
      damage: 350 * this.damageScale,
      radius: 6,
    });
    this.emit("grenade");
    return true;
  }
  findPath(from, to, radius = 0.6) {
    const cell = 2,
      n = 36,
      offset = 36;
    const encode = (x, z) => z * n + x;
    const sx = clamp(Math.floor((from.x + offset) / cell), 0, n - 1),
      sz = clamp(Math.floor((from.z + offset) / cell), 0, n - 1),
      tx = clamp(Math.floor((to.x + offset) / cell), 0, n - 1),
      tz = clamp(Math.floor((to.z + offset) / cell), 0, n - 1);
    const start = encode(sx, sz),
      goal = encode(tx, tz),
      queue = [start],
      parent = new Int32Array(n * n).fill(-1);
    parent[start] = start;
    for (let q = 0; q < queue.length && q < 1200; q++) {
      const current = queue[q];
      if (current === goal) break;
      const cx = current % n,
        cz = Math.floor(current / n);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const x = cx + dx,
          z = cz + dz;
        if (x < 0 || z < 0 || x >= n || z >= n) continue;
        const key = encode(x, z);
        if (
          parent[key] !== -1 ||
          this.blocked(x * cell - offset + 1, z * cell - offset + 1, radius)
        )
          continue;
        parent[key] = current;
        queue.push(key);
      }
    }
    if (parent[goal] === -1) return [];
    let route = [],
      key = goal;
    while (key !== start) {
      route.push({
        x: (key % n) * cell - offset + 1,
        z: Math.floor(key / n) * cell - offset + 1,
      });
      key = parent[key];
    }
    return route.reverse();
  }
  enemySpecial(e, dt) {
    e.special -= dt;
    if (e.phase === "charge") {
      e.phaseTime -= dt;
      this.move(e, e.chargeX * 7 * dt, e.chargeZ * 7 * dt, e.radius);
      if (distance(e, this.player) < e.radius + 1)
        this.damagePlayer(e.damage * 1.5);
      if (e.phaseTime <= 0) e.phase = "walk";
      return;
    }
    if (e.phase === "windup") {
      e.phaseTime -= dt;
      if (e.phaseTime <= 0) {
        e.phase = "charge";
        e.phaseTime = 1.2;
        const d = distance(e, this.player) || 1;
        e.chargeX = (this.player.x - e.x) / d;
        e.chargeZ = (this.player.z - e.z) / d;
      }
      return;
    }
    if (e.special > 0) return;
    if (e.type === "butcher" || e.type === "stalker") {
      e.phase = "windup";
      e.phaseTime = e.type === "stalker" ? 0.45 : 1;
      e.special = e.type === "stalker" ? 4 : 6;
      this.emit("charge", { id: e.id });
    }
    if (e.type === "spitter" || e.type === "hive" || e.type === "zero") {
      const d = distance(e, this.player) || 1;
      for (const a of e.boss ? [-0.16, 0, 0.16] : [0]) {
        const yaw = Math.atan2(this.player.x - e.x, this.player.z - e.z) + a;
        this.projectiles.push({
          id: ++this.id,
          kind: "acid",
          x: e.x,
          y: 1.3 * e.scale,
          z: e.z,
          dx: Math.sin(yaw) * 8,
          dy: ((1.4 - 1.3 * e.scale) / d) * 8,
          dz: Math.cos(yaw) * 8,
          life: 5,
          damage: e.damage,
          radius: 2.6,
        });
      }
      e.special = e.boss ? 2.5 : 3.4;
      this.emit("spit", { id: e.id });
    }
    if (e.type === "armored" || e.type === "zero") {
      this.hazards.push({
        x: e.x,
        z: e.z,
        radius: e.type === "zero" ? 10 : 7,
        delay: 1,
        life: 0.3,
        damage: 30,
        kind: "shock",
        hit: false,
      });
      e.special = e.type === "zero" ? 3 : 5;
      this.emit("stomp", { id: e.id });
    }
    if (e.type === "zero" && this.enemies.filter((e) => !e.boss).length < 5) {
      for (let i = 0; i < 2; i++) this.spawnEnemy("runner", true);
    }
  }
  update(dt, input = {}) {
    if (this.state !== "playing") return;
    dt = clamp(dt, 0, 0.05);
    this.time += dt;
    const p = this.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.cooldown = Math.max(0, p.cooldown - dt);
    if (Number.isFinite(input.yaw)) p.yaw = input.yaw;
    if (Number.isFinite(input.pitch)) p.pitch = clamp(input.pitch, -1.35, 1.35);
    p.aim = !!input.aim;
    p.crouch = !!input.crouch;
    if (p.reload > 0) {
      p.reload -= dt;
      if (p.reload <= 0) {
        p.reload = 0;
        const a = this.ammo[p.weapon],
          count = Math.min(this.weapon.magazine - a.magazine, a.reserve);
        a.magazine += count;
        a.reserve -= count;
        this.emit("loaded");
      }
    }
    if (input.reload) this.reload();
    if (input.grenade) this.grenade();
    let mx = input.moveX || 0,
      mz = input.moveZ || 0;
    const length = Math.hypot(mx, mz);
    if (length > 1) {
      mx /= length;
      mz /= length;
    }
    const sprint =
      input.sprint && p.stamina > 5 && !p.aim && length > 0 && p.reload <= 0;
    p.stamina = clamp(p.stamina + (sprint ? -22 : 16) * dt, 0, 100);
    const speed =
      (sprint ? 7 : 4.2) *
      this.weapon.weight *
      (p.aim ? 0.7 : 1) *
      (p.crouch ? 0.55 : 1);
    this.move(
      p,
      (mx * Math.cos(p.yaw) - mz * Math.sin(p.yaw)) * speed * dt,
      (-mx * Math.sin(p.yaw) - mz * Math.cos(p.yaw)) * speed * dt,
    );
    if (input.fire && (this.weapon.mode === "AUTO" || input.trigger))
      this.shoot();
    if (this.state !== "playing") return;
    this.intro = Math.max(0, this.intro - dt);
    const level = LEVELS[this.level - 1];
    this.spawnTimer -= dt;
    if (
      this.intro <= 0 &&
      !this.bossSpawned &&
      this.spawned < level.count &&
      this.enemies.filter((e) => e.hp > 0).length < level.cap &&
      this.spawnTimer <= 0
    ) {
      const r = this.random();
      let type =
        this.level >= 3 && r < 0.16
          ? "spitter"
          : this.level >= 2 && r < 0.4
            ? "runner"
            : this.level >= 2 && r < 0.56
              ? "soldier"
              : "shambler";
      this.spawnEnemy(type);
      this.spawned++;
      this.spawnTimer = Math.max(0.4, 1.25 - this.level * 0.12);
    }
    if (
      !this.bossSpawned &&
      this.regularKills >= level.count &&
      this.enemies.every((e) => e.hp <= 0)
    ) {
      this.bossSpawned = true;
      this.spawnEnemy(level.bossType);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
      this.pickups.push({
        id: ++this.id,
        x: p.x + 1,
        z: p.z,
        kind: "ammo",
        age: 0,
      });
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.age += dt;
      e.flash = Math.max(0, e.flash - dt);
      e.attack -= dt;
      if (e.burn > 0) {
        e.burn -= dt;
        e.burnTick = (e.burnTick || 0) - dt;
        if (e.burnTick <= 0) {
          this.damageEnemy(e, 5.5 * this.damageScale);
          e.burnTick = 0.25;
        }
        if (e.hp <= 0) continue;
      }
      this.enemySpecial(e, dt);
      if (e.phase !== "walk") continue;
      const d = distance(e, p) || 1;
      e.angle = Math.atan2(p.x - e.x, p.z - e.z);
      let target = p;
      const dir = { x: (p.x - e.x) / d, y: 0, z: (p.z - e.z) / d };
      if (this.wallDistance({ x: e.x, y: 1, z: e.z }, dir) < d) {
        e.navTimer -= dt;
        if (e.navTimer <= 0) {
          e.path = this.findPath(e, p, e.radius);
          e.navTimer = 0.8 + this.random() * 0.3;
        }
        while (e.path.length && distance(e, e.path[0]) < 0.8) e.path.shift();
        if (e.path.length) target = e.path[0];
      }
      const td = distance(e, target) || 1;
      const speed = e.speed * (e.type === "spitter" && d < 12 ? 0.25 : 1);
      if (d > e.radius + 0.85)
        this.move(
          e,
          ((target.x - e.x) / td) * speed * dt,
          ((target.z - e.z) / td) * speed * dt,
          e.radius,
        );
      if (d < e.radius + 1.1 && e.attack <= 0) {
        this.damagePlayer(e.damage);
        e.attack = e.boss ? 0.8 : 1.25;
        e.attackAnim = 0.4;
      }
      e.attackAnim = Math.max(0, (e.attackAnim || 0) - dt);
      if (this.state !== "playing") return;
    }
    for (let i = 0; i < this.enemies.length; i++)
      for (let j = i + 1; j < this.enemies.length; j++) {
        const a = this.enemies[i],
          b = this.enemies[j];
        if (a.hp <= 0 || b.hp <= 0) continue;
        const d = distance(a, b) || 0.01,
          overlap = a.radius + b.radius - d;
        if (overlap > 0) {
          const dx = ((a.x - b.x) / d) * Math.min(overlap / 2, dt),
            dz = ((a.z - b.z) / d) * Math.min(overlap / 2, dt);
          this.move(a, dx, dz, a.radius);
          this.move(b, -dx, -dz, b.radius);
        }
      }
    for (const shot of this.projectiles) {
      shot.life -= dt;
      const previous = { x: shot.x, y: shot.y, z: shot.z };
      shot.x += shot.dx * dt;
      shot.y += shot.dy * dt;
      shot.z += shot.dz * dt;
      if (shot.kind === "grenade") {
        shot.dy -= 9.8 * dt;
        if (shot.y < 0.16) {
          shot.y = 0.16;
          shot.dy = Math.abs(shot.dy) * 0.4;
          shot.dx *= 0.7;
          shot.dz *= 0.7;
        }
        if (this.blocked(shot.x, shot.z, 0.1)) {
          shot.x = previous.x;
          shot.z = previous.z;
          shot.dx *= -0.3;
          shot.dz *= -0.3;
        }
      }
      const travel =
        Math.hypot(
          shot.x - previous.x,
          shot.y - previous.y,
          shot.z - previous.z,
        ) || 1;
      const dir = {
        x: (shot.x - previous.x) / travel,
        y: (shot.y - previous.y) / travel,
        z: (shot.z - previous.z) / travel,
      };
      let collision =
        shot.kind !== "grenade" &&
        (shot.y <= 0.1 || this.wallDistance(previous, dir) < travel);
      if (shot.kind === "rocket")
        collision ||= this.enemies.some(
          (e) =>
            e.hp > 0 &&
            raySphere(
              previous,
              dir,
              { x: e.x, y: e.scale, z: e.z },
              0.6 * e.scale,
            ) < travel,
        );
      if (
        shot.kind === "acid" &&
        Math.hypot(p.x - shot.x, p.z - shot.z) < 0.7 &&
        shot.y < 2
      ) {
        this.damagePlayer(shot.damage);
        collision = true;
      }
      if (shot.life <= 0 || collision) {
        shot.dead = true;
        if (shot.kind === "acid") {
          this.hazards.push({
            x: shot.x,
            z: shot.z,
            radius: 2,
            delay: 0,
            life: 4,
            damage: 8,
            kind: "acid",
            hit: false,
          });
          this.emit("acid", { x: shot.x, z: shot.z });
        } else this.explode(shot.x, shot.y, shot.z, shot.radius, shot.damage);
      }
      if (this.state !== "playing") return;
    }
    for (const hazard of this.hazards) {
      if (hazard.delay > 0) {
        hazard.delay -= dt;
        continue;
      }
      hazard.life -= dt;
      if (distance(p, hazard) < hazard.radius) {
        if (hazard.kind === "acid") this.damagePlayer(hazard.damage);
        else if (!hazard.hit) {
          this.damagePlayer(hazard.damage);
          hazard.hit = true;
        }
      }
    }
    this.hazards = this.hazards.filter((h) => h.life > 0);
    this.projectiles = this.projectiles.filter((s) => !s.dead);
    for (const pickup of this.pickups) {
      pickup.age += dt;
      if (distance(p, pickup) < 1.7) {
        pickup.collected = true;
        if (pickup.kind === "health") p.hp = Math.min(p.maxHp, p.hp + 30);
        else
          this.ammo.forEach(
            (a, i) =>
              (a.reserve = Math.min(
                WEAPONS[i].reserve * 2,
                a.reserve + Math.max(1, Math.ceil(WEAPONS[i].reserve * 0.24)),
              )),
          );
        this.emit("pickup", { kind: pickup.kind });
      }
    }
    this.pickups = this.pickups.filter((p) => !p.collected && p.age < 90);
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  }
}
