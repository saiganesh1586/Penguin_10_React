import { useCallback, useEffect, useRef, useState } from 'react';
import { listTickets, sendFollowUp, submitTicket, uploadAttachment } from '../api/supportApi.js';

export default function useSupportRequests(user) {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const identity = `${user?.id || user?.userId}:${user?.token || ''}`;
  const activeIdentity = useRef(identity), read = useRef(0), mounted = useRef(false);
  activeIdentity.current = identity;
  const refresh = useCallback(async signal => {
    const sequence = ++read.current;
    try {
      const result = await listTickets(user, signal);
      if (mounted.current && activeIdentity.current === identity && sequence === read.current) {
        setTickets(result); setError('');
      }
      return result;
    } catch (failure) {
      if (failure.name !== 'AbortError' && mounted.current && activeIdentity.current === identity && sequence === read.current) setError(failure.message || 'Unable to load support tickets.');
      return null;
    } finally {
      if (mounted.current && activeIdentity.current === identity && sequence === read.current) setLoading(false);
    }
  }, [identity, user]);
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    setLoading(true); setTickets([]); setError('');
    refresh(controller.signal);
    return () => { mounted.current = false; read.current++; controller.abort(); };
  }, [refresh]);
  const create = async (request, files) => {
    const attachmentIds = [];
    for (const file of files) attachmentIds.push((await uploadAttachment(user, file)).attachmentId);
    const result = await submitTicket(user, { ...request, attachmentIds });
    await refresh();
    return result;
  };
  const followUp = async (id, message) => { await sendFollowUp(user, id, message); await refresh(); };
  return { tickets, error, loading, refresh, create, followUp };
}
