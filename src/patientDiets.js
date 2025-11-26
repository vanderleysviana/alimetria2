// src/patientDiets.js - VERSÃO COMPLETA CORRIGIDA COM SALVAMENTO FUNCIONANDO
import { state, MEALS, convertAppMealsToDbFormat, loadPatientDiets } from './state.js';
import { renderMeals, renderSummary } from './ui.js';
import supabase, { ensureAuth } from './supabase.js';
import { generateId } from './idGenerator.js';

export function openPatientDiets(patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;
  
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.maxWidth = '1000px';
  modal.style.width = '98%';
  
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '20px';
  
  const title = document.createElement('h3');
  title.textContent = `📋 Dietas de ${patient.nome}`;
  title.style.color = '#1e40af';
  
  const newDietBtn = document.createElement('button');
  newDietBtn.className = 'btn btn-primary';
  newDietBtn.textContent = '➕ Nova Dieta';
  newDietBtn.onclick = async () => {
    await createNewDietForPatient(patientId);
    openPatientDiets(patientId);
  };
  
  header.appendChild(title);
  header.appendChild(newDietBtn);
  modal.appendChild(header);

  const list = document.createElement('div');
  list.style.maxHeight = '400px';
  list.style.overflow = 'auto';
  list.style.marginTop = '16px';
  list.style.padding = '8px';
  list.style.border = '1px solid #e2e8f0';
  list.style.borderRadius = '8px';
  
  if (!patient.dietas || patient.dietas.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #64748b;">
        <div style="font-size: 48px; margin-bottom: 16px;">🍽️</div>
        <h4 style="margin: 0 0 8px 0; color: #374151;">Nenhuma dieta encontrada</h4>
        <p style="margin: 0 0 20px 0;">Comece criando a primeira dieta para este paciente.</p>
        <button class="btn btn-primary" onclick="createNewDietForPatient('${patientId}')">
          ➕ Criar Primeira Dieta
        </button>
      </div>
    `;
  } else {
    patient.dietas.forEach(d => {
      const totalItems = Object.values(d.meals || {}).reduce((acc, meal) => acc + meal.length, 0);
      const totalMeals = Object.keys(d.meals || {}).filter(m => d.meals[m].length > 0).length;
      
      const r = document.createElement('div');
      r.style.display = 'flex';
      r.style.justifyContent = 'space-between';
      r.style.alignItems = 'center';
      r.style.padding = '16px';
      r.style.borderBottom = '1px solid #f1f5f9';
      r.style.background = '#f8fafc';
      r.style.borderRadius = '8px';
      r.style.marginBottom = '8px';
      
      const left = document.createElement('div');
      left.innerHTML = `
        <div style="font-weight:600; color:#1e293b; font-size:16px;">${d.name}</div>
        <div style="font-size:12px;color:#64748b; margin-top:4px;">
          📅 ${d.createdAt} • 🍽️ ${totalMeals} refeições • 📊 ${totalItems} itens
        </div>
        ${d.observacoes ? `<div style="font-size:12px;color:#475569; margin-top:4px;">${d.observacoes}</div>` : ''}
      `;
      
      const a = document.createElement('div');
      a.style.display = 'flex';
      a.style.gap = '8px';
      a.style.flexDirection = 'column';
      a.style.minWidth = '200px';
      
      const loadBtn = document.createElement('button');
      loadBtn.className = 'btn btn-primary';
      loadBtn.textContent = '📥 Carregar';
      loadBtn.style.width = '100%';
      loadBtn.onclick = () => {
        loadDietToSession(patientId, d.id);
        backdrop.remove();
      };
      
      const editBtn = document.createElement('button');
      editBtn.className = 'btn';
      editBtn.style.background = '#f59e0b';
      editBtn.textContent = '✏️ Editar';
      editBtn.style.width = '100%';
      editBtn.onclick = () => {
        editDiet(patientId, d.id);
      };
      
      const del = document.createElement('button');
      del.className = 'btn btn-danger';
      del.textContent = '🗑️ Excluir';
      del.style.width = '100%';
      del.onclick = async () => {
        if (confirm(`Tem certeza que deseja excluir a dieta "${d.name}"?`)) {
          await deleteDiet(d.id);
          openPatientDiets(patientId);
        }
      };
      
      a.appendChild(loadBtn);
      a.appendChild(editBtn);
      a.appendChild(del);
      
      r.appendChild(left);
      r.appendChild(a);
      list.appendChild(r);
    });
  }
  
  modal.appendChild(list);

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  footer.style.marginTop = '20px';
  footer.style.paddingTop = '16px';
  footer.style.borderTop = '1px solid #e2e8f0';
  
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

async function deleteDiet(dietId) {
  try {
    await ensureAuth();
    
    const { error } = await supabase
      .from('diets')
      .delete()
      .eq('id', dietId);
    
    if (error) throw error;
    
    // Remover das dietas de todos os pacientes
    Object.values(state.patients).forEach(patient => {
      if (patient.dietas) {
        patient.dietas = patient.dietas.filter(d => d.id !== dietId);
      }
    });
    
    console.log(`✅ Dieta ${dietId} excluída`);
    
  } catch (error) {
    console.error('❌ Erro ao excluir dieta:', error);
    alert('Erro ao excluir dieta: ' + error.message);
  }
}

export async function saveEditingDiet() {
  console.log('💾 Iniciando salvamento da dieta...');
  
  if (!state.currentPatient) {
    alert('Selecione um paciente para começar.');
    return;
  }
  
  const { patientId, dietId } = state.currentDiet || {};
  
  if (!patientId || !dietId) {
    alert('Nenhuma dieta em edição encontrada.');
    return;
  }
  
  const patient = state.patients[patientId];
  
  if (!patient) {
    alert('Paciente não encontrado.');
    state.currentDiet = null;
    return;
  }
  
  // Verificar se há alimentos nas refeições
  const hasAny = Object.keys(state.meals).some(m => (state.meals[m] || []).length > 0);
  if (!hasAny) {
    alert('A dieta está vazia. Adicione pelo menos 1 alimento.');
    return;
  }

  // Verificar quantidades válidas
  for (const m of MEALS) {
    for (const item of (state.meals[m] || [])) {
      if (!item.qty || Number(item.qty) <= 0) {
        alert(`Quantidade inválida no alimento da refeição ${m}.`);
        return;
      }
    }
  }

  const saveBtn = document.getElementById('saveDietFloating');
  
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '💾 Salvando...';
  }

  try {
    await ensureAuth();
    
    console.log('📊 Convertendo refeições para formato do banco...');
    const dbMeals = convertAppMealsToDbFormat(state.meals);
    console.log('📦 Refeições convertidas:', dbMeals);
    
    // Primeiro, buscar todas as meals existentes para esta dieta
    const { data: existingMeals, error: fetchError } = await supabase
      .from('meals')
      .select('id, nome')
      .eq('diet_id', dietId);
    
    if (fetchError) throw fetchError;
    console.log('🍽️ Refeições existentes:', existingMeals);

    // Processar cada refeição
    for (const dbMeal of dbMeals) {
      console.log(`🔄 Processando refeição: ${dbMeal.nome}`);
      
      let mealId;
      const existingMeal = existingMeals?.find(m => m.nome === dbMeal.nome);
      
      if (existingMeal) {
        mealId = existingMeal.id;
        console.log(`✅ Refeição existente encontrada: ${mealId}`);
        
        // Deletar itens existentes
        const { error: deleteError } = await supabase
          .from('meal_items')
          .delete()
          .eq('meal_id', mealId);
        
        if (deleteError) throw deleteError;
        console.log(`🗑️ Itens antigos removidos da refeição ${dbMeal.nome}`);
      } else {
        // Criar nova refeição
        const { data: newMeal, error: mealError } = await supabase
          .from('meals')
          .insert([{ diet_id: dietId, nome: dbMeal.nome }])
          .select()
          .single();
        
        if (mealError) throw mealError;
        mealId = newMeal.id;
        console.log(`✅ Nova refeição criada: ${mealId}`);
      }
      
      // Inserir novos itens se houver
      if (dbMeal.meal_items.length > 0) {
        const mealItems = dbMeal.meal_items.map(item => ({
          meal_id: mealId,
          food_id: item.food_id,
          quantidade_gramas: item.quantidade_gramas
        }));
        
        console.log(`📥 Inserindo ${mealItems.length} itens na refeição ${dbMeal.nome}`);
        const { error: itemsError } = await supabase
          .from('meal_items')
          .insert(mealItems);
        
        if (itemsError) throw itemsError;
        console.log(`✅ Itens inseridos com sucesso`);
      }
    }
    
    // Atualizar estado
    state.unsavedChanges = false;
    
    // Recarregar dietas do paciente
    await loadPatientDiets(patientId);
    
    alert('✅ Dieta salva com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao salvar dieta:', error);
    
    if (error.message && error.message.includes('Network')) {
      alert('🌐 Falha de conexão. Verifique sua internet e tente novamente.');
    } else {
      alert('❌ Erro ao salvar dieta: ' + error.message);
    }
    
    state.unsavedChanges = true;
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Salvar Dieta';
    }
    
    renderSummary();
    renderMeals();
  }
}

export async function createNewDietForPatient(patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;
  
  const name = prompt('Nome da nova dieta (obrigatório):');
  if (!name || !name.trim()) {
    alert('Nome da dieta é obrigatório');
    return;
  }
  
  const objetivo = prompt('Objetivo da dieta (opcional):') || name.trim();
  
  try {
    await ensureAuth();
    
    const { data: diet, error } = await supabase
      .from('diets')
      .insert([{
        patient_id: patientId,
        data: new Date().toISOString().split('T')[0],
        objetivo: objetivo
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Criar refeições vazias
    for (const mealName of MEALS) {
      await supabase
        .from('meals')
        .insert([{ diet_id: diet.id, nome: mealName }]);
    }
    
    await loadPatientDiets(patientId);
    
    console.log(`✅ Nova dieta criada: ${name}`);
    alert(`✅ Dieta "${name}" criada com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro ao criar dieta:', error);
    alert('❌ Erro ao criar nova dieta: ' + error.message);
  }
}

