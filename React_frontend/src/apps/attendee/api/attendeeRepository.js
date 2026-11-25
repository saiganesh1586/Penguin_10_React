import { createPortalRepository, readRuntimeData } from '../../../app/state/portalRepository.js';
import { selectSession } from '../../auth/authSlice.js';

export const attendeeRepository = createPortalRepository(async ({ pageProps = {}, signal, getState }) => {
  const [eventRows, registrationRows, notificationRows] = await Promise.all([
    pageProps.events ? window.apiGetEvents() : null,
    pageProps.registrations ? window.apiGetAttendeeRegistrations() : null,
    pageProps.notifications ? window.apiGetNotifications() : null,
  ]);
  if (signal.aborted) return null;
  const catalog = window.EventFlowAttendeeData;
  // The runtime needs its own copies for the registration and ticket dialogs.
  return readRuntimeData({
    CU: selectSession(getState()),
    events: pageProps.events ? catalog.setEvents(eventRows) : [],
    registrations: pageProps.registrations ? catalog.setRegistrations(registrationRows) : [],
    notifications: pageProps.notifications ? catalog.setNotifications(notificationRows) : [],
  });
});
