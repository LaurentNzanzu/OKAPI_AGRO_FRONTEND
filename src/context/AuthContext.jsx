// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Vérification de l'état initial
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        if (import.meta.env.DEV) {
          console.log('[Auth] Initialisation...');
        }

        const token = authService.getAccessToken();

        // CAS 1 : Token présent mais expiré → Tentative de refresh
        if (token && authService.isTokenExpired()) {
          if (import.meta.env.DEV) {
            console.warn('[Auth] Token expiré, tentative de refresh...');
          }

          try {
            const refreshResult = await authService.refreshToken();

            if (refreshResult.success) {
              if (import.meta.env.DEV) {
                console.log('[Auth] Refresh réussi !');
              }

              const userResult = await authService.getCurrentUser();
              if (userResult.success) {
                applyUser(userResult.data);
                setIsAuthenticated(true);
                setAuthReady(true);
              } else {
                throw new Error('Échec récupération utilisateur après refresh');
              }
            } else {
              if (import.meta.env.DEV) {
                console.warn('[Auth] Refresh échoué, déconnexion...');
              }
              authService.clearTokens();
              setIsAuthenticated(false);
              setAuthReady(true);
              window.location.href = '/login';
              return;
            }
          } catch (refreshError) {
            console.error('[Auth] Erreur refresh:', refreshError);
            authService.clearTokens();
            setIsAuthenticated(false);
            setAuthReady(true);
            window.location.href = '/login';
            return;
          }
        }
        // CAS 2 : Token présent et valide → Récupération normale
        else if (token && !authService.isTokenExpired()) {
          if (import.meta.env.DEV) {
            console.log('[Auth] Token valide, récupération utilisateur...');
          }

          const result = await authService.getCurrentUser();
          if (result.success) {
            applyUser(result.data);
            setIsAuthenticated(true);
            setAuthReady(true);
          } else {
            authService.clearTokens();
            setIsAuthenticated(false);
            setAuthReady(true);
          }
        }
        // CAS 3 : Pas de token → Vérifier cookie Refresh Token
        else {
          if (import.meta.env.DEV) {
            console.log('[Auth] Pas de token, vérification cookie...');
          }

          try {
            const userResult = await authService.getCurrentUser();
            if (userResult.success) {
              applyUser(userResult.data);
              setIsAuthenticated(true);
              setAuthReady(true);
            } else {
              setIsAuthenticated(false);
              setAuthReady(true);
            }
          } catch (error) {
            console.warn('[Auth] Pas de session active, redirection vers login');
            setIsAuthenticated(false);
            setAuthReady(true);
          }
        }
      } catch (error) {
        console.error('[Auth] Erreur d\'initialisation:', error);
        authService.clearTokens();
        setIsAuthenticated(false);
        setAuthReady(true);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [applyUser]);

  // === LOGIN ===
  const login = useCallback(async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        applyUser(result.data.user);
        setIsAuthenticated(true);
        return { success: true, data: result.data };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de connexion',
      };
    }
  }, [applyUser]);

  // === LOGOUT ===
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
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
    try {
      const result = await authService.refreshToken();
      if (result.success) {
        const userResult = await authService.getCurrentUser();
        if (userResult.success) {
          applyUser(userResult.data);
          setIsAuthenticated(true);
        }
        return { success: true };
      }
      await logout();
      return { success: false, error: result.error };
    } catch (error) {
      await logout();
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de rafraîchissement',
      };
    }
  }, [logout, applyUser]);

  // === MISE À JOUR DU PROFIL ===
  const updateUser = useCallback((userData) => {
    applyUser(userData);
    authService.setUser(userData);
  }, [applyUser]);

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
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;