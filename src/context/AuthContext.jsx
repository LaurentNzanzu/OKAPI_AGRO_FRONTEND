// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AUTH_UNAVAILABLE, authErrorMessage } from '../utils/authError';
import { AuthAlert } from '../components/auth/AuthUI';
import authService from '../services/auth';
import { userHasPermission, hasRole as permHasRole, hasAnyRole as permHasAnyRole } from '../config/permissions';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ════════════════════════════════════════════════════════════════
// ═══ AJOUT 5.23 — Helpers multi-tenant SaaS                   ═══
// ════════════════════════════════════════════════════════════════
const extractActiveModules = (userData) => {
  if (!userData) return [];
  // Format backend actuel : user.modules_actifs (flat)
  if (Array.isArray(userData.modules_actifs)) return userData.modules_actifs;
  // Fallback : user.organisation.modules_actifs (nested)
  const fromOrg = userData.organisation?.modules_actifs;
  if (Array.isArray(fromOrg)) return fromOrg;
  return [];
};

const extractOrganisationId = (userData) => {
  if (!userData) return null;
  return userData.organisation_id ?? userData.organisation?.id ?? null;
};
// ═══ FIN AJOUT 5.23 ═══

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const authGeneration = useRef(0);


  // ═══ AJOUT 5.23 ═══
  const [activeModules, setActiveModules] = useState([]);
  const [organisationId, setOrganisationId] = useState(null);
  // ═══ FIN AJOUT ═══

  // Helper central : applique user + org + modules en un seul point
  const applyUser = useCallback((userData) => {
    setUser(userData);
    setActiveModules(extractActiveModules(userData));
    setOrganisationId(extractOrganisationId(userData));
  }, []);

  const initializeAuth = useCallback(async () => {
    const generation = ++authGeneration.current;
    setLoading(true);
    setAuthError('');
    try {
      // /me also supports the access cookie. Its interceptor refreshes at most once.
      const result = await authService.getCurrentUser();
      if (generation !== authGeneration.current) return;
      if (result.success) {
        applyUser(result.data);
        setIsAuthenticated(true);
        setServiceUnavailable(false);
      } else if (result.status !== 401) {
        setAuthError(result.error || AUTH_UNAVAILABLE);
      } else {
        applyUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      if (generation === authGeneration.current) setAuthError(AUTH_UNAVAILABLE);
    } finally {
      if (generation === authGeneration.current) {
        setAuthReady(true);
        setLoading(false);
      }
    }
  }, [applyUser]);

  useEffect(() => {
    const clear = () => {
      ++authGeneration.current;
      applyUser(null);
      setIsAuthenticated(false);
      setAuthError('');
      setServiceUnavailable(false);
      setAuthReady(true);
      setLoading(false);
    };
    const unavailable = () => setServiceUnavailable(true);
    window.addEventListener('auth-cleared', clear);
    window.addEventListener('auth-unavailable', unavailable);
    // Public password links must not compete with cookie refresh/session rotation.
    if (['/login', '/forgot-password', '/reset-password'].includes(window.location.pathname)) {
      setAuthReady(true);
      setLoading(false);
    } else {
      initializeAuth();
    }
    const lifecycle = authGeneration;
    return () => {
      ++lifecycle.current;
      window.removeEventListener('auth-cleared', clear);
      window.removeEventListener('auth-unavailable', unavailable);
    };
  }, [initializeAuth, applyUser]);

  // === LOGIN ===
  const login = useCallback(async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        ++authGeneration.current;
        setAuthError('');
        setServiceUnavailable(false);
        applyUser(result.data.user);
        setIsAuthenticated(true);
        return { success: true, data: result.data };
      }

      return {
        success: false,
        error: result.error,
        status: result.status,
        retryAfter: result.retryAfter,
        remainingAttempts: result.remainingAttempts,
      };
    } catch (error) {
      return {
        success: false,
        error: authErrorMessage(error),
      };
    }
  }, [applyUser]);

  // === LOGOUT ===
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      console.warn('La déconnexion distante a échoué.');
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setActiveModules([]);
      setOrganisationId(null);
      authService.clearTokens();
    }
  }, []);

  // === REFRESH ===
  const refreshToken = useCallback(async () => {
    const result = await authService.refreshToken();
    if (!result.success) return result;
    const userResult = await authService.getCurrentUser();
    if (userResult.success) {
      applyUser(userResult.data);
      setIsAuthenticated(true);
      setAuthError('');
    } else if (userResult.status !== 401) {
      setAuthError(userResult.error || AUTH_UNAVAILABLE);
    }
    return userResult;
  }, [applyUser]);

  // === MISE À JOUR DU PROFIL ===
  const updateUser = useCallback((userData) => {
    applyUser(userData);
    authService.setUser(userData);
  }, [applyUser]);

  const reloadUser = useCallback(async () => {
    const result = await authService.getCurrentUser();
    if (result.success) {
      updateUser(result.data);
      setAuthError('');
    } else if (result.status !== 401) {
      // Do not keep authorizing navigation with an unverified profile.
      setAuthError(result.error || AUTH_UNAVAILABLE);
    }
    return result;
  }, [updateUser]);

  // === PERMISSIONS HELPERS ===
  const hasPermission = useCallback((permission) => {
    return userHasPermission(user, permission);
  }, [user]);

  const hasRole = useCallback((role) => {
    return permHasRole(user, role);
  }, [user]);

  const hasAnyRole = useCallback((roles) => {
    return permHasAnyRole(user, roles);
  }, [user]);

  // ═══ AJOUT 5.23 — Helper module ═══
  const hasModule = useCallback((moduleCode) => {
    if (!moduleCode) return true;
    // Si l'utilisateur est plateforme admin (pas d'ONG), bypass
    if (user?.is_platform_admin) return true;
    // Si aucun module défini → bypass (safe default)
    if (!Array.isArray(activeModules) || activeModules.length === 0) return true;
    return activeModules.includes(moduleCode);
  }, [activeModules, user]);
  // ═══ FIN AJOUT ═══

  const value = {
    user,
    loading,
    authReady,
    authError,
    retryAuth: initializeAuth,
    isAuthenticated,
    authenticated: isAuthenticated,
    // ═══ AJOUT 5.23 ═══
    activeModules,
    organisationId,
    hasModule,
    // ═══ FIN AJOUT ═══
    login,
    logout,
    refreshToken,
    updateUser,
    reloadUser,
    hasPermission,
    hasRole,
    hasAnyRole,
    getAccessToken: authService.getAccessToken,
    getSessionUuid: authService.getSessionUuid,
    isTokenExpired: authService.isTokenExpired,
    getFingerprint: authService.getFingerprint,
  };

  return (
    <AuthContext.Provider value={value}>
      {serviceUnavailable && !authError && (
        <AuthAlert>{AUTH_UNAVAILABLE} <button type="button" onClick={() => setServiceUnavailable(false)}>Fermer</button></AuthAlert>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
