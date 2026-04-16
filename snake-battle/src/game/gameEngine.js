import {
  COLS, ROWS, GRID_SIZE,
  PLAYER_INITIAL_LENGTH, AI_INITIAL_LENGTH,
  AI_SNAKE_COUNT, AI_SNAKE_TYPE_IDS, MAX_FOOD,
  DIR, DIRECTIONS, FOOD_SCORE,
  GAME_STATE,
} from './constants.js';
import { getSnakeType } from './snakeTypes.js';
import { updateAISnake } from './aiSnake.js';
import {
  spawnFoodParticles,
  spawnSnakeEatParticles,
  spawnDeathParticles,
  updateParticles as tickParticles,
} from './particleSystem.js';

let nextId = 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Build a straight snake body pointing in direction dir, head at (hx, hy) */
function buildBody(hx, hy, length, dir) {
  const body = [];
  for (let i = 0; i < length; i++) {
    body.push({ x: hx - dir.x * i, y: hy - dir.y * i });
  }
  return body;
}

/** Check if a cell is occupied by any segment of any snake in the list */
function cellOccupied(x, y, snakes) {
  for (const s of snakes) {
    for (const seg of s.body) {
      if (seg.x === x && seg.y === y) return true;
    }
  }
  return false;
}

/** Generate a random spawn position that doesn't overlap existing snakes */
function randomSpawnPos(length, dir, snakes) {
  const margin = 2;
  for (let attempt = 0; attempt < 200; attempt++) {
    const hx = randomInt(margin + length, COLS - margin);
    const hy = randomInt(margin + length, ROWS - margin);
    const body = buildBody(hx, hy, length, dir);
    const valid = body.every(
      seg => seg.x >= 0 && seg.x < COLS && seg.y >= 0 && seg.y < ROWS
        && !cellOccupied(seg.x, seg.y, snakes)
    );
    if (valid) return body;
  }
  // Fallback: place without overlap check (rare)
  return buildBody(randomInt(2, COLS - 3), randomInt(2, ROWS - 3), length, dir);
}

/** Create a snake object */
function createSnake({ id, isPlayer, typeId, length = 4, existingSnakes = [] }) {
  const dir = DIRECTIONS[randomInt(0, DIRECTIONS.length - 1)];
  const body = randomSpawnPos(length, dir, existingSnakes);
  return {
    id,
    isPlayer,
    typeId: typeId || AI_SNAKE_TYPE_IDS[randomInt(0, AI_SNAKE_TYPE_IDS.length - 1)],
    body,           // array of { x, y }, index 0 = head
    direction: dir,
    nextDirection: dir,
    alive: true,
    length,
    tickAccum: 0,   // accumulates ticks for per-speed movement
  };
}

/** Spawn food at a random free cell */
function spawnFood(snakes, foods) {
  const occupied = new Set();
  for (const s of snakes) {
    for (const seg of s.body) occupied.add(`${seg.x},${seg.y}`);
  }
  for (const f of foods) occupied.add(`${f.x},${f.y}`);

  for (let attempt = 0; attempt < 300; attempt++) {
    const x = randomInt(0, COLS - 1);
    const y = randomInt(0, ROWS - 1);
    if (!occupied.has(`${x},${y}`)) return { x, y, id: nextId++ };
  }
  return null;
}

// ─── Initial State Factory ────────────────────────────────────────────────────

export function createInitialState(playerTypeId = 'classic') {
  nextId = 1;
  const snakes = [];

  // Player snake
  const player = createSnake({
    id: nextId++,
    isPlayer: true,
    typeId: playerTypeId,
    length: PLAYER_INITIAL_LENGTH,
    existingSnakes: snakes,
  });
  snakes.push(player);

  // AI snakes
  for (let i = 0; i < AI_SNAKE_COUNT; i++) {
    const ai = createSnake({
      id: nextId++,
      isPlayer: false,
      typeId: AI_SNAKE_TYPE_IDS[i % AI_SNAKE_TYPE_IDS.length],
      length: AI_INITIAL_LENGTH,
      existingSnakes: snakes,
    });
    snakes.push(ai);
  }

  // Foods
  const foods = [];
  while (foods.length < MAX_FOOD) {
    const f = spawnFood(snakes, foods);
    if (f) foods.push(f);
    else break;
  }

  return {
    snakes,
    foods,
    particles: [],
    score: 0,
    tickCount: 0,
    gameState: GAME_STATE.IDLE,
    playerTypeId,
  };
}

// ─── Input ────────────────────────────────────────────────────────────────────

