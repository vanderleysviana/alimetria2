// src/consultations.js - SISTEMA COMPLETO DE CONSULTAS
import { state, loadPatientConsultations, loadPatientsFromDB } from './state.js';
import supabase, { ensureAuth } from './supabase.js';

export function openPatientConsultations(patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;
  
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '1200px';
  modal.style.width = '98%';
  
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '20px';
  
  const title = document.createElement('h3');
  title.textContent = `Consultas de ${patient.nome}`;
  title.style.color = '#1565C0';
  title.style.margin = '0';
  
  const newBtn = document.createElement('button');
  newBtn.className = 'btn btn-primary';
  newBtn.innerHTML = '➕ Nova Consulta';
  newBtn.onclick = () => openConsultationForm(patientId);
  
  header.appendChild(title);
  header.appendChild(newBtn);
  modal.appendChild(header);

  // Container principal com abas
  const tabsContainer = document.createElement('div');
  tabsContainer.style.marginBottom = '20px';
  
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  
  const tabLista = document.createElement('div');
  tabLista.className = 'tab active';
  tabLista.textContent = '📋 Lista de Consultas';
  tabLista.onclick = () => switchConsultationTab('lista', tabsContent, patientId);
  
  const tabStats = document.createElement('div');
  tabStats.className = 'tab';
  tabStats.textContent = '📊 Estatísticas';
  tabStats.onclick = () => switchConsultationTab('stats', tabsContent, patientId);
  
  tabs.appendChild(tabLista);
  tabs.appendChild(tabStats);
  tabsContainer.appendChild(tabs);
  
  const tabsContent = document.createElement('div');
  tabsContent.id = 'consultationTabsContent';
  tabsContent.style.minHeight = '400px';
  
  modal.appendChild(tabsContainer);
  modal.appendChild(tabsContent);
  
  // Carregar e mostrar lista inicial
  switchConsultationTab('lista', tabsContent, patientId);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  
  const close = document.createElement('button');
  close.className = 'btn';
  close.style.background = '#94a3b8';
  close.textContent = 'Fechar';
  close.onclick = () => backdrop.remove();
  
  footer.appendChild(close);
  modal.appendChild(footer);

  backdrop.appendChild(modal);
  root.appendChild(backdrop);
}

function switchConsultationTab(tab, container, patientId) {
  // Atualizar botões de aba
  const tabs = container.parentElement.querySelector('.tabs');
  const tabButtons = tabs.querySelectorAll('.tab');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Encontrar e ativar o botão correto
  const activeTab = Array.from(tabButtons).find(btn => 
    btn.textContent.includes(tab === 'lista' ? 'Lista' : 'Estatísticas')
  );
  if (activeTab) {
    activeTab.classList.add('active');
  }
  
  container.innerHTML = '';
  
  if (tab === 'lista') {
    renderConsultationList(patientId, container);
  } else if (tab === 'stats') {
    renderConsultationStats(patientId, container);
  }
}

