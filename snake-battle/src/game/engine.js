// Game state management
export const createGameState = () => ({
  gameState: 'idle', // idle, running, paused, over
  player: null,
  aiSnakes: [],
  foods: [],
  particles: [],
  score: 0,
  highScore: 0,
  history: [],
  selectedSnakeType: 'classic',
  lastTick: 0,
});

// Snake creation
export const createSnake = (x, y, length, type, isPlayer = false) => ({
  id: isPlayer ? 'player' : `ai-${Date.now()}-${Math.random()}`,
  body: Array.from({ length }, (_, i) => ({ x, y: y + i })),
  direction: { x: 0, y: -1 },
  nextDirection: { x: 0, y: -1 },
  type,
  isPlayer,
  length,
  alive: true,
  growPending: 0,
});

// Food creation
export const createFood = (x, y) => ({
  id: `food-${Date.now()}-${Math.random()}`,
  x,
  y,
  pulse: 0,
});

// Particle creation
export const createParticle = (x, y, color) => ({
  id: `particle-${Date.now()}-${Math.random()}`,
  x,
  y,
  vx: (Math.random() - 0.5) * 8,
  vy: (Math.random() - 0.5) * 8,
  life: 1,
  color,
  size: Math.random() * 4 + 2,
});

// Move snake one step
export const moveSnake = (snake, growPending = 0) => {
  if (!snake.alive) return snake;

  const head = snake.body[0];
  const newHead = {
    x: head.x + snake.direction.x,
    y: head.y + snake.direction.y,
  };

  const newBody = [newHead, ...snake.body];
  if (growPending > 0) {
    growPending--;
  } else {
    newBody.pop();
  }

  return {
    ...snake,
    body: newBody,
    direction: snake.nextDirection,
    growPending,
  };
};

// Check wall collision
export const checkWallCollision = (snake, cols, rows) => {
  const head = snake.body[0];
  return head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;
};

// Check self collision
export const checkSelfCollision = (snake) => {
  const head = snake.body[0];
  return snake.body.slice(1).some(seg => seg.x === head.x && seg.y === head.y);
};

// Check collision between two snakes
export const checkSnakeCollision = (attacker, target) => {
  const head = attacker.body[0];
  return target.body.some(seg => seg.x === head.x && seg.y === head.y);
};

// Check if position is occupied by any snake body
export const isPositionOccupied = (x, y, snakes, excludeId) => {
  return snakes.some(snake =>
    snake.id !== excludeId && snake.alive && snake.body.some(seg => seg.x === x && seg.y === y)
  );
};

// Find empty cell
export const findEmptyCell = (cols, rows, snakes, foods, minDist = 3) => {
  let attempts = 0;
  const maxAttempts = 500;

  while (attempts < maxAttempts) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);

    // Check minimum distance from snakes
    let valid = true;
    for (const snake of snakes) {
      if (!snake.alive) continue;
      for (const seg of snake.body) {
        const dist = Math.abs(seg.x - x) + Math.abs(seg.y - y);
        if (dist < minDist) {
          valid = false;
          break;
        }
      }
      if (!valid) break;
    }

    // Check minimum distance from foods
    if (valid) {
      for (const food of foods) {
        const dist = Math.abs(food.x - x) + Math.abs(food.y - y);
        if (dist < minDist) {
          valid = false;
          break;
        }
      }
    }

    if (valid) return { x, y };
    attempts++;
  }

  // Fallback: random position
  return { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
};

// AI behavior: decide next direction
export const getAIDirection = (snake, cols, rows, player, foods, otherAISnakes) => {
  const head = snake.body[0];
  const possibleDirs = [];

  // Get valid directions (not 180 degree turn)
  for (const dir of [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ]) {
    // Can't reverse
    if (dir.x === -snake.direction.x && dir.y === -snake.direction.y) continue;

    // Check wall collision
    const newX = head.x + dir.x;
    const newY = head.y + dir.y;
    if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) continue;

    // Check self collision
    if (snake.body.slice(1).some(seg => seg.x === newX && seg.y === newY)) continue;

    // Check collision with other snakes
    const allSnakes = [player, ...otherAISnakes].filter(s => s && s.alive && s.id !== snake.id);
    if (isPositionOccupied(newX, newY, allSnakes, snake.id)) continue;

    possibleDirs.push(dir);
  }

  if (possibleDirs.length === 0) {
    // Stuck, just pick any valid (including reverse)
    return snake.direction;
  }

  // Simple AI: prefer directions toward food
  if (foods.length > 0) {
    const nearestFood = foods.reduce((nearest, food) => {
      const dist = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
      const nearestDist = nearest ? Math.abs(nearest.x - head.x) + Math.abs(nearest.y - head.y) : Infinity;
      return dist < nearestDist ? food : nearest;
    }, null);

    if (nearestFood) {
      // Sort by distance to food
      possibleDirs.sort((a, b) => {
        const distA = Math.abs(head.x + a.x - nearestFood.x) + Math.abs(head.y + a.y - nearestFood.y);
        const distB = Math.abs(head.x + b.x - nearestFood.x) + Math.abs(head.y + b.y - nearestFood.y);
        return distA - distB;
      });

      // 70% chance to go toward food, 30% random
      if (Math.random() < 0.7) {
        return possibleDirs[0];
      }
    }
  }

  // Random from valid directions
  return possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
};