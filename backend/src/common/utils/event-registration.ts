import type { Event, EventRequest } from '../data-store';

export function requiresRegistrationApproval(event: Pick<Event, 'visibility'>): boolean {
  return event.visibility === 'private';
}

/** Confirmed client bookings are also open to attendees without changing their booking lifecycle. */
export function isEventOpenForRegistration(event: Event, requests: EventRequest[]): boolean {
  if (event.status === 'published') return true;
  return event.status === 'ongoing' && Boolean(event.clientId) && requests.some(request =>
    request.eventId === event.eventId && request.organizerId === event.organizerId && request.clientId === event.clientId
    && ['confirmed', 'approved'].includes(request.status) && !request.cancellation);
}
