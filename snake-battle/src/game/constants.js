// Grid and canvas settings
export const GRID_SIZE = 20;        // pixels per cell
export const COLS = 40;             // number of columns
export const ROWS = 40;             // number of rows

// Game timing
export const BASE_TICK_MS = 120;    // base milliseconds per game tick

// Food settings
export const MAX_FOOD = 10;
export const FOOD_SCORE = 10;

// AI snake settings
export const AI_SNAKE_COUNT = 5;
export const AI_INITIAL_LENGTH = 4;
export const PLAYER_INITIAL_LENGTH = 4;

// Directions
export const DIR = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x: 1,  y:  0 },
};

export const DIRECTIONS = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

// Snake type configurations
export const SNAKE_TYPES = [
  {
    id: 'classic',
    name: '经典青蛇',
    primaryColor: '#00fff5',
    secondaryColor: '#00a8ff',
    glowColor: 'rgba(0, 255, 245, 0.6)',
    speedFactor: 1.0,
  },
  {
    id: 'neon-pink',
    name: '霓虹粉蛇',
    primaryColor: '#ff00ff',
    secondaryColor: '#ff0088',
    glowColor: 'rgba(255, 0, 255, 0.6)',
    speedFactor: 1.1,
  },
  {
    id: 'venom',
    name: '毒液绿蛇',
    primaryColor: '#00ff66',
    secondaryColor: '#88ff00',
    glowColor: 'rgba(0, 255, 102, 0.6)',
    speedFactor: 1.2,
  },
  {
    id: 'lava',
    name: '熔岩红蛇',
    primaryColor: '#ff3366',
    secondaryColor: '#ff6600',
    glowColor: 'rgba(255, 51, 102, 0.6)',
    speedFactor: 1.3,
  },
  {
    id: 'frost',
    name: '冰霜蓝蛇',
    primaryColor: '#66ccff',
    secondaryColor: '#0066ff',
    glowColor: 'rgba(102, 204, 255, 0.6)',
    speedFactor: 0.9,
  },
  {
    id: 'gold',
    name: '黄金蛇',
    primaryColor: '#ffd700',
    secondaryColor: '#ffaa00',
    glowColor: 'rgba(255, 215, 0, 0.6)',
    speedFactor: 1.0,
  },
];

// AI snake type ids (exclude player types — AI uses random from all)
export const AI_SNAKE_TYPE_IDS = SNAKE_TYPES.map(t => t.id);

// Game states
export const GAME_STATE = {
  IDLE:    'idle',
  RUNNING: 'running',
  PAUSED:  'paused',
  OVER:    'over',
};

// Cyberpunk color palette
export const COLORS = {
  bg:           '#0a0a0f',
  bgSecondary:  '#12121a',
  neonCyan:     '#00fff5',
  neonPink:     '#ff00ff',
  neonRed:      '#ff3366',
  neonGreen:    '#00ff66',
  textPrimary:  '#e0e0e0',
  textSecondary:'#888899',
  gridLine:     'rgba(0, 255, 245, 0.04)',
};
