const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  transpileOnly: true,
});
const { DataStore } = require('../src/common/data-store');
const { UserRole } = require('../src/common/constants');
const { EventRequestsService } = require('../src/modules/event-requests/event-requests.service');
const { PaymentsService } = require('../src/modules/payments/payments.service');
const { EventsService } = require('../src/modules/events/events.service');
const { RegistrationsService } = require('../src/modules/registrations/registrations.service');
const { WorkspaceService } = require('../src/modules/analytics/workspace.service');
const { UsersService } = require('../src/modules/users/users.service');
const vm = require('node:vm');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-checkout-'));
  const previousFile = process.env.EVENTFLOW_DATA_FILE;
  const file = path.join(directory, 'store.json');
  process.env.EVENTFLOW_DATA_FILE = file;
  DataStore.instance = undefined;
  const db = DataStore.getInstance(),
    now = new Date();
  const request = {
    requestId: 'req-checkout',
    clientId: 'cli-001',
    organizerId: 'org-001',
    eventName: 'Checkout Conference',
    eventDate: '2099-12-29',
    eventTime: '10:00',
    venue: 'Conference Hall',
    capacity: 50,
    budget: 60000,
    status: 'awaiting_client',
    agreementStatus: 'pending_signature',
    paymentStatus: 'unpaid',
    activeEventPlanId: 'plan-checkout',
    proposals: [],
    auditHistory: [],
    createdAt: now,
    updatedAt: now,
  };
  const plan = {
    eventPlanId: 'plan-checkout',
    requestId: request.requestId,
    organizerId: request.organizerId,
    clientId: request.clientId,
    title: 'Approved plan',
    budget: 60000,
    approvalStatus: 'approved',
    status: 'approved',
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };
  db.eventRequests = [request];
  db.eventPlans = [plan];
  db.events = [];
  db.eventWorkflowPayments = [];
  db.eventWorkflowRefunds = [];
  db.notifications = [];
  t.after(() => {
    DataStore.instance = undefined;
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-checkout-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return {
    db,
    request,
    plan,
    file,
    requests: new EventRequestsService(),
    payments: new PaymentsService(),
  };
}
const demo = { paymentMethod: 'DEMO_PROVIDER' };
function sign(h) {
  h.requests.updateAgreementStatus(
    h.request.requestId,
    { agreementStatus: 'agreed' },
    UserRole.CLIENT,
    'usr-client-001'
  );
}

test('confirmed client bookings reach attendee Browse Events, workspace refreshes, details and registration', async t => {
  const h = fixture(t),
    events = new EventsService(),
    registrations = new RegistrationsService();
  assert.equal(
    events.findAll(UserRole.ATTENDEE, undefined, undefined, 'usr-attendee-001').length,
    0
  );
  sign(h);
  const booking = h.requests.payDeposit(
    h.request.requestId,
    demo,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  const catalog = events.findAll(UserRole.ATTENDEE, undefined, undefined, 'usr-attendee-001');
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].eventId, booking.eventId);
  assert.equal(
    catalog[0].status,
    'ongoing',
    'Attendee listing must preserve the client booking lifecycle'
  );
  assert.equal(
    events.findOne(booking.eventId, UserRole.ATTENDEE, 'usr-attendee-001').name,
    h.request.eventName
  );
  const workspace = new WorkspaceService(events, registrations, new UsersService());
  assert.ok(
    workspace
      .snapshot(UserRole.ATTENDEE, 'usr-attendee-001')
      .events.some(event => event.eventId === booking.eventId)
  );

  const source = require('../../React_frontend/scripts/attendee-source.cjs')();
  function section(from, to) {
    const start = source.indexOf(from),
      end = source.indexOf(to, start);
    assert.ok(start >= 0 && end > start);
    return source.slice(start, end);
  }
  const ui = vm.createContext({
    CU: { id: 'usr-attendee-001' },
    DB: { events: [], registrations: [] },
    catalog,
    escapeHtml: value =>
      String(value).replace(
        /[&<>"']/g,
        char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])
      ),
    evStatBadge: () => 'purple',
  });
  vm.runInContext(
    'let attendeeRegistrationCatalog = [];' +
      section('let attendeeEventCatalog = [];', 'function toggleRegTerms(') +
      section('function evCard(', 'function openAddEventModal(') +
      'attendeeEventCatalog = catalog.map(normalizeAttendeeEvent);',
    ui
  );
  const html = vm.runInContext('pageBrowseEvents()', ui);
  assert.match(html, /Checkout Conference/);
  assert.match(html, /Register<\/button>/);
  const registration = await registrations.create(
    { attendeeId: 'usr-attendee-001', eventId: booking.eventId, ticketType: 'General' },
    UserRole.ATTENDEE,
    'usr-attendee-001'
  );
  assert.equal(registration.data.status, 'registered');
  assert.ok(registration.data.verificationId);
  assert.ok(registration.data.qrCode);
  ui.registration = registration.data;
  assert.doesNotMatch(
    vm.runInContext('attendeeRegistrationCatalog = [registration]; pageBrowseEvents()', ui),
    /Checkout Conference/
  );

  h.db.persist();
  DataStore.instance = undefined;
  assert.ok(
    new EventsService()
      .findAll(UserRole.ATTENDEE, undefined, undefined, 'usr-attendee-001')
      .some(event => event.eventId === booking.eventId)
  );
});

