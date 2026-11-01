const portalSource = require('./portal-source.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const client = portalSource('client');
const organizer = portalSource('organizer');
function section(source, from, to) {
  const start = source.indexOf(from),
    end = source.indexOf(to, start);
  assert.ok(start >= 0 && end > start, from);
  return source.slice(start, end);
}
function fixture(t) {
  const errors = [],
    console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(
    '<div id="modal-overlay"><div id="modal-box"><h2 id="modal-title"></h2><div id="modal-body"></div><div id="modal-foot"></div></div></div>',
    { url: 'http://localhost/client', runScripts: 'dangerously', virtualConsole: console }
  );
  t.after(() => {
    dom.window.close();
    assert.deepEqual(errors, []);
  });
  const w = dom.window,
    d = w.document;
  w.g = id => d.getElementById(id);
  w.v = id => w.g(id)?.value || '';
  w.requestAnimationFrame = callback => callback();
  w.eval(section(client, 'function openModal(', 'function closeModalOnBg('));
  w.eval(read('public/assets/vendor/qrcode-1.5.4.js'));
  w.eval(read('src/apps/attendee/utils/ticket-scanner.js'));
  w.regForEvent = w.completeDemoPayment = () => {};
  w.eval(read('src/app/paymentCheckout.js'));
  w.eval(read('src/app/theme.js'));
  d.dispatchEvent(new w.Event('DOMContentLoaded'));
  const calls = [];
  const open = (extra = {}) =>
    w.EventFlowCheckout.open({
      event: { title: 'Conference', date: '2099-12-10', venue: 'Hall A' },
      amount: 18000,
      onAuthorize: async details => {
        calls.push(details);
        return { paymentId: 'pay-verified' };
      },
      ...extra,
    });
  const card = () => {
    for (const [id, value] of Object.entries({
      'pco-holder': 'Demo User',
      'pco-number': '4111 1111 1111 1111',
      'pco-expiry': '12/99',
      'pco-cvv': '123',
    }))
      w.g(id).value = value;
  };
  return { w, d, calls, open, card };
}

test('card checkout validates details and requires the correct OTP before submitting once', async t => {
  const { w, calls, open, card } = fixture(t);
  open();
  await w.pcoSubmitPayment();
  assert.equal(calls.length, 0);
  assert.ok(w.g('pco-number-err').classList.contains('visible'));
  card();
  await w.pcoSubmitPayment();
  assert.equal(w.g('pco-step-otp').style.display, '');
  assert.equal(calls.length, 0);
  assert.equal(w.g('pco-number').value, '');
  assert.equal(w.g('pco-cvv').value, '');
  const code = w.g('pco-demo-otp').textContent;
  assert.match(code, /^\d{6}$/);
  w.g('pco-otp').value = code === '000000' ? '111111' : '000000';
  await w.pcoVerifyOtp();
  assert.equal(calls.length, 0);
  assert.match(w.g('pco-otp-err').textContent, /Incorrect OTP/);
  w.g('pco-otp').value = code;
  await Promise.all([w.pcoVerifyOtp(), w.pcoVerifyOtp()]);
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(calls[0]).sort(), ['amount', 'method']);
  assert.equal(calls[0].method, 'card');
  assert.equal(calls[0].amount, 18000);
  assert.match(w.g('pco-result-title').textContent, /Payment Successful/);
});

test('card verification initializes without crypto.randomUUID and exposes preparation, event, amount and cancel controls', async t => {
  const { w, open, card } = fixture(t);
  Object.defineProperty(w.crypto, 'randomUUID', { configurable: true, value: undefined });
  open();
  card();
  const transition = w.pcoSubmitPayment();
  assert.match(w.g('pco-proc-title').textContent, /Preparing card verification/);
  await transition;
  assert.match(w.g('pco-otp-summary').textContent, /Conference.*₹18,000/);
  assert.ok(
    [...w.document.querySelectorAll('#pco-step-otp button')].some(button =>
      /Cancel Checkout/.test(button.textContent)
    )
  );
});

