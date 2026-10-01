export const TABLE = Object.freeze({ width: 1000, height: 500, left: 36, right: 964, top: 36, bottom: 464, radius: 11.25 });
export const POCKETS = Object.freeze([
  { x: 36, y: 36, r: 27 }, { x: 500, y: 23, r: 25 }, { x: 964, y: 36, r: 27 },
  { x: 36, y: 464, r: 27 }, { x: 500, y: 477, r: 25 }, { x: 964, y: 464, r: 27 },
]);
const EPSILON = 1e-8;
const ROLLING_DRAG = 78;
const SIDE_SPIN_DRAG = 1.8;
const BALL_RESTITUTION = 0.95;
const RAIL_RESTITUTION = 0.79;

export function makeBall(number, x, y) {
  return { number, x, y, vx: 0, vy: 0, spinX: 0, spinY: 0, sideSpin: 0, pocketed: false };
}

export function rack() {
  const balls = [makeBall(0, 250, 250)];
  // Regulation eight-ball rack: the 8 in the center and unlike groups in the rear corners.
  const order = [[1], [9, 2], [3, 8, 10], [11, 4, 12, 5], [6, 13, 7, 14, 15]];
  const gap = TABLE.radius * 2 + 0.25;
  for (let row = 0; row < 5; row++) {
    for (let column = 0; column <= row; column++) {
      balls.push(makeBall(order[row][column], 690 + row * gap * Math.sqrt(3) / 2, 250 + (column - row / 2) * gap));
    }
  }
  return balls;
}

export function isMoving(balls) {
  return balls.some(ball => !ball.pocketed && (Math.hypot(ball.vx, ball.vy) > 2 || Math.hypot(ball.spinX, ball.spinY) > 2));
}

export function strike(ball, angle, power, topSpin = 0, sideSpin = 0) {
  if (ball.pocketed) return;
  const speed = 240 + Math.pow(Math.max(0, Math.min(1, power)), 1.35) * 1260;
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
  const spinFactor = 0.67 + topSpin * (topSpin < 0 ? 1.8 : 1.06);
  ball.spinX = Math.cos(angle) * speed * spinFactor;
  ball.spinY = Math.sin(angle) * speed * spinFactor;
  ball.sideSpin = sideSpin * speed * 0.26;
}

function pocket(ball, events) {
  if (ball.pocketed) return false;
  for (const hole of POCKETS) {
    if (Math.hypot(ball.x - hole.x, ball.y - hole.y) < hole.r - 2) {
      ball.pocketed = true;
      ball.vx = ball.vy = ball.spinX = ball.spinY = ball.sideSpin = 0;
      events?.pocketed.push(ball.number);
      return true;
    }
  }
  return false;
}

function advance(balls, dt, events) {
  for (const ball of balls) {
    if (ball.pocketed) continue;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    pocket(ball, events);
  }
}

function pairTime(a, b, remaining) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dvx = b.vx - a.vx, dvy = b.vy - a.vy;
  const rr = TABLE.radius * 2;
  const c = dx * dx + dy * dy - rr * rr;
  if (c <= -0.01) return 0;
  const aa = dvx * dvx + dvy * dvy;
  const bb = 2 * (dx * dvx + dy * dvy);
  if (aa < EPSILON || bb >= 0) return Infinity;
  const discriminant = bb * bb - 4 * aa * c;
  if (discriminant < 0) return Infinity;
  const t = (-bb - Math.sqrt(discriminant)) / (2 * aa);
  return t >= -EPSILON && t <= remaining + EPSILON ? Math.max(0, t) : Infinity;
}

function resolvePair(a, b, events) {
  let dx = b.x - a.x, dy = b.y - a.y;
  let distance = Math.hypot(dx, dy);
  if (distance < EPSILON) { dx = 1; dy = 0; distance = 1; }
  const nx = dx / distance, ny = dy / distance;
  const overlap = TABLE.radius * 2 - distance;
  if (overlap > 0) {
    a.x -= nx * (overlap / 2 + 0.001); a.y -= ny * (overlap / 2 + 0.001);
    b.x += nx * (overlap / 2 + 0.001); b.y += ny * (overlap / 2 + 0.001);
  }
  const normalSpeed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (normalSpeed >= -0.01) return false;
  const impulse = -(1 + BALL_RESTITUTION) * normalSpeed / 2;
  a.vx -= impulse * nx; a.vy -= impulse * ny;
  b.vx += impulse * nx; b.vy += impulse * ny;
  // Tangential friction carries a small amount of throw and side spin to the object ball.
  const tx = -ny, ty = nx;
  const slip = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty + (b.sideSpin + a.sideSpin) * 0.12;
  const tangentImpulse = Math.max(-22, Math.min(22, -slip * 0.035));
  a.vx -= tangentImpulse * tx; a.vy -= tangentImpulse * ty;
  b.vx += tangentImpulse * tx; b.vy += tangentImpulse * ty;
  if (a.number === 0 && events && events.firstHit === null) events.firstHit = b.number;
  if (b.number === 0 && events && events.firstHit === null) events.firstHit = a.number;
  events?.collisions.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, strength: -normalSpeed });
  return true;
}

function railOpen(ball, wall) {
  if (wall === 'top' || wall === 'bottom') return ball.x < 91 || ball.x > 909 || Math.abs(ball.x - 500) < 39;
  return ball.y < 91 || ball.y > 409;
}

