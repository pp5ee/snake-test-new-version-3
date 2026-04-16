import { useState, useCallback, useEffect } from 'react';
import { useGameLoop } from './hooks/useGameLoop.js';
import { GAME_STATE } from './game/constants.js';
import GameCanvas from './components/GameCanvas.jsx';
import SnakeSelector from './components/SnakeSelector.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import ScorePanel from './components/ScorePanel.jsx';
import './App.css';

function App() {
  const [selectedType, setSelectedType] = useState('classic');
  const { getState, renderTick, start, resume, pause, togglePause } = useGameLoop(selectedType);

  const state = getState();
  const isIdle = state.gameState === GAME_STATE.IDLE;
  const isRunning = state.gameState === GAME_STATE.RUNNING;
  const isPaused = state.gameState === GAME_STATE.PAUSED;
  const isOver = state.gameState === GAME_STATE.OVER;

  const handleStart = useCallback(() => {
    start(selectedType);
  }, [start, selectedType]);

  const handleResume = useCallback(() => {
    resume();
  }, [resume]);

  const handleRestart = useCallback(() => {
    start(selectedType);
  }, [start, selectedType]);

  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  // Handle R key for restart
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (isOver) {
        handleRestart();
      }
    }
  }, [isOver, handleRestart]);

  // Add keyboard listener for restart
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app">
      <header className="header">
        <h1>贪吃蛇大作战</h1>
        <span className="subtitle">Snake Battle</span>
      </header>

      <main className="main">
        <aside className="sidebar">
          <SnakeSelector
            selectedType={selectedType}
            onSelect={setSelectedType}
            disabled={isRunning || isPaused}
          />

          <ControlPanel
            gameState={state.gameState}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onRestart={handleRestart}
          />

          <ScorePanel score={state.score} renderTick={renderTick} />
        </aside>

        <section className="game-area">
          <GameCanvas
            getState={getState}
            renderTick={renderTick}
          />
        </section>
      </main>
    </div>
  );
}

export default App;