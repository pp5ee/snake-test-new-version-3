import {
  COLS, ROWS, GRID_SIZE,
  PLAYER_INITIAL_LENGTH, AI_INITIAL_LENGTH,
  AI_SNAKE_COUNT, AI_SNAKE_TYPE_IDS, MAX_FOOD,
  DIRECTIONS, FOOD_SCORE,
  GAME_STATE,
} from './constants.js';
import { getSnakeType } from './snakeTypes.js';
import { updateAISnake } from './aiSnake.js';
import {
  spawnFoodParticles,
  spawnSnakeEatParticles,
  spawnDeathParticles,
  updateParticles,
} from './particleSystem.js';

let nextId = 1;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildBody(hx, hy, length, dir) {
  const body = [];
  for (let i = 0; i < length; i++) {
    body.push({ x: hx - dir.x * i, y: hy - dir.y * i });
  }
  return body;
}

function cellOccupied(x, y, snakes) {
  for (const s of snakes) {
    for (const seg of s.body) {
      if (seg.x === x && seg.y === y) return true;
    }
  }
  return false;
}

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
  return buildBody(randomInt(2, COLS - 3), randomInt(2, ROWS - 3), length, dir);
}

function createSnake({ id, isPlayer, typeId, length = 4, existingSnakes = [] }) {
  const dir = DIRECTIONS[randomInt(0, DIRECTIONS.length - 1)];
  const body = randomSpawnPos(length, dir, existingSnakes);
  return {
    id,
    isPlayer,
    typeId: typeId || AI_SNAKE_TYPE_IDS[randomInt(0, AI_SNAKE_TYPE_IDS.length - 1)],
    body,
    direction: dir,
    nextDirection: dir,
    alive: true,
    length,
  };
}

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

export function createInitialState(playerTypeId = 'classic') {
  nextId = 1;
  const snakes = [];

  const player = createSnake({
    id: nextId++, isPlayer: true, typeId: playerTypeId,
    length: PLAYER_INITIAL_LENGTH, existingSnakes: snakes,
  });
  snakes.push(player);

  for (let i = 0; i < AI_SNAKE_COUNT; i++) {
    const ai = createSnake({
      id: nextId++, isPlayer: false,
      typeId: AI_SNAKE_TYPE_IDS[i % AI_SNAKE_TYPE_IDS.length],
      length: AI_INITIAL_LENGTH, existingSnakes: snakes,
    });
    snakes.push(ai);
  }

  const foods = [];
  while (foods.length < MAX_FOOD) {
    const f = spawnFood(snakes, foods);
    if (f) foods.push(f); else break;
  }

  return { snakes, foods, particles: [], score: 0, tickCount: 0, gameState: GAME_STATE.IDLE, playerTypeId };
}

function isOpposite(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

export function setPlayerDirection(state, dir) {
  const player = state.snakes.find(s => s.isPlayer && s.alive);
  if (!player) return;
  if (!isOpposite(player.direction, dir)) player.nextDirection = dir;
}

export function gameTick(state) {
  if (state.gameState !== GAME_STATE.RUNNING) return state;

  let { snakes, foods, score, tickCount } = state;
  const newParticles = [...state.particles];
  tickCount++;

  // 1. AI decisions
  snakes = snakes.map(snake => {
    if (snake.isPlayer || !snake.alive) return snake;
    return updateAISnake(snake, snakes, foods, COLS, ROWS);
  });

  // 2. Move snakes
  const movedSnakes = snakes.map(snake => {
    if (!snake.alive) return snake;
    const dir = snake.nextDirection;
    const head = snake.body[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };
    const newBody = [newHead, ...snake.body];
    if (newBody.length > snake.length) newBody.pop();
    return { ...snake, direction: dir, body: newBody };
  });

  // 3. Wall + self collision
  const afterCollision = movedSnakes.map(snake => {
    if (!snake.alive) return snake;
    const head = snake.body[0];
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      const type = getSnakeType(snake.typeId);
      const safeBody = snake.body.map(s => ({
        x: Math.max(0, Math.min(COLS - 1, s.x)),
        y: Math.max(0, Math.min(ROWS - 1, s.y)),
      }));
      newParticles.push(...spawnDeathParticles(safeBody, GRID_SIZE, type.primaryColor, type.secondaryColor));
      return { ...snake, alive: false };
    }
    for (let i = 1; i < snake.body.length; i++) {
      const seg = snake.body[i];
      if (seg.x === head.x && seg.y === head.y) {
        const type = getSnakeType(snake.typeId);
        newParticles.push(...spawnDeathParticles(snake.body, GRID_SIZE, type.primaryColor, type.secondaryColor));
        return { ...snake, alive: false };
      }
    }
    return snake;
  });

  // 4. Snake-vs-snake
  let scoreGain = 0;
  const snakesCopy = afterCollision.map(s => ({ ...s }));

  for (let i = 0; i < snakesCopy.length; i++) {
    const a = snakesCopy[i];
    if (!a.alive) continue;
    const headA = a.body[0];
    for (let j = 0; j < snakesCopy.length; j++) {
      if (i === j) continue;
      const b = snakesCopy[j];
      if (!b.alive) continue;
      const hit = b.body.some(seg => seg.x === headA.x && seg.y === headA.y);
      if (!hit) continue;
      const aWins = a.length > b.length ? true : a.length < b.length ? false : Math.random() < 0.5;
      const winner = aWins ? a : b;
      const loser  = aWins ? b : a;
      loser.alive = false;
      if (winner.isPlayer) {
        scoreGain += loser.length * 10;
        winner.length += Math.ceil(loser.length / 2);
      }
      const loserType = getSnakeType(loser.typeId);
      newParticles.push(...spawnSnakeEatParticles(loser.body, GRID_SIZE, loserType.primaryColor, loserType.secondaryColor));
    }
  }

  // 5. Food
  let newFoods = [...foods];
  const fedSnakes = snakesCopy.map(snake => {
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
    newParticles.push(...spawnFoodParticles(cx, cy, type.primaryColor));
    return { ...snake, length: snake.length + 1 };
  });

  // 6. Replenish food
  while (newFoods.length < MAX_FOOD) {
    const f = spawnFood(fedSnakes, newFoods);
    if (!f) break;
    newFoods.push(f);
  }

  // 7. Respawn dead AIs
  const respawnedSnakes = fedSnakes.map(snake => {
    if (snake.isPlayer || snake.alive) return snake;
    if (tickCount % 30 !== 0) return snake;
    return createSnake({
      id: snake.id, isPlayer: false, typeId: snake.typeId,
      length: AI_INITIAL_LENGTH,
      existingSnakes: fedSnakes.filter(s => s.alive),
    });
  });

  // 8. Game over check
  const playerSnake = respawnedSnakes.find(s => s.isPlayer);
  const newGameState = (playerSnake && playerSnake.alive) ? GAME_STATE.RUNNING : GAME_STATE.OVER;

  // 9. Advance particle physics (mutates array in-place per particleSystem contract)
  updateParticles(newParticles);

  return {
    ...state,
    snakes: respawnedSnakes,
    foods: newFoods,
    particles: newParticles,
    score: score + scoreGain,
    tickCount,
    gameState: newGameState,
  };
}
