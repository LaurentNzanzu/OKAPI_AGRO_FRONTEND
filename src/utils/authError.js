export const AUTH_UNAVAILABLE = 'Service temporairement indisponible. Veuillez réessayer.';

// Never render an Axios error/config or validation input: it can contain credentials.
export function authErrorMessage(error, fallback = 'La demande a échoué. Veuillez réessayer.') {
  const status = error?.response?.status ?? error?.status;
  if (!status || status >= 500) return AUTH_UNAVAILABLE;
  if (status === 401) return 'Votre session a expiré. Veuillez vous reconnecter.';
  if (status === 403) return 'Vous ne disposez pas des autorisations nécessaires.';
  return fallback;
}