test('expired OTPs, closed checkouts and replaced checkouts cannot submit a payment', async t => {
  const { w, calls, open, card } = fixture(t);
  open();
  card();
  await w.pcoSubmitPayment();
  const now = w.Date.now;
  w.Date.now = () => now() + 6 * 60 * 1000;
  w.g('pco-otp').value = w.g('pco-demo-otp').textContent;
  await w.pcoVerifyOtp();
  assert.equal(calls.length, 0);
  assert.match(w.g('pco-otp-err').textContent, /expired/);
  w.Date.now = now;
  w.pcoResendOtp();
  w.g('pco-otp').value = w.g('pco-demo-otp').textContent;
  w.closeModal();
  await w.pcoVerifyOtp();
  assert.equal(calls.length, 0);
  open();
  await w.pcoVerifyOtp();
  assert.equal(calls.length, 0);
});

test('UPI displays a scannable demo QR, submits only after confirmation, and supports retry', async t => {
  const { w, calls, open } = fixture(t);
  let fail = true;
  open({
    onAuthorize: async details => {
      calls.push(details);
      if (fail) throw Error('Provider unavailable');
      return { paymentId: 'pay-upi' };
    },
  });
  w.pcoSwitchTab('upi');
  assert.ok(w.g('pco-upi-qr').querySelector('svg path'));
  assert.equal(w.g('pco-panel-upi').style.display, '');
  assert.equal(calls.length, 0);
  w.g('pco-upi').value = 'invalid-upi';
  await w.pcoSubmitPayment();
  assert.equal(calls.length, 0);
  assert.ok(w.g('pco-upi-err').classList.contains('visible'));
  w.g('pco-upi').value = 'demo.user@upi';
  await Promise.all([w.pcoSubmitPayment(), w.pcoSubmitPayment()]);
  assert.equal(calls.length, 1);
  assert.match(w.g('pco-result-sub').textContent, /Provider unavailable/);
  fail = false;
  w.pcoRetry();
  await w.pcoSubmitPayment();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].method, 'upi');
  assert.equal(w.g('pco-step-otp').style.display, 'none');
  assert.match(w.g('pco-result-title').textContent, /Payment Successful/);
});

test('client deposits and remaining balances open checkout and call their APIs only after authorization', async t => {
  const { w, card } = fixture(t);
  const request = {
    requestId: 'req-1',
    id: 'req-1',
    clientId: 'client-1',
    organizerId: 'org-1',
    eventName: 'Conference',
    eventDate: '2099-12-10',
    budget: 60000,
    status: 'awaiting_client',
    paymentStatus: 'unpaid',
    agreementStatus: 'pending_signature',
    proposals: [],
  };
  w.DB = {
    eventRequests: [request],
    eventPlans: [
      { eventPlanId: 'plan-1', requestId: 'req-1', budget: 60000, approvalStatus: 'approved' },
    ],
    users: [],
    organizers: [],
    eventWorkflowPayments: [],
  };
  w.CU = { id: 'client-1', role: 'client' };
  w.escapeHtml = String;
  w.workflowPayload = response => response?.data || response;
  w.syncWorkflowData = w.syncClientEventRequests = async () => {};
  w.toast = () => {};
  const apiCalls = [];
  w.apiUpdateAgreementStatus = async () => {
    apiCalls.push('agreement');
  };
  w.apiPayDeposit = async (id, payload) => {
    apiCalls.push({ id, payload });
    Object.assign(request, {
      status: 'confirmed',
      paymentStatus: 'deposit_paid',
      eventId: 'evt-1',
    });
    return {
      data: {
        bookingStatus: 'confirmed',
        amountPaid: 18000,
        outstandingBalance: 42000,
        paymentId: 'pay-deposit',
      },
    };
  };
  w.eval(
    section(client, 'function getClientAcceptedProposal(', 'async function openEventPlanPdf(')
  );
  w.eval(section(client, 'function isClientOwner(', 'function viewClientPaidBooking('));
  w.eval(section(client, 'function payWorkflowEvent(', 'function submitClientOrganizerReview('));
  w.openClientPaymentModal('req-1');
  w.g('client-agree-terms').checked = false;
  await w.submitClientMockPayment('req-1');
  assert.equal(w.g('pco-wrap'), null);
  w.g('client-agree-terms').checked = true;
  await w.submitClientMockPayment('req-1');
  assert.equal(Number(w.g('pco-wrap').dataset.pcoPrice), 18000);
  assert.deepEqual(apiCalls, []);
  card();
  await w.pcoSubmitPayment();
  assert.deepEqual(apiCalls, []);
  w.g('pco-otp').value = w.g('pco-demo-otp').textContent;
  await w.pcoVerifyOtp();
  assert.equal(apiCalls[0], 'agreement');
  assert.equal(apiCalls[1].payload.methodDetails, 'Card');
  assert.deepEqual(Object.keys(apiCalls[1].payload).sort(), [
    'methodDetails',
    'paymentMethod',
    'simulateFailure',
  ]);
  assert.match(w.g('modal-body').textContent, /Booking Confirmed/);
  assert.equal(w.g('modal-foot').style.display, '');
  w.apiPayForWorkflowEvent = async id => {
    apiCalls.push('balance:' + id);
    request.paymentStatus = 'fully_paid';
    return { data: { paymentId: 'pay-balance', amount: 42000 } };
  };
  w.payWorkflowEvent('evt-1', 'req-1', 42000);
  assert.equal(apiCalls.length, 2);
  assert.equal(Number(w.g('pco-wrap').dataset.pcoPrice), 42000);
  w.pcoSwitchTab('upi');
  await w.pcoSubmitPayment();
  assert.equal(apiCalls[2], 'balance:evt-1');
  assert.equal(request.paymentStatus, 'fully_paid');
});

