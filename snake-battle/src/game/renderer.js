import { GRID_SIZE, COLS, ROWS, COLORS } from '../game/constants.js';
import { getSnakeType } from '../game/snakeTypes.js';
import { renderParticles } from '../game/particleSystem.js';

const CELL = GRID_SIZE; // 20px

// ─── Background & Grid ────────────────────────────────────────────────────────

export function drawBackground(ctx, width, height, scanOffset) {
  // Fill background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, ROWS * CELL);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(COLS * CELL, y * CELL);
    ctx.stroke();
  }

  // Scan line effect
  const grad = ctx.createLinearGradient(0, (scanOffset % (ROWS * CELL)), 0, (scanOffset % (ROWS * CELL)) + 80);
  grad.addColorStop(0, 'rgba(0,255,245,0)');
  grad.addColorStop(0.5, 'rgba(0,255,245,0.03)');
  grad.addColorStop(1, 'rgba(0,255,245,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

// ─── Food ─────────────────────────────────────────────────────────────────────

export function drawFoods(ctx, foods, time) {
  for (const food of foods) {
    const cx = food.x * CELL + CELL / 2;
    const cy = food.y * CELL + CELL / 2;

    // Pulse animation
    const pulse = 0.7 + 0.3 * Math.sin(time * 0.005 + food.id);
    const radius = (CELL / 3) * pulse;

    // Outer glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.5);
    glow.addColorStop(0, `rgba(255, 215, 0, ${0.4 * pulse})`);
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.shadowBlur = 15 * pulse;
    ctx.shadowColor = '#ffd700';
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// ─── Snakes ───────────────────────────────────────────────────────────────────

export function drawSnakes(ctx, snakes, time) {
  for (const snake of snakes) {
    if (!snake.alive) continue;
    drawSnake(ctx, snake, time);
  }
}

function drawSnake(ctx, snake, time) {
  const type = getSnakeType(snake.typeId);
  const breathe = 0.8 + 0.2 * Math.sin(time * 0.003 + snake.id);

  for (let i = snake.body.length - 1; i >= 0; i--) {
    const seg = snake.body[i];
    const cx = seg.x * CELL;
    const cy = seg.y * CELL;
    const isHead = i === 0;
    const t = i / snake.body.length; // 0 = head, 1 = tail

    // Color along the body: fade primary → secondary toward tail
    const color = interpolateColor(type.primaryColor, type.secondaryColor, t);
    const alpha = isHead ? 1 : 0.7 + 0.3 * (1 - t);

    // Glow intensity strongest at head
    const glowSize = isHead ? 12 * breathe : 6 * (1 - t * 0.5);
    ctx.shadowBlur = glowSize;
    ctx.shadowColor = type.glowColor;

    // Body segment
    ctx.fillStyle = hexToRgba(color, alpha);
    const pad = isHead ? 1 : 2;
    roundRect(ctx, cx + pad, cy + pad, CELL - pad * 2, CELL - pad * 2, isHead ? 5 : 4);

    // Head highlight
    if (isHead) {
      ctx.fillStyle = `rgba(255,255,255,0.25)`;
      roundRect(ctx, cx + 4, cy + 4, CELL - 8, CELL / 3, 3);

      // Eyes
      drawEyes(ctx, snake, seg, type.primaryColor);
    }
  }

  ctx.shadowBlur = 0;
}

function drawEyes(ctx, snake, headSeg, color) {
  const dir = snake.direction;
  const cx = headSeg.x * CELL + CELL / 2;
  const cy = headSeg.y * CELL + CELL / 2;
  const eyeOffset = 4;
  const eyeRadius = 2.5;

  // Perpendicular to movement direction
  const px = -dir.y;
  const py = dir.x;

  const e1x = cx + dir.x * eyeOffset + px * eyeOffset;
  const e1y = cy + dir.y * eyeOffset + py * eyeOffset;
  const e2x = cx + dir.x * eyeOffset - px * eyeOffset;
  const e2y = cy + dir.y * eyeOffset - py * eyeOffset;

  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ffffff';
  ctx.fillStyle = '#ffffff';
  for (const [ex, ey] of [[e1x, e1y], [e2x, e2y]]) {
    ctx.beginPath();
    ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = '#0a0a0f';
    ctx.beginPath();
    ctx.arc(ex + dir.x, ey + dir.y, eyeRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
  }
  ctx.shadowBlur = 0;
}

// ─── Particles ────────────────────────────────────────────────────────────────

export function drawParticles(ctx, particles) {
  // Delegate to the rich particle renderer from particleSystem.js
  renderParticles(ctx, particles);
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

export function drawOverlay(ctx, width, height, text, subText = '') {
  ctx.fillStyle = 'rgba(10, 10, 15, 0.75)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#00fff5';
  ctx.font = 'bold 48px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#00fff5';
  ctx.fillText(text, width / 2, height / 2 - 20);

  if (subText) {
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '18px "Rajdhani", sans-serif';
    ctx.shadowBlur = 0;
    ctx.fillText(subText, width / 2, height / 2 + 24);
  }

  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
}

// ─── Colour utilities ─────────────────────────────────────────────────────────

function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function interpolateColor(hex1, hex2, t) {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}
