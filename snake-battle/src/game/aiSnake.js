/**
 * AI Snake Behavior Module
 *
 * Each AI snake makes decisions every tick using a priority-based strategy:
 *
 *   1. Safety first  – evaluate all four directions; eliminate moves that lead
 *      to immediate death (wall, self, or a larger hostile snake's body).
 *
 *   2. Chase food    – among safe moves, prefer the direction that reduces
 *      Manhattan distance to the nearest food item.
 *
 *   3. Evade threat  – if the player snake is nearby AND larger, add a penalty
 *      to moves that bring the AI closer to the player's head.
 *
 *   4. Hunt smaller  – if the AI is larger than another snake, add a bonus to
 *      moves that bring the AI closer to that snake's head.
 *
 *   5. Fallback      – if no safe move exists, choose the least-bad direction
 *      (open cell or smallest snake body encountered) to avoid getting stuck.
 *
 * Scoring system
 * ──────────────
 * Every candidate direction receives a numeric score (higher = better).
 * The final direction is sampled with a bit of randomness to make AIs feel
 * natural and non-deterministic.
 */

import { DIRECTIONS } from './constants.js';

// ─── Utilities ────────────────────────────────────────────────────────────────

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Build a fast lookup Set of all occupied cells from the snake list.
 * Key format: "x,y".
 */
function buildOccupiedSet(snakes) {
  const set = new Set();
  for (const s of snakes) {
    if (!s.alive) continue;
    for (const seg of s.body) {
      set.add(`${seg.x},${seg.y}`);
    }
  }
  return set;
}

/**
 * Build a Set of cells that belong to snakes that are LONGER than `refLength`.
 * The AI treats entering these cells as lethal.
 */
function buildDangerSet(snakes, refLength) {
  const set = new Set();
  for (const s of snakes) {
    if (!s.alive || s.length <= refLength) continue;
    for (const seg of s.body) {
      set.add(`${seg.x},${seg.y}`);
    }
  }
  return set;
}

/**
 * Flood-fill from `start` to estimate how many free cells are reachable.
 * Capped at `limit` to keep it O(limit) instead of O(COLS*ROWS).
 */
function floodFill(start, occupiedSet, cols, rows, limit = 80) {
  const visited = new Set();
  const queue = [start];
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0 && visited.size < limit) {
    const { x, y } = queue.shift();
    for (const d of DIRECTIONS) {
      const nx = x + d.x;
      const ny = y + d.y;
      const key = `${nx},${ny}`;
      if (
        nx < 0 || nx >= cols || ny < 0 || ny >= rows
        || visited.has(key)
        || occupiedSet.has(key)
      ) continue;
      visited.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return visited.size;
}

// ─── Core AI decision function ────────────────────────────────────────────────

/**
 * Compute the next direction for a single AI snake.
 *
 * @param {object} snake   - The AI snake to update.
 * @param {object[]} snakes - All snakes (including self).
 * @param {object[]} foods  - All food items.
 * @param {number} cols
 * @param {number} rows
 * @returns {object} Updated snake with `nextDirection` set.
 */
export function updateAISnake(snake, snakes, foods, cols, rows) {
  const head = snake.body[0];
  const currentDir = snake.direction;

  // Pre-build spatial data
  const occupiedSet = buildOccupiedSet(snakes);
  const dangerSet   = buildDangerSet(snakes, snake.length);

  // Find the player snake (may be null if dead)
  const playerSnake = snakes.find(s => s.isPlayer && s.alive) || null;
  // Find nearest food
  const nearestFood = foods.length > 0
    ? foods.reduce((best, f) =>
        manhattan(head, f) < manhattan(head, best) ? f : best, foods[0])
    : null;

  // Find snakes we can hunt (alive, not self, shorter than us)
  const preySnakes = snakes.filter(
    s => s.alive && s.id !== snake.id && s.length < snake.length
  );

  // ─── Evaluate each candidate direction ──────────────────────────────────────

  const scored = DIRECTIONS.map(dir => {
    // Don't allow 180° reversal (would immediately hit own neck)
    if (dir.x + currentDir.x === 0 && dir.y + currentDir.y === 0) {
      return { dir, score: -Infinity, safe: false };
    }

    const nx = head.x + dir.x;
    const ny = head.y + dir.y;
    const cellKey = `${nx},${ny}`;

    // ── Wall check ───────────────────────────────────────────────────────────
    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
      return { dir, score: -1000, safe: false };
    }

    // ── Body collision (occupied by any snake body) ──────────────────────────
    if (occupiedSet.has(cellKey)) {
      // Is this a cell of a snake we can eat?
      const eatableSnake = preySnakes.find(s =>
        s.body.some(seg => seg.x === nx && seg.y === ny)
      );
      // Eating a shorter snake's body is fine (we'll kill it)
      if (!eatableSnake) {
        return { dir, score: -900, safe: false };
      }
    }

    // ── Danger zone (cells of larger snakes) ────────────────────────────────
    if (dangerSet.has(cellKey)) {
      return { dir, score: -800, safe: false };
    }

    // ── Safe move – calculate heuristic score ───────────────────────────────
    let score = 0;

    // Flood-fill: reward open space (avoid dead ends)
    const tempOccupied = new Set(occupiedSet);
    tempOccupied.add(cellKey);
    const openSpace = floodFill({ x: nx, y: ny }, tempOccupied, cols, rows, 80);
    score += openSpace * 0.5;                        // up to +40

    // Food attraction: reward getting closer to nearest food
    if (nearestFood) {
      const distNow  = manhattan(head, nearestFood);
      const distNext = manhattan({ x: nx, y: ny }, nearestFood);
      score += (distNow - distNext) * 6;             // +6 per step closer
    }

    // Threat avoidance: penalise moving toward a larger snake's head
    if (playerSnake && playerSnake.length >= snake.length) {
      const playerHead = playerSnake.body[0];
      const distToPlayer = manhattan({ x: nx, y: ny }, playerHead);
      if (distToPlayer < 5) {
        score -= (5 - distToPlayer) * 10;            // up to -50
      }
    }
    // Also avoid larger AI snakes
    for (const other of snakes) {
      if (other.id === snake.id || !other.alive || other.length < snake.length) continue;
      const otherHead = other.body[0];
      const d = manhattan({ x: nx, y: ny }, otherHead);
      if (d < 4) score -= (4 - d) * 8;
    }

    // Prey hunting: reward moving toward a shorter snake's head
    if (preySnakes.length > 0) {
      const nearestPrey = preySnakes.reduce((best, s) =>
        manhattan(head, s.body[0]) < manhattan(head, best.body[0]) ? s : best,
        preySnakes[0]
      );
      const preyHead = nearestPrey.body[0];
      const distNow  = manhattan(head, preyHead);
      const distNext = manhattan({ x: nx, y: ny }, preyHead);
      score += (distNow - distNext) * 3;             // +3 per step closer
    }

    // Small random jitter so identical snakes diverge
    score += (Math.random() - 0.5) * 4;

    return { dir, score, safe: true };
  });

  // ─── Pick best direction ─────────────────────────────────────────────────

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const safeMoves = scored.filter(s => s.safe);
  let chosen;

  if (safeMoves.length > 0) {
    // Among safe moves, pick the top-scored (with a small probability of
    // choosing the 2nd-best to add variety)
    if (safeMoves.length > 1 && Math.random() < 0.08) {
      chosen = safeMoves[1].dir;
    } else {
      chosen = safeMoves[0].dir;
    }
  } else {
    // No safe move – pick least-bad (highest score among dangerous options)
    chosen = scored[0].dir;
  }

  return { ...snake, nextDirection: chosen };
}