test('plan-submitted View Details opens the persisted plan review and decisions target the selected request and plan', async t => {
  const { w } = fixture(t),
    calls = [];
  const first = {
    id: 'req-plan-1',
    requestId: 'req-plan-1',
    status: 'plan_submitted',
    activeEventPlanId: 'plan-1',
    clientId: 'client-1',
    proposals: [],
    policySnapshot: {
      version: 'policy-plan-1',
      cancellation: {
        minimumNoticeDays: 21,
        feePercent: 5,
        refundEligible: true,
        approvalMode: 'manual',
      },
    },
  };
  const second = {
    id: 'req-plan-2',
    requestId: 'req-plan-2',
    status: 'plan_submitted',
    activeEventPlanId: 'plan-2',
    clientId: 'client-1',
    proposals: [],
  };
  w.DB = {
    eventRequests: [first, second],
    eventPlans: [
      {
        eventPlanId: 'plan-1',
        requestId: first.requestId,
        title: 'Conference plan',
        revision: 2,
        budget: 72000,
        approvalStatus: 'pending',
      },
      {
        eventPlanId: 'plan-2',
        requestId: second.requestId,
        title: 'Gala plan',
        revision: 1,
        budget: 36000,
        approvalStatus: 'pending',
      },
    ],
  };
  w.CU = { id: 'client-1', role: 'client' };
  w._currentPage = 'request-status';
  w.goNav = page => calls.push(['nav', page]);
  w.toast = () => {};
  w.escapeHtml = w.workflowHtml = String;
  w.workflowMoney = value => `₹${value}`;
  w.syncWorkflowData = async () => {};
  w.openClientPaymentModal = id => calls.push(['payment', id]);
  w.apiApproveEventPlan = async (...args) => calls.push(['decision', ...args]);
  w.runWorkflowAction = async action => action();
  w.eval(
    section(client, 'function getClientAcceptedProposal(', 'async function openEventPlanPdf(')
  );
  w.eval(
    section(client, 'function viewWorkflowRequestDrawer(', 'function viewWorkflowEventDetails(')
  );
  w.eval(section(client, 'function openWorkflowPlanRevisionModal(', 'function viewRequestDrawer('));
  w.eval(
    section(client, 'function viewRequestDrawer(', 'async function openClientCancelRequestModal(')
  );

  w.viewRequestDrawer(first.requestId);
  assert.deepEqual(calls[0], ['nav', 'request-details']);

  w.openWorkflowPlanAcceptanceModal('plan-1', first.requestId);
  await w.acceptWorkflowPlanAndPay('plan-1', first.requestId);
  assert.match(w.g('workflow-plan-accept-error').textContent, /explicitly agree/);
  assert.equal(calls.filter(call => call[0] === 'decision').length, 0);
  w.g('workflow-plan-accept-ack').checked = true;
  await w.acceptWorkflowPlanAndPay('plan-1', first.requestId);
  const approval = calls.find(call => call[0] === 'decision');
  assert.deepEqual(approval.slice(0, 3), ['decision', 'plan-1', 'approved']);
  assert.equal(approval[5].policyAccepted, true);
  assert.equal(approval[5].acceptedPolicyVersion, 'policy-plan-1');
  assert.deepEqual(
    calls.find(call => call[0] === 'payment'),
    ['payment', first.requestId]
  );

  w.openWorkflowPlanRejectionModal('plan-2', second.requestId);
  w.g('workflow-plan-reject-reason').value = 'The delivery schedule cannot meet our deadline.';
  w.g('workflow-plan-reject-comments').value = 'Please close this request.';
  w.submitWorkflowPlanRejection('plan-2', second.requestId);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(
    calls.some(
      call =>
        call[0] === 'decision' &&
        call[1] === 'plan-2' &&
        call[2] === 'rejected' &&
        call[3] === 'The delivery schedule cannot meet our deadline.' &&
        call[4] === 'Please close this request.'
    )
  );
});

