import { expect, it, vi } from 'vitest';
import { store } from '../../store/store.js';
import { readWorkspace } from '../../store/actions/workspaceActions.js';
import { registrationConfirmed } from '../../store/slices/authSlice.js';
import { cancelEventRequest, createEventRequest, selectWorkspaceEventRequests } from '../../store/slices/eventRequestsSlice.js';

it('invalidates the portal after a confirmed create and preserves its records on a rejected cancellation', async () => {
  store.dispatch(registrationConfirmed({ userId: 'client-1', role: 'client', token: 'signed-in' }));
  const existing = [{ requestId: 'open-1', status: 'pending' }];
  const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
  await store.dispatch(readWorkspace({ request: () => json({ eventRequests: existing }) })).unwrap();
  const revision = store.getState().client.revision;
  const invalidate = vi.fn();
  vi.stubGlobal('EventFlowData', { invalidate });
  let respond;
  vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { respond = resolve; })));

  const body = { eventName: 'Planning session' };
  const create = store.dispatch(createEventRequest({ body }));
  expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/event-requests$/), expect.objectContaining({
    method: 'POST',
    body: JSON.stringify(body),
  }));
  expect(selectWorkspaceEventRequests(store.getState())).toEqual(existing);
  expect(store.getState().client.revision).toBe(revision);
  expect(invalidate).not.toHaveBeenCalled();

  const saved = { requestId: 'saved-1', ...body };
  respond(json({ data: saved }, 201));
  expect(await create.unwrap()).toEqual(saved);
  expect(store.getState().client.revision).toBe(revision + 1);
  expect(invalidate).toHaveBeenCalledOnce();

  fetch.mockResolvedValueOnce(json({ success: false }));
  const cancel = await store.dispatch(cancelEventRequest({ id: 'open-1', body: { reason: 'Schedule changed' } }));
  expect(cancelEventRequest.rejected.match(cancel)).toBe(true);
  expect(selectWorkspaceEventRequests(store.getState())).toEqual(existing);
  expect(store.getState().client.revision).toBe(revision + 1);
  expect(invalidate).toHaveBeenCalledOnce();
});
