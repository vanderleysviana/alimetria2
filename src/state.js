// src/state.js - VERSÃO COMPLETA COM TODAS AS EXPORTAÇÕES
import supabase from './supabase.js';

export const MEALS = [
  "Café da manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar", "Ceia"
];

// Estado global da aplicação
export const state = {
  // Autenticação
  currentUser: null,
  isAuthenticated: false,
  
  // Dados principais
  taco: {},
  patients: {},
  consultations: {},
  
  // Sessão atual
  currentPatient: null,
  currentDiet: null,
  currentConsultation: null,
  
  // UI State
  unsavedChanges: false,
  loading: false,
  
  // Dados de trabalho atual
  meals: {}
};

// Inicializar refeições
MEALS.forEach(m => state.meals[m] = []);

// Utilidades
export function formatNumber(n, digits = 1) {
  return Number.isFinite(n) ? Number(n.toFixed(digits)) : 0;
}

export function calcScaled(nPer100, qty) {
  return (nPer100 * qty) / 100;
}

export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

// Carregar pacientes do Supabase
export async function loadPatientsFromDB() {
  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    
    state.patients = {};
    patients.forEach(p => {
      state.patients[p.id] = {
        ...p,
        idade: calcularIdade(p.data_nascimento),
        dietCount: 0,
        consultationCount: 0,
        lastConsultation: null
      };
    });
    
    console.log(`✅ ${patients.length} pacientes carregados`);
    return patients.length;
    
  } catch (error) {
    console.error('❌ Erro ao carregar pacientes:', error);
    return 0;
  }
}

// Carregar consultas recentes
export async function loadRecentConsultations(days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select(`
        *,
        patients (nome, genero)
      `)
      .gte('data_horario', startDate.toISOString())
      .order('data_horario', { ascending: true });
    
    if (error) throw error;
    
    state.recentConsultations = consultations || [];
    return consultations;
    
  } catch (error) {
    console.error('❌ Erro ao carregar consultas:', error);
    return [];
  }
}

// Carregar estatísticas
export async function loadStats() {
  try {
    // Contar pacientes
    const { count: patientCount, error: patientError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    // Contar consultas hoje
    const today = new Date().toISOString().split('T')[0];
    const { count: todayConsultations, error: todayError } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .gte('data_horario', `${today}T00:00:00`)
      .lte('data_horario', `${today}T23:59:59`);
    
    // Contar dietas
    const { count: dietCount, error: dietError } = await supabase
      .from('diets')
      .select('*', { count: 'exact', head: true });
    
    if (patientError || todayError || dietError) {
      throw new Error('Erro ao carregar estatísticas');
    }
    
    return {
      patientCount: patientCount || 0,
      todayConsultations: todayConsultations || 0,
      dietCount: dietCount || 0
    };
    
  } catch (error) {
    console.error('❌ Erro ao carregar estatísticas:', error);
    return { patientCount: 0, todayConsultations: 0, dietCount: 0 };
  }
}

// Selecionar paciente
export function selectPatient(patientId) {
  const patient = state.patients[patientId];
  if (!patient) {
    console.error('Paciente não encontrado:', patientId);
    return false;
  }
  
  state.currentPatient = { ...patient };
  
  // Carregar dados adicionais do paciente
  loadPatientDetails(patientId);
  
  console.log('✅ Paciente selecionado:', patient.nome);
  return true;
}

// Carregar detalhes do paciente
async function loadPatientDetails(patientId) {
  try {
    // Carregar contagem de dietas
    const { count: dietCount, error: dietError } = await supabase
      .from('diets')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);
    
    // Carregar contagem de consultas
    const { count: consultationCount, error: consultationError } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId);
    
    // Carregar última consulta
    const { data: lastConsultation, error: lastError } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('data_horario', { ascending: false })
      .limit(1)
      .single();
    
    if (!dietError && !consultationError) {
      state.patients[patientId].dietCount = dietCount || 0;
      state.patients[patientId].consultationCount = consultationCount || 0;
      state.patients[patientId].lastConsultation = lastConsultation;
      
      // Atualizar paciente atual se estiver selecionado
      if (state.currentPatient && state.currentPatient.id === patientId) {
        state.currentPatient.dietCount = dietCount || 0;
        state.currentPatient.consultationCount = consultationCount || 0;
        state.currentPatient.lastConsultation = lastConsultation;
      }
    }
    
  } catch (error) {
    console.error('Erro ao carregar detalhes do paciente:', error);
  }
}

