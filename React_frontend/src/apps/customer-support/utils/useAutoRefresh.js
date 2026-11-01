import { useEffect, useRef } from 'react';
export default function useAutoRefresh(refresh, { enabled = true, interval = 8000 } = {}) {
  const latest = useRef(refresh);
  latest.current = refresh;
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    let running = false;
    const update = async () => {
      if (!active || running || document.hidden) return;
      running = true;
      try {
        await latest.current();
      } catch {
        /* The feature retains its last data and reports errors. */
      } finally {
        running = false;
      }
    };
    const timer = setInterval(update, interval);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [enabled, interval]);
}
