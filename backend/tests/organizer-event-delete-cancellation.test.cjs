const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { DataStore } = require(path.join(__dirname, '../dist/common/data-store.js'));
const { EventsService } = require(path.join(__dirname, '../dist/modules/events/events.service.js'));
const { UserRole } = require(path.join(__dirname, '../dist/common/constants.js'));

function createTestHarness() {
  const store = DataStore.getInstance();
  store.restoreFromDisk();
  const service = new EventsService(store);
  return { store, service };
}

test('1. Eligible Draft Event Deletion: Organizer deletes draft without registrations', () => {
  const { store, service } = createTestHarness();

  const organizerId = 'org-delete-test-1';
  const userId = 'usr-delete-test-1';
  const eventId = 'ev-draft-eligible-' + Date.now();

  store.users.push({
    userId,
    name: 'Test Organizer',
    email: `org-${Date.now()}@test.com`,
    password: 'hash',
    userRole: UserRole.EVENT_ORGANIZER,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.organizers.push({
    organizerId,
    userId,
    rating: 5,
    verificationStatus: 'Approved',
    createdAt: new Date(),
  });

  store.events.push({
    eventId,
    organizerId,
    name: 'Draft Strategy Session',
    category: 'Corporate',
    date: '2099-12-01',
    time: '10:00',
    location: 'Conference Room B',
    capacity: 50,
    ticketPrice: 0,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Organizer can delete their draft event
  const result = service.delete(eventId, UserRole.EVENT_ORGANIZER, userId);
  assert.match(result.message, new RegExp(`Event ${eventId} deleted successfully`));
  assert.equal(
    store.events.some(e => e.eventId === eventId),
    false
  );
});

test('2. Permission Failures: Other organizers and unauthorized roles cannot delete event', () => {
  const { store, service } = createTestHarness();

  const ownerOrgId = 'org-owner-' + Date.now();
  const ownerUserId = 'usr-owner-' + Date.now();
  const otherUserId = 'usr-other-' + Date.now();
  const attendeeUserId = 'usr-att-' + Date.now();
  const eventId = 'ev-draft-perm-' + Date.now();

  store.organizers.push({
    organizerId: ownerOrgId,
    userId: ownerUserId,
    rating: 5,
    verificationStatus: 'Approved',
    createdAt: new Date(),
  });

  store.organizers.push({
    organizerId: 'org-other-' + Date.now(),
    userId: otherUserId,
    rating: 5,
    verificationStatus: 'Approved',
    createdAt: new Date(),
  });

  store.events.push({
    eventId,
    organizerId: ownerOrgId,
    name: 'Protected Draft Session',
    category: 'Workshop',
    date: '2099-12-01',
    time: '10:00',
    location: 'Studio 1',
    capacity: 30,
    ticketPrice: 0,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Other organizer cannot delete
  assert.throws(
    () => service.delete(eventId, UserRole.EVENT_ORGANIZER, otherUserId),
    /You can only delete your own events/
  );

  // Attendee cannot delete
  assert.throws(
    () => service.delete(eventId, UserRole.ATTENDEE, attendeeUserId),
    /Only organizers and super admin can delete events/
  );

  // Event must remain intact
  assert.ok(store.events.some(e => e.eventId === eventId));
});

test('3. Blocked Deletion: Published, registered, completed, or client-cancelled events cannot be deleted', () => {
  const { store, service } = createTestHarness();

  const orgId = 'org-rules-' + Date.now();
  const userId = 'usr-rules-' + Date.now();

  store.organizers.push({
    organizerId: orgId,
    userId,
    rating: 5,
    verificationStatus: 'Approved',
    createdAt: new Date(),
  });

  // A. Published event cannot be deleted
  const publishedId = 'ev-pub-' + Date.now();
  store.events.push({
    eventId: publishedId,
    organizerId: orgId,
    name: 'Published Summit',
    category: 'Conference',
    date: '2099-12-01',
    time: '09:00',
    location: 'Main Hall',
    capacity: 200,
    ticketPrice: 100,
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  assert.throws(
    () => service.delete(publishedId, UserRole.EVENT_ORGANIZER, userId),
    /Only draft events without registrations can be deleted; cancel an active event instead/
  );

  // B. Draft event with existing registrations cannot be deleted
  const draftWithRegId = 'ev-draft-reg-' + Date.now();
  store.events.push({
    eventId: draftWithRegId,
    organizerId: orgId,
    name: 'Draft With Registrations',
    category: 'Workshop',
    date: '2099-12-01',
    time: '09:00',
    location: 'Room 201',
    capacity: 50,
    ticketPrice: 0,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  store.registrations.push({
    registrationId: 'reg-' + Date.now(),
    eventId: draftWithRegId,
    attendeeId: 'att-1',
    status: 'registered',
    registrationDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  assert.throws(
    () => service.delete(draftWithRegId, UserRole.EVENT_ORGANIZER, userId),
    /Only draft events without registrations can be deleted; cancel an active event instead/
  );

  // C. Completed event cannot be deleted
  const completedId = 'ev-comp-' + Date.now();
  store.events.push({
    eventId: completedId,
    organizerId: orgId,
    name: 'Completed Gala',
    category: 'Corporate',
    date: '2026-01-01',
    time: '18:00',
    location: 'Grand Ballroom',
    capacity: 150,
    ticketPrice: 500,
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  assert.throws(
    () => service.delete(completedId, UserRole.EVENT_ORGANIZER, userId),
    /Only draft events without registrations can be deleted; cancel an active event instead/
  );

  // D. Client-cancelled event cannot be deleted
  const clientCancelledId = 'ev-cc-' + Date.now();
  store.events.push({
    eventId: clientCancelledId,
    organizerId: orgId,
    name: 'Cancelled Booking',
    category: 'Corporate',
    date: '2099-12-01',
    time: '18:00',
    location: 'Grand Ballroom',
    capacity: 150,
    ticketPrice: 500,
    status: 'cancelled',
    cancellation: {
      reason: 'Client requested cancellation',
      cancelledBy: 'usr-client',
      cancelledAt: new Date(),
      policyVersion: '1.0',
      paidAmount: 50000,
      cancellationFeePercent: 10,
      cancellationFee: 5000,
      refundAmount: 45000,
      refundStatus: 'pending',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  assert.throws(
    () => service.delete(clientCancelledId, UserRole.EVENT_ORGANIZER, userId),
    /A client-cancelled event cannot be deleted/
  );
});

test('4. Active Event Cancellation: Organizer cancels published event with registrations and pending refund', () => {
  const { store, service } = createTestHarness();

  const orgId = 'org-cancel-' + Date.now();
  const userId = 'usr-cancel-' + Date.now();
  const eventId = 'ev-cancel-' + Date.now();
  const attendeeId = 'att-cancel-' + Date.now();
  const attendeeUserId = 'usr-att-cancel-' + Date.now();
  const regId = 'reg-cancel-' + Date.now();
  const paymentId = 'pay-cancel-' + Date.now();

  store.organizers.push({
    organizerId: orgId,
    userId,
    rating: 5,
    verificationStatus: 'Approved',
    createdAt: new Date(),
  });

  store.attendees.push({
    attendeeId,
    userId: attendeeUserId,
    createdAt: new Date(),
  });

  store.events.push({
    eventId,
    organizerId: orgId,
    name: 'Active Product Expo',
    category: 'Conference',
    date: '2099-12-15',
    time: '10:00',
    location: 'Convention Center',
    capacity: 100,
    ticketPrice: 500,
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.registrations.push({
    registrationId: regId,
    eventId,
    attendeeId,
    status: 'registered',
    qrCode: 'QR_TICKET_DATA_123',
    verificationId: 'VERIF_PASS_999',
    registrationDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.payments.push({
    paymentId,
    registrationId: regId,
    amount: 500,
    status: 'completed',
    paymentMethod: 'Credit Card',
    transactionId: 'TXN_' + Date.now(),
    createdAt: new Date(),
  });

  // Short reason (< 10 chars) is rejected
  assert.throws(
    () =>
      service.update(
        eventId,
        { status: 'cancelled', changeReason: 'Too short' },
        UserRole.EVENT_ORGANIZER,
        userId
      ),
    /A cancellation reason of at least 10 characters is required/
  );

  // Cancellation with valid reason
  const result = service.update(
    eventId,
    { status: 'cancelled', changeReason: 'Unforeseen venue closure due to building maintenance' },
    UserRole.EVENT_ORGANIZER,
    userId
  );

  assert.equal(result.status, 'cancelled');

  // Verify event status and change history
  const ev = store.events.find(e => e.eventId === eventId);
  assert.equal(ev.status, 'cancelled');
  assert.equal(ev.cancellationReason, 'Unforeseen venue closure due to building maintenance');

  // Verify registration cancelled and QR code / ticket invalidated
  const reg = store.registrations.find(r => r.registrationId === regId);
  assert.equal(reg.status, 'cancelled');
  assert.equal(reg.qrCode, undefined);
  assert.equal(reg.verificationId, undefined);

  // Verify refund queued with status 'pending' (never claim completed)
  const refund = store.refunds.find(r => r.registrationId === regId);
  assert.ok(refund);
  assert.equal(refund.status, 'pending');
  assert.equal(refund.amount, 500);

  // Verify notifications sent to attendee
  const attendeeNotifs = store.notifications.filter(
    n => n.userId === attendeeUserId && n.eventId === eventId
  );
  assert.ok(attendeeNotifs.some(n => n.type === 'event_cancelled'));
  assert.ok(attendeeNotifs.some(n => n.type === 'refund_pending'));
});

test('5. Unpaid Event Cancellation: Cancelling unpaid event invalidates tickets and generates zero refunds', () => {
  const { store, service } = createTestHarness();

  const orgId = 'org-unpaid-' + Date.now();
  const userId = 'usr-unpaid-' + Date.now();
  const eventId = 'ev-unpaid-' + Date.now();
  const attendeeId = 'att-unpaid-' + Date.now();
  const regId = 'reg-unpaid-' + Date.now();

  store.organizers.push({
    organizerId: orgId,
    userId,
    rating: 5,
    verificationStatus: 'Approved',
    createdAt: new Date(),
  });

  store.attendees.push({
    attendeeId,
    userId: 'usr-att-free',
    createdAt: new Date(),
  });

  store.events.push({
    eventId,
    organizerId: orgId,
    name: 'Free Tech Workshop',
    category: 'Workshop',
    date: '2099-12-20',
    time: '14:00',
    location: 'Open Lab',
    capacity: 40,
    ticketPrice: 0,
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  store.registrations.push({
    registrationId: regId,
    eventId,
    attendeeId,
    status: 'registered',
    qrCode: 'QR_FREE_999',
    verificationId: 'V_FREE_999',
    registrationDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Cancel event
  const result = service.update(
    eventId,
    { status: 'cancelled', changeReason: 'Operational difficulties with venue setup' },
    UserRole.EVENT_ORGANIZER,
    userId
  );

  assert.equal(result.status, 'cancelled');

  // Verify registration cancelled and ticket cleared
  const reg = store.registrations.find(r => r.registrationId === regId);
  assert.equal(reg.status, 'cancelled');
  assert.equal(reg.qrCode, undefined);
  assert.equal(reg.verificationId, undefined);

  // Zero refunds generated
  assert.equal(store.refunds.filter(r => r.registrationId === regId).length, 0);

  // Organizer gets zero refund
  const ev = store.events.find(e => e.eventId === eventId);
  assert.equal(ev.cancellation?.paidAmount, 0);
  assert.equal(ev.cancellation?.refundAmount, 0);
});

test('6. Multiple Attendees: Only paid attendees receive Pending refunds, unpaid do not', () => {
  const { store, service } = createTestHarness();

  const orgId = 'org-multi-' + Date.now();
  const userId = 'usr-multi-' + Date.now();
  const eventId = 'ev-multi-' + Date.now();

  store.organizers.push({
    organizerId: orgId,
    userId,
    rating: 5,
    verificationStatus: 'Approved',
    createdAt: new Date(),
  });

  store.events.push({
    eventId,
    organizerId: orgId,
    name: 'DevOps Conference',
    category: 'Conference',
    date: '2099-12-25',
    time: '09:00',
    location: 'Auditorium A',
    capacity: 200,
    ticketPrice: 1000,
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const regPaid1 = 'reg-p1-' + Date.now();
  const regPaid2 = 'reg-p2-' + Date.now();
  const regUnpaid = 'reg-u3-' + Date.now();

  store.registrations.push(
    {
      registrationId: regPaid1,
      eventId,
      attendeeId: 'att-1',
      status: 'registered',
      qrCode: 'QR_1',
      verificationId: 'V_1',
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      registrationId: regPaid2,
      eventId,
      attendeeId: 'att-2',
      status: 'registered',
      qrCode: 'QR_2',
      verificationId: 'V_2',
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      registrationId: regUnpaid,
      eventId,
      attendeeId: 'att-3',
      status: 'registered',
      qrCode: 'QR_3',
      verificationId: 'V_3',
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  store.payments.push(
    {
      paymentId: 'pay-m1',
      registrationId: regPaid1,
      amount: 1000,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      paymentId: 'pay-m2',
      registrationId: regPaid2,
      amount: 1000,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  service.update(
    eventId,
    { status: 'cancelled', changeReason: 'Insufficient registrations for conference scale' },
    UserRole.EVENT_ORGANIZER,
    userId
  );

  // All registrations cancelled and tickets invalidated
  [regPaid1, regPaid2, regUnpaid].forEach(id => {
    const r = store.registrations.find(reg => reg.registrationId === id);
    assert.equal(r.status, 'cancelled');
    assert.equal(r.qrCode, undefined);
    assert.equal(r.verificationId, undefined);
  });

  // Exactly 2 refunds created with status 'pending'
  const eventRefunds = store.refunds.filter(
    r =>
      r.registrationId === regPaid1 ||
      r.registrationId === regPaid2 ||
      r.registrationId === regUnpaid
  );
  assert.equal(eventRefunds.length, 2);
  assert.ok(eventRefunds.every(r => r.status === 'pending' && r.amount === 1000));
  assert.equal(
    store.refunds.some(r => r.registrationId === regUnpaid),
    false
  );
});

test('7. Duplicate Cancellation Blocked: Attempting to cancel already cancelled event fails', () => {
  const { store, service } = createTestHarness();

  const orgId = 'org-dup-' + Date.now();
  const userId = 'usr-dup-' + Date.now();
  const eventId = 'ev-dup-' + Date.now();

  store.organizers.push({
    organizerId: orgId,
    userId,
    rating: 5,
    verificationStatus: 'Approved',
    createdAt: new Date(),
  });

  store.events.push({
    eventId,
    organizerId: orgId,
    name: 'Cancelled Meetup',
    category: 'Corporate',
    date: '2099-12-25',
    time: '18:00',
    location: 'Hall B',
    capacity: 50,
    ticketPrice: 0,
    status: 'cancelled',
    cancellationReason: 'Already cancelled',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.throws(
    () =>
      service.update(
        eventId,
        { status: 'cancelled', changeReason: 'Duplicate attempt to cancel' },
        UserRole.EVENT_ORGANIZER,
        userId
      ),
    /already been cancelled|Duplicate cancellations are blocked/
  );
});

test('8. Completed Event Cancellation Blocked: Completed events cannot be cancelled', () => {
  const { store, service } = createTestHarness();

  const orgId = 'org-comp-' + Date.now();
  const userId = 'usr-comp-' + Date.now();
  const eventId = 'ev-comp-block-' + Date.now();

  store.organizers.push({
    organizerId: orgId,
    userId,
    rating: 5,
    verificationStatus: 'Approved',
    createdAt: new Date(),
  });

  store.events.push({
    eventId,
    organizerId: orgId,
    name: 'Past Annual Gala',
    category: 'Corporate',
    date: '2026-01-01',
    time: '18:00',
    location: 'Grand Ballroom',
    capacity: 100,
    ticketPrice: 1000,
    status: 'completed',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.throws(
    () =>
      service.update(
        eventId,
        { status: 'cancelled', changeReason: 'Attempt to cancel completed event' },
        UserRole.EVENT_ORGANIZER,
        userId
      ),
    /Cannot change an event from completed to cancelled/
  );
});
