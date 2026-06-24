import { useState, useEffect, useCallback } from 'react';
import { fournituresService } from '../services/fournitures';
import usePolling from './usePolling';

const POLL_INTERVAL_MS = 30000;

/**
 * Hook pour charger et rafraîchir les fournitures en attente.
 * @param {{ poll?: boolean }} options
 */
export function useFournitures({ poll = false } = {}) {
  const [fournitures, setFournitures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setRefreshing(true);
      setError(null);
      const data = await fournituresService.getEnAttente();
      setFournitures(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  usePolling(() => refresh({ silent: true }), POLL_INTERVAL_MS, { enabled: poll });

  return { fournitures, loading, refreshing, error, refresh, count: fournitures.length };
}

export default useFournitures;
