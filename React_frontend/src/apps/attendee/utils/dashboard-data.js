import { compareNewestFirst } from '../../../app/record-order.js';

export function summarizeDashboard(events, registrations) {
  const now = new Date();
  const active = registrations.filter(registration => registration.status !== 'waitlisted');
  const eventFor = registration =>
    events.find(event => String(event.id || event.eventId) === String(registration.eventId)) || {
      id: registration.eventId,
      title: 'Event',
      emoji: '🎟️',
      date: '',
      time: '',
      venue: '',
    };
  const confirmed = active.filter(registration =>
    ['confirmed', 'registered'].includes(registration.status)
  );
  const awaiting = active.filter(
    registration =>
      registration.status === 'pending_payment' &&
      (!registration.reservationExpiresAt || new Date(registration.reservationExpiresAt) > now)
  );
  const attended = active.filter(
    registration => registration.checkedIn || registration.status === 'attended'
  );
  const paid = active.reduce(
    (total, registration) =>
      total +
      (['completed', 'paid'].includes(registration.payment) ||
      registration.paymentObj?.status === 'completed'
        ? Number(registration.paymentObj?.amount ?? registration.amount ?? 0)
        : 0),
    0
  );
  const refunded = active.reduce(
    (total, registration) =>
      total +
      (registration.refundStatus === 'completed' ||
      registration.payment === 'refunded' ||
      registration.refundObj?.status === 'completed'
        ? Number(registration.refundObj?.amount ?? registration.amount ?? 0)
        : 0),
    0
  );
  const registeredIds = new Set(
    registrations.filter(item => item.status !== 'cancelled').map(item => String(item.eventId))
  );
  const hasCapacity = event =>
    Number(
      event.remainingCapacity ?? Number(event.capacity || 100) - Number(event.registered || 0)
    ) > 0 && event.status !== 'full';
  const recommended = events
    .filter(
      event =>
        !['completed', 'cancelled'].includes(String(event.status).toLowerCase()) &&
        (!event.date || new Date(`${event.date}T23:59:59`) >= now) &&
        !registeredIds.has(String(event.id || event.eventId))
    )
    .sort(
      (leftEvent, rightEvent) =>
        Number(hasCapacity(rightEvent)) - Number(hasCapacity(leftEvent)) ||
        compareNewestFirst(leftEvent, rightEvent)
    )
    .slice(0, 4);
  const upcoming = active
    .filter(registration => {
      const event = eventFor(registration);
      return (
        ['confirmed', 'registered'].includes(registration.status) &&
        !registration.checkedIn &&
        event.date &&
        new Date(`${event.date}T23:59:59`) >= now
      );
    })
    .sort(compareNewestFirst);
  return {
    confirmed,
    awaiting,
    attended,
    netSpent: Math.max(0, paid - refunded),
    recommended,
    upcoming,
    eventFor,
  };
}
