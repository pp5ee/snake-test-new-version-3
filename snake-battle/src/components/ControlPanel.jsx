import { GAME_STATE } from '../game/constants.js';

export default function ControlPanel({ gameState, onStart, onPause, onResume, onRestart }) {
  const isIdle    = gameState === GAME_STATE.IDLE;
  const isRunning = gameState === GAME_STATE.RUNNING;
  const isPaused  = gameState === GAME_STATE.PAUSED;
  const isOver    = gameState === GAME_STATE.OVER;

  return (
    <div className="control-panel">
      <h3 className="panel-title">控制</h3>

      {(isIdle || isOver) && (
        <button className="btn btn-primary" onClick={onStart}>
          {isOver ? '再玩一次' : 'START'}
        </button>
      )}

      {isRunning && (
        <button className="btn btn-secondary" onClick={onPause}>
          PAUSE
        </button>
      )}

      {isPaused && (
        <>
          <button className="btn btn-primary" onClick={onResume}>
            RESUME
          </button>
          <button className="btn btn-danger" onClick={onRestart}>
            RESTART
          </button>
        </>
      )}

      <div className="key-hints">
        <div className="key-row"><kbd>↑↓←→</kbd> / <kbd>WASD</kbd> 移动</div>
        <div className="key-row"><kbd>Space</kbd> 暂停/继续</div>
        {isOver && <div className="key-row"><kbd>R</kbd> 重新开始</div>}
      </div>
    </div>
  );
}
