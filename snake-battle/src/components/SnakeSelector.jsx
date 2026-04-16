import { SNAKE_TYPES } from '../game/constants.js';

export default function SnakeSelector({ selectedType, onSelect, disabled }) {
  return (
    <div className="snake-selector">
      <h3 className="panel-title">选择蛇类型</h3>
      <div className="snake-grid">
        {SNAKE_TYPES.map(type => (
          <button
            key={type.id}
            className={`snake-card ${selectedType === type.id ? 'selected' : ''}`}
            onClick={() => !disabled && onSelect(type.id)}
            disabled={disabled}
            style={{
              '--primary': type.primaryColor,
              '--secondary': type.secondaryColor,
              '--glow': type.glowColor,
            }}
          >
            <div className="snake-preview">
              {/* Mini snake preview */}
              <svg width="60" height="24" viewBox="0 0 60 24">
                {[0, 1, 2].map(i => (
                  <rect
                    key={i}
                    x={i * 21 + 1}
                    y={4}
                    width={18}
                    height={16}
                    rx={4}
                    fill={i === 0 ? type.primaryColor : type.secondaryColor}
                    opacity={i === 0 ? 1 : 0.7 - i * 0.1}
                    style={{ filter: `drop-shadow(0 0 4px ${type.primaryColor})` }}
                  />
                ))}
              </svg>
            </div>
            <span className="snake-name">{type.name}</span>
            <span className="snake-speed">速度 ×{type.speedFactor.toFixed(1)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
