import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import authService from '../services/auth';
import { userHasPermission } from '../config/permissions';

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

const buildUserData = (data) => ({
  ...data,
  roles: normalizeRoles(data),
  permissions: data.permissions || [],
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.data) {
        const userData = buildUserData(result.data);
        setUser(userData);
        setAuthenticated(true);
        return userData;
      }
      setUser(null);
      setAuthenticated(false);
      return null;
    } catch {
      setUser(null);
      setAuthenticated(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, mot_de_passe) => {
    setLoading(true);
    try {
      const result = await authService.login(email, mot_de_passe);
      if (!result.success) {
        return result;
      }
      const userData = await checkAuth();
      if (!userData) {
        return { success: false, error: 'Session non établie après connexion' };
      }
      return { success: true, user: userData };
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  const handleLogout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setAuthenticated(false);
  }, []);

  const hasRole = useCallback((role) => {
    if (!user?.roles?.length) return false;
    const normalizedRole = String(role).trim().toUpperCase();
    return user.roles.some((r) => String(r).trim().toUpperCase() === normalizedRole);
  }, [user]);

  const hasAnyRole = useCallback((roles) => {
    if (!user?.roles?.length) return false;
    if (!Array.isArray(roles)) roles = [roles];
    const normalizedRoles = roles.map((r) => String(r).trim().toUpperCase());
    return normalizedRoles.some((role) => hasRole(role));
  }, [user, hasRole]);

  const hasPermission = useCallback((permission) => userHasPermission(user, permission), [user]);

  const canCreateMouvementType = useCallback((typeMouvement) => {
    const typeMap = {
      TRANSFERT: 'create_mouvement_transfert',
      AFFECTATION: 'create_mouvement_affectation',
      RETOUR: 'create_mouvement_retour',
      CESSION: 'create_mouvement_cession',
      SORTIE: 'create_mouvement_sortie',
    };
    const perm = typeMap[typeMouvement?.toUpperCase()];
    return perm ? hasPermission(perm) : false;
  }, [hasPermission]);

  const authReady = !loading && (!authenticated || !!user);

  const value = useMemo(() => ({
    user,
    authenticated,
    loading,
    authReady,
    login,
    logout: handleLogout,
    hasRole,
    hasAnyRole,
    hasPermission,
    canCreateMouvementType,
    checkAuth,
  }), [user, authenticated, loading, authReady, login, handleLogout, hasRole, hasAnyRole, hasPermission, canCreateMouvementType, checkAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
