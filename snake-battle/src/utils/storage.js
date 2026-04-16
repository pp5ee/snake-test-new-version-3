const STORAGE_KEY = 'snakeBattle';
const MAX_HISTORY = 20;

export const loadGameData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load game data:', e);
  }
  return {
    highScore: 0,
    history: [],
  };
};

export const saveGameData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save game data:', e);
  }
};

export const saveScore = (score, snakeType) => {
  const data = loadGameData();
  const now = new Date().toISOString();

  const newRecord = {
    score,
    date: now,
    snakeType,
  };

  // Update history
  data.history = [newRecord, ...data.history].slice(0, MAX_HISTORY);

  // Update high score
  if (score > data.highScore) {
    data.highScore = score;
  }

  saveGameData(data);
  return data;
};

export const getHighScore = () => {
  const data = loadGameData();
  return data.highScore;
};

export const getHistory = () => {
  const data = loadGameData();
  return data.history;
};

export const clearHistory = () => {
  saveGameData({ highScore: 0, history: [] });
};