// src/idGenerator.js - Substituição do nanoid
export function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}
