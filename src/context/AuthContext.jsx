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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Vérification de l'état initial
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // 🔍 LOG DE DÉBOGAGE (optionnel)
        if (import.meta.env.DEV) {
          console.log('[Auth] Initialisation...');
        }

        const token = authService.getAccessToken();
        const sessionUuid = authService.getSessionUuid();

        // ============================================================
        // 🔴 CORRECTION : Gérer le cas où le token est expiré
        // ============================================================

        // CAS 1 : Token présent mais expiré → Tentative de refresh
        if (token && authService.isTokenExpired()) {
          if (import.meta.env.DEV) {
            console.warn('[Auth] Token expiré, tentative de refresh...');
          }

          try {
            // Tentative de refresh automatique
            const refreshResult = await authService.refreshToken();

            if (refreshResult.success) {
              if (import.meta.env.DEV) {
                console.log('[Auth] Refresh réussi !');
              }

              // Récupérer l'utilisateur avec le nouveau token
              const userResult = await authService.getCurrentUser();
              if (userResult.success) {
                setUser(userResult.data);
                setIsAuthenticated(true);
                setAuthReady(true);
              } else {
                throw new Error('Échec récupération utilisateur après refresh');
              }
            } else {
              // Refresh échoué → déconnecter
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
            // Erreur lors du refresh
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
            setUser(result.data);
            setIsAuthenticated(true);
            setAuthReady(true);
          } else {
            // Token invalide malgré tout
            authService.clearTokens();
            setIsAuthenticated(false);
            setAuthReady(true);
          }
        }
        // CAS 3 : Pas de token en sessionStorage → Vérifier cookie Refresh Token
        else {
          if (import.meta.env.DEV) {
            console.log('[Auth] Pas de token, vérification cookie...');
          }

          try {
            const userResult = await authService.getCurrentUser();
            if (userResult.success) {
              setUser(userResult.data);
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
  }, []);

  // === LOGIN ===
  const login = useCallback(async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        setUser(result.data.user);
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
  }, []);

  // === LOGOUT ===
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      authService.clearTokens();
    }
  }, []);

  // === REFRESH ===
  const refreshToken = useCallback(async () => {
    try {
      const result = await authService.refreshToken();
      if (result.success) {
        // Réactualiser les informations utilisateur
        const userResult = await authService.getCurrentUser();
        if (userResult.success) {
          setUser(userResult.data);
          setIsAuthenticated(true);
        }
        return { success: true };
      }
      // Si le refresh échoue, déconnecter
      await logout();
      return { success: false, error: result.error };
    } catch (error) {
      await logout();
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur de rafraîchissement',
      };
    }
  }, [logout]);

  // === MISE À JOUR DU PROFIL ===
  const updateUser = useCallback((userData) => {
    setUser(userData);
    authService.setUser(userData);
  }, []);

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

  const value = {
    user,
    loading,
    authReady,
    isAuthenticated,
    authenticated: isAuthenticated,
    login,
    logout,
    refreshToken,
    updateUser,
    hasPermission,
    hasRole,
    hasAnyRole,
    // Exposer certaines méthodes du service
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