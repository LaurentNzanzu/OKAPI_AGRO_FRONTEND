import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolveRoutePermission, getAccessibleHomePath, userCanAccessPath } from '../config/permissions';
import { normalizePathname } from '../utils/redirectPath';
import { useTranslation } from '../context/LanguageContext';

const AuthLoading = ({ label }) => (
  <div
    className="flex items-center justify-center py-16"
    role="status"
    aria-live="polite"
    aria-label={label}
  >
    <div className="spinner" />
  </div>
);

/**
 * Vérifie l'authentification puis la permission associée à la route courante.
 */
const PermissionRoute = ({ children, permission }) => {
  const { authReady, user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (!authReady) {
    return <AuthLoading label={t('permissionChecking')} />;
  }

  const required = permission ?? resolveRoutePermission(location.pathname);

  if (required === 'public') {
    return children;
  }

  if (!required) {
    const home = getAccessibleHomePath(user);
    if (normalizePathname(location.pathname) !== normalizePathname(home)) {
      return <Navigate to={home} replace />;
    }
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  }

  if (!userCanAccessPath(user, location.pathname)) {
    const home = getAccessibleHomePath(user);
    const current = normalizePathname(location.pathname);
    const homePath = normalizePathname(home);
    const requiredPermission = resolveRoutePermission(location.pathname);

    if (current !== homePath && userCanAccessPath(user, homePath)) {
      if (import.meta.env.DEV) {
        console.warn(
          `[auth] Accès refusé à "${current}" (permission: ${requiredPermission}) → redirection vers "${homePath}"`,
          { roles: user?.roles }
        );
      }
      return <Navigate to={home} replace />;
    }

    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default PermissionRoute;
