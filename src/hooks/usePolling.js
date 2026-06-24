import { useEffect, useRef } from 'react';

/**
 * Polling centralisé avec pause lorsque l'onglet est masqué.
 * @param {Function} callback
 * @param {number} intervalMs
 * @param {{ immediate?: boolean, enabled?: boolean } | boolean} options
 */
export const usePolling = (callback, intervalMs = 30000, options = {}) => {
  const normalized = typeof options === 'boolean'
    ? { immediate: options, enabled: true }
    : { immediate: true, enabled: true, ...options };

  const { immediate, enabled } = normalized;
  const savedCallback = useRef(callback);
  const intervalId = useRef(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    const tick = () => savedCallback.current?.();

    const start = () => {
      if (intervalId.current) return;
      intervalId.current = setInterval(tick, intervalMs);
    };

    const stop = () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
    };

    if (immediate) tick();
    start();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        tick();
        start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, immediate, enabled]);
};

export default usePolling;
