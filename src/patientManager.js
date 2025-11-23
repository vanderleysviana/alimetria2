// src/patientManager.js - VERSÃO COMPLETA ATUALIZADA
import { state, MEALS, loadPatientsFromDB, loadPatientDiets, loadPatientConsultations, calcularIdade } from './state.js';
import { renderMeals, renderSummary } from './ui.js';
import { openPatientDiets, openPatientConsultations } from './patients.js';
import { supabase } from './supabase.js';

export function initPatientUI() {
  const disp = document.getElementById('patientDisplay');
  if (!disp) return;
  const current = state.patient && state.patient.nome ? state.patient : null;
  disp.textContent = current ? `${current.nome}` : '— nenhum paciente selecionado —';
}

export async function openPatientManager() {
  console.log('📋 Abrindo gerenciador de pacientes...');
  
  try {
    await loadPatientsFromDB();
    
    const root = document.getElementById('modalRoot');
    if (!root) {
      console.error('❌ modalRoot não encontrado');
      return;
    }
    
    root.innerHTML = '';
    
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.maxWidth = '1000px';
    modal.style.width = '95%';

    const titleWrap = document.createElement('div');
    titleWrap.style.display = 'flex';
    titleWrap.style.justifyContent = 'space-between';
    titleWrap.style.alignItems = 'center';
    titleWrap.style.marginBottom = '16px';
    
    const title = document.createElement('h3');
    title.textContent = 'Cadastro de Pacientes';
    title.style.color = '#1565C0';
    title.style.margin = '0';
    
    const newBtn = document.createElement('button');
    newBtn.className = 'btn';
    newBtn.innerHTML = '➕ Novo Paciente';
    newBtn.style.background = '#1E88E5';
    newBtn.onclick = () => openEditPatientForm();
    
    titleWrap.appendChild(title);
    titleWrap.appendChild(newBtn);
    modal.appendChild(titleWrap);

    const searchWrap = document.createElement('div');
    searchWrap.style.marginBottom = '16px';
    searchWrap.style.display = 'flex';
    searchWrap.style.gap = '8px';
    searchWrap.style.alignItems = 'center';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Pesquisar por nome, email, telefone...';
    searchInput.style.padding = '10px 12px';
    searchInput.style.flex = '1';
    searchInput.style.borderRadius = '8px';
    searchInput.style.border = '1px solid #d1d5db';
    searchInput.id = 'patientSearch';
    
    searchWrap.appendChild(searchInput);
    modal.appendChild(searchWrap);

    const list = document.createElement('div');
    list.style.maxHeight = '500px';
    list.style.overflow = 'auto';
    list.style.border = '1px solid #e5e7eb';
    list.style.borderRadius = '8px';
    list.style.padding = '8px';
    modal.appendChild(list);

    // Renderizar lista inicial
    renderPatientList('', list);
    
    // Adicionar evento de pesquisa
    searchInput.addEventListener('input', () => {
      renderPatientList(searchInput.value.trim().toLowerCase(), list);
    });

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.marginTop = '16px';
    footer.style.paddingTop = '16px';
    footer.style.borderTop = '1px solid #e5e7eb';
    
    const close = document.createElement('button');
    close.className = 'btn';
    close.style.background = '#94a3b8';
    close.textContent = 'Fechar';
    close.onclick = () => backdrop.remove();
    
    footer.appendChild(close);
    modal.appendChild(footer);

    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    
    console.log('✅ Gerenciador de pacientes aberto com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao abrir gerenciador de pacientes:', error);
    alert('Erro ao abrir gerenciador de pacientes');
  }
}

