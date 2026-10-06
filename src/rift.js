export const WORLD = { width: 2200, height: 1500 };
export const WAVE_NAMES = ['PRIMER CONTACTO', 'SEÑAL HOSTIL', 'ZONA DE FRACTURA', 'MASA CRÍTICA', 'SIN RETORNO', 'EL NÚCLEO'];
export const UPGRADES = [
  { id: 'damage', icon: '✳', name: 'PLASMA DENSO', tag: 'POTENCIA', description: '+30% de daño por proyectil. Que cada impacto cuente.' },
  { id: 'rapid', icon: '≋', name: 'SOBRECARGA', tag: 'CADENCIA', description: 'Dispara un 22% más rápido. Convierte el espacio en una tormenta.' },
  { id: 'spread', icon: '⋔', name: 'BIFURCACIÓN', tag: 'MULTIDISPARO', description: 'Un proyectil extra por disparo. Más ángulos. Menos escapatorias.' },
  { id: 'speed', icon: '↯', name: 'VECTOR FANTASMA', tag: 'MOVILIDAD', description: '+15% de velocidad y dash un 20% más frecuente.' },
  { id: 'health', icon: '⊕', name: 'SEGUNDA PIEL', tag: 'INTEGRIDAD', description: '+25 de integridad máxima y recuperación de 45 puntos.' },
  { id: 'pierce', icon: '⟶', name: 'LANZA DE IONES', tag: 'PENETRACIÓN', description: 'Tus disparos atraviesan un enemigo adicional. Alinea el enjambre.' },
  { id: 'drone', icon: '◈', name: 'SATÉLITE ARMADO', tag: 'COMPAÑERO', description: 'Un dron orbital que apunta y dispara automáticamente.' },
  { id: 'pulse', icon: '◎', name: 'HORIZONTE CERO', tag: 'COLAPSO', description: '+35% de alcance y daño del pulso. Recarga más rápido.' },
];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class RiftGame {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  reset() {
    this.state = 'menu'; this.time = 0; this.wave = 0; this.score = 0; this.kills = 0;
    this.combo = 1; this.comboTime = 0; this.maxCombo = 1; this.id = 0;
    this.player = { x: WORLD.width / 2, y: WORLD.height / 2, vx: 0, vy: 0, angle: -Math.PI / 2, radius: 15, hp: 100, maxHp: 100, invulnerable: 0, dashTime: 0, dashCooldown: 0, dashX: 0, dashY: -1, fireCooldown: 0, pulse: 0 };
    this.stats = { damage: 22, fireInterval: .17, speed: 280, projectiles: 1, pierce: 0, dashInterval: 1.4, drones: 0, pulseScale: 1, chargeRate: 1 };
    this.enemies = []; this.bullets = []; this.pickups = []; this.events = []; this.upgrades = [];
    this.spawned = 0; this.waveKills = 0; this.waveQuota = 0; this.spawnTimer = 0;
    this.waveDelay = 0; this.droneTimer = 0; this.choices = []; this.boss = null;
  }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  start() { this.reset(); this.state = 'playing'; this.nextWave(); }
  nextWave() {
    this.wave++; this.waveQuota = 5 + this.wave * 3; this.spawned = 0; this.waveKills = 0;
    this.spawnTimer = .6; this.waveDelay = 2.2; this.bullets = []; this.enemies = [];
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 12);
    this.player.invulnerable = 2.2;
    this.emit('wave', { wave: this.wave, name: WAVE_NAMES[this.wave - 1] });
  }
  nearestEnemy(maxDistance = Infinity, origin = this.player) {
    let target = null; let best = maxDistance;
    for (const enemy of this.enemies) { const d = distance(origin, enemy); if (enemy.hp > 0 && d < best) { target = enemy; best = d; } }
    return target;
  }
  spawnEnemy(type) {
    const angle = this.random() * Math.PI * 2;
    const range = 480 + this.random() * 170;
    const x = clamp(this.player.x + Math.cos(angle) * range, 50, WORLD.width - 50);
    const y = clamp(this.player.y + Math.sin(angle) * range, 50, WORLD.height - 50);
    const spec = {
      seeker: { radius: 17, hp: 34 + this.wave * 5, speed: 95 + this.wave * 9, damage: 14, value: 100 },
      gunner: { radius: 22, hp: 62 + this.wave * 7, speed: 72, damage: 12, value: 180 },
      brute: { radius: 30, hp: 120 + this.wave * 12, speed: 57 + this.wave * 3, damage: 23, value: 260 },
      boss: { radius: 66, hp: 1500, speed: 52, damage: 25, value: 5000 },
    }[type];
    const enemy = { id: ++this.id, type, x, y, vx: 0, vy: 0, angle, ...spec, maxHp: spec.hp, fireTimer: 1.2 + this.random(), flash: 0, attackTimer: 0, age: 0 };
    this.enemies.push(enemy);
    if (type === 'boss') { this.boss = enemy; this.emit('boss', { x, y }); }
    this.emit('spawn', { x, y, size: spec.radius });
    return enemy;
  }
  fire(angle, origin = this.player, drone = false) {
    const count = drone ? 1 : this.stats.projectiles;
    for (let i = 0; i < count; i++) {
      const a = angle + (i - (count - 1) / 2) * .13;
      this.bullets.push({ x: origin.x + Math.cos(a) * 23, y: origin.y + Math.sin(a) * 23, vx: Math.cos(a) * 1000, vy: Math.sin(a) * 1000, radius: 4, life: 1.1, damage: this.stats.damage * (drone ? .65 : 1), enemy: false, pierce: this.stats.pierce, hits: new Set(), drone });
    }
    this.emit('shot', { x: origin.x, y: origin.y, angle, drone });
  }
  enemyFire(enemy, angle, speed = 245) {
    this.bullets.push({ x: enemy.x + Math.cos(angle) * (enemy.radius + 8), y: enemy.y + Math.sin(angle) * (enemy.radius + 8), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 6, life: 7, damage: enemy.damage, enemy: true });
  }
  damagePlayer(damage) {
    const p = this.player;
    if (p.invulnerable > 0 || p.dashTime > 0 || this.state !== 'playing') return false;
    p.hp = Math.max(0, p.hp - damage); p.invulnerable = .85;
    this.combo = 1; this.comboTime = 0;
    this.emit('damage', { x: p.x, y: p.y, damage });
    if (p.hp <= 0) { this.state = 'dead'; this.emit('end', { victory: false }); }
    return true;
  }
  damageEnemy(enemy, damage) {
    if (enemy.hp <= 0 || this.state !== 'playing') return;
    enemy.hp -= damage; enemy.flash = .1;
    this.emit('hit', { x: enemy.x, y: enemy.y, damage });
    if (enemy.hp > 0) return;
    this.kills++; this.waveKills++; this.combo = Math.min(8, this.combo + .25); this.comboTime = 4;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += Math.round(enemy.value * this.combo);
    this.emit('kill', { x: enemy.x, y: enemy.y, enemyType: enemy.type, size: enemy.radius, value: Math.round(enemy.value * this.combo) });
    this.pickups.push({ x: enemy.x, y: enemy.y, type: 'charge', age: 0, amount: enemy.type === 'brute' ? 16 : 10 });
    if (this.random() < .13) this.pickups.push({ x: enemy.x + 14, y: enemy.y + 14, type: 'health', age: 0, amount: 14 });
    if (enemy.type === 'boss') { this.score += 3000; this.state = 'victory'; this.emit('end', { victory: true }); }
  }
  dash(input) {
    const p = this.player;
    if (p.dashCooldown > 0 || p.dashTime > 0) return;
    let x = input.x || 0; let y = input.y || 0;
    if (Math.hypot(x, y) < .1) { x = Math.cos(p.angle); y = Math.sin(p.angle); }
    const length = Math.hypot(x, y);
    p.dashX = x / length; p.dashY = y / length;
    p.dashTime = .19; p.dashCooldown = this.stats.dashInterval;
    this.emit('dash', { x: p.x, y: p.y, angle: Math.atan2(y, x) });
  }
  pulse() {
    const p = this.player;
    if (p.pulse < 100) return false;
    p.pulse = 0; p.invulnerable = Math.max(p.invulnerable, .45);
    const radius = 330 * this.stats.pulseScale;
    this.emit('pulse', { x: p.x, y: p.y, radius });
    for (const enemy of this.enemies) if (distance(p, enemy) < radius + enemy.radius) this.damageEnemy(enemy, 145 * this.stats.pulseScale);
    this.bullets = this.bullets.filter(b => !b.enemy || distance(p, b) > radius);
    return true;
  }
  chooseUpgrade(id) {
    if (this.state !== 'upgrade' || !this.choices.some(c => c.id === id)) return false;
    const s = this.stats;
    if (id === 'damage') s.damage *= 1.3;
    if (id === 'rapid') s.fireInterval *= .78;
    if (id === 'spread') s.projectiles++;
    if (id === 'speed') { s.speed *= 1.15; s.dashInterval *= .8; }
    if (id === 'health') { this.player.maxHp += 25; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 45); }
    if (id === 'pierce') s.pierce++;
    if (id === 'drone') s.drones++;
    if (id === 'pulse') { s.pulseScale *= 1.35; s.chargeRate *= 1.2; }
    this.upgrades.push(id); this.state = 'playing'; this.emit('upgrade', { id }); this.nextWave();
    return true;
  }
  completeWave() {
    this.state = 'upgrade'; this.score += this.wave * 500;
    this.choices = [...UPGRADES];
    for (let i = this.choices.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [this.choices[i], this.choices[j]] = [this.choices[j], this.choices[i]]; }
    this.choices = this.choices.slice(0, 3); this.emit('waveClear');
  }
  update(dt, input = {}) {
    if (this.state !== 'playing') return;
    dt = Math.min(Math.max(dt, 0), .04); this.time += dt;
    const p = this.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.fireCooldown = Math.max(0, p.fireCooldown - dt);
    this.comboTime -= dt; if (this.comboTime <= 0) this.combo = 1;
    if (Number.isFinite(input.aimX) && Number.isFinite(input.aimY)) p.angle = Math.atan2(input.aimY - p.y, input.aimX - p.x);
    if (input.autoAim) {
      const target = this.nearestEnemy();
      if (target) { const lead = distance(p, target) / 1000; p.angle = Math.atan2(target.y + target.vy * lead - p.y, target.x + target.vx * lead - p.x); }
    }
    if (input.dash) this.dash(input);
    if (input.pulse) this.pulse();
    if (this.state !== 'playing') return;
    let mx = input.x || 0; let my = input.y || 0; const length = Math.hypot(mx, my);
    if (length > 1) { mx /= length; my /= length; }
    const dashing = p.dashTime > 0;
    p.vx = dashing ? p.dashX * 1100 : mx * this.stats.speed;
    p.vy = dashing ? p.dashY * 1100 : my * this.stats.speed;
    p.x = clamp(p.x + p.vx * dt, p.radius + 20, WORLD.width - p.radius - 20);
    p.y = clamp(p.y + p.vy * dt, p.radius + 20, WORLD.height - p.radius - 20);
    p.dashTime = Math.max(0, p.dashTime - dt);
    if ((input.fire || input.autoAim) && p.fireCooldown <= 0) { this.fire(p.angle); p.fireCooldown = this.stats.fireInterval; }
    this.droneTimer -= dt;
    if (this.stats.drones && this.droneTimer <= 0) {
      const target = this.nearestEnemy(800);
      if (target) for (let i = 0; i < this.stats.drones; i++) {
        const a = this.time * 2.2 + i * Math.PI * 2 / this.stats.drones;
        const origin = { x: p.x + Math.cos(a) * 44, y: p.y + Math.sin(a) * 44 };
        this.fire(Math.atan2(target.y - origin.y, target.x - origin.x), origin, true);
      }
      this.droneTimer = .55;
    }
    this.waveDelay = Math.max(0, this.waveDelay - dt);
    if (this.waveDelay <= 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.spawned < this.waveQuota) {
        let type = 'seeker'; const roll = this.random();
        if (this.wave === 6 && this.spawned === 0) type = 'boss';
        else if (this.wave >= 3 && roll < .23) type = 'brute';
        else if (this.wave >= 2 && roll < .49) type = 'gunner';
        this.spawnEnemy(type); this.spawned++; this.spawnTimer = Math.max(.48, 1.35 - this.wave * .1);
      }
    }
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      enemy.age += dt; enemy.flash = Math.max(0, enemy.flash - dt); enemy.attackTimer -= dt;
      const dx = p.x - enemy.x; const dy = p.y - enemy.y; const d = Math.hypot(dx, dy) || 1;
      enemy.angle = Math.atan2(dy, dx); let speed = enemy.speed;
      if (enemy.type === 'gunner') speed *= d < 240 ? -1 : d < 340 ? 0 : 1;
      if (enemy.type === 'boss') speed *= d < 300 ? -.8 : 1;
      enemy.vx = dx / d * speed; enemy.vy = dy / d * speed;
      if (enemy.type === 'seeker') { enemy.vx += Math.cos(enemy.age * 3 + enemy.id) * 16; enemy.vy += Math.sin(enemy.age * 3 + enemy.id) * 16; }
      enemy.x = clamp(enemy.x + enemy.vx * dt, enemy.radius, WORLD.width - enemy.radius);
      enemy.y = clamp(enemy.y + enemy.vy * dt, enemy.radius, WORLD.height - enemy.radius);
      if (enemy.type === 'gunner' || enemy.type === 'boss') {
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0) {
          if (enemy.type === 'boss') {
            for (let i = 0; i < 14; i++) this.enemyFire(enemy, i * Math.PI / 7 + enemy.age * .24, 175);
            for (const offset of [-.16, 0, .16]) this.enemyFire(enemy, enemy.angle + offset, 285);
            enemy.fireTimer = enemy.hp < enemy.maxHp * .5 ? 1.25 : 1.9;
            this.emit('bossShot', { x: enemy.x, y: enemy.y });
          } else { this.enemyFire(enemy, enemy.angle); enemy.fireTimer = Math.max(.9, 2.4 - this.wave * .12); }
        }
      }
      if (d < p.radius + enemy.radius && enemy.attackTimer <= 0) {
        if (dashing) { this.damageEnemy(enemy, 48); enemy.attackTimer = .4; }
        else { this.damagePlayer(enemy.damage); enemy.attackTimer = .5; }
      }
      if (this.state !== 'playing') return;
    }
    for (let i = 0; i < this.enemies.length; i++) for (let j = i + 1; j < this.enemies.length; j++) {
      const a = this.enemies[i], b = this.enemies[j]; if (a.hp <= 0 || b.hp <= 0) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01;
      const overlap = a.radius + b.radius - d;
      if (overlap > 0) { const push = Math.min(overlap * .5, 100 * dt); a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push; }
    }
    for (const bullet of this.bullets) {
      if (bullet.life <= 0) continue;
      const oldX = bullet.x, oldY = bullet.y;
      bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      if (bullet.enemy) {
        if (segmentHit(oldX, oldY, bullet.x, bullet.y, p, p.radius + bullet.radius)) { if (!dashing) this.damagePlayer(bullet.damage); bullet.life = 0; }
      } else for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || bullet.hits.has(enemy.id)) continue;
        if (segmentHit(oldX, oldY, bullet.x, bullet.y, enemy, enemy.radius + bullet.radius)) {
          this.damageEnemy(enemy, bullet.damage); bullet.hits.add(enemy.id);
          if (bullet.pierce-- <= 0) { bullet.life = 0; break; }
        }
      }
      if (this.state !== 'playing') return;
    }
    this.bullets = this.bullets.filter(b => b.life > 0 && b.x > -40 && b.x < WORLD.width + 40 && b.y > -40 && b.y < WORLD.height + 40);
    this.enemies = this.enemies.filter(e => e.hp > 0);
    for (const pickup of this.pickups) {
      pickup.age += dt; const d = distance(p, pickup);
      if (d < 180) { const speed = (1 - d / 200) * 600; pickup.x += (p.x - pickup.x) / (d || 1) * speed * dt; pickup.y += (p.y - pickup.y) / (d || 1) * speed * dt; }
      if (d < 25) {
        if (pickup.type === 'health') p.hp = Math.min(p.maxHp, p.hp + pickup.amount);
        else { const wasReady = p.pulse >= 100; p.pulse = Math.min(100, p.pulse + pickup.amount * this.stats.chargeRate); this.score += 25; if (!wasReady && p.pulse >= 100) this.emit('pulseReady'); }
        pickup.collected = true; this.emit('pickup', { x: pickup.x, y: pickup.y, pickupType: pickup.type });
      }
    }
    this.pickups = this.pickups.filter(pickup => !pickup.collected && pickup.age < 25);
    if (this.state === 'playing' && this.wave < 6 && this.spawned >= this.waveQuota && this.enemies.length === 0) this.completeWave();
  }
}

export function segmentHit(x1, y1, x2, y2, target, radius) {
  const dx = x2 - x1, dy = y2 - y1, lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : clamp(((target.x - x1) * dx + (target.y - y1) * dy) / lengthSq, 0, 1);
  return Math.hypot(x1 + dx * t - target.x, y1 + dy * t - target.y) <= radius;
}
