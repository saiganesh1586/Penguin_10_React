import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supportIdentity, supportTicketsActions } from '../../../store/slices/supportTicketsSlice.js';

export default function useSupportRequests(user) {
  const dispatch = useDispatch();
  const state = useSelector(rootState => rootState.supportTickets);
  const identity = supportIdentity(user);
  const visibleState =
    state.identity === identity
      ? state
      : { tickets: [], loading: true, error: '' };

  const refresh = useCallback(
    async signal => {
      try {
        return await dispatch(supportTicketsActions.loadTickets({ identity }, { signal })).unwrap();
      } catch {
        return null;
      }
    },
    [dispatch, identity]
  );

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const create = useCallback(
    (request, files) =>
      dispatch(supportTicketsActions.createTicket({ request, files, identity })).unwrap(),
    [dispatch, identity]
  );
  const followUp = useCallback(
    (id, message) =>
      dispatch(supportTicketsActions.sendTicketFollowUp({ id, message, identity })).unwrap(),
    [dispatch, identity]
  );
  const updateTicket = useCallback(
    (id, values) =>
      dispatch(supportTicketsActions.updateTicket({ id, values, identity })).unwrap(),
    [dispatch, identity]
  );
  const remove = useCallback(
    id => dispatch(supportTicketsActions.deleteTicket({ id, identity })).unwrap(),
    [dispatch, identity]
  );

  return {
    tickets: visibleState.tickets,
    loading: visibleState.loading,
    error: visibleState.error,
    refresh,
    create,
    followUp,
    updateTicket,
    remove,
  };
}
