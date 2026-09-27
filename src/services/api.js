import axios from 'axios';
import authService from './auth';
import { isPublicRoute } from '../config/permissions';

const cookieOnlyPaths = new Set(['/auth/refresh', '/auth/login', '/auth/forgot-password', '/auth/verify-token', '/auth/reset-password']);
const endpointPath = (config) => (config?.url || '').split('?')[0].replace(/\/$/, '');

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
    if (accessToken && !cookieOnlyPaths.has(endpointPath(config))) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (cookieOnlyPaths.has(endpointPath(config))) {
      delete config.headers.Authorization;
      delete config.headers['X-Session-ID'];
    }

    // 2. Ajouter le session_uuid dans le header X-Session-ID
    const sessionUuid = authService.getSessionUuid();
    if (sessionUuid && !cookieOnlyPaths.has(endpointPath(config))) {
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

const expireSession = () => {
  authService.clearTokens();
  if (!isPublicRoute(window.location.pathname) || window.location.pathname === '/force-change-password') {
    window.location.assign('/login');
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Si pas de réponse du serveur (Network Error, reboot backend, ECONNREFUSED) :
    // On ne déconnecte PAS l'utilisateur et on ne vide pas ses tokens !
    if (!error.response) {
      console.warn('[API] Serveur inaccessible ou en cours de redémarrage. Session préservée.');
      return Promise.reject(error);
    }

    // ════════════════════════════════════════════════════════════════
    // ═══ AJOUT 5.23-bis — Détection 403 "Module non activé"      ═══
    // ════════════════════════════════════════════════════════════════
    // Backend renvoie : "Le module 'XXX' n'est pas activé pour votre organisation..."
    // On dispatche un event global écouté par <ModuleNotActiveBanner />
    if (error.response.status === 403) {
      const detail = typeof error.response.data?.detail === 'string' ? error.response.data.detail : '';

      const moduleMatch = detail.match(/Le module '([A-Z_]+)' n'est pas activé/i);

      if (moduleMatch) {
        const moduleCode = moduleMatch[1];

        if (import.meta.env.DEV) {
          console.warn(`[API] 🚫 Module '${moduleCode}' non activé pour cette ONG`);
        }

        window.dispatchEvent(
          new CustomEvent('module-not-active', {
            detail: {
              module: moduleCode,
              message: detail,
              url: originalRequest?.url,
            },
          })
        );
      }
    }
    // ═══ FIN AJOUT 5.23-bis ═══

    if (error.response.status === 503) {
      window.dispatchEvent(new Event('auth-unavailable'));
      return Promise.reject(error);
    }

    const path = endpointPath(originalRequest);
    const noRefresh = cookieOnlyPaths.has(path) || path === '/auth/logout';
    if (error.response.status === 401 && originalRequest && !noRefresh) {
      if (originalRequest._retry) {
        expireSession();
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      // The service shares this promise with startup and explicit refresh calls.
      const result = await authService.refreshToken();
      if (result.success) return api(originalRequest);
      if (result.status === 401) expireSession();
      // Keep the temporary failure status instead of converting it into a 401.
      return Promise.reject({ response: { status: result.status }, message: result.error });
    }

    return Promise.reject(error);
  }
);

export default api;