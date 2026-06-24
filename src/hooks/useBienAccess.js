import { useCallback } from 'react';
import { biensService } from '../services/biens';
import usePermissions from './usePermissions';

const FINANCIAL_KEYS = new Set([
  'prix_acquisition',
  'date_acquisition',
  'cumul_amortissement',
  'cumul_depreciation',
  'statut_comptable',
  'valeur_nette',
  'valeur_comptable',
]);

/**
 * Centralise l'accès aux biens (contexte panne, filtrage financier côté client).
 */
export function useBienAccess() {
  const { canViewPurchasePrice, isTechnicien } = usePermissions();

  const sanitizeBienDisplay = useCallback(
    (bien) => {
      if (!bien || canViewPurchasePrice) return bien;
      const sanitized = { ...bien };
      FINANCIAL_KEYS.forEach((key) => {
        delete sanitized[key];
      });
      return sanitized;
    },
    [canViewPurchasePrice],
  );

  const fetchBienForContext = useCallback(
    async (bienId, { panneId } = {}) => {
      if (!bienId) {
        return { data: null, denied: false, error: null };
      }

      try {
        const data = await biensService.getById(bienId, { panneId });
        return {
          data: sanitizeBienDisplay(data),
          denied: false,
          error: null,
        };
      } catch (err) {
        const status = err.response?.status;
        if (status === 403) {
          return {
            data: null,
            denied: true,
            error: 'Accès aux détails du bien refusé pour votre rôle.',
          };
        }
        if (status === 404) {
          return {
            data: null,
            denied: false,
            error: 'Bien introuvable.',
          };
        }
        return {
          data: null,
          denied: false,
          error: err.response?.data?.detail || 'Impossible de charger le bien associé.',
        };
      }
    },
    [sanitizeBienDisplay],
  );

  const resolveBienFromPanne = useCallback(
    async (panneData) => {
      if (!panneData?.id_bien) {
        return { data: null, denied: false, error: null, fromPanne: false };
      }

      if (panneData.bien_context) {
        return {
          data: sanitizeBienDisplay(panneData.bien_context),
          denied: false,
          error: null,
          fromPanne: true,
        };
      }

      const result = await fetchBienForContext(panneData.id_bien, {
        panneId: panneData.id_panne,
      });
      return { ...result, fromPanne: false };
    },
    [fetchBienForContext, sanitizeBienDisplay],
  );

  return {
    canViewPurchasePrice,
    isTechnicien,
    sanitizeBienDisplay,
    fetchBienForContext,
    resolveBienFromPanne,
  };
}

export default useBienAccess;
