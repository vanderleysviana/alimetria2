// src/dashboard.js - DASHBOARD COMPLETO E ATUALIZADO
import { state, loadRecentConsultations, loadStats, selectPatient } from './state.js';
import { openPatientManager } from './patientManager.js';
import { openPatientConsultations, openConsultationManager } from './consultations.js';
import { showDietBuilder } from './dietBuilder.js';

export function showDashboard() {
  const app = document.getElementById('app');
  
  if (!app) {
    console.error('❌ Elemento app não encontrado');
    return;
  }
  
  app.innerHTML = `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <h1>🍎 Painel Nutricional</h1>
          <p>Bem-vindo de volta! Aqui está o resumo da sua semana.</p>
        </div>
        <div class="header-actions">
          <button id="quickPatientBtn" class="btn btn-primary">
            👥 Gerenciar Pacientes
          </button>
        </div>
      </header>

      <!-- Stats Grid -->
      <div class="stats-grid" id="statsGrid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-value" id="patientCount">0</div>
            <div class="stat-label">Pacientes Cadastrados</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <div class="stat-value" id="todayConsultations">0</div>
            <div class="stat-label">Consultas Hoje</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-value" id="dietCount">0</div>
            <div class="stat-label">Dietas Criadas</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🩺</div>
          <div class="stat-info">
            <div class="stat-value" id="weekConsultations">0</div>
            <div class="stat-label">Consultas Esta Semana</div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="dashboard-content">
        <!-- Consultas Agendadas -->
        <div class="content-section">
          <div class="section-header">
            <h2>📅 Consultas desta Semana</h2>
            <button id="scheduleConsultationBtn" class="btn btn-outline">
              + Nova Consulta
            </button>
          </div>
          <div class="consultations-list" id="consultationsList">
            <div class="loading">Carregando consultas...</div>
          </div>
        </div>

        <!-- Ações Rápidas -->
        <div class="content-section">
          <div class="section-header">
            <h2>🚀 Ações Rápidas</h2>
          </div>
          <div class="quick-actions-grid">
            <div class="quick-action-card" onclick="openPatientManager()">
              <div class="action-icon">👥</div>
              <div class="action-title">Gerenciar Pacientes</div>
              <div class="action-description">Cadastrar, editar e visualizar pacientes</div>
            </div>
            <div class="quick-action-card" id="dietBuilderCard" style="opacity:0.5;cursor:not-allowed">
              <div class="action-icon">🍽️</div>
              <div class="action-title">Montar Dieta</div>
              <div class="action-description">Selecione um paciente para começar</div>
            </div>
            <div class="quick-action-card" onclick="openConsultationManager()">
              <div class="action-icon">🩺</div>
              <div class="action-title">Consultas</div>
              <div class="action-description">Agendar e gerenciar consultas</div>
            </div>
            <div class="quick-action-card" onclick="openReports()">
              <div class="action-icon">📈</div>
              <div class="action-title">Relatórios</div>
              <div class="action-description">Relatórios e estatísticas</div>
            </div>
          </div>
        </div>

        <!-- Pacientes Recentes -->
        <div class="content-section">
          <div class="section-header">
            <h2>👥 Pacientes Recentes</h2>
          </div>
          <div class="recent-patients" id="recentPatients">
            <div class="loading">Carregando pacientes...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Anexar eventos
  attachDashboardEvents();
  
  // Carregar dados
  loadDashboardData();
}

function attachDashboardEvents() {
  // Botão de gerenciar pacientes
  const patientBtn = document.getElementById('quickPatientBtn');
  if (patientBtn) {
    patientBtn.addEventListener('click', openPatientManager);
  }

  // Botão de nova consulta
  const consultBtn = document.getElementById('scheduleConsultationBtn');
  if (consultBtn) {
    consultBtn.addEventListener('click', () => {
      if (Object.keys(state.patients).length === 0) {
        alert('Cadastre primeiro um paciente para agendar consultas.');
        openPatientManager();
      } else {
        openConsultationManager();
      }
    });
  }
}

async function loadDashboardData() {
  try {
    // Carregar estatísticas
    const stats = await loadStats();
    updateStats(stats);

    // Carregar consultas recentes
    const consultations = await loadRecentConsultations();
    renderConsultations(consultations);

    // Carregar pacientes recentes
    renderRecentPatients();

  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
  }
}

function updateStats(stats) {
  // Verificar se elementos existem antes de atualizar
  const patientCountEl = document.getElementById('patientCount');
  const todayConsultationsEl = document.getElementById('todayConsultations');
  const dietCountEl = document.getElementById('dietCount');
  const weekConsultationsEl = document.getElementById('weekConsultations');

  if (patientCountEl) patientCountEl.textContent = stats.patientCount || 0;
  if (todayConsultationsEl) todayConsultationsEl.textContent = stats.todayConsultations || 0;
  if (dietCountEl) dietCountEl.textContent = stats.dietCount || 0;
  if (weekConsultationsEl) weekConsultationsEl.textContent = state.recentConsultations?.length || 0;
}

function renderConsultations(consultations) {
  const container = document.getElementById('consultationsList');
  if (!container) return;
  
  if (!consultations || consultations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>Nenhuma consulta esta semana</h3>
        <p>Agende novas consultas para ver aqui.</p>
        <button class="btn btn-primary" onclick="openConsultationManager()">
          Agendar Primeira Consulta
        </button>
      </div>
    `;
    return;
  }

  const consultationsHtml = consultations.map(consult => `
    <div class="consultation-item" data-patient-id="${consult.patient_id}">
      <div class="consultation-date">
        <div class="date-day">${new Date(consult.data_horario).getDate()}</div>
        <div class="date-month">${new Date(consult.data_horario).toLocaleDateString('pt-BR', { month: 'short' })}</div>
      </div>
      <div class="consultation-info">
        <div class="patient-name">${consult.patients?.nome || 'Paciente'}</div>
        <div class="consultation-time">${new Date(consult.data_horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • ${consult.tipo || 'Consulta'}</div>
      </div>
      <div class="consultation-actions">
        <button class="btn btn-sm btn-outline" onclick="openPatientConsultations('${consult.patient_id}')">
          Detalhes
        </button>
      </div>
    </div>
  `).join('');

  container.innerHTML = consultationsHtml;
}

