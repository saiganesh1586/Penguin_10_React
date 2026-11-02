import { useCallback, useEffect, useState } from 'react';
import { listTickets } from '../../customer-support/api/supportApi.js';

export default function useSupportQueue(user, getOptions) {
  const [state, setState] = useState({ tickets: [], loading: true, error: '', request: null });
  const refresh = useCallback(
    async signal => {
      const request = {};
      const requestSignal = typeof signal?.aborted === 'boolean' ? signal : undefined;
      setState(current => ({ ...current, request, loading: true, error: '' }));
      let tickets = [];
      let error = '';
      try {
        tickets = await listTickets(user, requestSignal);
      } catch (failure) {
        error = failure.message || 'Unable to load support tickets.';
      }
      const options = getOptions();
      const existingIds = new Set(tickets.map(ticket => String(ticket.ticketId)));
      tickets = [
        ...tickets,
        ...(options.getAdditionalTickets?.() || []).filter(
          ticket => !existingIds.has(String(ticket.ticketId))
        ),
      ];
      if (!requestSignal?.aborted)
        setState(current =>
          current.request === request ? { tickets, loading: false, error, request } : current
        );
      return tickets;
    },
    [user, getOptions]
  );
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  return { tickets: state.tickets, loading: state.loading, error: state.error, refresh };
}