function renderConsultationList(patientId, container) {
  const patient = state.patients[patientId];
  const consultas = patient.consultas || [];
  
  if (consultas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 64px; margin-bottom: 16px;">🩺</div>
        <h3 style="color: #374151; margin-bottom: 8px;">Nenhuma consulta encontrada</h3>
        <p style="margin-bottom: 24px;">Comece criando a primeira consulta para este paciente.</p>
        <button class="btn btn-primary" onclick="window.openConsultationForm('${patientId}')">
          ➕ Criar Primeira Consulta
        </button>
      </div>
    `;
    return;
  }
  
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '12px';
  
  consultas.sort((a, b) => new Date(b.data_horario) - new Date(a.data_horario))
          .forEach(consulta => {
    const card = document.createElement('div');
    card.style.background = 'white';
    card.style.border = '1px solid #e5e7eb';
    card.style.borderRadius = '12px';
    card.style.padding = '20px';
    card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
    
    const data = new Date(consulta.data_horario).toLocaleDateString('pt-BR');
    const hora = new Date(consulta.data_horario).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', minute: '2-digit' 
    });
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div style="flex: 1;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937;">${data} às ${hora}</h4>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <span style="background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 6px; font-size: 12px;">
              ${consulta.tipo || 'Consulta'}
            </span>
            ${consulta.anamneses ? '<span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 6px; font-size: 12px;">Anamnese</span>' : ''}
            ${consulta.anthropometry ? '<span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 6px; font-size: 12px;">Antropometria</span>' : ''}
            ${consulta.plans ? '<span style="background: #fce7f3; color: #831843; padding: 4px 8px; border-radius: 6px; font-size: 12px;">Plano</span>' : ''}
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary" onclick="window.openConsultationDetail('${patientId}', '${consulta.id}')">
            👁️ Detalhes
          </button>
          <button class="btn" style="background: #f59e0b;" onclick="window.openConsultationForm('${patientId}', '${consulta.id}')">
            ✏️ Editar
          </button>
          <button class="btn btn-danger" onclick="window.deleteConsultation('${patientId}', '${consulta.id}')">
            🗑️ Excluir
          </button>
        </div>
      </div>
      ${consulta.observacoes ? `<p style="color: #6b7280; margin: 0; font-size: 14px;">${consulta.observacoes}</p>` : ''}
    `;
    
    list.appendChild(card);
  });
  
  container.appendChild(list);
}

