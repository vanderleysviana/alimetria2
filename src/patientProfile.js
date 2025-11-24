// src/patientProfile.js - TELA COMPLETA DE PERFIL DO PACIENTE
import { state, loadPatientDiets, loadPatientConsultations } from './state.js';
import { openEditPatientForm } from './patientManager.js';
import { openPatientDiets } from './patientDiets.js';
import { openPatientConsultations } from './consultations.js';
import { showDietBuilder } from './dietBuilder.js';
import supabase, { ensureAuth } from './supabase.js';

export function openPatientProfile(patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;

  const app = document.getElementById('app');
  app.innerHTML = '';

  // Criar a estrutura do perfil
  const profileContainer = document.createElement('div');
  profileContainer.className = 'patient-profile';
  profileContainer.innerHTML = `
    <div class="profile-header">
      <button class="btn btn-back" onclick="window.showDashboard()">
        ← Voltar ao Painel
      </button>
      <div class="patient-photo-section">
        <div class="patient-photo">
          ${patient.foto_url 
            ? `<img src="${patient.foto_url}" alt="${patient.nome}" />`
            : `<div class="photo-placeholder">${patient.nome.charAt(0)}</div>`
          }
          <button class="btn-upload-photo" onclick="openPhotoUpload('${patient.id}')">
            📷 Alterar Foto
          </button>
        </div>
        <div class="patient-basic-info">
          <h1>${patient.nome}</h1>
          <div class="patient-meta">
            ${patient.idade ? `<span>${patient.idade} anos</span>` : ''}
            ${patient.genero ? `<span>${patient.genero}</span>` : ''}
            ${patient.data_nascimento ? `<span>Nascimento: ${new Date(patient.data_nascimento).toLocaleDateString('pt-BR')}</span>` : ''}
          </div>
          <div class="contact-info">
            ${patient.telefone ? `<div>📞 ${patient.telefone}</div>` : ''}
            ${patient.email ? `<div>✉️ ${patient.email}</div>` : ''}
          </div>
          ${patient.tags && patient.tags.length > 0 ? `
            <div class="patient-tags">
              ${patient.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
      <div class="profile-actions">
        <button class="btn btn-primary" id="editPatientBtn">✏️ Editar Perfil</button>
        <button class="btn btn-success" id="startDietBtn">🍽️ Montar Dieta</button>
        <button class="btn" id="newConsultationBtn" style="background: #8B5CF6;">🩺 Nova Consulta</button>
      </div>
    </div>

    <div class="profile-stats">
      <div class="stat-card">
        <div class="stat-icon">🍽️</div>
        <div class="stat-info">
          <div class="stat-value">${patient.dietCount || 0}</div>
          <div class="stat-label">Dietas</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🩺</div>
        <div class="stat-info">
          <div class="stat-value">${patient.consultationCount || 0}</div>
          <div class="stat-label">Consultas</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <div class="stat-value">${patient.lastConsultation ? new Date(patient.lastConsultation.data_horario).toLocaleDateString('pt-BR') : 'N/A'}</div>
          <div class="stat-label">Última Consulta</div>
        </div>
      </div>
    </div>

    <div class="profile-tabs">
      <div class="tabs">
        <div class="tab active" data-tab="dados">📋 Dados Pessoais</div>
        <div class="tab" data-tab="dietas">🍽️ Dietas</div>
        <div class="tab" data-tab="consultas">🩺 Consultas</div>
        <div class="tab" data-tab="antropometria">📏 Antropometria</div>
        <div class="tab" data-tab="anamnese">📝 Anamnese</div>
        <div class="tab" data-tab="historico">📊 Histórico</div>
      </div>
      <div class="tab-content" id="profileTabContent">
        <!-- Conteúdo das abas será carregado aqui -->
      </div>
    </div>
  `;

  app.appendChild(profileContainer);

  // Anexar eventos
  document.getElementById('editPatientBtn').addEventListener('click', () => openEditPatientForm(patient));
  document.getElementById('startDietBtn').addEventListener('click', () => {
    state.currentPatient = patient;
    showDietBuilder();
  });
  document.getElementById('newConsultationBtn').addEventListener('click', () => {
    window.openConsultationForm(patient.id);
  });

  // Anexar eventos das abas
  const tabs = profileContainer.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchProfileTab(tab.dataset.tab, profileContainer, patientId));
  });

  // Carregar a aba inicial (Dados Pessoais)
  switchProfileTab('dados', profileContainer, patientId);
}

function switchProfileTab(tabName, container, patientId) {
  // Atualizar abas
  const tabs = container.querySelectorAll('.tab');
  tabs.forEach(tab => tab.classList.remove('active'));
  container.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');

  const contentContainer = container.querySelector('#profileTabContent');
  contentContainer.innerHTML = '<div class="loading">Carregando...</div>';

  switch (tabName) {
    case 'dados':
      renderPersonalDataTab(contentContainer, patientId);
      break;
    case 'dietas':
      renderDietsTab(contentContainer, patientId);
      break;
    case 'consultas':
      renderConsultationsTab(contentContainer, patientId);
      break;
    case 'antropometria':
      renderAnthropometryTab(contentContainer, patientId);
      break;
    case 'anamnese':
      renderAnamnesisTab(contentContainer, patientId);
      break;
    case 'historico':
      renderHistoryTab(contentContainer, patientId);
      break;
  }
}

function renderPersonalDataTab(container, patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;

  container.innerHTML = `
    <div class="personal-data">
      <div class="section-header">
        <h3>📋 Dados Pessoais</h3>
        <button class="btn btn-primary" onclick="openEditPatientForm(${JSON.stringify(patient).replace(/"/g, '&quot;')})">
          ✏️ Editar
        </button>
      </div>
      
      <div class="data-grid">
        <div class="data-group">
          <h4>Informações Básicas</h4>
          <div class="data-item">
            <label>Nome Completo</label>
            <p>${patient.nome}</p>
          </div>
          <div class="data-item">
            <label>Data de Nascimento</label>
            <p>${patient.data_nascimento ? new Date(patient.data_nascimento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
          </div>
          <div class="data-item">
            <label>Idade</label>
            <p>${patient.idade ? `${patient.idade} anos` : 'Não calculada'}</p>
          </div>
          <div class="data-item">
            <label>Gênero</label>
            <p>${patient.genero || 'Não informado'}</p>
          </div>
          <div class="data-item">
            <label>CPF</label>
            <p>${patient.cpf || 'Não informado'}</p>
          </div>
        </div>

        <div class="data-group">
          <h4>Contato</h4>
          <div class="data-item">
            <label>Telefone</label>
            <p>${patient.telefone || 'Não informado'}</p>
          </div>
          <div class="data-item">
            <label>Email</label>
            <p>${patient.email || 'Não informado'}</p>
          </div>
        </div>

        <div class="data-group full-width">
          <h4>Observações</h4>
          <div class="data-item">
            <p>${patient.observacoes || 'Nenhuma observação cadastrada.'}</p>
          </div>
        </div>

        ${patient.tags && patient.tags.length > 0 ? `
          <div class="data-group full-width">
            <h4>Tags</h4>
            <div class="tags-container">
              ${patient.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderDietsTab(container, patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;

  container.innerHTML = '<div class="loading">Carregando dietas...</div>';

  // Carregar dietas do paciente
  loadPatientDiets(patientId).then(() => {
    const diets = patient.dietas || [];
    
    if (diets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍽️</div>
          <h3>Nenhuma dieta encontrada</h3>
          <p>Comece criando a primeira dieta para este paciente.</p>
          <div class="empty-actions">
            <button class="btn btn-primary" onclick="startDietForPatient('${patientId}')">
              🍽️ Criar Primeira Dieta
            </button>
            <button class="btn btn-outline" onclick="openPatientDiets('${patientId}')">
              📋 Ver Todas as Dietas
            </button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="diets-section">
        <div class="section-header">
          <h3>🍽️ Dietas do Paciente</h3>
          <div>
            <button class="btn btn-primary" onclick="startDietForPatient('${patientId}')">
              🍽️ Nova Dieta
            </button>
            <button class="btn btn-outline" onclick="openPatientDiets('${patientId}')">
              📋 Gerenciar Todas
            </button>
          </div>
        </div>
        
        <div class="diet-cards">
          ${diets.slice(0, 6).map(diet => `
            <div class="diet-card">
              <div class="diet-header">
                <h4>${diet.name}</h4>
                <span class="diet-date">${new Date(diet.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div class="diet-info">
                <div class="diet-objective">
                  <strong>Objetivo:</strong> ${diet.objetivo || 'Não definido'}
                </div>
                <div class="diet-stats">
                  <span class="stat">Refeições: ${Object.keys(diet.meals || {}).filter(m => diet.meals[m].length > 0).length}</span>
                  <span class="stat">Itens: ${Object.values(diet.meals || {}).reduce((acc, meal) => acc + meal.length, 0)}</span>
                </div>
              </div>
              <div class="diet-actions">
                <button class="btn btn-primary" onclick="loadDietToSession('${patientId}', '${diet.id}')">
                  🔄 Carregar
                </button>
                <button class="btn btn-outline" onclick="openPatientDiets('${patientId}')">
                  👁️ Detalhes
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${diets.length > 6 ? `
          <div class="see-more">
            <button class="btn btn-outline" onclick="openPatientDiets('${patientId}')">
              📋 Ver todas as ${diets.length} dietas
            </button>
          </div>
        ` : ''}
      </div>
    `;
  });
}

function renderConsultationsTab(container, patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;

  container.innerHTML = '<div class="loading">Carregando consultas...</div>';

  loadPatientConsultations(patientId).then(() => {
    const consultations = patient.consultas || [];
    
    if (consultations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🩺</div>
          <h3>Nenhuma consulta encontrada</h3>
          <p>Agende a primeira consulta para este paciente.</p>
          <div class="empty-actions">
            <button class="btn btn-primary" onclick="window.openConsultationForm('${patientId}')">
              🩺 Agendar Primeira Consulta
            </button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="consultations-section">
        <div class="section-header">
          <h3>🩺 Histórico de Consultas</h3>
          <button class="btn btn-primary" onclick="window.openConsultationForm('${patientId}')">
            🩺 Nova Consulta
          </button>
        </div>
        
        <div class="consultation-timeline">
          ${consultations.map(consult => `
            <div class="consultation-item">
              <div class="consultation-date">
                <div class="date-day">${new Date(consult.data_horario).getDate()}</div>
                <div class="date-month">${new Date(consult.data_horario).toLocaleDateString('pt-BR', { month: 'short' })}</div>
                <div class="date-year">${new Date(consult.data_horario).getFullYear()}</div>
              </div>
              <div class="consultation-content">
                <div class="consultation-header">
                  <h4>${consult.tipo || 'Consulta'}</h4>
                  <span class="consultation-time">
                    ${new Date(consult.data_horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                ${consult.observacoes ? `
                  <div class="consultation-notes">
                    <p>${consult.observacoes}</p>
                  </div>
                ` : ''}
                <div class="consultation-modules">
                  ${consult.anamneses ? '<span class="module-badge">Anamnese</span>' : ''}
                  ${consult.anthropometry ? '<span class="module-badge">Antropometria</span>' : ''}
                  ${consult.plans ? '<span class="module-badge">Plano</span>' : ''}
                  ${consult.guidelines ? '<span class="module-badge">Orientações</span>' : ''}
                </div>
                <div class="consultation-actions">
                  <button class="btn btn-sm btn-primary" onclick="window.openConsultationDetail('${patientId}', '${consult.id}')">
                    👁️ Detalhes
                  </button>
                  <button class="btn btn-sm" onclick="window.openConsultationForm('${patientId}', '${consult.id}')" style="background: #f59e0b;">
                    ✏️ Editar
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
}

function renderAnthropometryTab(container, patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;

  // Buscar dados de antropometria das consultas
  const anthropometryData = [];
  (patient.consultas || []).forEach(consult => {
    if (consult.anthropometry) {
      anthropometryData.push({
        id: consult.anthropometry.id,
        consultation_id: consult.id,
        date: consult.data_horario,
        ...consult.anthropometry
      });
    }
  });

  if (anthropometryData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📏</div>
        <h3>Nenhum dado antropométrico</h3>
        <p>Registre medidas antropométricas nas consultas do paciente.</p>
        <div class="empty-actions">
          <button class="btn btn-primary" onclick="window.openConsultationForm('${patientId}')">
            🩺 Nova Consulta com Medidas
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="anthropometry-section">
      <div class="section-header">
        <h3>📏 Evolução Antropométrica</h3>
        <div>
          <button class="btn btn-primary" onclick="window.openConsultationForm('${patientId}')">
            📊 Nova Medição
          </button>
        </div>
      </div>
      
      <div class="anthropometry-grid">
        ${anthropometryData.sort((a, b) => new Date(b.date) - new Date(a.date)).map(data => `
          <div class="anthropometry-card">
            <div class="anthro-header">
              <div class="anthro-date">
                ${new Date(data.date).toLocaleDateString('pt-BR')}
              </div>
              <button class="btn btn-sm" onclick="openAnthropometryForm('${data.consultation_id}', '${patientId}', ${JSON.stringify(data).replace(/"/g, '&quot;')})" style="background: #10b981;">
                ✏️ Editar
              </button>
            </div>
            <div class="anthro-measures">
              ${data.peso ? `<div class="measure"><label>Peso:</label> <span>${data.peso} kg</span></div>` : ''}
              ${data.altura ? `<div class="measure"><label>Altura:</label> <span>${data.altura} m</span></div>` : ''}
              ${data.imc ? `<div class="measure"><label>IMC:</label> <span>${data.imc}</span></div>` : ''}
              ${data.circ_cintura ? `<div class="measure"><label>Cintura:</label> <span>${data.circ_cintura} cm</span></div>` : ''}
              ${data.circ_quadril ? `<div class="measure"><label>Quadril:</label> <span>${data.circ_quadril} cm</span></div>` : ''}
              ${data.gordura_corporal ? `<div class="measure"><label>% Gordura:</label> <span>${data.gordura_corporal}%</span></div>` : ''}
              ${data.massa_magra ? `<div class="measure"><label>Massa Magra:</label> <span>${data.massa_magra} kg</span></div>` : ''}
              ${data.agua_corporal ? `<div class="measure"><label>% Água:</label> <span>${data.agua_corporal}%</span></div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAnamnesisTab(container, patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;

  // Buscar dados de anamnese das consultas
  const anamnesisData = [];
  (patient.consultas || []).forEach(consult => {
    if (consult.anamneses) {
      anamnesisData.push({
        id: consult.anamneses.id,
        consultation_id: consult.id,
        date: consult.data_horario,
        ...consult.anamneses
      });
    }
  });

  const latestAnamnesis = anamnesisData.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  if (!latestAnamnesis) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>Nenhuma anamnese registrada</h3>
        <p>Realize a primeira anamnese do paciente em uma consulta.</p>
        <div class="empty-actions">
          <button class="btn btn-primary" onclick="window.openConsultationForm('${patientId}')">
            🩺 Nova Consulta com Anamnese
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="anamnesis-section">
      <div class="section-header">
        <h3>📝 Anamnese - ${new Date(latestAnamnesis.date).toLocaleDateString('pt-BR')}</h3>
        <div>
          <button class="btn" style="background: #f59e0b;" onclick="openAnamnesisForm('${latestAnamnesis.consultation_id}', '${patientId}', ${JSON.stringify(latestAnamnesis).replace(/"/g, '&quot;')})">
            ✏️ Editar
          </button>
          <button class="btn btn-primary" onclick="window.openConsultationForm('${patientId}')">
            📝 Nova Anamnese
          </button>
        </div>
      </div>
      
      <div class="anamnesis-content">
        ${latestAnamnesis.historico_clinico ? `
          <div class="anamnesis-group">
            <h4>Histórico Clínico</h4>
            <p>${latestAnamnesis.historico_clinico}</p>
          </div>
        ` : ''}
        
        ${latestAnamnesis.historico_familiar ? `
          <div class="anamnesis-group">
            <h4>Histórico Familiar</h4>
            <p>${latestAnamnesis.historico_familiar}</p>
          </div>
        ` : ''}
        
        ${latestAnamnesis.alergias ? `
          <div class="anamnesis-group">
            <h4>Alergias</h4>
            <p>${latestAnamnesis.alergias}</p>
          </div>
        ` : ''}
        
        ${latestAnamnesis.restricoes ? `
          <div class="anamnesis-group">
            <h4>Restrições</h4>
            <p>${latestAnamnesis.restricoes}</p>
          </div>
        ` : ''}
        
        ${latestAnamnesis.rotina ? `
          <div class="anamnesis-group">
            <h4>Rotina</h4>
            <p>${latestAnamnesis.rotina}</p>
          </div>
        ` : ''}
        
        ${latestAnamnesis.medicacoes ? `
          <div class="anamnesis-group">
            <h4>Medicações</h4>
            <p>${latestAnamnesis.medicacoes}</p>
          </div>
        ` : ''}
        
        ${latestAnamnesis.observacoes ? `
          <div class="anamnesis-group">
            <h4>Observações</h4>
            <p>${latestAnamnesis.observacoes}</p>
          </div>
        ` : ''}
      </div>
      
      ${anamnesisData.length > 1 ? `
        <div class="anamnesis-history">
          <h4>Histórico de Anamneses</h4>
          <div class="history-list">
            ${anamnesisData.slice(1).map(data => `
              <div class="history-item">
                <span class="history-date">${new Date(data.date).toLocaleDateString('pt-BR')}</span>
                <button class="btn btn-sm btn-outline" onclick="loadAnamnesisDetail('${patientId}', '${data.id}')">
                  Ver Detalhes
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
function renderHistoryTab(container, patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;

  container.innerHTML = `
    <div class="history-section">
      <div class="section-header">
        <h3>📊 Histórico Completo</h3>
      </div>
      
      <div class="history-stats">
        <div class="stat-card large">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <div class="stat-value">${patient.consultationCount || 0}</div>
            <div class="stat-label">Consultas Realizadas</div>
          </div>
        </div>
        
        <div class="stat-card large">
          <div class="stat-icon">🍽️</div>
          <div class="stat-info">
            <div class="stat-value">${patient.dietCount || 0}</div>
            <div class="stat-label">Dietas Prescritas</div>
          </div>
        </div>
        
        <div class="stat-card large">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <div class="stat-value">${patient.data_nascimento ? patient.idade + ' anos' : 'N/A'}</div>
            <div class="stat-label">Idade do Paciente</div>
          </div>
        </div>
      </div>
      
      <div class="history-timeline">
        <h4>Linha do Tempo</h4>
        <div class="timeline">
          ${(patient.consultas || []).sort((a, b) => new Date(b.data_horario) - new Date(a.data_horario)).map(consult => `
            <div class="timeline-item">
              <div class="timeline-date">
                ${new Date(consult.data_horario).toLocaleDateString('pt-BR')}
              </div>
              <div class="timeline-content">
                <div class="timeline-type">${consult.tipo}</div>
                <div class="timeline-details">
                  ${consult.observacoes || 'Sem observações'}
                </div>
                <div class="timeline-modules">
                  ${consult.anamneses ? '<span class="module">Anamnese</span>' : ''}
                  ${consult.anthropometry ? '<span class="module">Antropometria</span>' : ''}
                  ${consult.plans ? '<span class="module">Plano</span>' : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Função para upload de foto
window.openPhotoUpload = async (patientId) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Aqui você implementaria o upload para o Supabase Storage
    // Por enquanto, vamos apenas mostrar um alerta
    alert('Funcionalidade de upload de foto será implementada em breve!');
  };
  
  input.click();
};

// Função para iniciar dieta
window.startDietForPatient = (patientId) => {
  const patient = state.patients[patientId];
  if (patient) {
    state.currentPatient = patient;
    showDietBuilder();
  }
};

// Adicionar funções globais
window.openPatientProfile = openPatientProfile;
