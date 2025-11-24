// src/ui.js - VERSÃO SIMPLIFICADA
import { state, MEALS, formatNumber, calcScaled } from './state.js';
import { openAddFoodModal } from './modals.js';

export function renderMeals() {
  // Esta função agora é usada principalmente pelo dietBuilder
  // O dashboard e dietBuilder cuidam de sua própria renderização
}

export function renderSummary() {
  // Esta função agora é usada principalmente pelo dietBuilder
}

// Sistema de eventos para notificar quando a aplicação estiver pronta
let appReady = false;
const readyCallbacks = [];

export function onAppReady(callback) {
  if (appReady) {
    callback();
  } else {
    readyCallbacks.push(callback);
  }
}

export function notifyAppReady() {
  appReady = true;
  readyCallbacks.forEach(callback => callback());
  readyCallbacks.length = 0; // Limpar array
}

// Inicialização básica da UI
export function initUI() {
  console.log('🎨 Inicializando UI...');
  
  // Configurações básicas que são comuns a todas as views
  // O dashboard e dietBuilder cuidam de seus próprios eventos específicos
  
  console.log('✅ UI inicializada com sucesso');
}
