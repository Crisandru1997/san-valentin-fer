import assert from 'node:assert/strict';
import { createGameState, nextState, queueDirection, placeFood } from '../logic.js';

function makeState({ rows = 6, cols = 6, snake, direction = 'right', food, score = 0 } = {}) {
  const base = createGameState(rows, cols, () => 0.5); // deterministic food
  const state = {
    ...base,
    direction,
    nextDirection: direction,
    snake: snake ?? base.snake,
    food: food ?? base.food,
    score,
  };
  return state;
}

// helper to create predictable random sequence
function fakeRandomSequence(...values) {
  let idx = 0;
  return () => {
    const val = values[idx % values.length];
    idx += 1;
    return val;
  };
}

// Movement forward should advance head and drop tail
{
  const state = makeState({
    snake: [
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    food: [0, 0],
  });
  const updated = nextState(state);
  assert.deepEqual(updated.snake, [
    [2, 2],
    [2, 3],
    [2, 4],
  ]);
}

// Eating food grows snake and increments score
{
  const state = makeState({
    snake: [
      [2, 2],
      [2, 3],
      [2, 4],
    ],
    food: [2, 5],
    score: 0,
  });
  const updated = nextState(state, fakeRandomSequence(0));
  assert.equal(updated.score, 10);
  assert.equal(updated.snake.length, state.snake.length + 1);
  assert(updated.food); // new food placed
}

// Hitting wall ends game
{
  const state = makeState({
    snake: [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    direction: 'up',
  });
  const updated = nextState(state);
  assert.equal(updated.status, 'over');
}

// Self collision ends game
{
  const state = makeState({
    snake: [
      [2, 2],
      [2, 3],
      [1, 3],
      [1, 2],
      [1, 1],
      [2, 1],
    ],
    direction: 'up',
  });
  const updated = nextState(state);
  assert.equal(updated.status, 'over');
}

// Opposite direction should be ignored
{
  const state = makeState();
  const updated = queueDirection(state, 'left');
  assert.equal(updated.nextDirection, state.nextDirection);
}

// Food placement avoids snake cells
{
  const state = makeState({
    rows: 3,
    cols: 3,
    snake: [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 2],
    ],
  });
  const updated = placeFood(state, () => 0); // only empty cell is (2,1)
  assert.deepEqual(updated.food, [2, 1]);
}

console.log('All snake logic tests passed.');
