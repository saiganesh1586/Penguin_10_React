import { createPortalRepository, readRuntimeData } from '../../../store/api/portalRepository.js';
import { selectSession } from '../../../store/slices/authSlice.js';
import { API_BASE_URL } from '../../../app/config.js';

const collectionsByPage = {
  dashboard: ['events', 'registrations'],
  'browse-events': ['events', 'registrations'],
  'my-tickets': ['events', 'registrations'],
  notifications: ['notifications'],
  profile: ['events', 'registrations'],
};
const paths = {
  events: '/events',
  registrations: '/registrations',
  notifications: '/notifications',
};

async function readCollection(name, token, signal) {
  let response;
  try {
    response = await (window.EventFlowFetch || fetch)(`${API_BASE_URL}${paths[name]}`, {
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (error) {
    if (signal.aborted) throw error;
    if (error.name === 'TypeError' || /fetch|network/i.test(error.message))
      throw new Error('Backend server is offline. Please start the NestJS server on port 3001.');
    throw error;
  }
  const body = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : { message: await response.text() };
  if (!response.ok) {
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return body;
}

export const attendeeRepository = createPortalRepository(async ({ page, signal, getState }) => {
  const session = selectSession(getState());
  const collections = collectionsByPage[page] || [];
  const rows = await Promise.all(collections.map(name => readCollection(name, session?.token, signal)));
  if (signal.aborted) return null;
  const raw = Object.fromEntries(collections.map((name, index) => [name, rows[index]]));
  // The runtime keeps a separate catalog for checkout, registration, and ticket dialogs.
  const catalog = window.EventFlowAttendeeData;
  return readRuntimeData({
    CU: session,
    events: raw.events ? catalog.setEvents(raw.events) : [],
    registrations: raw.registrations ? catalog.setRegistrations(raw.registrations) : [],
    notifications: raw.notifications ? catalog.setNotifications(raw.notifications) : [],
  });
});
