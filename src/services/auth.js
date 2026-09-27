// frontend/src/services/auth.js
import api from './api';
import { authErrorMessage } from '../utils/authError';

let refreshPromise = null;
let sessionGeneration = 0;

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
    } catch {
      return null;
    }
  },

  getAccessToken() {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  getSessionUuid() {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.SESSION_UUID);
    } catch {
      return null;
    }
  },

  getTokenExpiresAt() {
    try {
      const expiresAt = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      return expiresAt ? parseInt(expiresAt, 10) : null;
    } catch {
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
    ++sessionGeneration;
    try {
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_UUID);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Erreur lors du nettoyage des tokens:', error);
    } finally {
      window.dispatchEvent(new Event('auth-cleared'));
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
        status: error.response?.status,
        error: authErrorMessage(error),

        retryAfter: Number(
          error.response?.data?.detail?.retry_after ||
          error.response?.headers?.['retry-after'] ||
          0
        ),

        remainingAttempts:
          error.response?.data?.detail?.remaining_attempts,
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      if (import.meta.env.DEV) {
        console.warn('La déconnexion distante a échoué.');
      }
    } finally {
      // Toujours nettoyer même si la requête échoue
      authService.clearTokens();
    }
  },

  // === REFRESH ===

  refreshToken: () => {
    if (!refreshPromise) {
      const generation = sessionGeneration;
      refreshPromise = (async () => {
        try {
          const response = await api.post('/auth/refresh');
          if (generation !== sessionGeneration) return { success: false, status: 401 };
          const { access_token, session_uuid, expires_in } = response.data || {};
          if (!access_token || !session_uuid) return { success: false, status: 502, error: authErrorMessage({ status: 502 }) };
          authService.setTokens(access_token, session_uuid, expires_in);
          return { success: true, data: response.data };
        } catch (error) {
          const status = error.response?.status;
          if (status === 401) authService.clearTokens();
          return { success: false, status, error: authErrorMessage(error) };
        }
      })().finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  },

  // === UTILISATEUR ===

  getCurrentUser: async () => {
    const generation = sessionGeneration;
    try {
      const response = await api.get('/auth/me');
      if (generation !== sessionGeneration) return { success: false, status: 401 };
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
        status: error.response?.status,
        error: authErrorMessage(error),
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
     * Utilisé lorsque l'access_token est expiré ou absent mais que le cookie refresh est présent.
     */
    try {
      // 1. Tenter d'abord de rafraîchir le token via le refresh token (cookie HttpOnly)
      const refreshResult = await authService.refreshToken();

      if (!refreshResult.success) {
        return {
          success: false,
          status: refreshResult.status,
          error: refreshResult.error || 'Impossible de restaurer la session'
        };
      }

      // 2. Une fois le nouvel access token obtenu, récupérer les infos de l'utilisateur
      const userResult = await authService.getCurrentUser();
      if (userResult.success) {
        return {
          success: true,
          data: {
            user: userResult.data,
            session_uuid: authService.getSessionUuid(),
          }
        };
      }

      return {
        success: false,
        status: userResult.status,
        error: userResult.error || 'Impossible de récupérer le profil utilisateur'
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        error: authErrorMessage(error),
      };
    }
  },
  // ════════════════════════════════════════════════════════════════
  // ═══ AJOUT 5.23-bis — Force Change Password (1ère connexion) ═══
  // ════════════════════════════════════════════════════════════════
  forceChangePassword: async (nouveauMotDePasse) => {
    try {
      const response = await api.post('/auth/force-change-password', {
        nouveau_mot_de_passe: nouveauMotDePasse,
      });

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        error: authErrorMessage(error),
      };
    }
  },
  // ═══ FIN AJOUT 5.23-bis ═══


  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetToken: async (token) => {
    const response = await api.post('/auth/verify-token', { token });
    return response.data;
  },

  resetPassword: async (token, nouveau_mot_de_passe) => {
    const response = await api.post('/auth/reset-password', { token, nouveau_mot_de_passe });
    authService.clearTokens();
    return response.data;
  },
};

export default authService;