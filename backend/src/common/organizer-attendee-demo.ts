import type { DataStore, Registration } from './data-store';
import { UserRole } from './constants';
export const ORGANIZER_ATTENDEE_DEMO = 'organizer-attendees-v1' as const;
export const PRIVATE_ATTENDEE_DEMO_EVENT = 'evt-demo-orgatt-private';
type DemoStore = Pick<
  DataStore,
  | 'users'
  | 'attendees'
  | 'organizers'
  | 'events'
  | 'registrations'
  | 'payments'
  | 'refunds'
  | 'notifications'
  | 'attendance'
  | 'eventChanges'
>;

/** Populate the organizer's existing sample events with actual registration rows. */
export function seedOrganizerAttendeeDemo(store: DemoStore, now = new Date()): void {
  if (
    process.env.NODE_ENV === 'production' ||
    !store.organizers.some(item => item.organizerId === 'org-001')
  )
    return;
  const day = (offset: number) =>
    new Date(now.getTime() + (offset * 24 + 5.5) * 3_600_000).toISOString().slice(0, 10);
  const createdAt = new Date(now.getTime() - 5 * 86_400_000);
  const reviewedAt = new Date(now.getTime() - 4 * 86_400_000);
  const paidAt = new Date(now.getTime() - 3 * 86_400_000);
  const cancelledAt = new Date(now.getTime() - 86_400_000);
  const profiles = ['att-001', 'att-002']
    .map(id => store.attendees.find(item => item.attendeeId === id))
    .filter(
      (item): item is NonNullable<typeof item> =>
        !!item && store.users.some(user => user.userId === item.userId)
    );
  const names = [
    'Aditi Shah',
    'Meera Iyer',
    'Kavya Nair',
    'Neha Kapoor',
    'Ishita Rao',
    'Riya Patel',
    'Ananya Das',
    'Sana Khan',
  ];
  names.forEach((name, index) => {
    const suffix = String(index + 1).padStart(3, '0');
    const userId = `usr-demo-orgatt-${suffix}`;
    const attendeeId = `att-demo-orgatt-${suffix}`;
    if (!store.users.some(user => user.userId === userId))
      store.users.push({
        userId,
        name: `${name} (Demo)`,
        email: `organizer-attendee-${suffix}@example.test`,
        password: 'DemoAttendee@123',
        userRole: UserRole.ATTENDEE,
        status: 'active',
        phoneNo: `9000010${suffix}`,
        demoScenario: ORGANIZER_ATTENDEE_DEMO,
        createdAt,
        updatedAt: createdAt,
      });
    let profile = store.attendees.find(item => item.attendeeId === attendeeId);
    if (!profile) {
      profile = {
        attendeeId,
        userId,
        createdAt,
      };
      store.attendees.push(profile);
    }
    profiles.push(profile);
  });
  if (!store.events.some(event => event.eventId === PRIVATE_ATTENDEE_DEMO_EVENT))
    store.events.push({
      eventId: PRIVATE_ATTENDEE_DEMO_EVENT,
      organizerId: 'org-001',
      name: 'Engineering Leadership Roundtable (Demo)',
      category: 'Conference',
      date: day(45),
      time: '10:00',
      location: 'Demo Innovation Centre, Bengaluru',
      capacity: 60,
      ticketPrice: 750,
      status: 'published',
      visibility: 'private',
      description:
        'Attendee approval demo: review pending applications, approve payment access, or decline with a reason.',
      demoScenario: ORGANIZER_ATTENDEE_DEMO,
      createdAt: now,
      updatedAt: now,
    });
  const events = store.events.filter(
    event =>
      event.organizerId === 'org-001' &&
      ['published', 'ongoing'].includes(event.status) &&
      (event.demoScenario === 'organizer-dashboard-v3' ||
        event.eventId === PRIVATE_ATTENDEE_DEMO_EVENT)
  );
  for (const event of events)
    profiles.forEach((profile, index) => {
      const attendee =
        event.eventId === PRIVATE_ATTENDEE_DEMO_EVENT
          ? profiles[(index + profiles.length - 3) % profiles.length]
          : profile;
      const registrationId = `reg-demo-orgatt-${event.eventId}-${attendee.attendeeId}`;
      if (
        store.registrations.some(
          item =>
            item.registrationId === registrationId ||
            (item.eventId === event.eventId && item.attendeeId === attendee.attendeeId)
        )
      )
        return;
      const isPrivate = event.visibility === 'private';
      let status: Registration['status'] = 'registered';
      if (index === 8) status = 'cancelled';
      else if (isPrivate && index === 7) status = 'rejected';
      else if (isPrivate && [3, 4, 5, 9].includes(index)) status = 'pending_approval';
      else if (event.ticketPrice > 0 && (index === 6 || (!isPrivate && index === 7)))
        status = 'pending_payment';
      const reviewStatus =
        status === 'rejected' ? 'rejected' : status === 'pending_approval' ? undefined : 'approved';
      const verificationId =
        status === 'registered' ? `DEMO-ORGATT-${event.eventId}-${attendee.attendeeId}` : undefined;
      store.registrations.push({
        registrationId,
        attendeeId: attendee.attendeeId,
        eventId: event.eventId,
        registrationDate: day(-5),
        status,
        reviewStatus,
        reviewedAt: reviewStatus ? reviewedAt : undefined,
        ticketType: 'General Admission',
        additionalInfo: 'Organizer attendee-management demo registration.',
        verificationId,
        qrCode: verificationId,
        rejectionReason:
          status === 'rejected'
            ? 'This roundtable requires an engineering leadership role that was not included in the application.'
            : undefined,
        cancellationReason:
          status === 'cancelled' ? 'The attendee changed their travel plans.' : undefined,
        cancelledAt: status === 'cancelled' ? cancelledAt : undefined,
        createdAt,
        updatedAt: status === 'cancelled' ? cancelledAt : reviewedAt,
      });
      const hasPayment = event.ticketPrice > 0 && ['registered', 'cancelled'].includes(status);
      const failedPayment = event.ticketPrice > 0 && !isPrivate && index === 7;
      const paymentId = `pay-demo-orgatt-${registrationId}`;
      if (
        (hasPayment || failedPayment) &&
        !store.payments.some(item => item.paymentId === paymentId)
      )
        store.payments.push({
          paymentId,
          registrationId,
          amount: event.ticketPrice,
          status: failedPayment ? 'failed' : 'completed',
          paymentDate: day(-3),
          paymentMethod: 'DEMO_PROVIDER',
          createdAt: paidAt,
          updatedAt: paidAt,
        });
      if (
        status === 'cancelled' &&
        hasPayment &&
        !store.refunds.some(item => item.registrationId === registrationId)
      )
        store.refunds.push({
          refundId: `ref-demo-orgatt-${registrationId}`,
          paymentId,
          registrationId,
          amount: event.ticketPrice,
          payerId: attendee.attendeeId,
          recipientUserId: attendee.userId,
          recipientRole: 'attendee',
          status: 'pending',
          simulated: true,
          reason: 'Demo attendee cancellation within the event policy.',
          requestedAt: cancelledAt,
        });
    });
}

