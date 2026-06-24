/**
 * Feature flags pour déploiement progressif.
 * VITE_FF_STRICT_BIEN_PERMISSIONS=false désactive temporairement les garde-fous UI biens.
 * La sécurité API reste active côté backend.
 */
export const FEATURE_FLAGS = {
  strictBienPermissions: import.meta.env.VITE_FF_STRICT_BIEN_PERMISSIONS !== 'false',
};

export default FEATURE_FLAGS;
