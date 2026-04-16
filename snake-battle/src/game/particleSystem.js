/**
 * Particle system for cyberpunk visual effects.
 * Handles food burst, snake-eat explosion, and death disintegration effects.
 */

// Particle types
export const PARTICLE_TYPE = {
  FOOD_BURST: 'food_burst',
  SNAKE_EAT: 'snake_eat',
  DEATH: 'death',
};

/**
 * Create a single particle object.
 */
function createParticle({ x, y, vx, vy, color, size, life, maxLife, type, glow = true, trail = false }) {
  return { x, y, vx, vy, color, size, life, maxLife, type, glow, trail, alpha: 1 };
}

/**
 * Spawn particles for eating a food item.
 * @param {number} cx - center x in pixels
 * @param {number} cy - center y in pixels
 * @param {string} color - primary color
 * @returns {Array} particles
 */
export function spawnFoodParticles(cx, cy, color) {
  const particles = [];
  const count = 18;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 1.5 + Math.random() * 3.5;
    const size = 2 + Math.random() * 3;
    const life = 30 + Math.floor(Math.random() * 20);

    // Alternate between primary color and white-hot core
    const useWhite = Math.random() < 0.3;
    const particleColor = useWhite ? '#ffffff' : color;

    particles.push(createParticle({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: particleColor,
      size,
      life,
      maxLife: life,
      type: PARTICLE_TYPE.FOOD_BURST,
      glow: true,
      trail: false,
    }));
  }

  // Add a few trailing sparks
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2;
    particles.push(createParticle({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: 1 + Math.random() * 1.5,
      life: 40 + Math.floor(Math.random() * 20),
      maxLife: 60,
      type: PARTICLE_TYPE.FOOD_BURST,
      glow: true,
      trail: true,
    }));
  }

  return particles;
}

/**
 * Spawn particles when a snake is eaten.
 * Large explosion with multiple colors and screen-filling energy.
 * @param {Array} snakeBody - array of {x, y} grid coords
 * @param {number} gridSize - pixel size of one grid cell
 * @param {string} primaryColor - eaten snake's primary color
 * @param {string} secondaryColor - eaten snake's secondary color
 * @returns {Array} particles
 */
export function spawnSnakeEatParticles(snakeBody, gridSize, primaryColor, secondaryColor) {
  const particles = [];
  const half = gridSize / 2;

  snakeBody.forEach((seg, idx) => {
    const cx = seg.x * gridSize + half;
    const cy = seg.y * gridSize + half;

    // Every segment emits some particles, head emits more
    const count = idx === 0 ? 12 : (idx < 5 ? 5 : 2);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      const size = 2 + Math.random() * 4;
      const life = 25 + Math.floor(Math.random() * 35);

      const color = Math.random() < 0.5 ? primaryColor : secondaryColor;

      particles.push(createParticle({
        x: cx + (Math.random() - 0.5) * gridSize,
        y: cy + (Math.random() - 0.5) * gridSize,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size,
        life,
        maxLife: life,
        type: PARTICLE_TYPE.SNAKE_EAT,
        glow: true,
        trail: idx < 3,
      }));
    }
  });

  // White-hot core flash at the head
  const head = snakeBody[0];
  if (head) {
    const cx = head.x * gridSize + half;
    const cy = head.y * gridSize + half;
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      particles.push(createParticle({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#ffffff',
        size: 3 + Math.random() * 3,
        life: 20 + Math.floor(Math.random() * 15),
        maxLife: 35,
        type: PARTICLE_TYPE.SNAKE_EAT,
        glow: true,
        trail: false,
      }));
    }
  }

  return particles;
}

/**
 * Spawn death disintegration particles for a snake.
 * Creates a dramatic fragmentation effect along the snake's body.
 * @param {Array} snakeBody - array of {x, y} grid coords
 * @param {number} gridSize - pixel size per cell
 * @param {string} primaryColor
 * @param {string} secondaryColor
 * @returns {Array} particles
 */
export function spawnDeathParticles(snakeBody, gridSize, primaryColor, secondaryColor) {
  const particles = [];
  const half = gridSize / 2;

  snakeBody.forEach((seg, idx) => {
    const cx = seg.x * gridSize + half;
    const cy = seg.y * gridSize + half;

    // Spread factor increases toward the tail for a "disintegrating" look
    const spread = 1 + idx * 0.3;
    const count = 4;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 2.5) * spread;
      const life = 45 + Math.floor(Math.random() * 30) + idx * 2;
      const color = Math.random() < 0.6 ? primaryColor : secondaryColor;

      particles.push(createParticle({
        x: cx + (Math.random() - 0.5) * gridSize * 0.5,
        y: cy + (Math.random() - 0.5) * gridSize * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 1.5 + Math.random() * 2.5,
        life,
        maxLife: life,
        type: PARTICLE_TYPE.DEATH,
        glow: true,
        trail: false,
      }));
    }

    // Add a few glitchy red sparks to sell the death feel
    if (idx % 3 === 0) {
      particles.push(createParticle({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: '#ff3366',
        size: 2 + Math.random() * 2,
        life: 30 + Math.floor(Math.random() * 20),
        maxLife: 50,
        type: PARTICLE_TYPE.DEATH,
        glow: true,
        trail: false,
      }));
    }
  });

  return particles;
}

/**
 * Update all particles for one game frame.
 * Mutates particle array in place, removing dead particles.
 * @param {Array} particles
 * @param {number} dt - delta time factor (1 = normal)
 */
export function updateParticles(particles, dt = 1) {
  const gravity = 0.08 * dt;
  const drag = 0.97;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    // Move
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Apply drag
    p.vx *= drag;
    p.vy *= drag;

    // Slight gravity for death particles only
    if (p.type === PARTICLE_TYPE.DEATH) {
      p.vy += gravity;
    }

    // Age
    p.life -= dt;
    p.alpha = Math.max(0, p.life / p.maxLife);

    // Remove dead particles
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

/**
 * Render all particles onto a Canvas 2D context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} particles
 */
export function renderParticles(ctx, particles) {
  if (particles.length === 0) return;

  ctx.save();

  particles.forEach(p => {
    if (p.alpha <= 0) return;

    ctx.globalAlpha = p.alpha;

    if (p.glow) {
      ctx.shadowBlur = 8 + p.size * 2;
      ctx.shadowColor = p.color;
    } else {
      ctx.shadowBlur = 0;
    }

    // Trail particles: draw as thin lines
    if (p.trail && p.vx !== undefined) {
      const len = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 2;
      if (len > 0.5) {
        const nx = p.vx / Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const ny = p.vy / Math.sqrt(p.vx * p.vx + p.vy * p.vy);

        const grad = ctx.createLinearGradient(
          p.x - nx * len, p.y - ny * len,
          p.x, p.y
        );
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, p.color);

        ctx.strokeStyle = grad;
        ctx.lineWidth = p.size * 0.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x - nx * len, p.y - ny * len);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }

    // Draw particle dot
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.alpha + 0.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
}
