import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAccessibleHomePath } from '../config/permissions';
import { useTranslation } from '../context/LanguageContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { authenticated, user, authReady } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (!authReady) {
    return (
      <div
        className="loading-container"
        role="status"
        aria-live="polite"
        aria-label={t('authChecking')}
      >
        <div className="loading-spinner" />
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  const normalizeRole = (role) => (role ? String(role).trim().toUpperCase() : '');

  const userRoles = (user?.roles || []).map(normalizeRole).filter(Boolean);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole).filter(Boolean);

  const hasAccess = normalizedAllowedRoles.some((allowedRole) =>
    userRoles.includes(allowedRole)
  );

  if (!hasAccess) {
    const home = getAccessibleHomePath(user);
    return <Navigate to={home} replace />;
  }

  return children;
};

export default ProtectedRoute;