test('unconfirmed, cancelled, completed, draft and past client events stay out of attendee discovery', async t => {
  const h = fixture(t);
  sign(h);
  const booking = h.requests.payDeposit(
    h.request.requestId,
    demo,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  const event = h.db.events.find(item => item.eventId === booking.eventId),
    events = new EventsService(),
    registrations = new RegistrationsService();
  for (const status of [
    'planning',
    'awaiting_client',
    'rejected',
    'withdrawn',
    'cancelled',
    'completed',
  ]) {
    h.request.status = status;
    assert.equal(events.findAll(UserRole.ATTENDEE).length, 0, status);
    assert.throws(() => events.findOne(event.eventId, UserRole.ATTENDEE), /not found/);
    await assert.rejects(
      registrations.create(
        { attendeeId: 'usr-attendee-001', eventId: event.eventId },
        UserRole.ATTENDEE,
        'usr-attendee-001'
      ),
      /not open/
    );
  }
  h.request.status = 'confirmed';
  for (const status of ['draft', 'cancelled', 'completed']) {
    event.status = status;
    assert.equal(events.findAll(UserRole.ATTENDEE).length, 0, status);
  }
  event.status = 'ongoing';
  event.date = '2020-01-01';
  assert.equal(events.findAll(UserRole.ATTENDEE).length, 0);
  await assert.rejects(
    registrations.create(
      { attendeeId: 'usr-attendee-001', eventId: event.eventId },
      UserRole.ATTENDEE,
      'usr-attendee-001'
    ),
    /already concluded/
  );
});

test('confirmed client events support attendee ticket payment and waitlist confirmation', async t => {
  const h = fixture(t);
  h.request.ticketPrice = 250.5;
  sign(h);
  const booking = h.requests.payDeposit(
    h.request.requestId,
    demo,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  const event = h.db.events.find(item => item.eventId === booking.eventId),
    registrations = new RegistrationsService();
  assert.equal(event.ticketPrice, 250.5);
  const registration = (
    await registrations.create(
      { attendeeId: 'usr-attendee-001', eventId: event.eventId },
      UserRole.ATTENDEE,
      'usr-attendee-001'
    )
  ).data;
  const payment = await h.payments.create(
    {
      registrationId: registration.registrationId,
      amount: 250.5,
      paymentMethod: 'DEMO_PROVIDER',
      paymentDate: new Date().toISOString().slice(0, 10),
    },
    UserRole.ATTENDEE,
    'usr-attendee-001'
  );
  assert.equal(payment.data.status, 'completed');
  const savedRegistration = h.db.registrations.find(
    item => item.registrationId === registration.registrationId
  );
  assert.equal(savedRegistration.status, 'registered');
  const other = h.db.attendees.find(item => item.userId !== 'usr-attendee-001');
  h.db.registrations.push({
    ...savedRegistration,
    registrationId: 'reg-waiting',
    attendeeId: other.attendeeId,
    status: 'waitlisted',
    offerExpiresAt: new Date(Date.now() + 60000),
    verificationId: undefined,
    qrCode: undefined,
  });
  const offered = await registrations.confirmWaitlist(
    'reg-waiting',
    UserRole.ATTENDEE,
    other.userId
  );
  assert.equal(offered.data.status, 'pending_payment');
});

test('approved plan checkout signs the agreement, verifies the deposit, creates one booking and charges only the remaining balance', t => {
  const h = fixture(t);
  assert.throws(
    () => h.requests.payDeposit(h.request.requestId, demo, UserRole.CLIENT, 'usr-client-001'),
    /signed agreement/
  );
  assert.equal(h.db.eventWorkflowPayments.length, 0);
  sign(h);
  const deposit = h.requests.payDeposit(
    h.request.requestId,
    { ...demo, methodDetails: 'Card' },
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  assert.equal(deposit.amountPaid, 18000);
  assert.equal(deposit.outstandingBalance, 42000);
  assert.equal(deposit.bookingStatus, 'confirmed');
  assert.equal(h.db.events.length, 1);
  assert.equal(h.db.eventWorkflowPayments[0].eventId, deposit.eventId);
  assert.equal(h.db.eventWorkflowPayments[0].methodDetails, 'Card');
  assert.equal(h.db.eventWorkflowPayments[0].simulated, true);
  assert.ok(h.db.eventWorkflowPayments[0].createdAt);
  assert.match(deposit.bookingId, /^BKG-/);
  assert.ok(h.db.notifications.some(item => item.type === 'deposit_payment_confirmed'));
  h.requests.payDeposit(h.request.requestId, demo, UserRole.CLIENT, 'usr-client-001');
  assert.equal(h.db.events.length, 1);
  assert.equal(h.db.eventWorkflowPayments.length, 1);
  const balance = h.payments.payForOngoingEvent(
    deposit.eventId,
    'DEMO_PROVIDER',
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  assert.equal(balance.amount, 42000);
  assert.equal(h.request.paymentStatus, 'fully_paid');
  assert.equal(
    h.db.eventWorkflowPayments.reduce((sum, p) => sum + p.amount, 0),
    60000
  );
  assert.throws(
    () =>
      h.payments.payForOngoingEvent(
        deposit.eventId,
        'DEMO_PROVIDER',
        UserRole.CLIENT,
        'usr-client-001'
      ),
    /already been paid/
  );
  h.db.persist();
  DataStore.instance = undefined;
  const restored = DataStore.getInstance();
  assert.equal(
    restored.eventRequests.find(r => r.requestId === h.request.requestId).paymentStatus,
    'fully_paid'
  );
  assert.equal(
    restored.eventWorkflowPayments
      .filter(p => p.requestId === h.request.requestId && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    60000
  );
});

test('unapproved, unsigned, closed and foreign requests cannot record a completed deposit', t => {
  const h = fixture(t);
  assert.throws(
    () => h.requests.payDeposit(h.request.requestId, demo, UserRole.CLIENT, 'another-client'),
    /Access denied/
  );
  assert.throws(
    () => h.requests.payDeposit(h.request.requestId, demo, UserRole.EVENT_ORGANIZER, 'usr-org-001'),
    /Only the client/
  );
  sign(h);
  h.plan.approvalStatus = 'pending';
  assert.throws(
    () => h.requests.payDeposit(h.request.requestId, demo, UserRole.CLIENT, 'usr-client-001'),
    /Accept the final/
  );
  h.plan.approvalStatus = 'approved';
  h.request.status = 'planning';
  assert.throws(
    () => h.requests.payDeposit(h.request.requestId, demo, UserRole.CLIENT, 'usr-client-001'),
    /Accept the final/
  );
  h.request.status = 'cancelled';
  assert.throws(
    () => h.requests.payDeposit(h.request.requestId, demo, UserRole.CLIENT, 'usr-client-001'),
    /already cancelled/
  );
  assert.equal(h.db.eventWorkflowPayments.length, 0);
  assert.equal(h.db.events.length, 0);
});

test('failed and pending simulated payments do not confirm a booking or count toward its remaining balance', t => {
  const h = fixture(t);
  sign(h);
  assert.equal(
    h.requests.payDeposit(
      h.request.requestId,
      { ...demo, simulateFailure: true },
      UserRole.CLIENT,
      'usr-client-001'
    ).data.paymentStatus,
    'failed'
  );
  const pending = h.requests.payDeposit(
    h.request.requestId,
    { ...demo, status: 'pending' },
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  assert.equal(pending.amountPaid, 0);
  assert.equal(pending.bookingStatus, 'awaiting_client');
  assert.equal(h.db.events.length, 0);
  const deposit = h.requests.payDeposit(
    h.request.requestId,
    demo,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  const balance = h.payments.payForOngoingEvent(
    deposit.eventId,
    'DEMO_PROVIDER',
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  assert.equal(balance.amount, 42000);
  assert.equal(
    h.db.eventWorkflowPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    60000
  );
});

test('legacy deposits without an event ID are credited and accepted-proposal bookings can pay their balance', t => {
  const h = fixture(t);
  h.db.eventPlans = [];
  delete h.request.activeEventPlanId;
  h.request.proposals = [{ version: 1, status: 'accepted', amount: 60000, depositRequired: 20000 }];
  sign(h);
  const deposit = h.requests.payDeposit(
    h.request.requestId,
    demo,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  delete h.db.eventWorkflowPayments[0].eventId;
  const balance = h.payments.payForOngoingEvent(
    deposit.eventId,
    'DEMO_PROVIDER',
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  assert.equal(balance.amount, 40000);
  assert.equal(h.request.paymentStatus, 'fully_paid');
  assert.equal(h.db.eventWorkflowPayments[0].proposalVersion, 1);
});

test('two accepted proposals keep independent prices, deposits, versions and partial-payment balances', t => {
  const h = fixture(t);
  h.db.eventPlans = [];
  delete h.request.activeEventPlanId;
  h.request.currentProposalVersion = 2;
  h.request.proposals = [
    { version: 1, status: 'accepted', amount: 45000, depositRequired: 9000 },
    { version: 2, status: 'accepted', amount: 72000, depositRequired: 24000 },
    { version: 3, status: 'pending_client', amount: 999999, depositRequired: 999999 },
  ];
  const second = {
    ...h.request,
    requestId: 'req-checkout-two',
    eventName: 'Independent Gala',
    eventDate: '2099-12-30',
    budget: 36000,
    currentProposalVersion: 4,
    proposals: [{ version: 4, status: 'accepted', amount: 36000, depositRequired: 7000 }],
    agreementStatus: 'pending_signature',
    paymentStatus: 'deposit_pending',
    auditHistory: [],
    eventId: undefined,
  };
  h.db.eventRequests.push(second);
  h.db.eventWorkflowPayments.push({
    paymentId: 'pay-partial',
    eventId: undefined,
    requestId: h.request.requestId,
    proposalVersion: 2,
    clientId: h.request.clientId,
    organizerId: h.request.organizerId,
    amount: 5000,
    status: 'completed',
    paymentDate: '2099-01-01',
    paymentMethod: 'DEMO_PROVIDER',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  sign(h);
  h.requests.updateAgreementStatus(
    second.requestId,
    { agreementStatus: 'agreed' },
    UserRole.CLIENT,
    'usr-client-001'
  );
  const firstPayment = h.requests.payDeposit(
    h.request.requestId,
    demo,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  const secondPayment = h.requests.payDeposit(
    second.requestId,
    { ...demo, methodDetails: 'UPI' },
    UserRole.CLIENT,
    'usr-client-001'
  ).data;

  assert.equal(firstPayment.amountCharged, 19000);
  assert.equal(firstPayment.amountPaid, 24000);
  assert.equal(firstPayment.totalAmount, 72000);
  assert.equal(firstPayment.outstandingBalance, 48000);
  assert.equal(secondPayment.amountCharged, 7000);
  assert.equal(secondPayment.totalAmount, 36000);
  assert.equal(secondPayment.outstandingBalance, 29000);
  assert.equal(
    h.db.eventWorkflowPayments.find(payment => payment.requestId === second.requestId)
      .methodDetails,
    'UPI'
  );
  const completed = h.db.eventWorkflowPayments.filter(payment => payment.status === 'completed');
  assert.deepEqual(
    completed.map(payment => [payment.requestId, payment.proposalVersion, payment.amount]),
    [
      [h.request.requestId, 2, 5000],
      [h.request.requestId, 2, 19000],
      [second.requestId, 4, 7000],
    ]
  );
  assert.notEqual(firstPayment.eventId, secondPayment.eventId);
});

test('cancelled, failed and pending deposit attempts remain retryable without duplicate bookings or captured charges', t => {
  const h = fixture(t);
  sign(h);
  const cancelled = h.requests.payDeposit(
    h.request.requestId,
    { ...demo, status: 'cancelled' },
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  assert.equal(cancelled.bookingStatus, 'awaiting_client');
  assert.equal(h.db.events.length, 0);
  assert.equal(
    h.requests.payDeposit(
      h.request.requestId,
      { ...demo, simulateFailure: true },
      UserRole.CLIENT,
      'usr-client-001'
    ).data.paymentStatus,
    'failed'
  );
  const pending = h.requests.payDeposit(
    h.request.requestId,
    { ...demo, status: 'pending' },
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  assert.equal(pending.amountPaid, 0);
  assert.equal(h.db.events.length, 0);
  const completed = h.requests.payDeposit(
    h.request.requestId,
    demo,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  assert.equal(completed.bookingStatus, 'confirmed');
  assert.equal(h.db.events.length, 1);
  h.requests.payDeposit(h.request.requestId, demo, UserRole.CLIENT, 'usr-client-001');
  assert.equal(h.db.events.length, 1);
  assert.equal(
    h.db.eventWorkflowPayments.filter(payment => payment.status === 'completed').length,
    1
  );
});

test('confirmation errors do not capture a successful deposit', t => {
  const h = fixture(t);
  sign(h);
  h.requests.confirmBooking = () => {
    throw new Error('Date was taken');
  };
  assert.throws(
    () => h.requests.payDeposit(h.request.requestId, demo, UserRole.CLIENT, 'usr-client-001'),
    /Date was taken/
  );
  assert.equal(h.request.paymentStatus, 'unpaid');
  assert.equal(h.request.status, 'awaiting_client');
  assert.equal(h.db.eventWorkflowPayments.length, 0);
  assert.equal(h.db.events.length, 0);
});

test('cancellation quotes use all captured installments and ignore failed or unrelated payments', t => {
  const h = fixture(t);
  sign(h);
  const deposit = h.requests.payDeposit(
    h.request.requestId,
    demo,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  const events = new EventsService();
  assert.equal(
    events.clientCancellationPreview(deposit.eventId, UserRole.CLIENT, 'usr-client-001').paidAmount,
    18000
  );
  h.payments.payForOngoingEvent(
    deposit.eventId,
    'DEMO_PROVIDER',
    UserRole.CLIENT,
    'usr-client-001'
  );
  h.db.eventWorkflowPayments.push({
    ...h.db.eventWorkflowPayments[0],
    paymentId: 'foreign',
    clientId: 'other-client',
    amount: 999999,
  });
  h.db.eventWorkflowPayments.push({
    ...h.db.eventWorkflowPayments[0],
    paymentId: 'failed',
    status: 'failed',
    amount: 999999,
  });
  const preview = events.clientCancellationPreview(
    deposit.eventId,
    UserRole.CLIENT,
    'usr-client-001'
  );
  assert.equal(preview.paidAmount, 60000);
  assert.equal(preview.cancellationFee, 6000);
  assert.equal(preview.refundAmount, 54000);
  const requestPreview = h.requests.requestCancellationPreview(
    h.request.requestId,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  assert.equal(requestPreview.paidAmount, 60000);
  assert.equal(requestPreview.refundAmount, 54000);
});

test('accepted custom policy versions calculate client refunds across multiple successful payments', t => {
  const h = fixture(t);
  h.request.policySnapshot = {
    version: 'proposal-req-checkout-v7',
    cancellation: {
      minimumNoticeDays: 30,
      feePercent: 25,
      refundEligible: true,
      approvalMode: 'automatic',
      additionalTerms: 'Thirty days notice is mandatory.',
      isDefault: false,
    },
    sections: [],
  };
  sign(h);
  const booking = h.requests.payDeposit(
    h.request.requestId,
    demo,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  h.payments.payForOngoingEvent(
    booking.eventId,
    'DEMO_PROVIDER',
    UserRole.CLIENT,
    'usr-client-001'
  );
  const events = new EventsService();
  const preview = events.clientCancellationPreview(
    booking.eventId,
    UserRole.CLIENT,
    'usr-client-001'
  );
  assert.equal(preview.minimumNoticeDays, 30);
  assert.equal(preview.cancellationFeePercent, 25);
  assert.equal(preview.paidAmount, 60000);
  assert.equal(preview.cancellationFee, 15000);
  assert.equal(preview.refundAmount, 45000);
  assert.equal(preview.approvalMode, 'automatic');
  events.cancelClientEvent(
    booking.eventId,
    {
      reason: 'The company cancelled the conference program.',
      expectedPaidAmount: 60000,
      policyAccepted: true,
      acceptedPolicyVersion: 'proposal-req-checkout-v7',
    },
    UserRole.CLIENT,
    'usr-client-001'
  );
  const refunds = h.db.eventWorkflowRefunds.filter(
    refund => refund.requestId === h.request.requestId
  );
  assert.equal(refunds.length, 2);
  assert.equal(
    refunds.reduce((sum, refund) => sum + refund.amount, 0),
    45000
  );
  assert.ok(refunds.every(refund => refund.status === 'pending' && refund.simulated === true));
  assert.throws(
    () =>
      events.cancelClientEvent(
        booking.eventId,
        {
          reason: 'Duplicate cancellation request.',
          expectedPaidAmount: 60000,
          policyAccepted: true,
          acceptedPolicyVersion: 'proposal-req-checkout-v7',
        },
        UserRole.CLIENT,
        'usr-client-001'
      ),
    /already been cancelled/
  );
});

test('organizer proposal stores a structured cancellation policy and client acceptance snapshots its version', t => {
  const h = fixture(t);
  h.request.status = 'planning';
  h.request.proposals = [];
  h.request.activeEventPlanId = undefined;
  h.db.eventPlans = [];
  const sent = h.requests.sendProposal(
    h.request.requestId,
    {
      amount: 64000,
      depositRequired: 16000,
      proposedDate: '2099-12-29',
      validUntil: '2099-11-30',
      eventPlan: 'Configured cancellation plan',
      timeline: 'Setup and delivery',
      cancellationNoticeDays: 21,
      cancellationFeePercent: 12.5,
      cancellationRefundEligible: true,
      cancellationApprovalMode: 'automatic',
      cancellationAdditionalTerms: 'Written notice is required.',
    },
    UserRole.EVENT_ORGANIZER,
    'usr-org-001'
  ).data;
  const proposal = sent.proposals.at(-1);
  assert.equal(proposal.cancellationPolicy.cancellation.minimumNoticeDays, 21);
  assert.equal(proposal.cancellationPolicy.cancellation.feePercent, 12.5);
  assert.equal(proposal.cancellationPolicy.cancellation.approvalMode, 'automatic');
  assert.equal(proposal.cancellationPolicy.cancellation.isDefault, false);
  h.requests.clientResponse(
    h.request.requestId,
    {
      decision: 'accept',
      policyAccepted: true,
      acceptedPolicyVersion: proposal.cancellationPolicy.version,
    },
    UserRole.CLIENT,
    'usr-client-001'
  );
  assert.equal(h.request.policySnapshot.version, proposal.cancellationPolicy.version);
  assert.equal(h.request.clientPolicyAcceptedBy, 'usr-client-001');
  proposal.cancellationPolicy.cancellation.feePercent = 99;
  assert.equal(
    h.request.policySnapshot.cancellation.feePercent,
    12.5,
    'confirmed workflow keeps an immutable accepted snapshot'
  );
});

test('organizer cancellation refunds actual client payments in full and never refunds the organizer', t => {
  const h = fixture(t);
  h.request.policySnapshot = {
    version: 'proposal-req-checkout-v8',
    cancellation: {
      minimumNoticeDays: 7,
      feePercent: 50,
      refundEligible: true,
      approvalMode: 'manual',
      additionalTerms: 'Client cancellations incur a fee.',
      isDefault: false,
    },
    sections: [],
  };
  sign(h);
  const booking = h.requests.payDeposit(
    h.request.requestId,
    demo,
    UserRole.CLIENT,
    'usr-client-001'
  ).data;
  h.payments.payForOngoingEvent(
    booking.eventId,
    'DEMO_PROVIDER',
    UserRole.CLIENT,
    'usr-client-001'
  );
  const preview = h.requests.requestCancellationPreview(
    h.request.requestId,
    UserRole.EVENT_ORGANIZER,
    'usr-org-001'
  ).data;
  assert.equal(preview.organizerCancellation, true);
  assert.equal(preview.cancellationFee, 0);
  assert.equal(preview.refundAmount, 60000);
  h.requests.cancelRequest(
    h.request.requestId,
    { reason: 'Venue operations were unexpectedly suspended.', expectedPaidAmount: 60000 },
    UserRole.EVENT_ORGANIZER,
    'usr-org-001'
  );
  assert.equal(h.request.cancellation.refundAmount, 60000);
  assert.equal(h.request.cancellation.cancellationFee, 0);
  assert.equal(
    h.db.eventWorkflowRefunds
      .filter(refund => refund.requestId === h.request.requestId)
      .reduce((sum, refund) => sum + refund.amount, 0),
    60000
  );
  assert.ok(h.db.eventWorkflowRefunds.every(refund => refund.clientId === h.request.clientId));
  assert.ok(!h.db.eventWorkflowRefunds.some(refund => refund.clientId === h.request.organizerId));
});