function renderRecentPatients() {
  const container = document.getElementById('recentPatients');
  if (!container) return;
  
  const patients = Object.values(state.patients).slice(0, 5);
  
  if (patients.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Nenhum paciente cadastrado</h3>
        <p>Comece cadastrando seus primeiros pacientes.</p>
        <button class="btn btn-primary" onclick="openPatientManager()">
          Cadastrar Primeiro Paciente
        </button>
      </div>
    `;
    return;
  }

  const patientsHtml = patients.map(patient => `
    <div class="patient-card" onclick="selectPatientFromDashboard('${patient.id}')">
      <div class="patient-avatar">
        ${patient.genero === 'Feminino' ? '👩' : patient.genero === 'Masculino' ? '👨' : '👤'}
      </div>
      <div class="patient-info">
        <div class="patient-name">${patient.nome}</div>
        <div class="patient-meta">
          ${patient.idade ? `${patient.idade} anos` : 'Idade não informada'} • 
          ${patient.consultationCount || 0} consultas
        </div>
      </div>
      <div class="patient-badge">
        ${patient.dietCount || 0} dietas
      </div>
    </div>
  `).join('');

  container.innerHTML = patientsHtml;
}

// Funções globais para o dashboard
window.selectPatientFromDashboard = async (patientId) => {
  const success = selectPatient(patientId);
  if (success) {
    // Fechar modal se estiver aberto
    document.querySelector('.modal-backdrop')?.remove();
    // Mostrar interface de montagem de dieta
    showDietBuilder();
  }
};

window.openConsultationManager = openConsultationManager;

window.openReports = () => {
  // Implementar abertura de relatórios
  alert('Sistema de relatórios será implementado aqui');
};
