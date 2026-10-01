import test from 'node:test';
import assert from 'node:assert/strict';
import { POCKETS, TABLE, makeBall, rack, step, strike } from '../src/physics.js';
import { PoolGame } from '../src/game.js';

function event(overrides = {}) {
  return { firstHit: 1, pocketed: [], collisions: [], rails: [], railAfterHit: true,
    wasBreak: false, groupBefore: null, clearedBefore: false, ...overrides };
}

test('rack contains all sixteen numbered balls without overlap', () => {
  const balls = rack();
  assert.deepEqual(balls.map(ball => ball.number).sort((a, b) => a - b), Array.from({ length: 16 }, (_, i) => i));
  for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
    assert.ok(Math.hypot(balls[i].x - balls[j].x, balls[i].y - balls[j].y) >= TABLE.radius * 2);
  }
  assert.equal(balls[3].number, 2);
});

test('continuous collision catches a fast ball crossing another in one step', () => {
  const balls = [makeBall(0, 250, 250), makeBall(1, 305, 250)];
  const events = event({ firstHit: null });
  balls[0].vx = 4000;
  step(balls, 1 / 60, events);
  assert.equal(events.firstHit, 1);
  assert.ok(balls[1].vx > 2000);
  assert.ok(balls[0].x < balls[1].x);
});

test('a ball entering a pocket is removed and reported', () => {
  const balls = [makeBall(3, POCKETS[1].x, 55)];
  const events = event();
  balls[0].vy = -700;
  for (let i = 0; i < 20 && !balls[0].pocketed; i++) step(balls, 1 / 240, events);
  assert.equal(balls[0].pocketed, true);
  assert.deepEqual(events.pocketed, [3]);
});

test('draw sends the cue back while follow sends it forward after a straight hit', () => {
  function cueAfter(spin) {
    const balls = [makeBall(0, 250, 250), makeBall(1, 300, 250)];
    strike(balls[0], 0, .55, spin);
    for (let i = 0; i < 120; i++) step(balls, 1 / 240);
    return balls[0];
  }
  const draw = cueAfter(-1), follow = cueAfter(1);
  assert.ok(draw.x < 250 && draw.vx < 0);
  assert.ok(follow.x > 380 && follow.vx > 0);
});

test('a legal pocket selects groups and keeps the current player at the table', () => {
  const game = new PoolGame();
  game.phase = 'moving';
  game.events = event({ pocketed: [2] });
  game.balls.find(ball => ball.number === 2).pocketed = true;
  game.finishShot();
  assert.deepEqual(game.groups, ['lisas', 'rayadas']);
  assert.equal(game.turn, 0);
  assert.equal(game.phase, 'aim');
});

test('a wrong first contact gives the opponent ball in hand', () => {
  const game = new PoolGame();
  game.groups = ['lisas', 'rayadas'];
  game.phase = 'moving';
  game.events = event({ firstHit: 10, groupBefore: 'lisas' });
  game.finishShot();
  assert.equal(game.turn, 1);
  assert.equal(game.ballInHand, true);
  assert.equal(game.cueBall().pocketed, true);
  assert.equal(game.placeCue(250, 250), true);
  assert.equal(game.ballInHand, false);
});

test('the eight wins only after the player has cleared their group', () => {
  const game = new PoolGame();
  game.groups = ['lisas', 'rayadas'];
  game.phase = 'moving';
  game.events = event({ firstHit: 8, groupBefore: 'lisas', clearedBefore: false, pocketed: [8] });
  game.finishShot();
  assert.equal(game.winner, 1);
  const legal = new PoolGame();
  legal.groups = ['lisas', 'rayadas'];
  legal.phase = 'moving';
  legal.events = event({ firstHit: 8, groupBefore: 'lisas', clearedBefore: true, pocketed: [8] });
  legal.finishShot();
  assert.equal(legal.winner, 0);
});

test('a normal opening break settles and keeps the table playable', () => {
  const game = new PoolGame();
  assert.equal(game.startShot(0, .48), true);
  for (let i = 0; i < 2400 && game.phase === 'moving'; i++) game.update(1 / 240);
  assert.notEqual(game.phase, 'moving');
  assert.equal(game.events.firstHit, 1);
  assert.ok(game.balls.some(ball => ball.number !== 0 && (Math.hypot(ball.x - 690, ball.y - 250) > 30 || ball.pocketed)));
});
