import { useCallback, useEffect, useState } from 'react';

// Role hooks supply their API loader; page components receive only its current result.
export default function usePortalData(load, page, initialData, waitForLoad = false) {
  const [state, setState] = useState({
    data: initialData,
    loading: waitForLoad || !initialData,
    error: '',
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState(current => ({ ...current, loading: waitForLoad || !initialData, error: '' }));
    Promise.resolve()
      .then(() => load(page, initialData, attempt))
      .then(data => {
        if (active) setState({ data, loading: false, error: '' });
      })
      .catch(error => {
        if (active)
          setState(current => ({
            ...current,
            loading: false,
            error: error.message || 'Please try again.',
          }));
      });
    return () => {
      active = false;
    };
  }, [load, page, initialData, attempt, waitForLoad]);

  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return { ...state, retry };
}