test('confirmed bookings are partitioned by actual event date for client and organizer lifecycle views', t => {
  const { w } = fixture(t);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  w.CU = { id: 'user-client', role: 'client' };
  w.DB = {
    clients: [{ userId: 'user-client', clientId: 'client-1' }],
    users: [],
    organizers: [],
    eventRequests: [
      { requestId: 'req-future', eventId: 'evt-future', clientId: 'client-1', status: 'confirmed' },
      { requestId: 'req-today', eventId: 'evt-today', clientId: 'client-1', status: 'confirmed' },
      { requestId: 'req-past', eventId: 'evt-past', clientId: 'client-1', status: 'confirmed' },
    ],
    events: [
      {
        eventId: 'evt-future',
        clientId: 'client-1',
        name: 'Future Event',
        date: '2099-12-01',
        time: '10:00',
        status: 'ongoing',
      },
      {
        eventId: 'evt-today',
        clientId: 'client-1',
        name: 'Today Event',
        date: today,
        time: '00:00',
        status: 'ongoing',
      },
      {
        eventId: 'evt-past',
        clientId: 'client-1',
        name: 'Past Event',
        date: '2000-01-01',
        time: '10:00',
        status: 'ongoing',
      },
    ],
  };
  w.eval(section(client, 'function getClientWorkflowEvents(', 'function setWorkflowEventTab('));
  const lifecycle = w.getClientWorkflowEvents();
  assert.deepEqual(
    Array.from(lifecycle.upcoming, item => item.title),
    ['Future Event']
  );
  assert.deepEqual(
    Array.from(lifecycle.ongoing, item => item.title),
    ['Today Event']
  );
  assert.deepEqual(
    Array.from(lifecycle.completed, item => item.title),
    ['Past Event']
  );

  w.eval(section(organizer, 'function workflowEventPhase(', 'function getOngoingWorkflowItems('));
  assert.equal(w.workflowEventPhase(w.DB.events[0]), 'upcoming');
  assert.equal(w.workflowEventPhase(w.DB.events[1]), 'ongoing');
  assert.equal(w.workflowEventPhase(w.DB.events[2]), 'completed');
});

test('organizer notifications do not require a legacy toast DOM node', t => {
  const { w } = fixture(t);
  let detail;
  w.addEventListener('eventflow:toast', event => {
    detail = event.detail;
  });
  w.eval(section(organizer, 'function toast(', 'function g(id)'));
  w.g('modal-overlay').remove();
  w.toast('Cancellation saved', 'success');
  assert.equal(detail.message, 'Cancellation saved');
  assert.equal(detail.type, 'success');
});

