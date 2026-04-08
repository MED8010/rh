import apiClient from './api';

/**
 * Service pour les prédictions et l'intelligence artificielle (ML)
 */
const mlService = {
  // Prévision de la masse salariale (12 mois)
  getPayrollForecast: async () => {
    const response = await apiClient.get('/ml/forecast/payroll');
    return response.data;
  },

  // Analyse et prévision de l'absentéisme
  getAbsenteeismForecast: async () => {
    const response = await apiClient.get('/ml/forecast/absences');
    return response.data;
  },

  // Scoring du risque de turnover par employé
  getTurnoverRisk: async () => {
    const response = await apiClient.get('/ml/risk/turnover');
    return response.data;
  },

  // Détection d'anomalies (Data Profiling)
  getAnomalies: async () => {
    const response = await apiClient.get('/ml/risk/anomalies');
    return response.data;
  }
};

export default mlService;
