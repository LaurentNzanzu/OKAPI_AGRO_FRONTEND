// frontend/src/services/auth.js
import api from './api';

// === TOKEN STORAGE ===
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  SESSION_UUID: 'session_uuid',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  USER_DATA: 'user_data',
};

// === GÉNÉRATION DU FINGERPRINT ===
const generateFingerprint = () => {
  try {
    const components = [
      navigator.userAgent,
      `${screen.width}x${screen.height}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      navigator.language || 'unknown',
      navigator.hardwareConcurrency || 'unknown',
    ];
    
    const raw = components.join('|');
    // Hash simple (pas besoin de crypto fort, c'est juste pour l'identification)
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32-bit
    }
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.warn('Erreur génération fingerprint:', error);
    return 'default_fingerprint';
  }
};

// Fingerprint unique pour cette session d'onglet
const FINGERPRINT = generateFingerprint();

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
  // === FINGERPRINT ===
  getFingerprint: () => FINGERPRINT,

  // === STOCKAGE ===
  
  setTokens(accessToken, sessionUuid, expiresIn) {
    try {
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      sessionStorage.setItem(STORAGE_KEYS.SESSION_UUID, sessionUuid);
      
      // Calcul de la date d'expiration
      if (expiresIn) {
        const expiresAt = Date.now() + (expiresIn * 1000);
        sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
      }
    } catch (error) {
      console.error('Erreur lors du stockage des tokens:', error);
    }
  },

  setUser(userData) {
    try {
      sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Erreur lors du stockage de l\'utilisateur:', error);
    }
  },

  getUser() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  },

  getAccessToken() {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      return null;
    }
  },

  getSessionUuid() {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.SESSION_UUID);
    } catch (error) {
      return null;
    }
  },

  getTokenExpiresAt() {
    try {
      const expiresAt = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      return expiresAt ? parseInt(expiresAt, 10) : null;
    } catch (error) {
      return null;
    }
  },

  isTokenExpired() {
    const expiresAt = this.getTokenExpiresAt();
    if (!expiresAt) return true;
    
    // Ajoute une marge de sécurité de 30 secondes
    const marginMs = 30000;
    return Date.now() + marginMs > expiresAt;
  },

  clearTokens() {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_UUID);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Erreur lors du nettoyage des tokens:', error);
    }
  },

  // === AUTHENTIFICATION ===

  login: async (email, mot_de_passe) => {
    try {
      const response = await api.post('/auth/login', { email, mot_de_passe });
      
      if (response.data) {
        const { access_token, session_uuid, expires_in, user } = response.data;
        authService.setTokens(access_token, session_uuid, expires_in);
        
        const normalizedUser = {
          ...user,
          roles: normalizeRoles(user),
        };
        authService.setUser(normalizedUser);
        
        return { 
          success: true, 
          data: {
            ...response.data,
            user: normalizedUser,
          }
        };
      }
      
      return {
        success: false,
        error: 'Réponse invalide du serveur',
      };
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
    } finally {
      // Toujours nettoyer même si la requête échoue
      authService.clearTokens();
    }
  },

  // === REFRESH ===

  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      
      if (response.data) {
        const { access_token, session_uuid, expires_in } = response.data;
        authService.setTokens(access_token, session_uuid, expires_in);
        
        return {
          success: true,
          data: response.data,
        };
      }
      
      return {
        success: false,
        error: 'Réponse invalide du serveur',
      };
    } catch (error) {
      authService.clearTokens();
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de rafraîchissement',
      };
    }
  },

  // === UTILISATEUR ===

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      const normalizedUser = {
        ...response.data,
        roles: normalizeRoles(response.data),
        permissions: response.data.permissions || [],
        session_uuid: response.data.session_uuid,
      };
      
      // Stocker l'utilisateur en sessionStorage
      authService.setUser(normalizedUser);
      
      // Si on a reçu un session_uuid, le stocker aussi
      if (response.data.session_uuid) {
        sessionStorage.setItem(STORAGE_KEYS.SESSION_UUID, response.data.session_uuid);
      }
      
      return { success: true, data: normalizedUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de récupération',
      };
    }
  },

  isAuthenticated: () => {
    const token = authService.getAccessToken();
    if (!token) return false;
    
    // Vérification supplémentaire : le token n'est pas expiré
    return !authService.isTokenExpired();
  },

  // === RÉCUPÉRATION DE SESSION (Phase 6) ===
  
  restoreSession: async () => {
    /**
     * Tente de restaurer la session depuis le cookie Refresh Token.
     * Utilisé lorsque sessionStorage est vide mais que le cookie est présent.
     */
    try {
      const response = await api.get('/auth/me');
      
      if (response.data) {
        const { session_uuid, ...userData } = response.data;
        
        // Générer un nouvel access token via /refresh
        const refreshResult = await authService.refreshToken();
        
        if (refreshResult.success) {
          return { 
            success: true, 
            data: {
              user: userData,
              session_uuid: session_uuid,
            }
          };
        }
      }
      
      return { success: false, error: 'Impossible de restaurer la session' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de restauration',
      };
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