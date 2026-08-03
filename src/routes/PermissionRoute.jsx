// src/components/PermissionRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  resolveRoutePermission, 
  getAccessibleHomePath, 
  userCanAccessPath,
  isPublicRoute,
  hasPermission,
  hasRole,
  hasAnyRole
} from '../config/permissions';
import { normalizePathname } from '../utils/redirectPath';
import { useTranslation } from '../context/LanguageContext';
import authService from '../services/auth';

// Composant de chargement
const AuthLoading = ({ label }) => (
  <div
    className="flex items-center justify-center py-16"
    role="status"
    aria-live="polite"
    aria-label={label}
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}
  >
    <div 
      className="spinner"
      style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

/**
 * Composant de vérification des permissions avec support :
 * - Authentification via sessionStorage
 * - Vérification des permissions par route
 * - Support des rôles
 * - Routes publiques
 * - Redirection intelligente
 */
const PermissionRoute = ({ 
  children, 
  permission = null,
  allowedRoles = [],
  requireAuth = true,
  fallbackPath = '/unauthorized'
}) => {
  const { authReady, user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  // État local pour la vérification du token
  const [hasValidToken, setHasValidToken] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Vérification du token — re-évaluée à chaque changement d'état d'auth
  useEffect(() => {
    const checkToken = () => {
      try {
        const token = authService.getAccessToken();
        const isValid = token && !authService.isTokenExpired();
        setHasValidToken(isValid);
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        setHasValidToken(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkToken();
  // Re-vérifier à chaque changement d'état auth (ex: après logout)
  }, [isAuthenticated, user]);

  // Déterminer si l'utilisateur est authentifié
  const isUserAuthenticated = () => {
    // Si le contexte indique explicitement déconnecté, ne pas se fier au token local
    if (authReady && !isAuthenticated && !user) return false;

    // Vérification via le contexte
    if (authReady && isAuthenticated) return true;
    if (authReady && user) return true;

    // Vérification directe du token (seulement si authReady n'a pas encore statué)
    if (!authReady && hasValidToken) return true;

    return false;
  };

  // Vérifier si l'utilisateur a les rôles requis
  const hasRequiredRoles = () => {
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    if (!user) {
      return false;
    }

    const userRoles = (user.roles || [])
      .map(r => String(r).trim().toUpperCase())
      .filter(Boolean);

    const normalizedAllowedRoles = allowedRoles
      .map(r => String(r).trim().toUpperCase())
      .filter(Boolean);

    // Vérification des rôles
    const hasAccess = normalizedAllowedRoles.some(role => 
      userRoles.includes(role)
    );

    // Les administrateurs ont toujours accès
    if (userRoles.includes('ADMIN')) return true;

    return hasAccess;
  };

  // Si le chargement est en cours
  if (!authReady || loading || isChecking) {
    return <AuthLoading label={t?.('permissionChecking') || 'Vérification des permissions...'} />;
  }

  // Déterminer la permission requise pour la route
  const required = permission ?? resolveRoutePermission(location.pathname);

  // Si la route est publique, on laisse passer
  if (required === 'public' || isPublicRoute(location.pathname)) {
    return children;
  }

  // Vérifier l'authentification
  if (requireAuth && !isUserAuthenticated()) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Si l'utilisateur est authentifié mais n'a pas les rôles requis
  if (requireAuth && isUserAuthenticated() && !hasRequiredRoles()) {
    const home = getAccessibleHomePath(user);
    const current = normalizePathname(location.pathname);
    const homePath = normalizePathname(home);

    if (current !== homePath && userCanAccessPath(user, homePath)) {
      if (import.meta.env.DEV) {
        console.warn(
          `[auth] Accès refusé à "${current}" (rôles requis: ${allowedRoles.join(', ')}) → redirection vers "${homePath}"`,
          { roles: user?.roles }
        );
      }
      return <Navigate to={home} replace />;
    }

    return <Navigate to={fallbackPath} replace state={{ from: location.pathname }} />;
  }

  // Vérifier la permission spécifique (si définie)
  if (required && !required.startsWith('public')) {
    // Vérification par permission
    const hasAccess = hasPermission(user, required);
    
    if (!hasAccess) {
      const home = getAccessibleHomePath(user);
      const current = normalizePathname(location.pathname);
      const homePath = normalizePathname(home);

      if (current !== homePath && userCanAccessPath(user, homePath)) {
        if (import.meta.env.DEV) {
          console.warn(
            `[auth] Accès refusé à "${current}" (permission: ${required}) → redirection vers "${homePath}"`,
            { roles: user?.roles, permissions: user?.permissions }
          );
        }
        return <Navigate to={home} replace />;
      }

      return <Navigate to={fallbackPath} replace state={{ from: location.pathname }} />;
    }
  }

  // Vérification supplémentaire : accès à la route via userCanAccessPath
  // Guard : si user est null ici, rediriger vers /login (cas logout race condition)
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!userCanAccessPath(user, location.pathname)) {
    const home = getAccessibleHomePath(user);
    const current = normalizePathname(location.pathname);
    const homePath = normalizePathname(home);

    if (current !== homePath && userCanAccessPath(user, homePath)) {
      if (import.meta.env.DEV) {
        console.warn(
          `[auth] Accès refusé à "${current}" → redirection vers "${homePath}"`,
          { roles: user?.roles }
        );
      }
      return <Navigate to={home} replace />;
    }

    return <Navigate to={fallbackPath} replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default PermissionRoute;