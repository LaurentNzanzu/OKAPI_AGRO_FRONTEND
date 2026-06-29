import api from './api';

const BASE_URL = '/pieces-justificatives';

export const piecesJustificativesService = {
    getByTransaction: async (type, id) => {
        const response = await api.get(`${BASE_URL}/transaction/${type}/${id}`);
        return response.data;
    },
    getById: async (pieceId) => {
        const response = await api.get(`${BASE_URL}/${pieceId}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post(BASE_URL, data);
        return response.data;
    },
    valider: async (pieceId, decision, motif = null) => {
        const response = await api.post(`${BASE_URL}/${pieceId}/valider`, { decision, motif });
        return response.data;
    },
    signer: async (pieceId, signature) => {
        const response = await api.post(`${BASE_URL}/${pieceId}/signer`, { signature });
        return response.data;
    }
};

export default piecesJustificativesService;
