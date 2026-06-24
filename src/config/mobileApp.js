/**
 * Liens de téléchargement de l'application mobile.
 * Renseigner les URLs lorsque les applications seront publiées sur les stores.
 */
export const MOBILE_APP_LINKS = {
  googlePlay: import.meta.env.VITE_GOOGLE_PLAY_URL || null,
  appStore: import.meta.env.VITE_APP_STORE_URL || null,
};

export const MOBILE_APP_AVAILABLE = Boolean(
  MOBILE_APP_LINKS.googlePlay || MOBILE_APP_LINKS.appStore
);
