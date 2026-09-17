// frontend/src/services/permissions.js
import api from './api';

const permissionsService = {
  async list(params = {}) {
    const { data } = await api.get('/permissions/', { params });
    return data;
  },

  async modules() {
    const { data } = await api.get('/permissions/modules');
    return data;
  },

  async mesPermissions() {
    const { data } = await api.get('/permissions/mes-permissions');
    return data;
  },

  async listerRole(roleId) {
    const { data } = await api.get(`/permissions/role/${roleId}`);
    return data;
  },

  async get(id) {
    const { data } = await api.get(`/permissions/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/permissions/', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/permissions/${id}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/permissions/${id}`);
  },

  async attribuer(roleId, permissionIds) {
    const { data } = await api.post(`/permissions/role/${roleId}/attribuer`, {
      role_id: roleId,
      permission_ids: permissionIds,
    });
    return data;
  },

  async revoquer(roleId, permissionIds) {
    const { data } = await api.post(`/permissions/role/${roleId}/revoquer`, {
      role_id: roleId,
      permission_ids: permissionIds,
    });
    return data;
  },
};

export default permissionsService;