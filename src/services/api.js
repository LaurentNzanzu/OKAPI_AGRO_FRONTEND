import axios from 'axios';
import authService from './auth';
import { isPublicRoute } from '../config/permissions';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // Important pour les cookies
});

// === REQUEST INTERCEPTOR ===

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

api.interceptors.request.use(
  (config) => {
    // 1. Ajouter le token d'accès dans le header Authorization
    const accessToken = authService.getAccessToken();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // 2. Ajouter le session_uuid dans le header X-Session-ID
    const sessionUuid = authService.getSessionUuid();
    if (sessionUuid) {
      config.headers['X-Session-ID'] = sessionUuid;
    }

    // 3. 🔴 NOUVEAU : Ajouter le fingerprint dans le header X-Fingerprint
    const fingerprint = authService.getFingerprint();
    if (fingerprint) {
      config.headers['X-Fingerprint'] = fingerprint;
    }

    // 4. Protection CSRF pour les méthodes qui modifient l'état
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrfToken = getCookie('csrf_token') || getCookie('XSRF-TOKEN');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// === RESPONSE INTERCEPTOR ===

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si l'erreur est 401 et que la requête n'a pas encore été retentée
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Sur les pages publiques, ne pas tenter de refresh
      if (isPublicRoute(window.location.pathname)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Vérifier si le token est effectivement expiré
      if (authService.isTokenExpired()) {
        try {
          // Utiliser un mécanisme de verrouillage pour éviter les appels concurrents
          if (!refreshPromise) {
            refreshPromise = authService.refreshToken()
              .then((result) => {
                if (!result.success) {
                  throw new Error(result.error);
                }
                return result;
              })
              .finally(() => {
                refreshPromise = null;
              });
          }

          await refreshPromise;

          // Réessayer la requête originale avec le nouveau token
          const newAccessToken = authService.getAccessToken();
          if (newAccessToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          }
          
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh échoué : redirection vers login
          if (!isPublicRoute(window.location.pathname)) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;