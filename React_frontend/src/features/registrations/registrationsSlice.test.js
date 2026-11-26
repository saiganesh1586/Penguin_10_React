import { expect, it, vi } from 'vitest';
import { createRuntimeFetch } from '../../store/api/portalRepository.js';
import { portalSlices, store } from '../../store/store.js';
import { readWorkspace } from '../../store/actions/workspaceActions.js';
import { registrationConfirmed } from '../../store/slices/authSlice.js';
import { cancelRegistration, selectWorkspaceRegistrations } from '../../store/slices/registrationsSlice.js';

it('routes an attendee cancellation through its named thunk and refreshes saved rows after success', async () => {
  store.dispatch(registrationConfirmed({ userId: 'attendee-1', role: 'attendee', token: 'signed-in' }));
  const registration = { registrationId: 'reg-1', status: 'registered' };
  const updated = { ...registration, status: 'cancelled' };
  const json = data => new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
  await store.dispatch(readWorkspace({ request: () => json({ registrations: [registration] }) })).unwrap();
  const revision = store.getState().attendee.revision;
  const invalidate = vi.fn();
  const actions = [];
  const dispatch = async input => {
    const action = await store.dispatch(input);
    actions.push(action);
    return action;
  };
  const request = createRuntimeFetch(dispatch, portalSlices.attendee.actions, invalidate, () => 'signed-in');
  let respond;
  vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { respond = resolve; })));

  const pending = request('/api/registrations/reg-1/cancel', { method: 'PATCH' });
  expect(selectWorkspaceRegistrations(store.getState())).toEqual([registration]);
  expect(store.getState().attendee.revision).toBe(revision);
  respond(json(updated));

  expect(await (await pending).json()).toEqual(updated);
  expect(actions.some(cancelRegistration.fulfilled.match)).toBe(true);
  expect(store.getState().attendee.revision).toBe(revision + 1);
  expect(invalidate).toHaveBeenCalledOnce();

  await store.dispatch(readWorkspace({ request: () => json({ registrations: [updated] }) })).unwrap();
  expect(selectWorkspaceRegistrations(store.getState())).toEqual([updated]);
});
