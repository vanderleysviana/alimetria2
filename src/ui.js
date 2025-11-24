// src/ui.js - VERSÃO COMPLETA COM EXPORTAÇÕES CORRIGIDAS
import { state, MEALS, formatNumber, calcScaled } from './state.js';
import { openAddFoodModal } from './modals.js';
import { savePatientToPdfContext } from './pdf.js';
import { saveCurrentSessionAsDiet, saveEditingDiet } from './patientDiets.js';

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

// Render / UI helpers
export function createMealCard(mealName){
  const card = document.createElement('div'); 
  card.className = 'meal-card';
  const header = document.createElement('div'); 
  header.className='meal-header';
  const title = document.createElement('strong'); 
  title.textContent=mealName;
  const btns = document.createElement('div');
  const addBtn = document.createElement('button'); 
  addBtn.className='btn btn-primary'; 
  addBtn.innerHTML = '+ alimento';
  addBtn.onclick = ()=> openAddFoodModal(mealName);
  btns.appendChild(addBtn);
  header.appendChild(title); 
  header.appendChild(btns);
  const list = document.createElement('div'); 
  list.className='food-list'; 
  list.id = `list-${mealName}`;
  const totals = document.createElement('div'); 
  totals.className='totals'; 
  totals.id=`totals-${mealName}`;
  card.appendChild(header); 
  card.appendChild(list); 
  card.appendChild(totals);
  return card;
}

export function renderMeals(){
  const container = document.getElementById('mealsContainer');
  
  // Verificar se o container existe (aplicação principal carregada)
  if (!container) {
    console.log('⏳ Aplicação ainda não carregou, aguardando...');
    return;
  }

  container.innerHTML='';

  // Determine if we are allowed to edit: allow when a patient is selected
  const canEdit = !!state.currentPatient;

  if(!canEdit){
    const empty = document.createElement('div');
    empty.style.padding='24px';
    empty.style.textAlign='center';
    empty.style.color='#334155';
    empty.style.fontSize='15px';
    empty.textContent = 'Selecione um paciente para começar a montar dietas.';
    container.appendChild(empty);
    // hide FAB if present
    const fab = document.getElementById('saveDietFloating'); 
    if(fab) fab.style.display='none';
    return;
  }

  // show header info inside page for clarity when editing
  const headerInfo = document.createElement('div');
  headerInfo.style.display='flex';
  headerInfo.style.justifyContent='space-between';
  headerInfo.style.alignItems='center';
  headerInfo.style.marginBottom='8px';
  const left = document.createElement('div');
  left.innerHTML = `<strong style="color:var(--dark)">${state.currentPatient?.nome || 'Paciente'}</strong><div style="font-size:12px;color:#334155">${state.currentDiet ? `Editando: ${state.currentDiet.name||''}` : 'Nova dieta'}</div>`;
  headerInfo.appendChild(left);
  const right = document.createElement('div'); 
  right.className='controls';
  headerInfo.appendChild(right);
  container.appendChild(headerInfo);

  MEALS.forEach(m=>{
    const card = createMealCard(m);
    container.appendChild(card);
    renderMealList(m);
  });
  renderSummary();
}