export function editDiet(patientId, dietId) {
  const patient = state.patients[patientId];
  if (!patient) return;
  
  const diet = (patient.dietas || []).find(d => d.id === dietId);
  if (!diet) return;
  
  const newName = prompt('Renomear dieta:', diet.name);
  if (newName && newName.trim()) {
    diet.name = newName.trim();
    openPatientDiets(patientId);
  }
}

export function loadDietToSession(patientId, dietId) {
  console.log(`📥 Carregando dieta ${dietId} para sessão...`);
  
  const patient = state.patients[patientId];
  if (!patient) return;
  
  const diet = (patient.dietas || []).find(d => d.id === dietId);
  if (!diet) return;
  
  // Limpar refeições atuais
  MEALS.forEach(meal => state.meals[meal] = []);
  console.log('🗑️ Refeições atuais limpas');

  // Carregar refeições da dieta
  if (diet.meals) {
    Object.keys(diet.meals).forEach(mealName => {
      if (MEALS.includes(mealName)) {
        state.meals[mealName] = (diet.meals[mealName] || []).map(item => ({
          id: item.id,
          qty: item.qty
        }));
        
        console.log(`📋 ${diet.meals[mealName].length} alimentos carregados para ${mealName}`);
      }
    });
  }
  
  state.currentPatient = { ...patient };
  state.currentDiet = { patientId, dietId, name: diet.name };
  state.unsavedChanges = false;

  console.log('✅ Dieta carregada para sessão:', state.meals);
  
  renderMeals();
  renderSummary();
  
  alert(`✅ Dieta "${diet.name}" carregada para edição!`);
}