function renderConsultationStats(patientId, container) {
  const patient = state.patients[patientId];
  const consultas = patient.consultas || [];
  
  if (consultas.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280;">Nenhuma consulta para mostrar estatísticas.</div>';
    return;
  }
  
  // Estatísticas básicas
  const tipos = {};
  const porMes = {};
  
  consultas.forEach(consulta => {
    // Contagem por tipo
    const tipo = consulta.tipo || 'Não especificado';
    tipos[tipo] = (tipos[tipo] || 0) + 1;
    
    // Por mês
    const mes = new Date(consulta.data_horario).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
    porMes[mes] = (porMes[mes] || 0) + 1;
  });
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <div class="stat-value">${consultas.length}</div>
          <div class="stat-label">Total de Consultas</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <div class="stat-value">${new Date(consultas[consultas.length-1]?.data_horario).toLocaleDateString('pt-BR')}</div>
          <div class="stat-label">Primeira Consulta</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-info">
          <div class="stat-value">${new Date(consultas[0]?.data_horario).toLocaleDateString('pt-BR')}</div>
          <div class="stat-label">Última Consulta</div>
        </div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h4 style="margin: 0 0 16px 0; color: #374151;">📊 Consultas por Tipo</h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${Object.entries(tipos).map(([tipo, count]) => `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6b7280;">${tipo}</span>
              <span style="font-weight: bold; color: #1f2937;">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h4 style="margin: 0 0 16px 0; color: #374151;">📅 Consultas por Mês</h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${Object.entries(porMes).map(([mes, count]) => `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #6b7280;">${mes}</span>
              <span style="font-weight: bold; color: #1f2937;">${count}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Função global para abrir formulário de consulta
window.openConsultationForm = async (patientId, consultationId = null) => {
  const patient = state.patients[patientId];
  if (!patient) return;
  
  const consultation = consultationId 
    ? (patient.consultas || []).find(c => c.id === consultationId)
    : null;
  
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '800px';
  modal.style.width = '95%';
  
  const title = document.createElement('h3');
  title.textContent = consultation ? 'Editar Consulta' : 'Nova Consulta';
  title.style.color = '#8B5CF6';
  title.style.marginBottom = '24px';
  modal.appendChild(title);
  
  // Formulário
  const form = document.createElement('form');
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = '16px';
  
  // Campos básicos
  const campos = [
    { label: 'Data e Horário *', type: 'datetime-local', id: 'cons_data', value: consultation?.data_horario ? new Date(consultation.data_horario).toISOString().slice(0, 16) : '' },
    { 
      label: 'Tipo de Consulta *', 
      type: 'select', 
      id: 'cons_tipo', 
      value: consultation?.tipo || '',
      options: [
        { value: '', label: 'Selecione...' },
        { value: 'Primeira Consulta', label: 'Primeira Consulta' },
        { value: 'Retorno', label: 'Retorno' },
        { value: 'Avaliacao', label: 'Avaliação' },
        { value: 'Outro', label: 'Outro' }
      ]
    },
    { label: 'Observações', type: 'textarea', id: 'cons_obs', value: consultation?.observacoes || '' }
  ];
  
  campos.forEach(campo => {
    const field = document.createElement('div');
    field.className = 'field';
    
    const label = document.createElement('label');
    label.textContent = campo.label;
    label.style.fontWeight = '500';
    
    let input;
    
    if (campo.type === 'select') {
      input = document.createElement('select');
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #d1d5db';
      
      campo.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (opt.value === campo.value) option.selected = true;
        input.appendChild(option);
      });
    } else if (campo.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 4;
      input.value = campo.value;
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #d1d5db';
      input.style.resize = 'vertical';
    } else {
      input = document.createElement('input');
      input.type = campo.type;
      input.value = campo.value;
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #d1d5db';
    }
    
    input.id = campo.id;
    field.appendChild(label);
    field.appendChild(input);
    form.appendChild(field);
  });
  
  modal.appendChild(form);
  
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '12px';
  actions.style.marginTop = '24px';
  actions.style.paddingTop = '16px';
  actions.style.borderTop = '1px solid #e5e7eb';
  
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn';
  cancel.style.background = '#94a3b8';
  cancel.textContent = 'Cancelar';
  cancel.onclick = () => backdrop.remove();
  
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'btn btn-success';
  save.textContent = consultation ? 'Atualizar' : 'Salvar';
  
  save.onclick = async () => {
    const dataEl = document.getElementById('cons_data');
    const tipoEl = document.getElementById('cons_tipo');
    const obsEl = document.getElementById('cons_obs');
    
    if (!dataEl.value || !tipoEl.value) {
      alert('Preencha a data/horário e tipo da consulta.');
      return;
    }
    
    try {
      await ensureAuth();
      
      const consultationData = {
        patient_id: patientId,
        data_horario: new Date(dataEl.value).toISOString(),
        tipo: tipoEl.value,
        observacoes: obsEl.value.trim() || null
      };
      
      let result;
      if (consultation) {
        result = await supabase
          .from('consultations')
          .update(consultationData)
          .eq('id', consultation.id)
          .select();
      } else {
        result = await supabase
          .from('consultations')
          .insert([consultationData])
          .select();
      }
      
      if (result.error) throw result.error;
      
      // Recarregar consultas
      await loadPatientConsultations(patientId);
      backdrop.remove();
      openPatientConsultations(patientId);
      
    } catch (error) {
      console.error('Erro ao salvar consulta:', error);
      alert('Erro ao salvar consulta: ' + error.message);
    }
  };
  
  actions.appendChild(cancel);
  actions.appendChild(save);
  modal.appendChild(actions);
  
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
};

// Função global para excluir consulta
window.deleteConsultation = async (patientId, consultationId) => {
  if (!confirm('Tem certeza que deseja excluir esta consulta?')) return;
  
  try {
    await ensureAuth();
    
    const { error } = await supabase
      .from('consultations')
      .delete()
      .eq('id', consultationId);
    
    if (error) throw error;
    
    // Recarregar consultas
    await loadPatientConsultations(patientId);
    
    // Recarregar a lista
    const container = document.getElementById('consultationTabsContent');
    if (container) {
      renderConsultationList(patientId, container);
    }
    
  } catch (error) {
    console.error('Erro ao excluir consulta:', error);
    alert('Erro ao excluir consulta');
  }
};

// Função global para ver detalhes da consulta
window.openConsultationDetail = (patientId, consultationId) => {
  const patient = state.patients[patientId];
  const consultation = (patient.consultas || []).find(c => c.id === consultationId);
  
  if (!consultation) return;
  
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '900px';
  modal.style.width = '95%';
  
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '24px';
  
  const title = document.createElement('h3');
  title.textContent = `Detalhes da Consulta - ${new Date(consultation.data_horario).toLocaleDateString('pt-BR')}`;
  title.style.color = '#8B5CF6';
  title.style.margin = '0';
  
  const close = document.createElement('button');
  close.className = 'btn';
  close.style.background = '#94a3b8';
  close.textContent = 'Fechar';
  close.onclick = () => backdrop.remove();
  
  header.appendChild(title);
  header.appendChild(close);
  modal.appendChild(header);
  
  // Conteúdo dos detalhes
  const content = document.createElement('div');
  content.style.display = 'grid';
  content.style.gap = '24px';
  
  // Informações básicas
  const basicInfo = document.createElement('div');
  basicInfo.style.background = '#f8fafc';
  basicInfo.style.padding = '20px';
  basicInfo.style.borderRadius = '8px';
  basicInfo.innerHTML = `
    <h4 style="margin: 0 0 16px 0; color: #374151;">📋 Informações da Consulta</h4>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      <div>
        <strong>Data e Horário:</strong><br>
        ${new Date(consultation.data_horario).toLocaleString('pt-BR')}
      </div>
      <div>
        <strong>Tipo:</strong><br>
        ${consultation.tipo}
      </div>
      ${consultation.observacoes ? `
        <div style="grid-column: 1 / -1;">
          <strong>Observações:</strong><br>
          ${consultation.observacoes}
        </div>
      ` : ''}
    </div>
  `;
  content.appendChild(basicInfo);
  
  // Anamnese
  if (consultation.anamneses) {
    const anamneseSection = document.createElement('div');
    anamneseSection.style.background = '#f0f9ff';
    anamneseSection.style.padding = '20px';
    anamneseSection.style.borderRadius = '8px';
    anamneseSection.innerHTML = `
      <h4 style="margin: 0 0 16px 0; color: #0369a1;">📝 Anamnese</h4>
      <div style="display: grid; gap: 12px;">
        ${consultation.anamneses.historico_clinico ? `<div><strong>Histórico Clínico:</strong><br>${consultation.anamneses.historico_clinico}</div>` : ''}
        ${consultation.anamneses.historico_familiar ? `<div><strong>Histórico Familiar:</strong><br>${consultation.anamneses.historico_familiar}</div>` : ''}
        ${consultation.anamneses.alergias ? `<div><strong>Alergias:</strong><br>${consultation.anamneses.alergias}</div>` : ''}
        ${consultation.anamneses.restricoes ? `<div><strong>Restrições:</strong><br>${consultation.anamneses.restricoes}</div>` : ''}
      </div>
    `;
    content.appendChild(anamneseSection);
  }
  
  // Antropometria
  if (consultation.anthropometry) {
    const anthroSection = document.createElement('div');
    anthroSection.style.background = '#fef7ed';
    anthroSection.style.padding = '20px';
    anthroSection.style.borderRadius = '8px';
    anthroSection.innerHTML = `
      <h4 style="margin: 0 0 16px 0; color: #92400e;">📏 Antropometria</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
        ${consultation.anthropometry.peso ? `<div><strong>Peso:</strong><br>${consultation.anthropometry.peso} kg</div>` : ''}
        ${consultation.anthropometry.altura ? `<div><strong>Altura:</strong><br>${consultation.anthropometry.altura} m</div>` : ''}
        ${consultation.anthropometry.imc ? `<div><strong>IMC:</strong><br>${consultation.anthropometry.imc}</div>` : ''}
        ${consultation.anthropometry.circ_cintura ? `<div><strong>Circ. Cintura:</strong><br>${consultation.anthropometry.circ_cintura} cm</div>` : ''}
      </div>
    `;
    content.appendChild(anthroSection);
  }
  
  modal.appendChild(content);
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
};

// Gerenciador geral de consultas
export function openConsultationManager() {
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '1200px';
  modal.style.width = '98%';
  
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '20px';
  
  const title = document.createElement('h3');
  title.textContent = '📅 Gerenciador de Consultas';
  title.style.color = '#1565C0';
  title.style.margin = '0';
  
  const newBtn = document.createElement('button');
  newBtn.className = 'btn btn-primary';
  newBtn.innerHTML = '➕ Nova Consulta';
  newBtn.onclick = () => openConsultationFormManager();
  
  header.appendChild(title);
  header.appendChild(newBtn);
  modal.appendChild(header);

  // Container principal com abas
  const tabsContainer = document.createElement('div');
  tabsContainer.style.marginBottom = '20px';
  
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  
  const tabLista = document.createElement('div');
  tabLista.className = 'tab active';
  tabLista.textContent = '📋 Todas as Consultas';
  tabLista.onclick = () => switchConsultationManagerTab('lista', tabsContent);
  
  const tabCalendario = document.createElement('div');
  tabCalendario.className = 'tab';
  tabCalendario.textContent = '📅 Visualização por Data';
  tabCalendario.onclick = () => switchConsultationManagerTab('calendario', tabsContent);
  
  tabs.appendChild(tabLista);
  tabs.appendChild(tabCalendario);
  tabsContainer.appendChild(tabs);
  
  const tabsContent = document.createElement('div');
  tabsContent.id = 'consultationManagerTabsContent';
  tabsContent.style.minHeight = '400px';
  
  modal.appendChild(tabsContainer);
  modal.appendChild(tabsContent);
  
  // Carregar e mostrar lista inicial
  switchConsultationManagerTab('lista', tabsContent);

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  
  const close = document.createElement('button');
  close.className = 'btn';
  close.style.background = '#94a3b8';
  close.textContent = 'Fechar';
  close.onclick = () => backdrop.remove();
  
  footer.appendChild(close);
  modal.appendChild(footer);

  backdrop.appendChild(modal);
  root.appendChild(backdrop);
}

function switchConsultationManagerTab(tab, container) {
  // Atualizar botões de aba
  const tabs = container.parentElement.querySelector('.tabs');
  const tabButtons = tabs.querySelectorAll('.tab');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Encontrar e ativar o botão correto
  const activeTab = Array.from(tabButtons).find(btn => 
    btn.textContent.includes(tab === 'lista' ? 'Todas' : 'Visualização')
  );
  if (activeTab) {
    activeTab.classList.add('active');
  }
  
  container.innerHTML = '<div class="loading">Carregando...</div>';
  
  if (tab === 'lista') {
    renderConsultationManagerList(container);
  } else if (tab === 'calendario') {
    renderConsultationCalendar(container);
  }
}

async function renderConsultationManagerList(container) {
  try {
    // Carregar todas as consultas dos últimos 60 dias
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select(`
        *,
        patients (id, nome, genero, telefone, email)
      `)
      .gte('data_horario', startDate.toISOString())
      .order('data_horario', { ascending: false });
    
    if (error) throw error;
    
    if (!consultations || consultations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 64px; margin-bottom: 16px;">📅</div>
          <h3 style="color: #374151; margin-bottom: 8px;">Nenhuma consulta encontrada</h3>
          <p style="margin-bottom: 24px;">Agende a primeira consulta para começar.</p>
          <button class="btn btn-primary" onclick="openConsultationFormManager()">
            ➕ Agendar Primeira Consulta
          </button>
        </div>
      `;
      return;
    }
    
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '12px';
    
    consultations.forEach(consultation => {
      const card = document.createElement('div');
      card.style.background = 'white';
      card.style.border = '1px solid #e5e7eb';
      card.style.borderRadius = '12px';
      card.style.padding = '20px';
      card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
      
      const data = new Date(consultation.data_horario).toLocaleDateString('pt-BR');
      const hora = new Date(consultation.data_horario).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', minute: '2-digit' 
      });
      
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 8px 0; color: #1f2937;">${data} às ${hora}</h4>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px;">
              <span style="background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 6px; font-size: 12px;">
                ${consultation.tipo || 'Consulta'}
              </span>
              <span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 6px; font-size: 12px;">
                ${consultation.patients?.nome || 'Paciente não encontrado'}
              </span>
            </div>
            ${consultation.observacoes ? `<p style="color: #6b7280; margin: 0; font-size: 14px;">${consultation.observacoes}</p>` : ''}
          </div>
          <div style="display: flex; gap: 8px; flex-direction: column;">
            <button class="btn btn-primary" onclick="openConsultationDetailManager('${consultation.patient_id}', '${consultation.id}')">
              👁️ Detalhes
            </button>
            <button class="btn" style="background: #f59e0b;" onclick="openConsultationFormManager('${consultation.patient_id}', '${consultation.id}')">
              ✏️ Editar
            </button>
            <button class="btn btn-danger" onclick="deleteConsultationManager('${consultation.id}')">
              🗑️ Excluir
            </button>
          </div>
        </div>
      `;
      
      list.appendChild(card);
    });
    
    container.innerHTML = '';
    container.appendChild(list);
    
  } catch (error) {
    console.error('Erro ao carregar consultas:', error);
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #dc2626;">Erro ao carregar consultas.</div>';
  }
}