export function renderMealList(mealName){
  const list = document.getElementById(`list-${mealName}`);
  if (!list) return; // Verificar se o elemento existe
  
  list.innerHTML=''; 
  const foods = state.meals[mealName] || [];
  
  if (foods.length === 0) {
    list.innerHTML = `
      <div class="empty-meal">
        <div class="empty-icon">🥗</div>
        <p>Nenhum alimento adicionado</p>
        <button class="btn btn-sm btn-outline" onclick="openAddFoodModal('${mealName}')">
          Adicionar primeiro alimento
        </button>
      </div>
    `;
    return;
  }
  
  foods.forEach(item=>{
    const food = state.taco[item.id] || { name: 'Desconhecido', calorias:0, proteina:0, carboidrato:0, lipidio:0, fibra:0 };
    const row = document.createElement('div'); 
    row.className='food-item';
    const left = document.createElement('div'); 
    left.innerHTML = `<div style="font-weight:600;color:var(--dark)">${food.name}</div><div style="font-size:12px;color:#334155">${item.qty} g</div>`;
    const right = document.createElement('div'); 
    right.style.display='flex'; 
    right.style.gap='8px'; 
    right.style.alignItems='center';
    const nutrDiv = document.createElement('div'); 
    nutrDiv.style.fontSize='12px'; 
    nutrDiv.style.color='#0f172a';
    nutrDiv.innerHTML = `Kcal ${formatNumber(calcScaled(food.calorias, item.qty),0)} • P ${formatNumber(calcScaled(food.proteina, item.qty))}g • C ${formatNumber(calcScaled(food.carboidrato, item.qty))}g • L ${formatNumber(calcScaled(food.lipidio, item.qty))}g`;
    const del = document.createElement('button'); 
    del.className='btn btn-danger btn-sm'; 
    del.textContent='Remover';
    del.onclick = ()=>{ 
      state.meals[mealName] = state.meals[mealName].filter(i=>i!==item); 
      state.unsavedChanges = true; 
      renderMealList(mealName); 
      renderSummary(); 
    };
    right.appendChild(nutrDiv); 
    right.appendChild(del);
    row.appendChild(left); 
    row.appendChild(right);
    list.appendChild(row);
  });
  
  const totalsEl = document.getElementById(`totals-${mealName}`);
  if (totalsEl) {
    totalsEl.innerHTML=''; 
    const sum = aggregateMeal(mealName);
    totalsEl.innerHTML = `<div style="font-weight:600;color:#063970">Totais: Kcal ${formatNumber(sum.calorias,0)} • P ${formatNumber(sum.proteina)}g • C ${formatNumber(sum.carboidrato)}g • L ${formatNumber(sum.lipidio)}g • Fib ${formatNumber(sum.fibra)}g</div>`;
  }
}

export function aggregateMeal(mealName){
  const foods = state.meals[mealName] || [];
  const total = {calorias:0,proteina:0,carboidrato:0,lipidio:0,fibra:0};
  foods.forEach(item=>{
    const f = state.taco[item.id] || {};
    total.calorias += calcScaled(f.calorias||0, item.qty);
    total.proteina += calcScaled(f.proteina||0, item.qty);
    total.carboidrato += calcScaled(f.carboidrato||0, item.qty);
    total.lipidio += calcScaled(f.lipidio||0, item.qty);
    total.fibra += calcScaled(f.fibra||0, item.qty || 0);
    Object.keys(f).forEach(k=>{
      if(!['id','name','calorias','proteina','carboidrato','lipidio','fibra'].includes(k)){
        if(typeof f[k] === 'number'){
          total[k] = (total[k] || 0) + calcScaled(f[k], item.qty);
        }
      }
    });
  });
  return total;
}

export function aggregateAll(){
  const total = {calorias:0,proteina:0,carboidrato:0,lipidio:0,fibra:0};
  MEALS.forEach(m=>{
    const t = aggregateMeal(m);
    Object.keys(t).forEach(k=> total[k] = (total[k]||0) + t[k]);
  });
  return total;
}