/** Strip this cohort and its dependent records when loading a production store. */
export function removeOrganizerAttendeeDemo(store: DemoStore): boolean {
  const demoUsers = new Set(
    store.users
      .filter(
        user =>
          user.demoScenario === ORGANIZER_ATTENDEE_DEMO ||
          user.userId.startsWith('usr-demo-orgatt-')
      )
      .map(user => user.userId)
  );
  const demoProfiles = new Set(
    store.attendees
      .filter(item => demoUsers.has(item.userId) || item.attendeeId.startsWith('att-demo-orgatt-'))
      .map(item => item.attendeeId)
  );
  const registrations = store.registrations.filter(
    item =>
      item.registrationId.startsWith('reg-demo-orgatt-') ||
      item.eventId === PRIVATE_ATTENDEE_DEMO_EVENT ||
      demoProfiles.has(item.attendeeId)
  );
  const demoRegistrations = new Set(registrations.map(item => item.registrationId));
  const attendancePairs = new Set(registrations.map(item => `${item.eventId}:${item.attendeeId}`));
  const changed =
    demoUsers.size > 0 ||
    demoRegistrations.size > 0 ||
    store.events.some(event => event.eventId === PRIVATE_ATTENDEE_DEMO_EVENT);
  store.registrations = store.registrations.filter(
    item => !demoRegistrations.has(item.registrationId)
  );
  store.payments = store.payments.filter(item => !demoRegistrations.has(item.registrationId));
  store.refunds = store.refunds.filter(item => !demoRegistrations.has(item.registrationId));
  store.notifications = store.notifications.filter(
    item =>
      !demoUsers.has(item.userId) &&
      !demoRegistrations.has(item.registrationId || '') &&
      item.eventId !== PRIVATE_ATTENDEE_DEMO_EVENT
  );
  store.attendance = store.attendance.filter(
    item =>
      !attendancePairs.has(`${item.eventId}:${item.attendeeId}`) &&
      !demoProfiles.has(item.attendeeId)
  );
  store.eventChanges = store.eventChanges.filter(
    item => item.eventId !== PRIVATE_ATTENDEE_DEMO_EVENT
  );
  store.events = store.events.filter(event => event.eventId !== PRIVATE_ATTENDEE_DEMO_EVENT);
  store.attendees = store.attendees.filter(item => !demoProfiles.has(item.attendeeId));
  store.users = store.users.filter(item => !demoUsers.has(item.userId));
  return changed;
}
