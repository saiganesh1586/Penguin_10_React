import { useEffect, useState } from 'react';

export default function useAttendeeData({ events = false, registrations = false, notifications = false } = {}) {
  const [state, setState] = useState({ loading: true, error: '', events: [], registrations: [], notifications: [] });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState(current => ({ ...current, loading: true, error: '' }));
    Promise.all([
      events ? window.apiGetEvents() : Promise.resolve(null),
      registrations ? window.apiGetAttendeeRegistrations() : Promise.resolve(null),
      notifications ? window.apiGetNotifications() : Promise.resolve(null),
    ]).then(([eventRows, registrationRows, notificationRows]) => {
      if (!active) return;
      const catalog = window.EventFlowAttendeeData;
      const nextEvents = events ? catalog.setEvents(eventRows) : null;
      const nextRegistrations = registrations ? catalog.setRegistrations(registrationRows) : null;
      const nextNotifications = notifications ? catalog.setNotifications(notificationRows) : null;
      setState({ loading: false, error: '', events: nextEvents || catalog.getEvents(), registrations: nextRegistrations || [], notifications: nextNotifications || [] });
    }).catch(error => { if (active) setState(current => ({ ...current, loading: false, error: error.message || 'Please try again.' })); });
    return () => { active = false; };
  }, [events, registrations, notifications, attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
