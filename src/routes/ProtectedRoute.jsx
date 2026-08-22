// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isPublicRoute, getAccessibleHomePath } from '../config/permissions';
import { useTranslation } from '../context/LanguageContext';
import authService from '../services/auth';

/**
 * Composant de protection des routes avec gestion :
 * - Authentification requise
 * - Vérification des rôles
 * - Routes publiques
 * - Redirection intelligente
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { 
    authenticated, 
    user, 
    authReady, 
    loading, 
    isAuthenticated 
  } = useAuth();
  
  const location = useLocation();
  const { t } = useTranslation();
  
  // État local pour la vérification du token
  const [hasValidToken, setHasValidToken] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Vérification du token en dehors du contexte
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
  }, [authenticated, user]);

  // Normalisation des rôles
  const normalizeRole = (role) => {
    if (!role) return '';
    return String(role).trim().toUpperCase();
  };

  // Vérification des rôles
  const hasRequiredRole = () => {
    // Si aucun rôle n'est requis, l'accès est autorisé
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    // Si l'utilisateur n'est pas chargé, accès refusé
    if (!user) {
      return false;
    }

    // Récupération des rôles de l'utilisateur
    const userRoles = (user.roles || [])
      .map(normalizeRole)
      .filter(Boolean);

    // Normalisation des rôles autorisés
    const normalizedAllowedRoles = allowedRoles
      .map(normalizeRole)
      .filter(Boolean);

    // Vérification de l'accès
    const hasAccess = normalizedAllowedRoles.some((allowedRole) =>
      userRoles.includes(allowedRole)
    );

    // Les administrateurs ont toujours accès (optionnel)
    const isAdmin = userRoles.includes('ADMIN');
    
    return hasAccess || isAdmin;
  };

  // Déterminer si l'utilisateur est authentifié
  const isUserAuthenticated = () => {
    // Si le contexte indique explicitement déconnecté, ne pas se fier au token local
    if (authReady && !authenticated && !user) return false;

    if (authReady && authenticated) return true;
    if (!authReady && isAuthenticated) return true;
    // Vérification directe du token (seulement si authReady n'a pas encore statué)
    if (!authReady && hasValidToken) return true;
    return false;
  };

  // État de chargement
  if (!authReady || loading || isChecking) {
    return (
      <div 
        className="loading-container"
        role="status"
        aria-live="polite"
        aria-label={t?.('authChecking') || 'Vérification de l\'authentification'}
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
          className="loading-spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <p style={{ color: '#666', fontSize: '1rem' }}>
          {t?.('loading') || 'Chargement...'}
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Vérification si la route est publique
  const isPublic = isPublicRoute(location.pathname);
  
  // Si la route est publique, on laisse passer
  if (isPublic) {
    return children;
  }

  // Si l'authentification est requise et que l'utilisateur n'est pas authentifié
  if (requireAuth && !isUserAuthenticated()) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Si l'utilisateur est authentifié mais n'a pas les rôles requis
  if (requireAuth && isUserAuthenticated() && !hasRequiredRole()) {
    // Rediriger vers une page d'accueil accessible
    const homePath = getAccessibleHomePath(user);
    return <Navigate to={homePath || '/'} replace />;
  }

  // Si tout est OK, rendre les enfants
  return children;
};

export default ProtectedRoute;