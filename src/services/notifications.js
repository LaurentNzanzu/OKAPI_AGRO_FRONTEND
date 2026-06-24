import api from './api';

const BASE_URL = '/notifications/';

/** Affiche les montants en USD (remplace FCFA dans les anciennes notifications). */
export const formatNotificationContent = (text) => {
  if (!text || typeof text !== 'string') return text ?? '';
  return text.replace(/\bFCFA\b/gi, 'USD');
};

/**
 * Construit les query params pour GET /notifications/
 * @param {object} options
 * @param {number} [options.limit]
 * @param {boolean|null} [options.est_lu]
 * @param {string|null} [options.priorite] information | importante | critique
 * @param {boolean} [options.include_archivees]
 */
export const buildNotificationQueryParams = ({
  limit = 100,
  est_lu = undefined,
  priorite = undefined,
  include_archivees = false,
} = {}) => {
  const params = { limit };
  if (est_lu !== undefined && est_lu !== null) {
    params.est_lu = est_lu;
  }
  if (priorite) {
    params.priorite = priorite;
  }
  if (include_archivees) {
    params.include_archivees = true;
  }
  return params;
};

export const notificationsService = {
  getAll: async (params = {}) => {
    const res = await api.get(BASE_URL, { params });
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await api.get(`${BASE_URL}/non-lues/count`);
    return res.data.count;
  },
  markAsRead: async (id) => {
    const res = await api.patch(`${BASE_URL}/${id}/lu`);
    return res.data;
  },
  markAllAsRead: async () => {
    await api.post(`${BASE_URL}/tout-marquer-lu`);
  },
  archive: async (id) => {
    const res = await api.patch(`${BASE_URL}/${id}/archiver`);
    return res.data;
  },
};

export default notificationsService;
