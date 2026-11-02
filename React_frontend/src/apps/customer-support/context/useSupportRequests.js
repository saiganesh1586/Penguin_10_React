import { useCallback, useEffect, useState } from 'react';
import { listTickets, sendFollowUp, submitTicket, uploadAttachment } from '../api/supportApi.js';

export default function useSupportRequests(user) {
  const identity = [user?.id || user?.userId, user?.token || ''].join(':');
  const [state, setState] = useState({
    identity,
    tickets: [],
    loading: true,
    error: '',
    request: null,
  });
  const refresh = useCallback(
    async signal => {
      const request = {};
      const requestSignal = typeof signal?.aborted === 'boolean' ? signal : undefined;
      setState(current => (current.identity === identity ? { ...current, request } : current));
      try {
        const tickets = await listTickets(user, requestSignal);
        // A later refresh or a different account owns the screen once its request starts.
        setState(current =>
          current.identity === identity && current.request === request
            ? { ...current, tickets, loading: false, error: '' }
            : current
        );
        return tickets;
      } catch (error) {
        if (error.name !== 'AbortError')
          setState(current =>
            current.identity === identity && current.request === request
              ? {
                  ...current,
                  loading: false,
                  error: error.message || 'Unable to load support tickets.',
                }
              : current
          );
        return null;
      }
    },
    [identity, user]
  );

  useEffect(() => {
    const controller = new AbortController();
    setState({ identity, tickets: [], loading: true, error: '', request: null });
    refresh(controller.signal);
    return () => controller.abort();
  }, [identity, refresh]);

  const create = useCallback(
    async (request, files) => {
      const attachmentIds = [];
      for (const file of files)
        attachmentIds.push((await uploadAttachment(user, file)).attachmentId);
      const result = await submitTicket(user, { ...request, attachmentIds });
      await refresh();
      return result;
    },
    [user, refresh]
  );
  const followUp = useCallback(
    async (id, message) => {
      await sendFollowUp(user, id, message);
      await refresh();
    },
    [user, refresh]
  );

  const visible = state.identity === identity ? state : { tickets: [], loading: true, error: '' };
  return {
    tickets: visible.tickets,
    loading: visible.loading,
    error: visible.error,
    refresh,
    create,
    followUp,
  };
}