function renderConsultationCalendar(container) {
  container.innerHTML = `
    <div style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
      <h4 style="margin: 0 0 16px 0; color: #374151;">📅 Consultas por Data</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        <div>
          <h5 style="color: #6b7280; margin-bottom: 12px;">Próximos 7 Dias</h5>
          <div id="nextWeekConsultations" class="loading">Carregando...</div>
        </div>
        <div>
          <h5 style="color: #6b7280; margin-bottom: 12px;">Este Mês</h5>
          <div id="thisMonthConsultations" class="loading">Carregando...</div>
        </div>
      </div>
    </div>
  `;
  
  loadCalendarData();
}

async function loadCalendarData() {
  try {
    // Consultas dos próximos 7 dias
    const nextWeekStart = new Date();
    const nextWeekEnd = new Date();
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
    
    const { data: nextWeekData, error: nextWeekError } = await supabase
      .from('consultations')
      .select(`
        *,
        patients (nome)
      `)
      .gte('data_horario', nextWeekStart.toISOString())
      .lte('data_horario', nextWeekEnd.toISOString())
      .order('data_horario', { ascending: true });
    
    // Consultas deste mês
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const thisMonthEnd = new Date();
    thisMonthEnd.setMonth(thisMonthEnd.getMonth() + 1);
    thisMonthEnd.setDate(0);
    thisMonthEnd.setHours(23, 59, 59, 999);
    
    const { data: thisMonthData, error: thisMonthError } = await supabase
      .from('consultations')
      .select(`
        *,
        patients (nome)
      `)
      .gte('data_horario', thisMonthStart.toISOString())
      .lte('data_horario', thisMonthEnd.toISOString())
      .order('data_horario', { ascending: true });
    
    if (nextWeekError) throw nextWeekError;
    if (thisMonthError) throw thisMonthError;
    
    // Renderizar próximos 7 dias
    const nextWeekContainer = document.getElementById('nextWeekConsultations');
    if (nextWeekContainer) {
      if (nextWeekData && nextWeekData.length > 0) {
        nextWeekContainer.innerHTML = nextWeekData.map(consult => `
          <div style="padding: 8px; border-left: 3px solid #3b82f6; background: #f0f9ff; margin-bottom: 8px; border-radius: 4px;">
            <div style="font-weight: 600; color: #1e40af;">${new Date(consult.data_horario).toLocaleDateString('pt-BR')}</div>
            <div style="font-size: 14px; color: #374151;">${consult.patients.nome} - ${consult.tipo}</div>
            <div style="font-size: 12px; color: #6b7280;">${new Date(consult.data_horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        `).join('');
      } else {
        nextWeekContainer.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 20px;">Nenhuma consulta agendada</div>';
      }
    }
    
    // Renderizar este mês
    const thisMonthContainer = document.getElementById('thisMonthConsultations');
    if (thisMonthContainer) {
      if (thisMonthData && thisMonthData.length > 0) {
        // Agrupar por data
        const groupedByDate = {};
        thisMonthData.forEach(consult => {
          const date = new Date(consult.data_horario).toLocaleDateString('pt-BR');
          if (!groupedByDate[date]) {
            groupedByDate[date] = [];
          }
          groupedByDate[date].push(consult);
        });
        
        thisMonthContainer.innerHTML = Object.entries(groupedByDate).map(([date, consults]) => `
          <div style="margin-bottom: 12px;">
            <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">${date}</div>
            ${consults.map(consult => `
              <div style="padding: 6px; background: #f8fafc; margin-bottom: 4px; border-radius: 4px; font-size: 14px;">
                <span style="color: #3b82f6;">${new Date(consult.data_horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                - ${consult.patients.nome} (${consult.tipo})
              </div>
            `).join('')}
          </div>
        `).join('');
      } else {
        thisMonthContainer.innerHTML = '<div style="color: #6b7280; text-align: center; padding: 20px;">Nenhuma consulta este mês</div>';
      }
    }
    
  } catch (error) {
    console.error('Erro ao carregar dados do calendário:', error);
  }
}

// Função para abrir formulário de consulta a partir do gerenciador
window.openConsultationFormManager = async (patientId = null, consultationId = null) => {
  await loadPatientsFromDB(); // Garantir que pacientes estão carregados
  
  if (!patientId) {
    // Se não há patientId, mostrar seletor de paciente
    const root = document.getElementById('modalRoot');
    root.innerHTML = '';
    
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.maxWidth = '500px';
    
    const title = document.createElement('h3');
    title.textContent = 'Selecionar Paciente';
    title.style.color = '#1565C0';
    title.style.marginBottom = '20px';
    
    const patientList = document.createElement('div');
    patientList.style.maxHeight = '400px';
    patientList.style.overflowY = 'auto';
    patientList.style.display = 'flex';
    patientList.style.flexDirection = 'column';
    patientList.style.gap = '8px';
    
    Object.values(state.patients).forEach(patient => {
      const patientBtn = document.createElement('button');
      patientBtn.className = 'btn';
      patientBtn.style.background = '#f8fafc';
      patientBtn.style.border = '1px solid #e2e8f0';
      patientBtn.style.justifyContent = 'flex-start';
      patientBtn.style.textAlign = 'left';
      patientBtn.innerHTML = `
        <div style="font-weight: 600;">${patient.nome}</div>
        <div style="font-size: 12px; color: #64748b;">
          ${patient.idade ? `${patient.idade} anos` : ''} ${patient.genero ? `• ${patient.genero}` : ''}
        </div>
      `;
      patientBtn.onclick = () => {
        backdrop.remove();
        openConsultationForm(patient.id, consultationId);
      };
      patientList.appendChild(patientBtn);
    });
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.style.background = '#94a3b8';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = () => backdrop.remove();
    
    modal.appendChild(title);
    modal.appendChild(patientList);
    modal.appendChild(cancelBtn);
    
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
  } else {
    openConsultationForm(patientId, consultationId);
  }
};

// Função para ver detalhes da consulta no gerenciador
window.openConsultationDetailManager = (patientId, consultationId) => {
  openConsultationDetail(patientId, consultationId);
};

// Função para excluir consulta do gerenciador
window.deleteConsultationManager = async (consultationId) => {
  if (!confirm('Tem certeza que deseja excluir esta consulta? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  try {
    await ensureAuth();
    
    const { error } = await supabase
      .from('consultations')
      .delete()
      .eq('id', consultationId);
    
    if (error) throw error;
    
    // Recarregar a lista atual
    const container = document.getElementById('consultationManagerTabsContent');
    if (container) {
      const activeTab = container.parentElement.querySelector('.tab.active');
      if (activeTab.textContent.includes('Todas')) {
        renderConsultationManagerList(container);
      } else {
        renderConsultationCalendar(container);
      }
    }
    
    // Mostrar mensagem de sucesso
    alert('Consulta excluída com sucesso!');
    
  } catch (error) {
    console.error('Erro ao excluir consulta:', error);
    alert('Erro ao excluir consulta: ' + error.message);
  }
};