export function renderSummary(){
  const details = document.getElementById('summaryDetails');
  const alerts = document.getElementById('alerts');
  
  // Verificar se os elementos existem
  if (!details || !alerts) return;
  
  const sum = aggregateAll();
  details.innerHTML = `
    <div style="min-width:140px"><strong>Calorias</strong><div style="font-size:16px;color:var(--dark)">${formatNumber(sum.calorias,0)} kcal</div></div>
    <div style="min-width:120px"><strong>Proteínas</strong><div style="font-size:16px;color:#063970">${formatNumber(sum.proteina)} g</div></div>
    <div style="min-width:120px"><strong>Carboidratos</strong><div style="font-size:16px;color:#063970">${formatNumber(sum.carboidrato)} g</div></div>
    <div style="min-width:120px"><strong>Lipídios</strong><div style="font-size:16px;color:#063970">${formatNumber(sum.lipidio)} g</div></div>
    <div style="min-width:120px"><strong>Fibras</strong><div style="font-size:16px;color:#063970">${formatNumber(sum.fibra)} g</div></div>
  `;

  // floating Save Diet button (visible only when editingDiet is set)
  let floating = document.getElementById('saveDietFloating');
  if(!floating){
    floating = document.createElement('button');
    floating.id = 'saveDietFloating';
    floating.textContent = 'Salvar Dieta';
    floating.className = 'btn btn-success';
    floating.onclick = ()=> saveEditingDiet();
    document.body.appendChild(floating);
  }
  if(state.currentPatient){
    floating.style.display = 'inline-block';
  }else{
    floating.style.display = 'none';
  }

  // save session button (when a patient is selected and not editing an existing diet)
  const controls = document.querySelector('.summary .controls') || document.querySelector('.controls');
  if(controls){
    let saveSessionMain = document.getElementById('saveSessionMainBtn');
    if(!saveSessionMain){
      saveSessionMain = document.createElement('button');
      saveSessionMain.id = 'saveSessionMainBtn';
      saveSessionMain.className = 'btn btn-success';
      saveSessionMain.style.marginRight = '8px';
      saveSessionMain.textContent = '💾 Salvar sessão atual como dieta';
      saveSessionMain.onclick = ()=>{
        if(!state.currentPatient || !state.currentPatient.id){
          alert('Selecione primeiro um paciente para salvar a sessão como dieta.');
          return;
        }
        saveCurrentSessionAsDiet(state.currentPatient.id);
        renderSummary();
      };
      controls.insertBefore(saveSessionMain, controls.firstChild);
    }
    if(state.currentPatient && state.currentPatient.id && !state.currentDiet){
      saveSessionMain.style.display = 'inline-block';
    }else{
      saveSessionMain.style.display = 'none';
    }
  }

  alerts.innerHTML=''; 
  if(sum.proteina < 50) addAlert('Baixa ingestão de proteínas.');
  if(sum.carboidrato > 350) addAlert('Excesso de carboidratos.');
  if(sum.calorias > 3000) addAlert('Calorias acima do recomendado.');
  if(sum.fibra < 25) addAlert('Fibras insuficientes.');
  MEALS.forEach(m=>{
    if((state.meals[m] || []).length===0) addAlert(`Refeição vazia: ${m}`);
  });
  
  function addAlert(text){
    const a = document.createElement('div'); 
    a.className='alert alert-warning'; 
    a.textContent=text;
    alerts.appendChild(a);
  }
}

// wire some global buttons and initial render - AGORA CONTROLADO PELO APP PRINCIPAL
export function initUI() {
  console.log('🎨 Inicializando UI...');
  
  const exportBtn = document.getElementById('exportPdfBtn');
  if(exportBtn) exportBtn.addEventListener('click', savePatientToPdfContext);
  
  const clearBtn = document.getElementById('clearBtn');
  if(clearBtn) clearBtn.addEventListener('click', ()=>{
    if(!confirm('Limpar todas as refeições?')) return;
    MEALS.forEach(m=> state.meals[m]=[]);
    state.unsavedChanges = true;
    renderMeals();
  });

  // state header updater (keeps header consistent)
  setInterval(()=>{
    const obs = document.getElementById('patientDisplay');
    if(!obs) return;
    if(state.unsavedChanges){
      if(!obs.textContent.includes(' • Alterações não salvas')) obs.textContent = (state.currentPatient?.nome? `${state.currentPatient.nome} — ${state.currentDiet ? state.currentDiet.name||'' : ''}`.trim() : '— nenhum paciente selecionado —') + ' • Alterações não salvas';
    }else{
      if(state.currentPatient && state.currentPatient.nome){
        obs.textContent = state.currentDiet ? `${state.currentPatient.nome} — ${state.currentDiet.name||''}` : `${state.currentPatient.nome} — ${state.currentPatient.objetivo||''}`;
      }else{
        obs.textContent = '— nenhum paciente selecionado —';
      }
    }
  },500);

  // Renderizar inicialmente
  renderMeals();
  
  console.log('✅ UI inicializada com sucesso');
}

// Adicionar funções globais para uso em eventos
window.openAddFoodModal = openAddFoodModal;
