import { SNAKE_TYPES } from './constants.js';

/**
 * Get snake type config by id.
 * @param {string} id
 * @returns {object}
 */
export function getSnakeType(id) {
  return SNAKE_TYPES.find(t => t.id === id) || SNAKE_TYPES[0];
}

export { SNAKE_TYPES };
