import { useRef, useEffect } from 'react';
import { GRID_SIZE, COLS, ROWS, GAME_STATE } from '../game/constants.js';
import {
  drawBackground,
  drawFoods,
  drawSnakes,
  drawParticles,
  drawOverlay,
} from '../game/renderer.js';

const WIDTH  = COLS * GRID_SIZE;
const HEIGHT = ROWS * GRID_SIZE;

export default function GameCanvas({ getState, renderTick }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const scanRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let startTime = performance.now();

    const draw = (timestamp) => {
      const time = timestamp - startTime;
      scanRef.current = (scanRef.current + 0.4) % (HEIGHT + 80);

      const state = getState();
      const { snakes, foods, particles, gameState, score } = state;

      // Background + grid
      drawBackground(ctx, WIDTH, HEIGHT, scanRef.current);

      // Game objects
      drawFoods(ctx, foods, time);
      drawSnakes(ctx, snakes, time);
      drawParticles(ctx, particles);

      // Overlays
      if (gameState === GAME_STATE.IDLE) {
        drawOverlay(ctx, WIDTH, HEIGHT, 'SNAKE BATTLE', '选择蛇类型后点击 START');
      } else if (gameState === GAME_STATE.PAUSED) {
        drawOverlay(ctx, WIDTH, HEIGHT, 'PAUSED', '按 Space 继续');
      } else if (gameState === GAME_STATE.OVER) {
        drawOverlay(ctx, WIDTH, HEIGHT, 'GAME OVER', `得分: ${score}  按 R 重新开始`);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [getState]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{
        display: 'block',
        border: '1px solid rgba(0,255,245,0.3)',
        boxShadow: '0 0 30px rgba(0,255,245,0.15)',
        borderRadius: '4px',
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    />
  );
}
