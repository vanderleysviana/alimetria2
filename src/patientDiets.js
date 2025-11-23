// src/patientDiets.js - ATUALIZAR IMPORT
import { state, MEALS, convertAppMealsToDbFormat } from './state.js';
import { renderMeals, renderSummary } from './ui.js';
import { loadPatientDiets } from './state.js';
import supabase, { ensureAuth } from './supabase.js'; // ← Mudar para import default
import { nanoid } from 'nanoid';

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
  
  const title = document.createElement('h3');
  title.textContent = `Dietas de ${patient.name}`;
  title.style.color = '#1565C0';
  
  const newDietBtn = document.createElement('button');
  newDietBtn.className = 'btn';
  newDietBtn.textContent = '➕ Nova Dieta';
  newDietBtn.style.background = '#1E88E5';
  newDietBtn.onclick = async () => {
    await createNewDietForPatient(patientId);
    openPatientDiets(patientId);
  };
  
  header.appendChild(title);
  header.appendChild(newDietBtn);
  modal.appendChild(header);

  const list = document.createElement('div');
  list.style.maxHeight = '360px';
  list.style.overflow = 'auto';
  list.style.marginTop = '12px';
  
  (patient.dietas || []).forEach(d => {
    const r = document.createElement('div');
    r.style.display = 'flex';
    r.style.justifyContent = 'space-between';
    r.style.alignItems = 'center';
    r.style.padding = '8px 0';
    r.style.borderBottom = '1px solid rgba(0,0,0,0.04)';
    
    const left = document.createElement('div');
    left.innerHTML = `<div style="font-weight:600">${d.name}</div><div style="font-size:12px;color:#334155">Data: ${d.createdAt} • Refeições: ${Object.keys(d.meals || {}).length}</div>`;
    
    const a = document.createElement('div');
    a.style.display = 'flex';
    a.style.gap = '8px';
    
    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn';
    loadBtn.textContent = 'Carregar';
    loadBtn.onclick = () => {
      loadDietToSession(patientId, d.id);
      backdrop.remove();
    };
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.style.background = '#f59e0b';
    editBtn.textContent = 'Editar';
    editBtn.onclick = () => {
      editDiet(patientId, d.id);
    };
    
    const del = document.createElement('button');
    del.className = 'btn';
    del.style.background = '#ef4444';
    del.textContent = 'Excluir';
    del.onclick = async () => {
      if (confirm('Excluir dieta?')) {
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
  
  modal.appendChild(list);

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  footer.style.marginTop = '12px';
  
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
    
    Object.values(state.patients).forEach(patient => {
      if (patient.dietas) {
        patient.dietas = patient.dietas.filter(d => d.id !== dietId);
      }
    });
    
    console.log(`✅ Dieta ${dietId} excluída`);
    
  } catch (error) {
    console.error('❌ Erro ao excluir dieta:', error);
    alert('Erro ao excluir dieta');
  }
}

export async function saveEditingDiet() {
  if (!state.editingDiet) {
    alert('Selecione um paciente e uma dieta para começar.');
    return;
  }
  
  const { patientId, dietId } = state.editingDiet;
  const patient = state.patients[patientId];
  
  if (!patient) {
    alert('Paciente não encontrado.');
    state.editingDiet = null;
    return;
  }
  
  const dietIndex = (patient.dietas || []).findIndex(d => d.id === dietId);
  if (dietIndex === -1) {
    alert('Dieta não encontrada.');
    state.editingDiet = null;
    return;
  }

  const hasAny = Object.keys(state.meals).some(m => (state.meals[m] || []).length > 0);
  if (!hasAny) {
    alert('A dieta está vazia. Adicione pelo menos 1 alimento.');
    return;
  }

  for (const m of MEALS) {
    for (const item of (state.meals[m] || [])) {
      if (!item.qty || Number(item.qty) <= 0) {
        alert('Quantidade inválida em algum alimento.');
        return;
      }
    }
  }

  const backupPatient = JSON.parse(JSON.stringify(patient));
  const diet = (patient.dietas || [])[dietIndex];
  const saveBtn = document.getElementById('saveDietFloating');
  
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';
  }

  try {
    await ensureAuth();
    
    const dbMeals = convertAppMealsToDbFormat(state.meals);
    
    for (const dbMeal of dbMeals) {
      let mealId;
      const { data: existingMeal } = await supabase
        .from('meals')
        .select('id')
        .eq('diet_id', dietId)
        .eq('nome', dbMeal.nome)
        .single();
      
      if (existingMeal) {
        mealId = existingMeal.id;
        await supabase
          .from('meal_items')
          .delete()
          .eq('meal_id', mealId);
      } else {
        const { data: newMeal, error } = await supabase
          .from('meals')
          .insert([{ diet_id: dietId, nome: dbMeal.nome }])
          .select()
          .single();
        
        if (error) throw error;
        mealId = newMeal.id;
      }
      
      if (dbMeal.meal_items.length > 0) {
        const mealItems = dbMeal.meal_items.map(item => ({
          meal_id: mealId,
          food_id: item.food_id,
          quantidade_gramas: item.quantidade_gramas
        }));
        
        const { error } = await supabase
          .from('meal_items')
          .insert(mealItems);
        
        if (error) throw error;
      }
    }
    
    state.unsavedChanges = false;
    alert('Dieta salva com sucesso.');
    
  } catch (error) {
    state.patients[patientId] = backupPatient;
    state.unsavedChanges = true;
    
    console.error('ERR_SAVE_001', error);
    
    if (error && error.message && error.message.includes('Network')) {
      if (confirm('Falha de conexão. Verifique sua internet e tente novamente. Deseja tentar novamente?')) {
        saveEditingDiet();
      }
    } else {
      const code = 'ERR_SAVE_001';
      if (confirm(`Erro ao salvar. Código: ${code}. Deseja tentar novamente?`)) {
        saveEditingDiet();
      }
    }
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Salvar Dieta';
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
    alert('Nome da dieta obrigatório');
    return;
  }
  
  try {
    await ensureAuth();
    
    const { data: diet, error } = await supabase
      .from('diets')
      .insert([{
        patient_id: patientId,
        data: new Date().toISOString().split('T')[0],
        objetivo: name.trim()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    for (const mealName of MEALS) {
      await supabase
        .from('meals')
        .insert([{ diet_id: diet.id, nome: mealName }]);
    }
    
    await loadPatientDiets(patientId);
    
    console.log(`✅ Nova dieta criada: ${name}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar dieta:', error);
    alert('Erro ao criar nova dieta');
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
  const patient = state.patients[patientId];
  if (!patient) return;
  
  const diet = (patient.dietas || []).find(d => d.id === dietId);
  if (!diet) return;
  
  Object.keys(diet.meals).forEach(m => {
    state.meals[m] = (diet.meals[m] || []).map(i => ({ ...i }));
  });
  
  state.patient = { ...patient };
  const disp = document.getElementById('patientDisplay');
  
  if (disp) disp.textContent = `${patient.name} — ${diet.name}`;
  
  state.editingDiet = { patientId, dietId, dietName: diet.name };
  renderMeals();
  renderSummary();
  
  alert(`Dieta "${diet.name}" carregada para montagem e edição.`);
}

export async function saveCurrentSessionAsDiet(patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;
  
  const hasAny = Object.keys(state.meals).some(m => (state.meals[m] || []).length > 0);
  if (!hasAny) {
    alert('Sessão atual vazia — nada para salvar como dieta.');
    return;
  }
  
  const name = prompt('Nome para a nova dieta (obrigatório):');
  if (!name || !name.trim()) {
    alert('Nome da dieta obrigatório');
    return;
  }
  
  try {
    await ensureAuth();
    
    const { data: diet, error } = await supabase
      .from('diets')
      .insert([{
        patient_id: patientId,
        data: new Date().toISOString().split('T')[0],
        objetivo: name.trim()
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
    
    await loadPatientDiets(patientId);
    
    alert(`Dieta "${name}" salva no paciente ${patient.name}.`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar dieta:', error);
    alert('Erro ao salvar dieta no banco de dados');
  }
}
