import { TABLE, POCKETS, isMoving, makeBall, rack, step, strike } from './physics.js';

export const groupOf = number => number >= 1 && number <= 7 ? 'lisas' : number >= 9 && number <= 15 ? 'rayadas' : null;

export class PoolGame {
  constructor(mode = 'duel') { this.reset(mode); }

  reset(mode = this.mode) {
    this.mode = mode;
    this.balls = rack();
    this.turn = 0;
    this.turnNumber = 1;
    this.groups = [null, null];
    this.phase = 'aim';
    this.ballInHand = false;
    this.winner = null;
    this.message = mode === 'practice' ? 'Mesa libre: experimenta con cada golpe' : 'Jugador 1: rompe la formación';
    this.events = null;
    this.settleTime = 0;
    return this;
  }

  cueBall() { return this.balls[0]; }
  activeBalls() { return this.balls.filter(ball => !ball.pocketed); }
  remaining(group) { return this.balls.filter(ball => !ball.pocketed && groupOf(ball.number) === group).length; }

  canPlace(x, y) {
    const r = TABLE.radius;
    if (x < TABLE.left + r || x > TABLE.right - r || y < TABLE.top + r || y > TABLE.bottom - r) return false;
    if (POCKETS.some(hole => Math.hypot(x - hole.x, y - hole.y) < hole.r + r * 0.2)) return false;
    return this.balls.slice(1).every(ball => ball.pocketed || Math.hypot(x - ball.x, y - ball.y) >= r * 2 + 0.5);
  }

  placeCue(x, y) {
    if (!this.ballInHand || !this.canPlace(x, y)) return false;
    const cue = this.cueBall();
    Object.assign(cue, makeBall(0, x, y));
    this.ballInHand = false;
    this.phase = 'aim';
    this.message = this.mode === 'duel' ? `Jugador ${this.turn + 1}: apunta y dispara` : 'Apunta y dispara';
    return true;
  }

  findCueSpot() {
    const spots = [[250, 250]];
    for (let d = 18; d <= 360; d += 18) {
      for (let a = 0; a < 12; a++) spots.push([250 + d * Math.cos(a * Math.PI / 6), 250 + d * Math.sin(a * Math.PI / 6)]);
    }
    return spots.find(([x, y]) => this.canPlace(x, y)) || [250, 250];
  }

  startShot(angle, power, topSpin = 0, sideSpin = 0) {
    if (this.phase !== 'aim' || this.ballInHand || isMoving(this.balls)) return false;
    this.events = { firstHit: null, pocketed: [], collisions: [], rails: [], railAfterHit: false,
      wasBreak: this.turnNumber === 1, groupBefore: this.groups[this.turn], clearedBefore: this.groups[this.turn] && this.remaining(this.groups[this.turn]) === 0 };
    strike(this.cueBall(), angle, power, topSpin, sideSpin);
    this.phase = 'moving';
    this.message = 'Bolas en movimiento…';
    this.settleTime = 0;
    return true;
  }

  update(dt) {
    if (this.phase !== 'moving') return;
    step(this.balls, dt, this.events);
    if (isMoving(this.balls)) this.settleTime = 0;
    else this.settleTime += dt;
    if (this.settleTime > 0.16) this.finishShot();
  }

  respotEight() {
    const eight = this.balls.find(ball => ball.number === 8);
    if (!eight) return;
    eight.pocketed = false;
    for (let x = 720; x >= 530; x -= TABLE.radius * 2 + 1) {
      if (this.balls.every(ball => ball === eight || ball.pocketed || Math.hypot(ball.x - x, ball.y - 250) >= TABLE.radius * 2 + 1)) {
        Object.assign(eight, makeBall(8, x, 250));
        return;
      }
    }
    Object.assign(eight, makeBall(8, 750, 250));
  }

  finishShot() {
    if (this.phase !== 'moving') return;
    const event = this.events;
    const pocketed = event.pocketed;
    const cuePocketed = pocketed.includes(0);
    const eightPocketed = pocketed.includes(8);
    const objectPocketed = pocketed.filter(number => number !== 0 && number !== 8);
    const ownGroup = event.groupBefore;
    const wrongFirst = ownGroup ? (event.clearedBefore ? event.firstHit !== 8 : groupOf(event.firstHit) !== ownGroup)
      : event.firstHit === 8;
    const foul = cuePocketed || event.firstHit === null || wrongFirst || (!event.railAfterHit && !pocketed.length);

    if (this.mode === 'practice') {
      if (cuePocketed) {
        this.ballInHand = true;
        const [x, y] = this.findCueSpot();
        this.placeCue(x, y);
      }
      if (eightPocketed) this.respotEight();
      this.phase = 'aim';
      this.turnNumber++;
      this.message = cuePocketed ? 'Blanca recolocada. ¡Sigue practicando!' : objectPocketed.length ? `¡${objectPocketed.length} bola${objectPocketed.length > 1 ? 's' : ''} embocada${objectPocketed.length > 1 ? 's' : ''}!` : 'Ajusta tu próximo tiro';
      return;
    }

    if (eightPocketed && event.wasBreak && !cuePocketed) {
      this.respotEight();
    } else if (eightPocketed) {
      const legalEight = ownGroup && event.clearedBefore && event.firstHit === 8 && !foul;
      this.winner = legalEight ? this.turn : 1 - this.turn;
      this.phase = 'finished';
      this.message = legalEight ? `¡Jugador ${this.turn + 1} gana la partida!` : `Bola 8 antes de tiempo: gana Jugador ${this.winner + 1}`;
      return;
    }

    if (!foul && !this.groups[0] && objectPocketed.length) {
      const chosen = groupOf(objectPocketed[0]);
      this.groups[this.turn] = chosen;
      this.groups[1 - this.turn] = chosen === 'lisas' ? 'rayadas' : 'lisas';
    }
    const ownPocketed = objectPocketed.some(number => groupOf(number) === this.groups[this.turn]);
    const keepTurn = !foul && (this.groups[this.turn] ? ownPocketed : objectPocketed.length > 0);
    if (!keepTurn) this.turn = 1 - this.turn;
    this.turnNumber++;
    this.phase = cuePocketed ? 'place' : 'aim';
    this.ballInHand = foul;
    if (foul && !cuePocketed) this.cueBall().pocketed = true;
    this.message = foul ? `Falta${cuePocketed ? ': blanca embocada' : wrongFirst ? ': primera bola incorrecta' : event.firstHit === null ? ': sin contacto' : ': falta banda o embocar'}. Jugador ${this.turn + 1}: coloca la blanca` :
      keepTurn ? `¡Buen tiro! Jugador ${this.turn + 1} continúa` : `Turno de Jugador ${this.turn + 1}`;
  }
}
