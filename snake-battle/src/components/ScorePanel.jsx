import { loadGameData } from '../utils/storage.js';
import { SNAKE_TYPES } from '../game/constants.js';

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function snakeName(typeId) {
  const t = SNAKE_TYPES.find(t => t.id === typeId);
  return t ? t.name : typeId;
}

export default function ScorePanel({ score, renderTick }) {
  const data = loadGameData();

  return (
    <div className="score-panel">
      <div className="current-score">
        <span className="score-label">SCORE</span>
        <span className="score-value">{score}</span>
      </div>

      <div className="high-score">
        <span className="score-label">BEST</span>
        <span className="score-value high">{data.highScore}</span>
      </div>

      <div className="history-section">
        <h4 className="history-title">历史记录</h4>
        <div className="history-list">
          {data.history.length === 0 && (
            <div className="history-empty">暂无记录</div>
          )}
          {data.history.slice(0, 20).map((entry, i) => (
            <div key={i} className="history-item">
              <span className="history-rank">#{i + 1}</span>
              <span className="history-score">{entry.score}</span>
              <span className="history-type">{snakeName(entry.snakeType)}</span>
              <span className="history-date">{formatDate(entry.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