export function renderPatientList(filter, container) {
  container.innerHTML = '';
  const patients = Object.values(state.patients).sort((a, b) => a.nome.localeCompare(b.nome));
  
  const filtered = patients.filter(p => {
    if (!filter) return true;
    const searchStr = `${p.nome} ${p.email} ${p.telefone} ${p.tags?.join(' ')}`.toLowerCase();
    return searchStr.includes(filter);
  });
  
  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.style.color = '#6b7280';
    empty.style.padding = '40px 20px';
    empty.style.textAlign = 'center';
    empty.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
      <div style="font-size: 16px; color: #374151; margin-bottom: 8px;">Nenhum paciente encontrado</div>
      <div style="font-size: 14px; color: #6b7280;">Tente ajustar os termos da pesquisa</div>
    `;
    container.appendChild(empty);
    return;
  }
  
  filtered.forEach(p => {
    const idade = p.data_nascimento ? calcularIdade(p.data_nascimento) : null;
    const dietCount = (p.dietas && p.dietas.length) ? p.dietas.length : 0;
    const consultaCount = (p.consultas && p.consultas.length) ? p.consultas.length : 0;
    
    const row = document.createElement('div');
    row.className = 'patient-row';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'flex-start';
    row.style.padding = '16px 12px';
    row.style.borderBottom = '1px solid #f3f4f6';
    row.style.borderRadius = '8px';
    row.style.marginBottom = '8px';
    row.style.background = '#fafafa';
    row.style.transition = 'all 0.2s ease';
    
    row.onmouseenter = () => {
      row.style.background = '#f0f9ff';
      row.style.transform = 'translateY(-1px)';
    };
    row.onmouseleave = () => {
      row.style.background = '#fafafa';
      row.style.transform = 'translateY(0)';
    };

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';
    left.style.flex = '1';
    
    const nameLine = document.createElement('div');
    nameLine.style.fontWeight = '600';
    nameLine.style.fontSize = '16px';
    nameLine.style.color = '#1f2937';
    nameLine.textContent = p.nome;
    
    const metaLine = document.createElement('div');
    metaLine.style.fontSize = '13px';
    metaLine.style.color = '#6b7280';
    metaLine.style.marginTop = '4px';
    metaLine.innerHTML = `
      <div>📅 Idade: ${idade || '-'} • 🚻 ${p.genero || '-'}</div>
      <div>📞 ${p.telefone || '-'} • ✉️ ${p.email || '-'}</div>
      <div>📊 Dietas: ${dietCount} • 🩺 Consultas: ${consultaCount}</div>
      ${p.tags && p.tags.length > 0 ? `<div>🏷️ Tags: ${p.tags.join(', ')}</div>` : ''}
    `;
    
    left.appendChild(nameLine);
    left.appendChild(metaLine);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.flexDirection = 'column';
    actions.style.gap = '8px';
    actions.style.minWidth = '200px';
    
    const dietBtn = document.createElement('button');
    dietBtn.className = 'btn';
    dietBtn.style.background = '#2196F3';
    dietBtn.style.width = '100%';
    dietBtn.textContent = '📄 Dietas';
    dietBtn.onclick = async () => {
      await loadPatientDiets(p.id);
      openPatientDiets(p.id);
    };
    
    const consultBtn = document.createElement('button');
    consultBtn.className = 'btn';
    consultBtn.style.background = '#8B5CF6';
    consultBtn.style.width = '100%';
    consultBtn.textContent = '🩺 Consultas';
    consultBtn.onclick = async () => {
      await loadPatientConsultations(p.id);
      openPatientConsultations(p.id);
    };
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.style.background = '#f59e0b';
    editBtn.style.width = '100%';
    editBtn.textContent = '✏️ Editar';
    editBtn.onclick = () => {
      openEditPatientForm(p);
    };
    
    const selectBtn = document.createElement('button');
    selectBtn.className = 'btn';
    selectBtn.style.background = '#10b981';
    selectBtn.style.width = '100%';
    selectBtn.textContent = '✅ Selecionar';
    selectBtn.onclick = () => {
      selectPatient(p.id);
      document.querySelector('.modal-backdrop')?.remove();
    };
    
    actions.appendChild(dietBtn);
    actions.appendChild(consultBtn);
    actions.appendChild(editBtn);
    actions.appendChild(selectBtn);

    row.appendChild(left);
    row.appendChild(actions);
    container.appendChild(row);
  });
}

export async function openEditPatientForm(existing = null) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '600px';
  modal.style.width = '95%';

  const title = document.createElement('h3');
  title.textContent = existing ? 'Editar paciente' : 'Novo paciente';
  title.style.color = '#1565C0';
  title.style.marginBottom = '20px';
  modal.appendChild(title);

  const makeField = (label, id, type = 'text', value = '', options = []) => {
    const field = document.createElement('div');
    field.className = 'field';
    field.style.marginBottom = '16px';
    
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.display = 'block';
    labelEl.style.marginBottom = '6px';
    labelEl.style.fontWeight = '500';
    labelEl.style.color = '#374151';
    
    let input;
    
    if (type === 'select') {
      input = document.createElement('select');
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #d1d5db';
      input.style.background = 'white';
      
      options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        if (option.value === value) opt.selected = true;
        input.appendChild(opt);
      });
    } else if (type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
      input.value = value;
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #d1d5db';
      input.style.resize = 'vertical';
    } else {
      input = document.createElement('input');
      input.type = type;
      input.value = value;
      input.style.width = '100%';
      input.style.padding = '10px 12px';
      input.style.borderRadius = '6px';
      input.style.border = '1px solid #d1d5db';
    }
    
    input.id = id;
    field.appendChild(labelEl);
    field.appendChild(input);
    
    return { field, input };
  };

  // Campos do formulário
  const nomeField = makeField('Nome completo *', 'pt_nome', 'text', existing?.nome || '');
  const dataNascField = makeField('Data de Nascimento', 'pt_data_nasc', 'date', existing?.data_nascimento || '');
  const generoField = makeField('Gênero', 'pt_genero', 'select', existing?.genero || '', [
    { value: '', label: 'Selecione...' },
    { value: 'Masculino', label: 'Masculino' },
    { value: 'Feminino', label: 'Feminino' },
    { value: 'Outro', label: 'Outro' }
  ]);
  const cpfField = makeField('CPF', 'pt_cpf', 'text', existing?.cpf || '');
  const telefoneField = makeField('Telefone', 'pt_telefone', 'tel', existing?.telefone || '');
  const emailField = makeField('Email', 'pt_email', 'email', existing?.email || '');
  const tagsField = makeField('Tags (separadas por vírgula)', 'pt_tags', 'text', existing?.tags?.join(', ') || '');
  const obsField = makeField('Observações', 'pt_obs', 'textarea', existing?.observacoes || '');

  [
    nomeField.field, dataNascField.field, generoField.field, 
    cpfField.field, telefoneField.field, emailField.field,
    tagsField.field, obsField.field
  ].forEach(field => modal.appendChild(field));

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '12px';
  actions.style.marginTop = '24px';
  actions.style.paddingTop = '16px';
  actions.style.borderTop = '1px solid #e5e7eb';
  
  const cancel = document.createElement('button');
  cancel.className = 'btn';
  cancel.style.background = '#94a3b8';
  cancel.textContent = 'Cancelar';
  cancel.onclick = () => backdrop.remove();
  
  const save = document.createElement('button');
  save.className = 'btn';
  save.style.background = '#10b981';
  save.textContent = existing ? 'Atualizar' : 'Salvar';
  
  save.onclick = async () => {
    if (!nomeField.input.value.trim()) {
      alert('Preencha o Nome (obrigatório).');
      return;
    }
    
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    if (userError || !user) {
      alert('Erro de autenticação. Recarregue a página.');
      return;
    }
    
    const patientData = {
      nome: nomeField.input.value.trim(),
      data_nascimento: dataNascField.input.value || null,
      genero: generoField.input.value || null,
      cpf: cpfField.input.value.trim() || null,
      telefone: telefoneField.input.value.trim() || null,
      email: emailField.input.value.trim() || null,
      tags: tagsField.input.value.split(',').map(tag => tag.trim()).filter(tag => tag),
      observacoes: obsField.input.value.trim() || null,
      user_id: user.id
    };

    try {
      let result;
      if (existing?.id) {
        result = await window.supabase
          .from('patients')
          .update(patientData)
          .eq('id', existing.id)
          .select();
      } else {
        result = await window.supabase
          .from('patients')
          .insert([patientData])
          .select();
      }

      if (result.error) throw result.error;

      const savedPatient = result.data[0];
      state.patients[savedPatient.id] = { 
        ...savedPatient, 
        dietas: existing?.dietas || [],
        consultas: existing?.consultas || [] 
      };
      
      initPatientUI();
      backdrop.remove();
      
      // Recarregar a lista se o gerenciador estiver aberto
      const searchInput = document.getElementById('patientSearch');
      const listContainer = document.querySelector('.modal .patient-list');
      if (searchInput && listContainer) {
        renderPatientList(searchInput.value.trim().toLowerCase(), listContainer);
      }
      
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      alert('Erro ao salvar paciente: ' + error.message);
    }
  };
  
  actions.appendChild(cancel);
  actions.appendChild(save);
  modal.appendChild(actions);
  
  backdrop.appendChild(modal);
  root.appendChild(backdrop);
}

export function selectPatient(id) {
  const p = state.patients[id];
  if (!p) return;
  
  state.patient = { ...p };
  initPatientUI();
  renderMeals();
  renderSummary();
  
  // Mostrar mensagem de sucesso
  showStatusMessage(`Paciente "${p.nome}" selecionado com sucesso!`, 'success');
}

function showStatusMessage(message, type = 'info') {
  const statusEl = document.getElementById('statusMessage');
  if (!statusEl) return;
  
  statusEl.textContent = message;
  statusEl.className = `status-message status-${type}`;
  statusEl.style.display = 'block';
  
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}
