import api from './api';

const BASE_URL = '/etats-financiers';

export const etatsFinanciersService = {
    getFicheStock: async () => {
        const response = await api.get(`${BASE_URL}/fiche-stock`);
        return response.data;
    },
    getEtatParc: async () => {
        const response = await api.get(`${BASE_URL}/etat-parc`);
        return response.data;
    },
    getEtatFinancier: async (exercice = null) => {
        const response = await api.get(`${BASE_URL}/etat-financier`, { params: { exercice } });
        return response.data;
    },
    getEtatSortie: async (exercice = null) => {
        const response = await api.get(`${BASE_URL}/etat-sortie`, { params: { exercice } });
        return response.data;
    }
};

export default etatsFinanciersService;
