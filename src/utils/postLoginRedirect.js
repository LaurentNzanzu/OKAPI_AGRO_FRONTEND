import { getSafeRedirectPath, normalizePathname } from './redirectPath';
import { getAccessibleHomePath, userCanAccessPath } from '../config/permissions';

/**
 * Détermine la meilleure route après connexion selon le rôle et les permissions.
 */
export function getPostLoginPath(user, requestedPath) {
  const home = getAccessibleHomePath(user);
  const fallback = home || '/dashboard';
  const safePath = getSafeRedirectPath(requestedPath, fallback);
  const pathOnly = normalizePathname(safePath);

  if (user && userCanAccessPath(user, pathOnly)) {
    return safePath;
  }

  if (import.meta.env.DEV) {
    console.warn(
      `[auth] Redirection post-login: "${requestedPath}" inaccessible → "${fallback}"`,
      { roles: user?.roles }
    );
  }

  return fallback;
}

export default getPostLoginPath;
