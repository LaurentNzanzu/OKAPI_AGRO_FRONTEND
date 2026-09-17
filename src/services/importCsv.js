// frontend/src/services/importCsv.js
import api from './api';

const importCsvService = {
  async upload(typeEntite, file) {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/import/csv/${typeEntite}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export default importCsvService;