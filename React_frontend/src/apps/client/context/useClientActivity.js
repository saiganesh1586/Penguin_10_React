import { useCallback, useEffect, useState } from 'react';
import { loadClientActivity } from '../api/client-api.js';

export default function useClientActivity(refreshKey) {
  const [activity, setActivity] = useState({ rows: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setActivity(current => ({ ...current, loading: true, error: '' }));
    Promise.resolve()
      .then(() => loadClientActivity())
      .then(
        rows => active && setActivity({ rows, loading: false, error: '' }),
        error => active && setActivity({
          rows: [],
          loading: false,
          error: error.message || 'Unable to load activity.',
        })
      );
    return () => {
      active = false;
    };
  }, [refreshKey, attempt]);

  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return { ...activity, retry };
}
