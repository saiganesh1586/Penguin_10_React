import { useCallback, useEffect, useRef, useState } from 'react';
import { listTickets, sendFollowUp, submitTicket, uploadAttachment } from '../api/supportApi.js';

export default function useSupportRequests(user) {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const identity = `${user?.id || user?.userId}:${user?.token || ''}`;
  const activeIdentity = useRef(identity);
  const requestSequence = useRef(0);
  const mounted = useRef(false);
  activeIdentity.current = identity;
  const refresh = useCallback(
    async signal => {
      const sequence = ++requestSequence.current;
      // Ignore responses from an older refresh, a signed-out user, or an unmounted page.
      const isCurrentResponse = () =>
        mounted.current &&
        activeIdentity.current === identity &&
        sequence === requestSequence.current;
      try {
        const result = await listTickets(user, signal);
        if (isCurrentResponse()) {
          setTickets(result);
          setError('');
        }
        return result;
      } catch (failure) {
        if (failure.name !== 'AbortError' && isCurrentResponse())
          setError(failure.message || 'Unable to load support tickets.');
        return null;
      } finally {
        if (isCurrentResponse()) setLoading(false);
      }
    },
    [identity, user]
  );
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    setLoading(true);
    setTickets([]);
    setError('');
    refresh(controller.signal);
    return () => {
      mounted.current = false;
      requestSequence.current++;
      controller.abort();
    };
  }, [refresh]);
  const create = async (request, files) => {
    const attachmentIds = [];
    for (const file of files) attachmentIds.push((await uploadAttachment(user, file)).attachmentId);
    const result = await submitTicket(user, { ...request, attachmentIds });
    await refresh();
    return result;
  };
  const followUp = async (id, message) => {
    await sendFollowUp(user, id, message);
    await refresh();
  };
  return { tickets, error, loading, refresh, create, followUp };
}
