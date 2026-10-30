import { useCallback, useEffect, useState } from 'react';
import { logout, readSession } from '../../../app/session.js';
import { SESSION_KEY } from '../../../app/config.js';

export default function useStoredSession() {
  const [user, setUser] = useState(readSession);
  useEffect(() => {
    const update = event => { if (event.key === SESSION_KEY || event.key === null) setUser(readSession()); };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);
  const signOut = useCallback(() => { logout(); setUser(null); }, []);
  return { user, signOut };
}
