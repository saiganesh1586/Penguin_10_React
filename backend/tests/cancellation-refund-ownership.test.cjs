const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

const { DataStore } = require('../src/common/data-store');
const { UserRole } = require('../src/common/constants');
const { EventRequestsService } = require('../src/modules/event-requests/event-requests.service');
const { EventsService } = require('../src/modules/events/events.service');
const { AnalyticsService } = require('../src/modules/analytics/analytics.service');
const { FinanceService } = require('../src/modules/finance/finance.service');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-refund-owner-'));
  const previousFile = process.env.EVENTFLOW_DATA_FILE;
  const previousMode = process.env.NODE_ENV;
  const file = path.join(directory, 'store.json');
  process.env.EVENTFLOW_DATA_FILE = file;
  process.env.NODE_ENV = 'test';
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const now = new Date();
  const policy = {
    version: 'accepted-policy-v25',
    cancellation: {
      minimumNoticeDays: 14, feePercent: 25, refundEligible: true,
      approvalMode: 'manual', additionalTerms: '', isDefault: false,
    },
    sections: [],
  };
  const request = {
    requestId: 'req-refund-owner', eventId: 'evt-refund-owner', clientId: 'cli-001', organizerId: 'org-001',
    eventName: 'Refund ownership conference', eventDate: '2099-12-29', eventTime: '10:00',
    budget: 90000, capacity: 50, requirements: 'Conference requirements.',
    status: 'confirmed', agreementStatus: 'agreed', paymentStatus: 'deposit_paid',
    policySnapshot: policy, auditHistory: [], createdAt: now, updatedAt: now,
  };
  const event = {
    eventId: request.eventId, clientId: request.clientId, organizerId: request.organizerId,
    name: request.eventName, category: 'Conference', date: request.eventDate, time: '10:00',
    location: 'Conference Hall', capacity: 50, ticketPrice: 0, status: 'ongoing',
    policySnapshot: policy, createdAt: now, updatedAt: now,
  };
  db.events = [event];
  db.eventRequests = [request];
  db.eventWorkflowPayments = [];
  db.eventWorkflowRefunds = [];
  db.registrations = [];
  db.payments = [];
  db.refunds = [];
  t.after(() => {
    DataStore.instance = undefined;
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previousFile;
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-refund-owner-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return { db, request, event, policy, file };
}

test('client cancellation refunds only successful client payments, applies accepted fee, and blocks duplicates', t => {
  const { db, request, policy, file } = fixture(t);
  const now = new Date();
  db.eventWorkflowPayments.push(
    { paymentId: 'client-deposit', requestId: request.requestId, eventId: request.eventId, clientId: request.clientId, organizerId: request.organizerId, amount: 10.01, status: 'completed', paymentDate: now.toISOString(), paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
    { paymentId: 'client-installment', requestId: request.requestId, eventId: request.eventId, clientId: request.clientId, organizerId: request.organizerId, amount: 5.02, status: 'completed', paymentDate: now.toISOString(), paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
    { paymentId: 'failed-payment', requestId: request.requestId, eventId: request.eventId, clientId: request.clientId, organizerId: request.organizerId, amount: 700, status: 'failed', paymentDate: now.toISOString(), paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
    { paymentId: 'other-client-payment', requestId: request.requestId, eventId: request.eventId, clientId: 'other-client', organizerId: request.organizerId, amount: 900, status: 'completed', paymentDate: now.toISOString(), paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
    { paymentId: 'client-deposit', requestId: request.requestId, eventId: request.eventId, clientId: request.clientId, organizerId: request.organizerId, amount: 10.01, status: 'completed', paymentDate: now.toISOString(), paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
  );
  const requests = new EventRequestsService();
  const preview = requests.requestCancellationPreview(request.requestId, UserRole.CLIENT, 'usr-client-001').data;
  assert.equal(preview.paidAmount, 15.03);
  assert.equal(preview.cancellationFee, 3.76);
  assert.equal(preview.refundAmount, 11.27);

  const result = requests.cancelRequest(request.requestId, {
    reason: 'The client changed the event schedule.',
    expectedPaidAmount: 15.03,
    policyAccepted: true,
    acceptedPolicyVersion: policy.version,
  }, UserRole.CLIENT, 'usr-client-001');
  assert.equal(result.data.cancellation.organizerRefundAmount, 0);
  assert.equal(result.data.cancellation.refundSimulated, true);
  const refunds = db.eventWorkflowRefunds.filter(refund => refund.requestId === request.requestId);
  assert.equal(refunds.length, 2);
  assert.deepEqual(refunds.map(refund => refund.paymentId).sort(), ['client-deposit', 'client-installment']);
  assert.equal(refunds.reduce((sum, refund) => sum + refund.amount, 0), 11.27);
  assert.ok(refunds.every(refund => refund.payerId === request.clientId));
  assert.ok(refunds.every(refund => refund.recipientUserId === 'usr-client-001' && refund.recipientRole === 'client'));
  assert.ok(refunds.every(refund => refund.simulated && refund.status === 'pending'));
  assert.ok(refunds.every(refund => !['org-001', 'usr-org-001'].includes(refund.payerId) &&
    refund.recipientUserId !== 'usr-org-001'));
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(saved.eventWorkflowRefunds.filter(refund => refund.requestId === request.requestId).length, 2);
  assert.equal(saved.eventRequests.find(item => item.requestId === request.requestId).cancellation.organizerRefundAmount, 0);
  assert.throws(() => requests.cancelRequest(request.requestId, {
    reason: 'Duplicate client cancellation.',
    expectedPaidAmount: 15.03,
    policyAccepted: true,
    acceptedPolicyVersion: policy.version,
  }, UserRole.CLIENT, 'usr-client-001'), /already been recorded/);
  assert.equal(db.eventWorkflowRefunds.filter(refund => refund.requestId === request.requestId).length, 2);
});

test('organizer cancellation refunds the client and affected ticket payers, never the organizer', t => {
  const { db, request, event } = fixture(t);
  const now = new Date();
  db.eventWorkflowPayments.push(
    { paymentId: 'booking-deposit', requestId: request.requestId, eventId: event.eventId, clientId: request.clientId, organizerId: request.organizerId, amount: 12.34, status: 'completed', paymentDate: now.toISOString(), paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
    { paymentId: 'booking-failed', requestId: request.requestId, eventId: event.eventId, clientId: request.clientId, organizerId: request.organizerId, amount: 900, status: 'failed', paymentDate: now.toISOString(), paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
  );
  const attendee = db.attendees[0];
  db.registrations.push({
    registrationId: 'reg-cancelled-event', attendeeId: attendee.attendeeId, eventId: event.eventId,
    registrationDate: now.toISOString(), status: 'registered', ticketType: 'General',
    createdAt: now, updatedAt: now,
  });
  db.payments.push(
    { paymentId: 'ticket-partial-a', registrationId: 'reg-cancelled-event', amount: 40.25, status: 'completed', paymentDate: now.toISOString(), paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
    { paymentId: 'ticket-partial-b', registrationId: 'reg-cancelled-event', amount: 5.75, status: 'completed', paymentDate: now.toISOString(), paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
    { paymentId: 'ticket-failed', registrationId: 'reg-cancelled-event', amount: 700, status: 'failed', paymentDate: now.toISOString(), paymentMethod: 'DEMO_PROVIDER', createdAt: now, updatedAt: now },
  );

  new EventsService().update(event.eventId, {
    status: 'cancelled',
    changeReason: 'The organizer venue is unexpectedly unavailable.',
  }, UserRole.EVENT_ORGANIZER, 'usr-org-001');

  assert.equal(request.status, 'cancelled');
  assert.equal(request.cancellation.paidAmount, 12.34);
  assert.equal(request.cancellation.refundAmount, 12.34);
  assert.equal(request.cancellation.cancellationFee, 0);
  assert.equal(request.cancellation.organizerRefundAmount, 0);
  assert.equal(request.cancellation.refundSimulated, true);
  assert.equal(request.cancellation.policyVersion, 'accepted-policy-v25');
  const bookingRefunds = db.eventWorkflowRefunds.filter(refund => refund.requestId === request.requestId);
  assert.equal(bookingRefunds.length, 1);
  assert.equal(bookingRefunds[0].paymentId, 'booking-deposit');
  assert.equal(bookingRefunds[0].amount, 12.34);
  assert.equal(bookingRefunds[0].payerId, request.clientId);
  assert.equal(bookingRefunds[0].recipientUserId, 'usr-client-001');
  assert.equal(bookingRefunds[0].recipientRole, 'client');
  assert.equal(bookingRefunds[0].status, 'pending');
  assert.equal(bookingRefunds[0].simulated, true);

  assert.equal(db.refunds.length, 2);
  assert.deepEqual(db.refunds.map(refund => refund.paymentId).sort(), ['ticket-partial-a', 'ticket-partial-b']);
  assert.equal(db.refunds.reduce((sum, refund) => sum + refund.amount, 0), 46);
  assert.ok(db.refunds.every(refund => refund.payerId === attendee.attendeeId));
  assert.ok(db.refunds.every(refund => refund.recipientUserId === attendee.userId && refund.recipientRole === 'attendee'));
  assert.ok(db.refunds.every(refund => refund.status === 'pending' && refund.simulated));
  assert.ok(db.eventWorkflowRefunds.every(refund => refund.recipientUserId !== 'usr-org-001'));
  assert.equal(new AnalyticsService().getOrganizerDashboard(UserRole.EVENT_ORGANIZER, 'usr-org-001').data.totalRevenue, 0);
  const finance = new FinanceService();
  assert.equal(finance.dashboard('usr-emp-001c', UserRole.EMPLOYEE).totals.grossRevenue, 0);
  assert.equal(finance.report('usr-emp-001c', UserRole.EMPLOYEE, { type: 'events' }).rows.length, 0);
  assert.equal(finance.report('usr-emp-001c', UserRole.EMPLOYEE, { type: 'transactions' }).rows.length, 3,
    'cancelled booking payments remain available in transaction history');
  assert.equal(finance.report('usr-emp-001c', UserRole.EMPLOYEE, { type: 'refunds' }).rows.length, 2,
    'pending attendee refunds remain available in refund history');
  assert.throws(() => new EventsService().update(event.eventId, {
    status: 'cancelled',
    changeReason: 'The organizer venue is unexpectedly unavailable.',
  }, UserRole.EVENT_ORGANIZER, 'usr-org-001'), /already been cancelled/);
  assert.equal(db.refunds.length, 2);
  assert.equal(db.eventWorkflowRefunds.length, 1);
});

test('zero-paid confirmed client booking produces no refund transaction and never attributes a fee to the organizer', t => {
  const { db, request, policy } = fixture(t);
  request.policySnapshot = {
    ...policy,
    cancellation: { ...policy.cancellation, refundEligible: false },
  };
  const requests = new EventRequestsService();
  const preview = requests.requestCancellationPreview(request.requestId, UserRole.CLIENT, 'usr-client-001').data;
  assert.equal(preview.paidAmount, 0);
  assert.equal(preview.cancellationFee, 0);
  assert.equal(preview.refundAmount, 0);
  const result = requests.cancelRequest(request.requestId, {
    reason: 'The client no longer needs this event.',
    expectedPaidAmount: 0,
    policyAccepted: true,
    acceptedPolicyVersion: policy.version,
  }, UserRole.CLIENT, 'usr-client-001');
  assert.equal(result.data.cancellation.organizerRefundAmount, 0);
  assert.equal(result.data.cancellation.refundSimulated, false);
  assert.equal(result.data.cancellation.refundStatus, 'not_applicable');
  assert.equal(db.eventWorkflowRefunds.length, 0);
  assert.equal(db.refunds.length, 0);
});
