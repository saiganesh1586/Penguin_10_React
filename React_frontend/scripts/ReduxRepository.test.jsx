import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createPortalSlice } from '../src/store/factories/createPortalSlice.js';
import { createPortalRepository, createRuntimeFetch } from '../src/store/api/portalRepository.js';
import { store } from '../src/store/store.js';
import { clientSlice } from '../src/store/slices/clientSlice.js';
import ClientPageContainer from '../src/apps/client/app/ClientPageContainer.jsx';
import { login, logout, saveAccountPreferences, selectSession } from '../src/store/slices/authSlice.js';
import { selectWorkspace } from '../src/store/slices/resourcesSlice.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status });

function setup() {
  const events = createPortalSlice('events', createPortalRepository(async () => ['event-1']));
  const store = configureStore({ reducer: { events: events.reducer } });
  const invalidate = vi.fn();
  return { store, events, invalidate, request: createRuntimeFetch(store.dispatch, events.actions, invalidate) };
}

describe('Redux API repositories', () => {
  it.each(['POST', 'PATCH', 'PUT', 'DELETE'])(
    'invalidates the active repository only after a successful %s',
    async method => {
      const { store, events, invalidate, request } = setup();
      await store.dispatch(events.actions.loadData({ page: 'events' })).unwrap();
      let respond;
      vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { respond = resolve; })));

      const pending = request('/api/events/event-1', { method });
      expect(Object.keys(store.getState().events.pendingWrites)).toHaveLength(1);
      expect(store.getState().events.data).toEqual(['event-1']);
      expect(store.getState().events.revision).toBe(0);
      expect(invalidate).not.toHaveBeenCalled();

      respond(json({ id: 'event-1' }));
      expect(await (await pending).json()).toEqual({ id: 'event-1' });
      expect(store.getState().events.pendingWrites).toEqual({});
      expect(store.getState().events.revision).toBe(1);
      expect(invalidate).toHaveBeenCalledOnce();
    }
  );

  it('preserves the previous Redux data and returns the server error to the writer', async () => {
    const { store, events, invalidate, request } = setup();
    await store.dispatch(events.actions.loadData({ page: 'events' })).unwrap();
    vi.stubGlobal('fetch', vi.fn(async () => json({ message: 'Already registered' }, 409)));

    const response = await request('/api/registrations', { method: 'POST' });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: 'Already registered' });
    expect(store.getState().events.data).toEqual(['event-1']);
    expect(store.getState().events.pendingWrites).toEqual({});
    expect(store.getState().events.revision).toBe(0);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('reads the client workspace on mount and refreshes after a confirmed write', async () => {
    store.dispatch(clientSlice.actions.reset());
    let notifications = [{ id: 'one', title: 'Initial notification', read: false }];
    let respond;
    const runtime = {
      snapshot: (pageProps = {}) => ({
        DB: { notifications },
        CU: { id: 'client-1', token: 'session-token' },
        visibleNotifications: () => notifications,
        pageProps,
      }),
    };
    vi.stubGlobal('EventFlowClientRuntime', runtime);
    vi.stubGlobal('EventFlowData', { sync: vi.fn(async () => {}) });
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { respond = resolve; })));
    const request = createRuntimeFetch(store.dispatch, clientSlice.actions, vi.fn());
    vi.stubGlobal('markNotifRead', id => request(`/api/notifications/${id}/read`, { method: 'PATCH' }));

    render(<ClientPageContainer page="notifications" />);
    await screen.findByText('Initial notification');
    const before = store.getState().client.data;
    expect(before.CU).toEqual({ id: 'client-1' });
    expect(before.visibleNotifications).toBeUndefined();
    expect(before.DB.notifications).not.toBe(notifications);

    act(() => screen.getByText('Initial notification').click());
    expect(fetch).toHaveBeenCalledWith('/api/notifications/one/read', { method: 'PATCH' });
    expect(store.getState().client.data).toBe(before);

    notifications = [{ id: 'one', title: 'Confirmed notification', read: true }];
    await act(async () => respond(json(notifications[0])));
    await screen.findByText('Confirmed notification');
    await waitFor(() => expect(store.getState().client.data.notificationRows).toEqual(notifications));
    expect(before.notificationRows[0].read).toBe(false);
  });

  it('commits an authenticated session only on success and discards a late login after logout', async () => {
    const account = { userId: 'client-1', role: 'client', token: 'session-token' };
    let respond;
    vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => { respond = resolve; })));
    const credentials = { email: 'client@example.test', password: 'Password@123' };
    const rejected = store.dispatch(login(credentials));
    expect(selectSession(store.getState())).toBeNull();
    respond(json({ message: 'Invalid credentials' }, 401));
    await expect(rejected).rejects.toMatchObject({ message: 'Invalid credentials' });
    expect(selectSession(store.getState())).toBeNull();

    const signIn = store.dispatch(login(credentials));
    respond(json({ success: true, data: account }));
    await expect(signIn).resolves.toMatchObject(account);
    expect(selectSession(store.getState())).toMatchObject(account);
    expect(JSON.parse(sessionStorage.getItem('ef_cu'))).toMatchObject(account);

    const obsolete = store.dispatch(login(credentials));
    store.dispatch(logout());
    respond(json({ success: true, data: account }));
    await expect(obsolete).rejects.toThrow('superseded');
    expect(selectSession(store.getState())).toBeNull();
    expect(sessionStorage.getItem('ef_cu')).toBeNull();
  });

  it('reads workspace entities into their resource slices and leaves them intact on a failed write', async () => {
    const notifications = [{ notificationId: 'n-1', read: false }];
    const workspace = {
      currentUser: { userId: 'client-1' }, version: '1', notifications,
      events: [{ eventId: 'event-1' }],
    };
    const response = body => new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
    const invalidate = vi.fn();
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response(workspace))
      .mockResolvedValueOnce(json({ message: 'Rejected' }, 409))
      .mockResolvedValueOnce(response({ success: true })));
    const request = createRuntimeFetch(store.dispatch, clientSlice.actions, invalidate, () => undefined);
    await request('/api/workspace');
    const initial = store.getState();
    expect(initial.resources.events.workspace).toEqual(workspace.events);
    expect(initial.resources.notifications.workspace).toEqual(notifications);
    expect(selectWorkspace(initial)).toMatchObject(workspace);

    await request('/api/notifications/n-1/read', { method: 'PATCH' });
    expect(store.getState().resources.notifications.workspace).toBe(initial.resources.notifications.workspace);
    expect(store.getState().client.revision).toBe(initial.client.revision);
    expect(invalidate).not.toHaveBeenCalled();

    await request('/api/notifications/n-1/read', { method: 'PATCH' });
    expect(store.getState().resources.notifications.revision).toBe(initial.resources.notifications.revision + 1);
    expect(store.getState().client.revision).toBe(initial.client.revision + 1);
    expect(invalidate).toHaveBeenCalledOnce();
  });

  it('changes preferences only after accepting the saved server profile', async () => {
    const account = {
      userId: 'client-1', role: 'client', token: 'session-token',
      preferences: { emailNotifications: true },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json(account)));
    await store.dispatch(login({ email: 'client@example.test', password: 'Password@123' }));
    let respond;
    fetch.mockImplementation(() => new Promise(resolve => { respond = resolve; }));
    const toggle = () => store.dispatch(saveAccountPreferences({ emailNotifications: false }));
    const declined = toggle();
    expect(selectSession(store.getState()).preferences.emailNotifications).toBe(true);
    respond(json({ message: 'Offline' }, 503));
    await declined;
    expect(selectSession(store.getState()).preferences.emailNotifications).toBe(true);
    const accepted = toggle();
    respond(json({ ...account, preferences: { emailNotifications: false } }));
    await accepted.unwrap();
    expect(selectSession(store.getState()).preferences.emailNotifications).toBe(false);
  });
});
