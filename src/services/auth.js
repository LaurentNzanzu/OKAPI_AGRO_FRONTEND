// frontend/src/services/auth.js
import api from './api';

const normalizeRoles = (userData) => {
  if (!userData) return [];

  let roles = [];

  if (Array.isArray(userData.roles)) {
    roles = userData.roles;
  } else if (typeof userData.roles === 'string') {
    roles = [userData.roles];
  } else if (userData.role && typeof userData.role === 'object' && userData.role.nom) {
    roles = [userData.role.nom];
  } else if (typeof userData.role === 'string') {
    roles = [userData.role];
  } else if (userData.role_nom) {
    roles = [userData.role_nom];
  }

  return roles.map((r) => String(r).trim().toUpperCase());
};

const authService = {
  login: async (email, mot_de_passe) => {
    try {
      const response = await api.post('/auth/login', { email, mot_de_passe });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de connexion',
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Erreur logout:', error);
      }
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      const normalizedUser = {
        ...response.data,
        roles: normalizeRoles(response.data),
        permissions: response.data.permissions || [],
      };
      return { success: true, data: normalizedUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de récupération',
      };
    }
  },

  isAuthenticated: async () => {
    try {
      await api.get('/auth/me');
      return true;
    } catch {
      return false;
    }
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetToken: async (token) => {
    const response = await api.get(`/auth/verify-token/${token}`);
    return response.data;
  },

  resetPassword: async (token, nouveau_mot_de_passe) => {
    const response = await api.post('/auth/reset-password', { token, nouveau_mot_de_passe });
    return response.data;
  },
};

export default authService;
