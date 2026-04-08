import apiClient from './api';

const datavizService = {
  getHeatmap: async () => {
    const response = await apiClient.get('/dataviz/heatmap');
    return response.data;
  },
  getTreemap: async () => {
    const response = await apiClient.get('/dataviz/treemap');
    return response.data;
  },
  getGantt: async () => {
    const response = await apiClient.get('/dataviz/gantt');
    return response.data;
  },
  getRadar: async () => {
    const response = await apiClient.get('/dataviz/radar');
    return response.data;
  },
  getTrend: async () => {
    const response = await apiClient.get('/dataviz/trend');
    return response.data;
  }
};

export default datavizService;
