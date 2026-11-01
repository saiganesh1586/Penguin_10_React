export function ticketEvent(registration, events) {
  return (
    events.find(event => String(event.id || event.eventId) === String(registration.eventId)) ||
    registration.event || {
      title: 'Unknown',
      emoji: '🎟️',
      color: '#7c6ff7',
      venue: '',
      date: '',
      time: '',
    }
  );
}
const isRefund = registration =>
  registration.refundStatus === 'pending' ||
  registration.refundStatus === 'completed' ||
  registration.payment === 'refunded' ||
  Number(registration.refundObj?.amount) > 0 ||
  (registration.status === 'cancelled' &&
    (Number(registration.amount) > 0 || registration.refundStatus));
function isUpcoming(registration, events) {
  if (registration.status === 'rejected') return !registration.declineViewedAt;
  if (
    !['confirmed', 'registered', 'booked', 'pending_approval', 'pending_payment'].includes(
      registration.status
    ) ||
    registration.checkedIn
  )
    return false;
  const event = ticketEvent(registration, events);
  return (
    !['cancelled', 'completed'].includes(event.status) &&
    Date.parse(`${event.date}T23:59:59`) >= Date.now()
  );
}
export function ticketView(registrations, events, tab, filter, sort) {
  const active = registrations.filter(registration => registration.status !== 'waitlisted');
  const upcoming = active.filter(registration => isUpcoming(registration, events));
  const upcomingIds = new Set(
    upcoming.map(registration => String(registration.registrationId || registration.id))
  );
  const other = active.filter(
    registration => !upcomingIds.has(String(registration.registrationId || registration.id))
  );
  const tabRegistrations = tab === 'upcoming' ? upcoming : other;
  const activeFilter =
    filter === 'waitlisted' ||
    (tab === 'upcoming' &&
      !['all', 'registered', 'pending_approval', 'pending_payment', 'rejected'].includes(filter))
      ? 'all'
      : filter;
  const counts = {
    all: tabRegistrations.length,
    registered: tabRegistrations.filter(item =>
      ['confirmed', 'registered', 'booked'].includes(item.status)
    ).length,
    pending_approval: tabRegistrations.filter(item => item.status === 'pending_approval').length,
    pending_payment: tabRegistrations.filter(item => item.status === 'pending_payment').length,
    refund: tabRegistrations.filter(isRefund).length,
    cancelled: tabRegistrations.filter(item => item.status === 'cancelled').length,
    rejected: tabRegistrations.filter(item => item.status === 'rejected').length,
    'checked-in': tabRegistrations.filter(item => item.checkedIn || item.status === 'attended')
      .length,
  };
  const filtered = tabRegistrations.filter(
    item =>
      activeFilter === 'all' ||
      (activeFilter === 'registered'
        ? ['confirmed', 'registered', 'booked'].includes(item.status)
        : activeFilter === 'refund'
        ? isRefund(item)
        : activeFilter === 'checked-in'
        ? item.checkedIn || item.status === 'attended'
        : item.status === activeFilter)
  );
  filtered.sort((a, b) => {
    const left = Date.parse(ticketEvent(a, events).date);
    const right = Date.parse(ticketEvent(b, events).date);
    if (Number.isNaN(left)) return Number.isNaN(right) ? 0 : 1;
    if (Number.isNaN(right)) return -1;
    return sort === 'earliest' ? left - right : right - left;
  });
  return {
    upcoming,
    other,
    counts,
    activeFilter,
    filtered,
  };
}