// Limpar seleção atual
export function clearCurrentPatient() {
  state.currentPatient = null;
  state.currentDiet = null;
  MEALS.forEach(m => state.meals[m] = []);
  state.unsavedChanges = false;
}

// Inicialização
export async function initializeApp() {
  state.loading = true;
  
  try {
    await Promise.all([
      loadPatientsFromDB(),
      loadRecentConsultations(),
      loadStats()
    ]);
    
    console.log('✅ Aplicação inicializada com sucesso');
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
  } finally {
    state.loading = false;
  }
}

// Converter formato da app para estrutura do banco - FUNÇÃO ADICIONADA
export function convertAppMealsToDbFormat(appMeals) {
  const dbMeals = [];
  
  Object.keys(appMeals).forEach(mealName => {
    if (appMeals[mealName].length > 0) {
      dbMeals.push({
        nome: mealName,
        meal_items: appMeals[mealName].map(item => ({
          food_id: item.id,
          quantidade_gramas: item.qty
        }))
      });
    }
  });
  
  return dbMeals;
}

// Carregar dietas de um paciente
export async function loadPatientDiets(patientId) {
  try {
    const { data: diets, error } = await supabase
      .from('diets')
      .select(`
        *,
        meals (
          id,
          nome,
          meal_items (
            id,
            quantidade_gramas,
            foods (*)
          )
        )
      `)
      .eq('patient_id', patientId)
      .order('data', { ascending: false });
    
    if (error) throw error;
    
    const patient = state.patients[patientId];
    if (patient) {
      patient.dietas = diets.map(diet => ({
        id: diet.id,
        name: `Dieta ${new Date(diet.data).toLocaleDateString()}`,
        objetivo: diet.objetivo,
        createdAt: diet.data,
        meals: convertDbMealsToAppFormat(diet.meals)
      }));
    }
    
    console.log(`✅ ${diets.length} dietas carregadas para paciente ${patientId}`);
    
  } catch (error) {
    console.error('❌ Erro ao carregar dietas:', error);
    // loadMockDiets(patientId);
  }
}

// Converter estrutura do banco para formato da app
function convertDbMealsToAppFormat(dbMeals) {
  const appMeals = {};
  MEALS.forEach(m => appMeals[m] = []);
  
  dbMeals?.forEach(meal => {
    const mealName = meal.nome;
    if (MEALS.includes(mealName)) {
      appMeals[mealName] = meal.meal_items.map(item => ({
        id: item.foods.id,
        qty: item.quantidade_gramas,
        foodData: item.foods
      }));
    }
  });
  
  return appMeals;
}

// Carregar consultas de um paciente
export async function loadPatientConsultations(patientId) {
  try {
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select(`
        *,
        anamneses (*),
        anthropometry (*),
        plans (*),
        guidelines (*),
        manipulados (*)
      `)
      .eq('patient_id', patientId)
      .order('data_horario', { ascending: false });
    
    if (error) throw error;
    
    if (!state.consultations) state.consultations = {};
    state.consultations[patientId] = consultations;
    
    const patient = state.patients[patientId];
    if (patient) {
      patient.consultas = consultations;
    }
    
    console.log(`✅ ${consultations.length} consultas carregadas para paciente ${patientId}`);
    
  } catch (error) {
    console.error('❌ Erro ao carregar consultas:', error);
  }
}