test('organizer cancellation performs one backend mutation then synchronizes and renders cancelled history', async t => {
  const { w } = fixture(t),
    calls = [];
  w.CU = {
    id: 'organizer-user',
    userId: 'organizer-user',
    organizerId: 'org-1',
    role: 'organizer',
    name: 'Organizer',
  };
  const event = {
    id: 'evt-1',
    eventId: 'evt-1',
    organizerId: 'org-1',
    organizerUserId: 'organizer-user',
    title: 'Cancelled Gala',
    name: 'Cancelled Gala',
    status: 'ongoing',
    backendStatus: 'ongoing',
    date: '2099-10-10',
    time: '10:00',
  };
  const request = {
    id: 'req-1',
    requestId: 'req-1',
    eventId: 'evt-1',
    organizerId: 'org-1',
    organizerUserId: 'organizer-user',
    status: 'confirmed',
  };
  w.DB = {
    events: [event],
    eventRequests: [request],
    registrations: [],
    refunds: [],
    notifications: [],
    payments: [],
    eventWorkflowPayments: [],
  };
  w.pending = {
    isClientBooking: true,
    eventId: 'evt-1',
    requestId: 'req-1',
    reason: 'Venue became unavailable unexpectedly.',
    explanation: '',
    paidAmount: 0,
    cancellationFee: 0,
    refundAmount: 0,
    feePercent: 0,
    evName: event.title,
  };
  w._currentPage = 'my-events';
  w.apiCancelOrganizerEvent = async (id, reason) => {
    calls.push(['cancel', id, reason]);
    return {
      eventId: id,
      status: 'cancelled',
      cancellation: {
        reason,
        cancelledAt: '2026-10-30T12:00:00.000Z',
        refundStatus: 'not_applicable',
      },
    };
  };
  w.EventFlowData = {
    invalidate: () => calls.push(['invalidate']),
    sync: async () => {
      calls.push(['sync']);
      request.status = 'cancelled';
      request.cancellation = { reason: w.pending.reason, refundStatus: 'not_applicable' };
    },
  };
  w.saveDB = () => {};
  w.closeModal = () => calls.push(['close']);
  w.renderPage = async page => calls.push(['render', page]);
  w.toast = (message, type) => calls.push(['toast', type, message]);
  w.eval(
    'let _pendingOrganizerCancel = window.pending;' +
      section(
        organizer,
        'async function submitOrganizerEventCancellation(',
        'function openRejectModal('
      )
  );
  await w.submitOrganizerEventCancellation('evt-1', 'req-1');
  assert.equal(calls.filter(call => call[0] === 'cancel').length, 1);
  assert.deepEqual(
    calls.filter(call => ['invalidate', 'sync', 'render'].includes(call[0])).map(call => call[0]),
    ['invalidate', 'sync', 'render']
  );
  assert.equal(event.status, 'cancelled');
  assert.equal(request.status, 'cancelled');
  assert.equal(calls.at(-1)[0], 'toast');

  w.goNav = () => {};
  w.escapeHtml = String;
  w.workflowHtml = String;
  w.eval(
    section(organizer, 'function isCancelledWorkflowEvent(', 'function setOrganizerEventFilter(')
  );
  w._workflowEventTab = 'cancelled';
  const html = w.pageWorkflowEvents();
  assert.match(html, /Cancelled Events \(1\)/);
  assert.match(html, /Cancelled Gala/);
  assert.match(html, /Cancellation reason:<\/strong> Venue became unavailable unexpectedly\./);
  assert.match(html, /Cancellation date:<\/strong>/);
  assert.match(html, /Refund status:<\/strong> Not applicable/);
  assert.match(html, /Upcoming Events \(0\)|Upcoming \(0\)/);
  assert.match(html, /Ongoing Events \(0\)/);
  assert.match(html, /View Details/);
  assert.match(html, /View Cancellation History/);
  assert.doesNotMatch(html, /Cancel Event|Edit Event|Delete Event/);
  assert.equal(w.getOngoingWorkflowItems().length, 0);
});

