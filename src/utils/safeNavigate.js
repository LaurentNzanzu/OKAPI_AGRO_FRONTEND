import { getSafeRedirectPath } from './redirectPath';

/**
 * Navigation interne sécurisée — bloque les URLs externes et redirige
 * vers le tableau de bord si le chemin ne correspond à aucune route.
 */
export const safeNavigate = (navigate, path, fallback = '/dashboard') => {
  if (!path || typeof path !== 'string') return false;

  const trimmed = path.trim();

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('//') ||
    trimmed.toLowerCase().startsWith('javascript:')
  ) {
    if (import.meta.env.DEV) {
      console.warn('Navigation bloquée:', trimmed);
    }
    return false;
  }

  if (trimmed.startsWith('/')) {
    navigate(getSafeRedirectPath(trimmed, fallback));
    return true;
  }

  return false;
};

export default safeNavigate;