/** Returns true if two directions are opposite (180°) */
function isOpposite(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

/** Queue the next direction for the player snake */
export function setPlayerDirection(state, dir) {
  const player = state.snakes.find(s => s.isPlayer && s.alive);
  if (!player) return;
  if (!isOpposite(player.direction, dir)) {
    player.nextDirection = dir;
  }
}

// ─── Particle helpers ─────────────────────────────────────────────────────────
// Rich particle effects are handled by particleSystem.js.
// All particle emission uses those functions for consistent cyberpunk aesthetics.

// ─── Game Tick ────────────────────────────────────────────────────────────────

/**
 * Advance the game by one tick.
 * Returns a *new* state object (immutable update pattern).
 */
export function gameTick(state) {
  if (state.gameState !== GAME_STATE.RUNNING) return state;

  let { snakes, foods, particles, score, tickCount } = state;
  tickCount++;

  // ── 1. Decide next direction for AI snakes
  snakes = snakes.map(snake => {
    if (snake.isPlayer || !snake.alive) return snake;
    return updateAISnake(snake, snakes, foods, COLS, ROWS);
  });

  // ── 2. Move all alive snakes
  const movedSnakes = snakes.map(snake => {
    if (!snake.alive) return snake;
    const dir = snake.nextDirection;
    const head = snake.body[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };
    // Grow if length > body; otherwise pop tail
    const newBody = [newHead, ...snake.body];
    if (newBody.length > snake.length) newBody.pop();
    return { ...snake, direction: dir, body: newBody };
  });

  // ── 3. Wall & self-collision death
  let newParticles = [...particles];
  const afterWallCheck = movedSnakes.map(snake => {
    if (!snake.alive) return snake;
    const head = snake.body[0];
    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      const type = getSnakeType(snake.typeId);
      const clampedX = Math.max(0, Math.min(COLS - 1, head.x));
      const clampedY = Math.max(0, Math.min(ROWS - 1, head.y));
      // Death particles along the whole body
      const deathParts = spawnDeathParticles(
        [{ x: clampedX, y: clampedY }, ...snake.body.slice(1)],
        GRID_SIZE, type.primaryColor, type.secondaryColor
      );
      newParticles = [...newParticles, ...deathParts];
      return { ...snake, alive: false };
    }
    // Self-collision (skip head at index 0)
    for (let i = 1; i < snake.body.length; i++) {
      if (snake.body[i].x === head.x && snake.body[i].y === head.y) {
        const type = getSnakeType(snake.typeId);
        const deathParts = spawnDeathParticles(
          snake.body, GRID_SIZE, type.primaryColor, type.secondaryColor
        );
        newParticles = [...newParticles, ...deathParts];
        return { ...snake, alive: false };
      }
    }
    return snake;
  });

  // ── 4. Snake vs snake collision
  let scoreGain = 0;
  const snakesCopy = afterWallCheck.map(s => ({ ...s }));

  for (let i = 0; i < snakesCopy.length; i++) {
    const a = snakesCopy[i];
    if (!a.alive) continue;
    const headA = a.body[0];

    for (let j = 0; j < snakesCopy.length; j++) {
      if (i === j) continue;
      const b = snakesCopy[j];
      if (!b.alive) continue;

      // Check if snake A's head touches any segment of snake B
      for (let k = 0; k < b.body.length; k++) {
        const seg = b.body[k];
        if (headA.x !== seg.x || headA.y !== seg.y) continue;

        // Collision: compare lengths
        const aWins = a.length > b.length
          ? true
          : a.length < b.length
          ? false
          : Math.random() < 0.5; // equal length: random

        const winner = aWins ? a : b;
        const loser  = aWins ? b : a;
        loser.alive = false;

        // Reward: loser length × 10 points if player wins
        if (winner.isPlayer) {
          scoreGain += loser.length * 10;
          // Grow winner
          winner.length += Math.ceil(loser.length / 2);
        }

        const loserType = getSnakeType(loser.typeId);
        const eatParts = spawnSnakeEatParticles(
          loser.body, GRID_SIZE, loserType.primaryColor, loserType.secondaryColor
        );
        newParticles = [...newParticles, ...eatParts];
        break;
      }
    }
  }

  // ── 5. Food consumption
  let newFoods = [...foods];
  const finalSnakes = snakesCopy.map(snake => {
    if (!snake.alive) return snake;
    const head = snake.body[0];
    const foodIdx = newFoods.findIndex(f => f.x === head.x && f.y === head.y);
    if (foodIdx === -1) return snake;

    const food = newFoods[foodIdx];
    newFoods.splice(foodIdx, 1);

    if (snake.isPlayer) scoreGain += FOOD_SCORE;

    const type = getSnakeType(snake.typeId);
    const cx = food.x * GRID_SIZE + GRID_SIZE / 2;
    const cy = food.y * GRID_SIZE + GRID_SIZE / 2;
    const foodParts = spawnFoodParticles(cx, cy, type.primaryColor);
    newParticles = [...newParticles, ...foodParts];

    return { ...snake, length: snake.length + 1 };
  });

  // ── 6. Respawn food up to MAX_FOOD
  while (newFoods.length < MAX_FOOD) {
    const f = spawnFood(finalSnakes, newFoods);
    if (!f) break;
    newFoods.push(f);
  }

  // ── 7. Respawn dead AI snakes (after a small delay)
  const finalSnakesRespawned = finalSnakes.map(snake => {
    if (snake.isPlayer || snake.alive) return snake;
    // Respawn after ~30 ticks
    if (tickCount % 30 !== 0) return snake;
    return createSnake({
      id: snake.id,
      isPlayer: false,
      typeId: snake.typeId,
      length: AI_INITIAL_LENGTH,
      existingSnakes: finalSnakes.filter(s => s.alive),
    });
  });

  // ── 8. Check player alive
  const player = finalSnakesRespawned.find(s => s.isPlayer);
  const playerAlive = player && player.alive;
  const newGameState = playerAlive ? GAME_STATE.RUNNING : GAME_STATE.OVER;

  // ── 9. Update particles (tick physics, remove expired)
  const aliveParticles = tickParticles([...newParticles]);

  return {
    ...state,
    snakes: finalSnakesRespawned,
    foods: newFoods,
    particles: aliveParticles,
    score: score + scoreGain,
    tickCount,
    gameState: newGameState,
  };
}
