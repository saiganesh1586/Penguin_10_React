import { expect, it, vi } from 'vitest';
import { store } from '../../store/store.js';
import { registrationConfirmed } from '../../store/slices/authSlice.js';
import { loadEvents, loadPublicEvents, selectPublicEvents } from '../../store/slices/eventsSlice.js';

it('keeps the public catalog separate from signed-in event results and sends no public credentials', async () => {
  store.dispatch(registrationConfirmed({ userId: 'org-1', role: 'organizer', token: 'signed-in' }));
  const publicEvents = [{ eventId: 'public-1' }];
  const managedEvents = [{ eventId: 'draft-1' }];
  const json = data => new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce(json(publicEvents))
    .mockResolvedValueOnce(json(managedEvents)));

  await store.dispatch(loadPublicEvents()).unwrap();
  await store.dispatch(loadEvents({ query: { status: 'draft' } })).unwrap();

  expect(selectPublicEvents(store.getState())).toEqual(publicEvents);
  expect(store.getState().resources.events.byQuery['/api/events?status=draft']).toEqual(managedEvents);
  expect(fetch).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/public\/events$/), expect.objectContaining({
    headers: {},
  }));
  expect(fetch).toHaveBeenNthCalledWith(2, expect.stringMatching(/\/events\?status=draft$/), expect.objectContaining({
    headers: { Authorization: 'Bearer signed-in' },
  }));
});
