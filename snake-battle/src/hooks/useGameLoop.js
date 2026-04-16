import { useRef, useState, useEffect, useCallback } from 'react';
import {
  createInitialState,
  setPlayerDirection,
  gameTick,
} from '../game/gameEngine.js';
import { DIR, GAME_STATE, BASE_TICK_MS } from '../game/constants.js';
import { saveScore } from '../utils/storage.js';

const KEY_MAP = {
  ArrowUp:    DIR.UP,
  ArrowDown:  DIR.DOWN,
  ArrowLeft:  DIR.LEFT,
  ArrowRight: DIR.RIGHT,
  w: DIR.UP,
  s: DIR.DOWN,
  a: DIR.LEFT,
  d: DIR.RIGHT,
  W: DIR.UP,
  S: DIR.DOWN,
  A: DIR.LEFT,
  D: DIR.RIGHT,
};

export function useGameLoop(playerTypeId) {
  const stateRef   = useRef(createInitialState(playerTypeId));
  const [renderTick, setRenderTick] = useState(0); // triggers re-render
  const rafRef     = useRef(null);
  const lastTickRef = useRef(0);
  const savedRef   = useRef(false);

  // Expose a snapshot for React components to read
  const getState = useCallback(() => stateRef.current, []);

  // ── Tick loop ──────────────────────────────────────────────────────────────
  const loop = useCallback((timestamp) => {
    const state = stateRef.current;
    if (state.gameState !== GAME_STATE.RUNNING) return;

    const elapsed = timestamp - lastTickRef.current;
    if (elapsed >= BASE_TICK_MS) {
      lastTickRef.current = timestamp;
      const next = gameTick(state);
      stateRef.current = next;
      setRenderTick(t => t + 1);

      // Auto-save on game over
      if (next.gameState === GAME_STATE.OVER && !savedRef.current) {
        savedRef.current = true;
        saveScore(next.score, next.playerTypeId);
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Start / Resume ─────────────────────────────────────────────────────────
  const start = useCallback((typeId) => {
    const tid = typeId || stateRef.current.playerTypeId;
    stateRef.current = createInitialState(tid);
    stateRef.current.gameState = GAME_STATE.RUNNING;
    savedRef.current = false;
    lastTickRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
    setRenderTick(t => t + 1);
  }, [loop]);

  const resume = useCallback(() => {
    if (stateRef.current.gameState !== GAME_STATE.PAUSED) return;
    stateRef.current = { ...stateRef.current, gameState: GAME_STATE.RUNNING };
    lastTickRef.current = performance.now();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
    setRenderTick(t => t + 1);
  }, [loop]);

  // ── Pause ──────────────────────────────────────────────────────────────────
  const pause = useCallback(() => {
    if (stateRef.current.gameState !== GAME_STATE.RUNNING) return;
    stateRef.current = { ...stateRef.current, gameState: GAME_STATE.PAUSED };
    cancelAnimationFrame(rafRef.current);
    setRenderTick(t => t + 1);
  }, []);

  // ── Toggle pause/resume ────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    const gs = stateRef.current.gameState;
    if (gs === GAME_STATE.RUNNING) pause();
    else if (gs === GAME_STATE.PAUSED) resume();
  }, [pause, resume]);

  // ── Keyboard input ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
        return;
      }
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        setPlayerDirection(stateRef.current, dir);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return {
    getState,
    renderTick,
    start,
    pause,
    resume,
    togglePause,
  };
}
