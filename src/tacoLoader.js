// src/tacoLoader.js
import { state } from './state.js';
import { renderMeals } from './ui.js';
import supabase from './supabase.js'; 

export async function loadTaco(){
  try{
    // Carregar alimentos do banco
    const { data: foods, error } = await supabase
      .from('foods')
      .select('*');
    
    if (error) throw error;
    
    // Mapear alimentos para o formato esperado pela app
    foods.forEach(f => {
      state.taco[f.id] = {
        id: f.id,
        name: f.nome,
        qtd_padrao: f.qtd_padrao || 100,
        calorias: f.calorias || 0,
        proteina: f.proteina || 0,
        carboidrato: f.carboidrato || 0,
        lipidio: f.lipidio || 0,
        fibra: f.fibra_alimentar || 0,
        // Adicionar outros nutrientes se necessário
        colesterol: f.colesterol || 0,
        sodio: f.sodio || 0,
        potassio: f.potassio || 0
      };
    });
    
    renderMeals(); // initial render after data loaded
  }catch(err){
    console.error('Erro ao carregar alimentos do banco', err);
    alert('Não foi possível carregar a base de alimentos.');
  }
}

// start loading immediately
loadTaco();