test('attendee ticket payments use card OTP and UPI while free registrations still skip payment', async t => {
  const { w, card } = fixture(t);
  const paid = {
    id: 'evt-paid',
    eventId: 'evt-paid',
    title: 'Paid conference',
    date: '2099-12-10',
    price: 250,
    status: 'published',
    capacity: 100,
    registered: 0,
  };
  const free = { ...paid, id: 'evt-free', eventId: 'evt-free', title: 'Free workshop', price: 0 };
  w.CU = { id: 'attendee-1', userId: 'user-1' };
  w.DB = { events: [paid, free], registrations: [], _nextId: { regs: 1 } };
  w.attendeeRegistrationCatalog = [];
  w.saveDB = w.toast = w.goNav = () => {};
  const calls = [];
  w.apiRegisterForEvent = async payload => {
    calls.push({ kind: 'register', payload });
    return {
      registrationId: 'reg-' + calls.length,
      status: payload.eventId === 'evt-free' ? 'registered' : 'pending_payment',
    };
  };
  let reviewStatus;
  w.apiMakePayment = async payload => {
    calls.push({ kind: 'payment', payload });
    return {
      paymentId: 'pay-ticket',
      status: 'completed',
      registration: { verificationId: 'verify-1', qrCode: 'ticket-qr', reviewStatus },
    };
  };
  w.regForEvent('evt-paid');
  w.g('pco-terms-check').checked = true;
  await w.pcoProceedFromReview('evt-paid');
  card();
  await w.pcoSubmitPayment();
  assert.deepEqual(calls, []);
  w.g('pco-otp').value = w.g('pco-demo-otp').textContent;
  await w.pcoVerifyOtp();
  assert.deepEqual(
    calls.map(call => call.kind),
    ['register', 'payment']
  );
  assert.equal(w.DB.registrations[0].status, 'confirmed');
  assert.match(w.g('pco-result-sub').textContent, /awaiting organizer approval/);
  assert.match(w.g('pco-result-detail').textContent, /Organizer reviewPending/);
  assert.deepEqual(Object.keys(calls[1].payload).sort(), [
    'amount',
    'paymentDate',
    'paymentMethod',
    'registrationId',
  ]);
  w.attendeeRegistrationCatalog = [{ registrationId: 'reg-pending', eventId: 'evt-paid' }];
  reviewStatus = 'approved';
  w.completeDemoPayment('reg-pending');
  w.pcoSwitchTab('upi');
  await w.pcoSubmitPayment();
  assert.equal(calls[2].payload.registrationId, 'reg-pending');
  assert.equal(w.attendeeRegistrationCatalog[0].reviewStatus, 'approved');
  assert.doesNotMatch(w.g('pco-result-sub').textContent, /awaiting organizer approval/);
  w.regForEvent('evt-free');
  w.g('pco-terms-check').checked = true;
  await w.pcoProceedFromReview('evt-free');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(
    calls.map(call => call.kind),
    ['register', 'payment', 'payment', 'register']
  );
  assert.equal(calls[3].payload.eventId, 'evt-free');
});

test('public events proceed directly to payment and show no organizer approval requirement', async t => {
  const { w } = fixture(t),
    calls = [];
  const event = {
    id: 'public-1',
    eventId: 'public-1',
    title: 'Public conference',
    date: '2099-12-01',
    price: 149.85,
    visibility: 'public',
    capacity: 10,
    status: 'published',
  };
  w.CU = { id: 'attendee-1' };
  w.DB = { events: [event], registrations: [], _nextId: { regs: 1 } };
  w.attendeeRegistrationCatalog = [];
  w.apiRegisterForEvent = async () => {
    calls.push('register');
    return { registrationId: 'reg-public', status: 'pending_payment', reviewStatus: 'approved' };
  };
  w.apiMakePayment = async () => {
    calls.push('pay');
    return {
      status: 'completed',
      registration: { status: 'registered', reviewStatus: 'approved', verificationId: 'public-qr' },
    };
  };
  w.regForEvent(event.id);
  w.g('pco-terms-check').checked = true;
  await w.pcoProceedFromReview(event.id);
  assert.deepEqual(calls, []);
  assert.ok(w.g('pco-wrap'));
  w.pcoSwitchTab('upi');
  await w.pcoSubmitPayment();
  assert.deepEqual(calls, ['register', 'pay']);
  assert.equal(w.DB.registrations[0].status, 'confirmed');
  assert.match(w.g('pco-result-detail').textContent, /Not required \(public event\)/);
  assert.doesNotMatch(w.g('pco-result-sub').textContent, /awaiting organizer approval/);
});

