// src/patients.js
// facade that re-exports patient-related API

export { initPatientUI, openPatientManager, selectPatient, renderPatientList, openEditPatientForm } from './patientManager.js';
export { openPatientDiets, createNewDietForPatient, saveCurrentSessionAsDiet, loadDietToSession, saveEditingDiet } from './patientDiets.js';
export { openPatientConsultations } from './consultations.js';