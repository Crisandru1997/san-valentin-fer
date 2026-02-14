// Core snake game logic (framework-agnostic)
export const DIRECTIONS = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

const OPPOSITES = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function createGameState(rows = 20, cols = 20, randomFn = Math.random) {
  const midRow = Math.floor(rows / 2);
  const midCol = Math.floor(cols / 2);
  const snake = [
    [midRow, midCol - 1],
    [midRow, midCol],
    [midRow, midCol + 1],
  ];

  const state = {
    rows,
    cols,
    snake,
    direction: 'right',
    nextDirection: 'right',
    food: null,
    score: 0,
    status: 'running', // 'running' | 'over' | 'paused'
  };

  return placeFood(state, randomFn);
}

export function queueDirection(state, desiredDirection) {
  if (!DIRECTIONS[desiredDirection] || state.status !== 'running') return state;
  // prevent direct reversal
  const current = state.direction;
  if (OPPOSITES[current] === desiredDirection) return state;
  return { ...state, nextDirection: desiredDirection };
}

export function togglePause(state) {
  if (state.status === 'over') return state;
  const status = state.status === 'paused' ? 'running' : 'paused';
  return { ...state, status };
}

export function nextState(state, randomFn = Math.random) {
  if (state.status !== 'running') return state;

  const direction = state.nextDirection ?? state.direction;
  const vector = DIRECTIONS[direction];
  const [headRow, headCol] = state.snake[state.snake.length - 1];
  const nextHead = [headRow + vector[0], headCol + vector[1]];

  // wall collision
  if (
    nextHead[0] < 0 ||
    nextHead[0] >= state.rows ||
    nextHead[1] < 0 ||
    nextHead[1] >= state.cols
  ) {
    return { ...state, status: 'over' };
  }

  const occupies = new Set(state.snake.map(([r, c]) => `${r},${c}`));
  if (occupies.has(`${nextHead[0]},${nextHead[1]}`)) {
    return { ...state, status: 'over' };
  }

  const ateFood = state.food && nextHead[0] === state.food[0] && nextHead[1] === state.food[1];
  const newSnake = [...state.snake, nextHead];
  let newScore = state.score;
  if (!ateFood) {
    newSnake.shift();
  } else {
    newScore += 10;
  }

  const updated = {
    ...state,
    direction,
    nextDirection: direction,
    snake: newSnake,
    score: newScore,
  };

  return ateFood ? placeFood(updated, randomFn) : updated;
}

export function placeFood(state, randomFn = Math.random) {
  const filled = new Set(state.snake.map(([r, c]) => `${r},${c}`));
  const emptyCount = state.rows * state.cols - filled.size;
  if (emptyCount === 0) {
    return { ...state, status: 'over' };
  }

  // deterministic order based on randomFn
  let targetIndex = Math.floor(randomFn() * emptyCount);
  for (let r = 0; r < state.rows; r += 1) {
    for (let c = 0; c < state.cols; c += 1) {
      if (filled.has(`${r},${c}`)) continue;
      if (targetIndex === 0) {
        return { ...state, food: [r, c] };
      }
      targetIndex -= 1;
    }
  }
  // fallback (should not reach)
  return { ...state, food: [0, 0] };
}

export function restartState(state, randomFn = Math.random) {
  return createGameState(state.rows, state.cols, randomFn);
}

export function coordsEqual(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
