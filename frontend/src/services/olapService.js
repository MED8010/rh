import apiClient from './api';

const olapService = {
  /**
   * Exécute une requête OLAP dynamique
   * @param {Object} query - { cube: 'attendance'|'salary', dimensions: [], measures: [], filters: {} }
   */
  queryCube: async (query) => {
    const response = await apiClient.post('/olap/query', query);
    return response.data;
  }
};

export default olapService;