test('private requests do not open checkout or collect payment until approval', async t => {
  const { w, card } = fixture(t),
    calls = [];
  const event = {
    id: 'private-1',
    eventId: 'private-1',
    title: 'Private conference',
    date: '2099-12-01',
    price: 149.85,
    visibility: 'private',
    capacity: 10,
    registered: 0,
    status: 'published',
  };
  w.CU = { id: 'attendee-1' };
  w.DB = { events: [event], registrations: [], _nextId: { regs: 1 } };
  w.attendeeRegistrationCatalog = [];
  w.toast = () => {};
  let finish;
  w.apiRegisterForEvent = async () => {
    calls.push('request');
    await new Promise(resolve => {
      finish = resolve;
    });
    return { registrationId: 'reg-private', status: 'pending_approval' };
  };
  w.apiMakePayment = async () => {
    calls.push('pay');
    return {
      status: 'completed',
      registration: {
        status: 'registered',
        reviewStatus: 'approved',
        verificationId: 'private-qr',
      },
    };
  };
  w.regForEvent(event.id);
  w.g('pco-terms-check').checked = true;
  const first = w.pcoProceedFromReview(event.id),
    second = w.pcoProceedFromReview(event.id);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(calls, ['request']);
  finish();
  await Promise.all([first, second]);
  assert.equal(w.g('pco-wrap'), null);
  assert.match(w.g('modal-body').textContent, /No payment has been collected/);
  assert.equal(w.DB.registrations[0].status, 'pending_approval');
  assert.equal(w.DB.registrations[0].verificationId, '');
  assert.equal(event.registered, 0);
  w.completeDemoPayment('reg-private');
  assert.equal(w.g('pco-wrap'), null);
  Object.assign(w.attendeeRegistrationCatalog[0], {
    status: 'pending_payment',
    reviewStatus: 'approved',
  });
  w.completeDemoPayment('reg-private');
  assert.ok(w.g('pco-wrap'));
  card();
  await w.pcoSubmitPayment();
  assert.deepEqual(calls, ['request']);
  w.g('pco-otp').value = w.g('pco-demo-otp').textContent;
  await w.pcoVerifyOtp();
  assert.deepEqual(calls, ['request', 'pay']);
  assert.equal(w.DB.registrations[0].status, 'confirmed');
  assert.equal(w.DB.registrations[0].verificationId, 'private-qr');
});

test('free private events request approval without issuing a ticket or opening payment', async t => {
  const { w } = fixture(t);
  const event = {
    id: 'private-free',
    eventId: 'private-free',
    title: 'Private free workshop',
    date: '2099-12-01',
    price: 0,
    visibility: 'private',
    capacity: 10,
    status: 'published',
  };
  w.CU = { id: 'attendee-1' };
  w.DB = { events: [event], registrations: [], _nextId: { regs: 1 } };
  w.attendeeRegistrationCatalog = [];
  w.apiRegisterForEvent = async () => ({
    registrationId: 'reg-private-free',
    status: 'pending_approval',
  });
  w.apiMakePayment = async () => assert.fail('Private free requests must not take payment');
  w.regForEvent(event.id);
  w.g('pco-terms-check').checked = true;
  await w.pcoProceedFromReview(event.id);
  assert.equal(w.g('pco-wrap'), null);
  assert.match(
    w.g('modal-body').textContent,
    /free ticket will be issued after organizer approval/
  );
  assert.equal(w.DB.registrations[0].status, 'pending_approval');
});
