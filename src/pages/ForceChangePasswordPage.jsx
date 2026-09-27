
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthAlert, AuthLoadingPage } from '../components/auth/AuthUI';
import { getPostLoginPath } from '../utils/postLoginRedirect';
import ForceChangePassword from '../components/auth/ForceChangePassword';

const ForceChangePasswordPage = () => {
  const { authReady, loading, isAuthenticated, user, authError, retryAuth } = useAuth();
  if (authError) return <AuthAlert>{authError} <button onClick={retryAuth}>Réessayer</button></AuthAlert>;
  if (!authReady || loading) return <AuthLoadingPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.doit_changer_mot_de_passe === false) return <Navigate to={getPostLoginPath(user)} replace />;
  return <ForceChangePassword />;
};

export default ForceChangePasswordPage;
