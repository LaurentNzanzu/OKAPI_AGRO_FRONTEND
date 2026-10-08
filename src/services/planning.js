import api from './api';

const planningService = {
  async getPlanning(dateDebut, dateFin) {
    const params = {};
    if (dateDebut) params.date_debut = dateDebut;
    if (dateFin) params.date_fin = dateFin;
    const { data } = await api.get('/planning/', { params });
    return data;
  },
  async getGantt(dateDebut, dateFin) {
    const params = {};
    if (dateDebut) params.date_debut = dateDebut;
    if (dateFin) params.date_fin = dateFin;
    const { data } = await api.get('/planning/gantt', { params });
    return data;
  },
};

export default planningService;
