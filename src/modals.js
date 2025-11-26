// src/modals.js - VERSÃO CORRIGIDA COM SALVAMENTO NO BANCO
import { state } from './state.js';
import { renderMealList, renderMeals } from './ui.js';
import { generateId } from './idGenerator.js';
import supabase, { ensureAuth } from './supabase.js';

export function openAddFoodModal(mealName){
  if(!state.currentPatient){
    alert('Selecione um paciente para começar.');
    return;
  }
  
  const modalRoot = document.getElementById('modalRoot');
  modalRoot.innerHTML = '';
  
  const backdrop = document.createElement('div'); 
  backdrop.className='modal-backdrop';
  
  const modal = document.createElement('div'); 
  modal.className='modal';
  modal.style.maxWidth = '600px';
  
  const title = document.createElement('h3'); 
  title.textContent = `Adicionar alimento — ${mealName}`;
  title.style.color = '#1e40af';
  title.style.marginBottom = '20px';
  
  const fieldSel = document.createElement('div'); 
  fieldSel.className='field';
  
  const selLabel = document.createElement('label'); 
  selLabel.textContent='Selecionar alimento (TACO)';
  selLabel.style.fontWeight = '600';
  selLabel.style.marginBottom = '8px';
  selLabel.style.display = 'block';
  
  const select = document.createElement('select');
  select.style.padding='12px'; 
  select.style.borderRadius='8px';
  select.style.width = '100%';
  select.style.border = '2px solid #e2e8f0';
  select.style.fontSize = '14px';
  
  const tacoList = Object.values(state.taco).sort((a,b)=>a.name.localeCompare(b.name));
  const blankOpt = document.createElement('option'); 
  blankOpt.value=''; 
  blankOpt.textContent='-- selecione um alimento --';
  select.appendChild(blankOpt);
  
  tacoList.forEach(f=>{ 
    const o=document.createElement('option'); 
    o.value=f.id; 
    o.textContent = f.name; 
    select.appendChild(o); 
  });
  
  fieldSel.appendChild(selLabel); 
  fieldSel.appendChild(select);
  
  const fieldQty = document.createElement('div'); 
  fieldQty.className='field';
  fieldQty.style.marginTop = '16px';
  
  const qtyLabel = document.createElement('label'); 
  qtyLabel.textContent='Quantidade (g)';
  qtyLabel.style.fontWeight = '600';
  qtyLabel.style.marginBottom = '8px';
  qtyLabel.style.display = 'block';
  
  const qtyInput = document.createElement('input'); 
  qtyInput.type='number'; 
  qtyInput.value=100; 
  qtyInput.min=1;
  qtyInput.step = '1';
  qtyInput.style.width = '100%';
  qtyInput.style.padding = '12px';
  qtyInput.style.borderRadius = '8px';
  qtyInput.style.border = '2px solid #e2e8f0';
  qtyInput.style.fontSize = '14px';
  
  fieldQty.appendChild(qtyLabel); 
  fieldQty.appendChild(qtyInput);

  // Preview de nutrientes
  const previewDiv = document.createElement('div');
  previewDiv.id = 'nutrientPreview';
  previewDiv.style.background = '#f0f9ff';
  previewDiv.style.padding = '16px';
  previewDiv.style.borderRadius = '8px';
  previewDiv.style.marginTop = '16px';
  previewDiv.style.display = 'none';
  previewDiv.style.fontSize = '13px';
  previewDiv.style.border = '1px solid #bae6fd';
  previewDiv.innerHTML = '<strong style="color:#0369a1">📊 Informações nutricionais (por 100g):</strong><div id="previewContent" style="margin-top:8px;"></div>';
  
  fieldSel.appendChild(previewDiv);
  
  const notFoundBtn = document.createElement('button'); 
  notFoundBtn.className='btn btn-outline'; 
  notFoundBtn.textContent='➕ Cadastrar novo alimento';
  notFoundBtn.style.marginTop = '12px';
  notFoundBtn.style.width = '100%';
  
  notFoundBtn.onclick = (e)=>{
    e.preventDefault();
    backdrop.remove();
    openRegisterFoodModal(mealName, qtyInput.value || 100);
  };
  
  const actions = document.createElement('div'); 
  actions.style.display='flex'; 
  actions.style.justifyContent='flex-end'; 
  actions.style.gap='12px';
  actions.style.marginTop = '24px';
  actions.style.paddingTop = '20px';
  actions.style.borderTop = '1px solid #e2e8f0';
  
  const cancel = document.createElement('button'); 
  cancel.className='btn'; 
  cancel.style.background='#94a3b8'; 
  cancel.textContent='Cancelar';
  cancel.onclick = ()=> backdrop.remove();
  
  const add = document.createElement('button'); 
  add.className='btn btn-success'; 
  add.textContent='Adicionar à refeição';
  add.style.padding = '12px 24px';
  
  add.onclick = ()=>{
    const id = select.value;
    const qty = Number(qtyInput.value) || 100;
    
    if(!id){
      alert('Selecione um alimento da TACO ou cadastre um novo.');
      return;
    }
    
    // Verificar se o alimento existe na TACO
    const food = state.taco[id];
    if (!food) {
      alert('Alimento não encontrado na base de dados.');
      return;
    }
    
    console.log('➕ Adicionando alimento:', food.name, 'Quantidade:', qty, 'Refeição:', mealName);
    
    // Garantir que o array da refeição existe
    if (!state.meals[mealName]) {
      state.meals[mealName] = [];
    }
    
    // Verificar se já existe o mesmo alimento
    const existingIndex = state.meals[mealName].findIndex(x => x.id === id);
    
    if(existingIndex !== -1){
      if(!confirm(`"${food.name}" já existe nesta refeição. Deseja somar as quantidades?`)) return;
      state.meals[mealName][existingIndex].qty = Number(state.meals[mealName][existingIndex].qty || 0) + qty;
      console.log('🔢 Quantidade atualizada:', state.meals[mealName][existingIndex].qty);
    }else{
      state.meals[mealName].push({id, qty});
      console.log('✅ Novo alimento adicionado');
    }
    
    state.unsavedChanges = true;
    backdrop.remove(); 
    
    // Forçar re-renderização
    renderMealList(mealName);
    renderSummary();
    
    console.log('📋 Estado atual das refeições:', state.meals);
  };
  
  actions.appendChild(notFoundBtn); 
  actions.appendChild(cancel); 
  actions.appendChild(add);
  
  modal.appendChild(title); 
  modal.appendChild(fieldSel); 
  modal.appendChild(fieldQty); 
  modal.appendChild(actions);
  
  backdrop.appendChild(modal); 
  modalRoot.appendChild(backdrop);
  
  // Evento para mostrar preview de nutrientes
  select.addEventListener('change', function() {
    const foodId = this.value;
    const previewContent = document.getElementById('previewContent');
    const previewDiv = document.getElementById('nutrientPreview');
    
    if (foodId && state.taco[foodId]) {
      const food = state.taco[foodId];
      previewDiv.style.display = 'block';
      
      previewContent.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div><strong>Calorias:</strong> ${food.calorias || 0} kcal</div>
          <div><strong>Proteínas:</strong> ${food.proteina || 0}g</div>
          <div><strong>Lipídios:</strong> ${food.lipidio || 0}g</div>
          <div><strong>Carboidratos:</strong> ${food.carboidrato || 0}g</div>
          <div><strong>Fibras:</strong> ${food.fibra || food.fibra_alimentar || 0}g</div>
          <div><strong>Colesterol:</strong> ${food.colesterol || 0}mg</div>
          ${food.sodio ? `<div><strong>Sódio:</strong> ${food.sodio}mg</div>` : ''}
          ${food.potassio ? `<div><strong>Potássio:</strong> ${food.potassio}mg</div>` : ''}
        </div>
      `;
    } else {
      previewDiv.style.display = 'none';
    }
  });
}

export async function openRegisterFoodModal(mealName, defaultQty=100){
  const modalRoot = document.getElementById('modalRoot');
  modalRoot.innerHTML = '';
  
  const backdrop = document.createElement('div'); 
  backdrop.className='modal-backdrop';
  
  const modal = document.createElement('div'); 
  modal.className='modal';
  modal.style.maxWidth = '600px';
  
  const title = document.createElement('h3'); 
  title.textContent = `📝 Cadastrar novo alimento`;
  title.style.color = '#1e40af';
  title.style.marginBottom = '20px';
  
  const makeField = (labelText, id, type='number', defaultVal='')=>{
    const f=document.createElement('div'); 
    f.className='field';
    f.style.marginBottom = '16px';
    
    const l=document.createElement('label'); 
    l.textContent=labelText;
    l.style.fontWeight = '600';
    l.style.marginBottom = '8px';
    l.style.display = 'block';
    
    let inp;
    if(type==='textarea'){ 
      inp=document.createElement('textarea'); 
      inp.rows=3; 
    } else { 
      inp=document.createElement('input'); 
      inp.type=type; 
    }
    
    inp.id=id; 
    inp.value = defaultVal;
    inp.style.width = '100%';
    inp.style.padding = '12px';
    inp.style.borderRadius = '8px';
    inp.style.border = '2px solid #e2e8f0';
    inp.style.fontSize = '14px';
    
    f.appendChild(l); 
    f.appendChild(inp);
    
    return {el:f,input:inp};
  };
  
  const fName = makeField('Nome do alimento *','nf_name','text','');
  const fQty = makeField('Quantidade padrão (g)','nf_qty','number',defaultQty);
  const fKcal = makeField('Calorias (kcal/100g) *','nf_kcal','number','');
  const fProt = makeField('Proteínas (g/100g)','nf_prot','number','');
  const fCarb = makeField('Carboidratos (g/100g)','nf_carb','number','');
  const fLip = makeField('Lipídios (g/100g)','nf_lip','number','');
  const fFib = makeField('Fibras (g/100g)','nf_fib','number','');
  const fCol = makeField('Colesterol (mg/100g)','nf_col','number','');
  const fSod = makeField('Sódio (mg/100g)','nf_sod','number','');
  
  modal.appendChild(title);
  [fName,fQty,fKcal,fProt,fCarb,fLip,fFib,fCol,fSod].forEach(f=>modal.appendChild(f.el));
  
  const actions = document.createElement('div'); 
  actions.style.display='flex';
  actions.style.justifyContent='flex-end';
  actions.style.gap='12px';
  actions.style.marginTop = '24px';
  actions.style.paddingTop = '20px';
  actions.style.borderTop = '1px solid #e2e8f0';
  
  const cancel = document.createElement('button'); 
  cancel.className='btn'; 
  cancel.style.background='#94a3b8'; 
  cancel.textContent='Cancelar';
  cancel.onclick=()=>backdrop.remove();
  
  const save = document.createElement('button'); 
  save.className='btn btn-success'; 
  save.textContent='💾 Salvar e adicionar';
  save.style.padding = '12px 24px';
  
  save.onclick = async ()=>{
    const name = fName.input.value.trim();
    if(!name){ 
      alert('Nome do alimento é obrigatório'); 
      return; 
    }
    
    if(!fKcal.input.value){ 
      alert('Calorias são obrigatórias'); 
      return; 
    }

    try {
      await ensureAuth();
      
      // Preparar dados para salvar no banco
      const foodData = {
        nome: name,
        qtd_padrao: Number(fQty.input.value) || 100,
        calorias: Number(fKcal.input.value) || 0,
        proteina: Number(fProt.input.value) || 0,
        carboidrato: Number(fCarb.input.value) || 0,
        lipidio: Number(fLip.input.value) || 0,
        fibra_alimentar: Number(fFib.input.value) || 0,
        colesterol: Number(fCol.input.value) || 0,
        sodio: Number(fSod.input.value) || 0,
        criado_em: new Date().toISOString()
      };

      console.log('💾 Salvando alimento no banco:', foodData);

      // Salvar no Supabase
      const { data, error } = await supabase
        .from('foods')
        .insert([foodData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar alimento:', error);
        throw error;
      }

      console.log('✅ Alimento salvo no banco:', data);

      // Adicionar ao state.taco com o ID do banco
      const newFood = {
        id: data.id,
        name: data.nome,
        qtd_padrao: data.qtd_padrao,
        calorias: data.calorias,
        proteina: data.proteina,
        carboidrato: data.carboidrato,
        lipidio: data.lipidio,
        fibra: data.fibra_alimentar,
        colesterol: data.colesterol,
        sodio: data.sodio
      };

      state.taco[data.id] = newFood;
      
      // Adicionar à refeição atual
      if (!state.meals[mealName]) {
        state.meals[mealName] = [];
      }
      state.meals[mealName].push({
        id: data.id, 
        qty: Number(fQty.input.value) || defaultQty
      });
      
      state.unsavedChanges = true;
      backdrop.remove(); 
      
      // Forçar re-renderização
      renderMeals();
      
      alert(`✅ "${name}" cadastrado com sucesso e adicionado à refeição!`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar alimento:', error);
      alert('Erro ao salvar alimento no banco de dados: ' + error.message);
    }
  };
  
  actions.appendChild(cancel); 
  actions.appendChild(save);
  modal.appendChild(actions);
  
  backdrop.appendChild(modal); 
  modalRoot.appendChild(backdrop);
}

// Adicionar função global para uso em eventos
window.openRegisterFoodModal = openRegisterFoodModal;