function railTime(ball, remaining) {
  let best = null;
  const r = TABLE.radius;
  const walls = [
    ['left', TABLE.left + r, ball.vx], ['right', TABLE.right - r, ball.vx],
    ['top', TABLE.top + r, ball.vy], ['bottom', TABLE.bottom - r, ball.vy],
  ];
  for (const [wall, bound, velocity] of walls) {
    if ((wall === 'left' || wall === 'top') ? velocity >= -EPSILON : velocity <= EPSILON) continue;
    const coordinate = wall === 'left' || wall === 'right' ? ball.x : ball.y;
    const t = (bound - coordinate) / velocity;
    if (t < -EPSILON || t > remaining + EPSILON) continue;
    const other = wall === 'left' || wall === 'right' ? ball.y + ball.vy * Math.max(0, t) : ball.x + ball.vx * Math.max(0, t);
    if (railOpen({ x: other, y: other }, wall)) continue;
    if (!best || t < best.t) best = { t: Math.max(0, t), wall };
  }
  return best;
}

function resolveRail(ball, wall, events) {
  const horizontal = wall === 'left' || wall === 'right';
  if (horizontal) {
    ball.x = wall === 'left' ? TABLE.left + TABLE.radius : TABLE.right - TABLE.radius;
    ball.vx *= -RAIL_RESTITUTION;
    ball.vy += ball.sideSpin * 0.13;
    ball.sideSpin *= 0.56;
  } else {
    ball.y = wall === 'top' ? TABLE.top + TABLE.radius : TABLE.bottom - TABLE.radius;
    ball.vy *= -RAIL_RESTITUTION;
    ball.vx -= ball.sideSpin * 0.13;
    ball.sideSpin *= 0.56;
  }
  if (events?.firstHit !== null && events) events.railAfterHit = true;
  events?.rails.push({ x: ball.x, y: ball.y, strength: horizontal ? Math.abs(ball.vx) : Math.abs(ball.vy) });
}

function applyCloth(ball, dt) {
  const speed = Math.hypot(ball.vx, ball.vy);
  const spinSpeed = Math.hypot(ball.spinX, ball.spinY);
  if (speed < 0.1 && spinSpeed < 0.1) { ball.vx = ball.vy = ball.spinX = ball.spinY = 0; return; }
  // Sliding friction transfers top/back spin to translation. The remaining energy
  // then fades under rolling resistance; this allows follow and draw after impact.
  const slipX = ball.spinX - ball.vx, slipY = ball.spinY - ball.vy;
  const transfer = Math.min(0.08, dt * 4);
  ball.vx += slipX * transfer;
  ball.vy += slipY * transfer;
  // A solid sphere has I = 2/5 mr², so the angular correction is 5/2
  // times the linear correction while sliding toward pure rolling.
  ball.spinX -= slipX * transfer * 2.5;
  ball.spinY -= slipY * transfer * 2.5;
  const now = Math.hypot(ball.vx, ball.vy);
  const drag = Math.min(now, ROLLING_DRAG * dt);
  if (now > EPSILON) { ball.vx *= (now - drag) / now; ball.vy *= (now - drag) / now; }
  const spinNow = Math.hypot(ball.spinX, ball.spinY);
  const spinDrag = Math.min(spinNow, ROLLING_DRAG * dt * 0.7);
  if (spinNow > EPSILON) { ball.spinX *= (spinNow - spinDrag) / spinNow; ball.spinY *= (spinNow - spinDrag) / spinNow; }
  ball.sideSpin *= Math.exp(-SIDE_SPIN_DRAG * dt);
  if (Math.hypot(ball.vx, ball.vy) < 1.5 && Math.hypot(ball.spinX, ball.spinY) < 1.5) ball.vx = ball.vy = ball.spinX = ball.spinY = 0;
}

export function step(balls, dt, events = null) {
  // Continuous collision times prevent tunneling at full break speed.
  let remaining = Math.min(dt, 1 / 60);
  let iterations = 0;
  while (remaining > EPSILON && iterations++ < 48) {
    let hit = null;
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      if (a.pocketed) continue;
      const rail = railTime(a, remaining);
      if (rail && (!hit || rail.t < hit.t)) hit = { type: 'rail', t: rail.t, a, wall: rail.wall };
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        if (b.pocketed) continue;
        const t = pairTime(a, b, remaining);
        if (t < Infinity && (!hit || t < hit.t)) hit = { type: 'pair', t, a, b };
      }
    }
    if (!hit) { advance(balls, remaining, events); remaining = 0; break; }
    advance(balls, hit.t, events);
    remaining -= hit.t;
    if (!hit.a.pocketed && (hit.type !== 'pair' || !hit.b.pocketed)) {
      if (hit.type === 'pair') resolvePair(hit.a, hit.b, events);
      else resolveRail(hit.a, hit.wall, events);
    }
    // Move past a zero-time collision to prevent repeated contact loops.
    if (hit.t < EPSILON) { const nudge = Math.min(remaining, 0.00001); advance(balls, nudge, events); remaining -= nudge; }
  }
  if (remaining > EPSILON) advance(balls, remaining, events);
  for (const ball of balls) {
    if (!ball.pocketed) {
      applyCloth(ball, dt);
      if (ball.x < -40 || ball.x > TABLE.width + 40 || ball.y < -40 || ball.y > TABLE.height + 40) {
        ball.pocketed = true; events?.pocketed.push(ball.number);
      }
    }
  }
}
