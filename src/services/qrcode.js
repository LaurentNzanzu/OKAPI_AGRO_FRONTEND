import api from './api';

export const qrcodeService = {
  getView: (bienId) => api.get(`/qr-code/${bienId}/view`),

  download: (bienId) =>
    api.get(`/qr-code/${bienId}/download`, { responseType: 'blob' }),

  scan: (qrData) => api.post('/qr-code/scan', { qr_data: qrData }),
};

export default qrcodeService;