export async function saveCurrentSessionAsDiet(patientId) {
  console.log('💾 Salvando sessão atual como nova dieta...');
  
  const patient = state.patients[patientId];
  if (!patient) return;
  
  const hasAny = Object.keys(state.meals).some(m => (state.meals[m] || []).length > 0);
  if (!hasAny) {
    alert('Sessão atual vazia — nada para salvar como dieta.');
    return;
  }
  
  const name = prompt('Nome para a nova dieta (obrigatório):');
  if (!name || !name.trim()) {
    alert('Nome da dieta é obrigatório');
    return;
  }
  
  const objetivo = prompt('Objetivo da dieta (opcional):') || name.trim();
  
  try {
    await ensureAuth();
    
    const { data: diet, error } = await supabase
      .from('diets')
      .insert([{
        patient_id: patientId,
        data: new Date().toISOString().split('T')[0],
        objetivo: objetivo
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('📊 Convertendo refeições para formato do banco...');
    const dbMeals = convertAppMealsToDbFormat(state.meals);
    
    for (const dbMeal of dbMeals) {
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert([{ diet_id: diet.id, nome: dbMeal.nome }])
        .select()
        .single();
      
      if (mealError) throw mealError;
      
      if (dbMeal.meal_items.length > 0) {
        const mealItems = dbMeal.meal_items.map(item => ({
          meal_id: meal.id,
          food_id: item.food_id,
          quantidade_gramas: item.quantidade_gramas
        }));
        
        const { error: itemsError } = await supabase
          .from('meal_items')
          .insert(mealItems);
        
        if (itemsError) throw itemsError;
      }
    }
    
    await loadPatientDiets(patientId);
    
    alert(`✅ Dieta "${name}" salva no paciente ${patient.nome}.`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar dieta:', error);
    alert('❌ Erro ao salvar dieta no banco de dados: ' + error.message);
  }
}

// ADICIONAR ESTA NOVA FUNÇÃO - saveCurrentDiet
export async function saveCurrentDiet() {
  console.log('💾 Salvando dieta atual...');
  
  if (!state.currentPatient) {
    alert('Selecione um paciente para começar.');
    return;
  }
  
  // Se já temos uma dieta em edição, use saveEditingDiet
  if (state.currentDiet) {
    return await saveEditingDiet();
  }
  
  // Caso contrário, crie uma nova dieta
  const hasAny = Object.keys(state.meals).some(m => (state.meals[m] || []).length > 0);
  if (!hasAny) {
    alert('A dieta está vazia. Adicione pelo menos 1 alimento.');
    return;
  }

  const name = prompt('Nome para a nova dieta (obrigatório):');
  if (!name || !name.trim()) {
    alert('Nome da dieta é obrigatório');
    return;
  }
  
  const objetivo = prompt('Objetivo da dieta (opcional):') || name.trim();
  
  try {
    await ensureAuth();
    
    const { data: diet, error } = await supabase
      .from('diets')
      .insert([{
        patient_id: state.currentPatient.id,
        data: new Date().toISOString().split('T')[0],
        objetivo: objetivo
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    const dbMeals = convertAppMealsToDbFormat(state.meals);
    
    for (const dbMeal of dbMeals) {
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert([{ diet_id: diet.id, nome: dbMeal.nome }])
        .select()
        .single();
      
      if (mealError) throw mealError;
      
      if (dbMeal.meal_items.length > 0) {
        const mealItems = dbMeal.meal_items.map(item => ({
          meal_id: meal.id,
          food_id: item.food_id,
          quantidade_gramas: item.quantidade_gramas
        }));
        
        const { error: itemsError } = await supabase
          .from('meal_items')
          .insert(mealItems);
        
        if (itemsError) throw itemsError;
      }
    }
    
    await loadPatientDiets(state.currentPatient.id);
    state.currentDiet = { patientId: state.currentPatient.id, dietId: diet.id, name: name.trim() };
    state.unsavedChanges = false;
    
    alert(`✅ Dieta "${name}" salva com sucesso!`);
    renderSummary();
    
  } catch (error) {
    console.error('❌ Erro ao salvar dieta:', error);
    alert('❌ Erro ao salvar dieta no banco de dados: ' + error.message);
  }
}
