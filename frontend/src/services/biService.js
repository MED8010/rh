import apiClient from './api';

/**
 * Service pour les données analytiques (BI / Data Warehouse)
 */
const biService = {
  // Statistiques globales avec filtres
  getStats: async (filters = {}) => {
    const response = await apiClient.get('/bi/stats', { params: filters });
    return response.data;
  },

  // Tendances de présence avec filtres
  getAttendanceTrend: async (filters = {}) => {
    const response = await apiClient.get('/bi/attendance-trend', { params: filters });
    return response.data;
  },

  // Répartition et évolution de la paie avec filtres
  getPayrollEvolution: async (filters = {}) => {
    const response = await apiClient.get('/bi/payroll-evolution', { params: filters });
    return response.data;
  },

  // Données détaillées (Drill-down)
  getDrillDown: async (filters = {}) => {
    const response = await apiClient.get('/bi/drill-down', { params: filters });
    return response.data;
  },

  // Déclencher manuellement l'ETL (Admin uniquement)
  triggerETL: async () => {
    const response = await apiClient.post('/bi/etl/trigger');
    return response.data;
  }
};

export default biService;
