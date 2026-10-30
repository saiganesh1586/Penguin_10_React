const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sources = Object.fromEntries(['client', 'organizer'].map(role => [role, fs.readFileSync(path.join(__dirname, `../src/apps/${role}/app/runtime.js`), 'utf8')]));
const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const policy = { version: 'test-policy-1', cancellation: { minimumNoticeDays: 14, feePercent: 10 }, sections: [
  { title: 'Event rules', items: ['Agree on venue permissions and safety arrangements.'] },
  { title: 'Cancellation and refund policy', items: ['Cancel at least 14 days before the event. A 10% fee applies to the amount paid.'] },
  { title: 'Terms and conditions', items: ['Accepting a request starts planning. The client approves the final event plan.'] },
] };
function section(source, from, to) {
  const start = source.indexOf(from);
  const end = source.indexOf(to, start);
  assert.ok(start >= 0 && end > start, `Missing workflow section ${from}`);
  return source.slice(start, end);
}
function harness(role, state) {
  const content = { innerHTML: '' };
  const elements = new Map([['page-content', content]]);
  const context = vm.createContext({
    CU: { id: role === 'client' ? 'usr-client-001' : 'usr-org-001', role },
    DB: { users: [], events: [], eventRequests: [], eventPlans: [], notifications: [] },
    _workflowAvailability: null,
    g: id => elements.get(id), v: id => elements.get(id)?.value || '', escapeHtml,
    reqBadge: () => 'blue', _workflowReturnPage: 'request-status', _currentPage: 'request-status',
    apiGetEventRequests: async () => ({ data: structuredClone(state.requests) }),
    apiGetEventPlans: async () => structuredClone(state.plans),
    apiGetWorkflowEvents: async () => structuredClone(state.events),
    apiGetNotifications: async () => [], apiGetCompletionReports: async () => [],
    apiGetEventReports: async () => structuredClone(state.fileReports || []),
    apiGetPrivateOrganizerReviews: async () => [], toast() {},
    apiGetEventPolicy: async () => ({ data: structuredClone(policy) }),
    closeModal() {}, closeDrawer() {}, renderPage: async () => {},
  });
  vm.runInContext(section(sources[role], '    function workflowPayload(', '    function viewRequestDrawer('), context);
  return { context, content, elements, async render() {
    await context.syncWorkflowData();
    context.renderWorkflowRequestDetails(state.requests[0].requestId);
    return content.innerHTML;
  } };
}
function fixture() {
  return { requests: [{ requestId: 'req-flow', clientId: 'cli-001', clientUserId: 'usr-client-001', organizerId: 'org-001', organizerUserId: 'usr-org-001', eventName: 'Client conference', eventType: 'Conference', eventDate: '2099-11-20', budget: 50000, capacity: 80, requirements: 'Catering and sound equipment.', status: 'submitted' }], plans: [], events: [] };
}

async function approvedClientCheckout() {
  const state = fixture();
  Object.assign(state.requests[0], { status: 'awaiting_client', budget: 60000, agreementStatus: 'pending_signature', paymentStatus: 'unpaid',
    activeEventPlanId: 'plan-flow', proposals: [], auditHistory: [] });
  state.plans = [{ eventPlanId: 'plan-flow', requestId: 'req-flow', title: 'Approved final plan', budget: 60000, approvalStatus: 'approved', revision: 1 }];
  const h = harness('client', state), calls = [], notices = [], navigation = [];
  let modal, checkout;
  await h.render();
  h.context.openModal = (title, body, buttons) => { modal = { title, body, buttons }; };
  h.context.toast = (message, type) => notices.push({ message, type });
  h.context.goNav = page => navigation.push(page);
  h.context.window = { EventFlowCheckout: { open: options => { checkout = options; } } };
  h.context.apiGetClientRequests = async () => ({ data: structuredClone(state.requests) });
  const syncStart = sources.client.indexOf('    async function syncClientEventRequests(');
  vm.runInContext("let _workflowEventTab = 'ongoing';" + sources.client.match(/function getClientWorkflowEvents\(\)[\s\S]*?window\.pageWorkflowEvents = pageWorkflowEvents;/)[0]
    + sources.client.slice(syncStart, sources.client.indexOf('    function pageRequestStatus(', syncStart)), h.context);
  h.context.apiUpdateAgreementStatus = async (id, agreementStatus) => { calls.push('agreement'); state.requests[0].agreementStatus = agreementStatus; };
  h.context.apiPayDeposit = async () => {
    calls.push('deposit');
    Object.assign(state.requests[0], { status: 'confirmed', paymentStatus: 'deposit_paid', eventId: 'evt-checkout' });
    state.events = [{ eventId: 'evt-checkout', clientUserId: 'usr-client-001', organizerUserId: 'usr-org-001', name: 'Client conference', date: '2099-11-20', status: 'ongoing' }];
    return { data: { amountPaid: 18000, outstandingBalance: 42000, paymentStatus: 'deposit_paid', bookingStatus: 'confirmed', eventId: 'evt-checkout' } };
  };
  for (const [id, element] of Object.entries({
    'client-agree-terms': { checked: false }, 'pay-modal-err': { style: {}, textContent: '' },
    'payment-modal-container': { innerHTML: '' }, 'modal-foot': { innerHTML: '', style: {} },
  })) h.elements.set(id, element);
  return { ...h, state, calls, notices, navigation, getModal: () => modal, getCheckout: () => checkout,
    async authorizePayment() { await h.context.submitClientMockPayment('req-flow'); return checkout.onAuthorize({ method: 'upi' }); } };
}

test('approved plan details and ongoing cards offer checkout before an event record exists, with one cancellation action', async () => {
  const h = await approvedClientCheckout();
  h.context.renderWorkflowRequestDetails('req-flow');
  const html = h.content.innerHTML;
  assert.equal((html.match(/>Cancel Request<\/button>/g) || []).length, 1);
  assert.equal((html.match(/>Proceed to Payment &amp; Confirmation<\/button>/g) || []).length, 1);
  assert.equal(h.context.DB.events.length, 0);
  const card = h.context.pageWorkflowEvents();
  assert.match(card, /Awaiting Payment/);
  assert.match(card, /openClientPaymentModal\('req-flow'\)/);
  vm.runInContext(html.match(/onclick="(openClientPaymentModal[^\"]*)"/)[1], h.context);
  assert.equal(h.getModal().title, 'Payment & Booking Confirmation');
  assert.match(h.getModal().body, /APPROVED EVENT PLAN/);
  assert.match(h.getModal().body, /18,000/);
  await h.context.submitClientMockPayment('req-flow');
  assert.deepEqual(h.calls, []);
  h.elements.get('client-agree-terms').checked = true;
  await h.context.submitClientMockPayment('req-flow');
  assert.deepEqual(h.calls, [], 'Opening checkout must not submit a deposit');
  assert.equal(h.getCheckout().amount, 18000);
  await h.getCheckout().onAuthorize({ method: 'upi' });
  assert.deepEqual(h.calls, ['agreement', 'deposit']);
  assert.equal(h.context.DB.eventRequests[0].status, 'confirmed');
  assert.equal(h.context.DB.eventRequests[0].paymentStatus, 'deposit_paid');
  assert.match(h.elements.get('payment-modal-container').innerHTML, /Payment Verified/);
  h.context.viewClientPaidBooking('req-flow');
  assert.deepEqual(h.navigation, ['my-events']);
  assert.equal(h.context.window._workflowEventTab, 'upcoming');
  assert.doesNotMatch(h.context.pageWorkflowEvents(), /Pay Remaining Amount/);
});

test('agreement failures stop payment, and pending verification does not display booking-confirmed success', async () => {
  const failed = await approvedClientCheckout();
  failed.elements.get('client-agree-terms').checked = true;
  failed.context.apiUpdateAgreementStatus = async () => { throw new Error('Agreement could not be saved'); };
  await failed.authorizePayment();
  assert.deepEqual(failed.calls, []);
  assert.match(failed.elements.get('payment-modal-container').innerHTML, /Agreement could not be saved/);
  assert.equal(failed.context.DB.eventRequests[0].status, 'awaiting_client');
  const pending = await approvedClientCheckout();
  pending.elements.get('client-agree-terms').checked = true;
  pending.context.apiPayDeposit = async () => ({ data: { bookingStatus: 'awaiting_client', paymentStatus: 'deposit_pending', amountPaid: 0 } });
  await pending.authorizePayment();
  assert.doesNotMatch(pending.elements.get('payment-modal-container').innerHTML, /Booking Confirmed!/);
  assert.equal(pending.notices.some(notice => notice.type === 'success'), false);
});

test('remaining balance actions use the payment API, and disappear after full payment', async () => {
  const h = await approvedClientCheckout();
  h.elements.get('client-agree-terms').checked = true;
  await h.authorizePayment();
  h.context.openClientPaymentModal('req-flow');
  const action = h.getModal().buttons.find(button => button.lbl === 'Pay Remaining Amount');
  assert.ok(action);
  h.context.apiPayForWorkflowEvent = async id => {
    assert.equal(id, 'evt-checkout');
    Object.assign(h.state.requests[0], { paymentStatus: 'fully_paid' });
    return { data: { amount: 42000 } };
  };
  vm.runInContext(action.fn, h.context);
  assert.equal(h.getCheckout().amount, 42000);
  assert.equal(h.context.DB.eventRequests[0].paymentStatus, 'deposit_paid');
  await h.getCheckout().onAuthorize({ method: 'upi' });
  assert.equal(h.context.DB.eventRequests[0].paymentStatus, 'fully_paid');
  const item = h.context.getClientWorkflowEvents().upcoming[0];
  assert.doesNotMatch(h.context.renderWorkflowEventCard(item, 'upcoming'), /Pay Remaining Amount|Pay Now/);
  h.context.openClientPaymentModal('req-flow');
  assert.equal(h.getModal().buttons.some(button => button.lbl === 'Pay Remaining Amount'), false);
});

test('confirmed booking details provide remaining payment while cards offer details and cancellation', async () => {
  const h = await approvedClientCheckout();
  h.elements.get('client-agree-terms').checked = true;
  await h.authorizePayment();
  const request = h.context.DB.eventRequests[0];
  request.eventModifications = [{ id: 'old-mod', requesterRole: 'organizer', status: 'pending_approval', reason: 'Earlier request', newValues: {} }];
  h.context.DB.eventWorkflowPayments = [
    { paymentId: 'captured', requestId: 'req-flow', amount: 24000, status: 'completed' },
    { paymentId: 'failed', requestId: 'req-flow', amount: 999999, status: 'failed' },
    { paymentId: 'other', requestId: 'another-request', amount: 999999, status: 'completed' },
  ];
  h.context.renderWorkflowRequestDetails('req-flow');
  assert.match(h.content.innerHTML, /Remaining amount: ₹36,000/);
  assert.match(h.content.innerHTML, /Pay Remaining Amount/);
  assert.doesNotMatch(h.content.innerHTML, /Pay Now|Booking Confirmation|Update Event|Approve Changes|Decline Changes/);
  assert.match(h.content.innerHTML, /Cancel Event/);
  h.context.openClientPaymentModal('req-flow');
  assert.equal(h.getModal().title, 'Booking Payment');
  assert.match(h.getModal().body, /24,000/);
  assert.match(h.getModal().body, /36,000/);
  assert.doesNotMatch(h.getModal().body, /client-agree-terms|mock-pay-method/);
  assert.ok(h.getModal().buttons.find(button => button.lbl === 'Pay Remaining Amount').fn.includes('36000'));
  assert.ok(!h.getModal().buttons.some(button => /submitClientMockPayment/.test(button.fn)));
  for (const tab of ['upcoming', 'ongoing']) {
    const card = h.context.renderWorkflowEventCard(h.context.getClientWorkflowEvents().all[0], tab);
    assert.match(card, /View Details/);
    assert.match(card, /Cancel Booking|Cancel Event/);
    assert.doesNotMatch(card, /Pay Remaining Amount/);
    assert.doesNotMatch(card, /Pay Now|Booking Confirmation|Update Event/);
  }
  request.paymentStatus = 'unpaid';
  h.context.DB.eventWorkflowPayments = [];
  h.context.openClientPaymentModal('req-flow');
  assert.equal(h.getModal().title, 'Booking Payment');
  assert.ok(h.getModal().buttons.find(button => button.lbl === 'Pay Remaining Amount').fn.includes('60000'));
  assert.ok(!h.getModal().buttons.some(button => /submitClientMockPayment/.test(button.fn)));
});

test('both role editors refuse booked client events while public event editing remains available', async () => {
  for (const role of ['client', 'organizer']) {
    const state = fixture();
    Object.assign(state.requests[0], { status: 'confirmed', paymentStatus: 'deposit_paid', eventId: 'evt-locked' });
    state.events = [{ eventId: 'evt-locked', name: 'Booked event', status: 'ongoing', clientId: 'cli-001', clientUserId: 'usr-client-001', organizerUserId: 'usr-org-001' }];
    const h = harness(role, state), modals = [], notices = [];
    await h.render();
    h.context.openModal = (...args) => modals.push(args);
    h.context.toast = message => notices.push(message);
    vm.runInContext(section(sources[role], '    function openEditEventModal(', '    function deleteEvent('), h.context);
    if (role === 'organizer') vm.runInContext(section(sources.organizer, '    function openUpdateConfirmedEventModal(', '    function calculateModCost('), h.context);
    h.context.openEditEventModal('evt-locked');
    h.context.saveEditEvent('evt-locked');
    h.context.openUpdateConfirmedEventModal('req-flow', 'evt-locked');
    assert.equal(modals.length, 0);
    assert.equal(notices.length, 3);
    assert.ok(notices.every(message => /cannot be edited/.test(message)));
    h.context.DB.events.push({ id: 'evt-public', title: 'Public workshop', date: '2099-11-20', time: '10:00', capacity: 50 });
    h.context.openEditEventModal('evt-public');
    assert.equal(modals.length, 1);
    assert.match(modals[0][0], /Public workshop/);
  }
});

function loadOrganizerEventViews(h) {
  h.context._workflowEventTab = 'ongoing';
  h.context._currentPage = 'my-events';
  vm.runInContext(section(sources.organizer, '    function getOngoingWorkflowItems(', '    function openModal('), h.context);
}

test('organizer ongoing events refresh to show client-accepted planning and open the existing plan workflow', async () => {
  const state = fixture();
  Object.assign(state.requests[0], { status: 'changes_requested', agreementStatus: 'not_sent', paymentStatus: 'unpaid' });
  const h = harness('organizer', state);
  await h.context.syncWorkflowData();
  loadOrganizerEventViews(h);
  assert.equal(h.context.getOngoingWorkflowItems().length, 0);
  Object.assign(state.requests[0], { status: 'planning', budget: 75000, eventDate: '2099-11-22',
    auditHistory: [{ action: 'Client Accepted Requested Changes' }] });
  await h.context.syncWorkflowData();
  const html = h.context.pageWorkflowEvents();
  assert.match(html, /Ongoing Events \(1\)/);
  assert.match(html, /Client conference/);
  assert.match(html, />Planning<\/span>/);
  assert.match(html, /2099-11-22/);
  assert.match(html, /75,000/);
  assert.match(html, /Unpaid/);
  assert.equal(h.context.DB.events.length, 0);
  assert.equal(h.context.DB.eventRequests[0].status, 'planning');
  assert.equal(h.context.DB.eventRequests[0].agreementStatus, 'not_sent');
  assert.equal(h.context.DB.eventRequests[0].paymentStatus, 'unpaid');
  h.context.goNav = page => {
    h.context._currentPage = page;
    if (page === 'request-details') h.context.renderWorkflowRequestDetails(h.context._workflowRequestId);
  };
  vm.runInContext(html.match(/onclick="(viewWorkflowRequestDrawer[^\"]*)"/)[1], h.context);
  assert.equal(h.context._workflowRequestId, 'req-flow');
  assert.equal(h.context._workflowReturnPage, 'my-events');
  assert.match(h.content.innerHTML, /Create Event Plan/);
  assert.match(h.content.innerHTML, /openWorkflowPlanModal\('req-flow'\)/);
});

test('organizer and client keep the same accepted planning work visible through review and payment after reload', async () => {
  for (const status of ['planning', 'plan_submitted', 'plan_revision_requested', 'proposal_sent', 'awaiting_client']) {
    const state = fixture();
    Object.assign(state.requests[0], { status, paymentStatus: 'unpaid', auditHistory: [{ action: 'Client Accepted Requested Changes' }] });
    const organizer = harness('organizer', state), client = harness('client', state);
    await organizer.context.syncWorkflowData();
    await client.context.syncWorkflowData();
    loadOrganizerEventViews(organizer);
    client.context.window = {};
    vm.runInContext("let _workflowEventTab = 'ongoing';" + sources.client.match(/function getClientWorkflowEvents\(\)[\s\S]*?window\.pageWorkflowEvents = pageWorkflowEvents;/)[0], client.context);
    const work = organizer.context.getOngoingWorkflowItems();
    assert.equal(work.length, 1, status);
    assert.equal(work[0].isPlanning, true, status);
    assert.equal(work[0].event, undefined, status);
    assert.equal(work[0].request.status, status);
    assert.equal(client.context.getClientWorkflowEvents().ongoing[0].requestId, work[0].request.requestId, status);
    const html = organizer.context.pageWorkflowEvents();
    assert.match(html, /Ongoing Events \(1\)/);
    if (status === 'plan_submitted' || status === 'proposal_sent') assert.match(html, /Awaiting Client Review/);
    if (status === 'awaiting_client') assert.match(html, /Awaiting Payment/);
    assert.equal(organizer.context.DB.events.length, 0, status);
    assert.equal(organizer.context.DB.eventRequests[0].paymentStatus, 'unpaid', status);
  }
});

test('organizer planning lists exclude other organizers, unopened requests and closed workflows', async () => {
  const state = fixture();
  const accepted = { ...state.requests[0], status: 'planning', auditHistory: [{ action: 'Client Accepted Requested Changes' }] };
  state.requests = [accepted,
    { ...accepted, requestId: 'private', organizerId: 'org-other', organizerUserId: 'usr-other', eventName: 'Other organizer private event' },
    { ...accepted, requestId: 'pending', eventName: 'Unopened request', status: 'submitted', auditHistory: [] },
    { ...accepted, requestId: 'cancelled-record', cancellation: { reason: 'Cancelled' } },
    ...['rejected', 'withdrawn', 'expired', 'cancelled', 'completed'].map(status => ({ ...accepted, requestId: status, status, eventName: 'Closed workflow ' + status })),
  ];
  const h = harness('organizer', state);
  await h.context.syncWorkflowData();
  loadOrganizerEventViews(h);
  assert.equal(h.context.getOngoingWorkflowItems().length, 1);
  const html = h.context.pageWorkflowEvents();
  assert.doesNotMatch(html, /Other organizer private event|Unopened request|Closed workflow/);
  h.context.DB.organizers = [{ organizerId: 'org-profile', userId: h.context.CU.id }];
  h.context.DB.eventRequests = [{ id: 'profile-request', organizerId: 'org-profile', status: 'planning', eventName: 'Profile-linked planning' },
    { id: 'other-profile', organizerId: 'org-other', status: 'planning', eventName: 'Other profile' }];
  assert.equal(h.context.getOngoingWorkflowItems().length, 1);
  assert.equal(h.context.getOngoingWorkflowItems()[0].request.id, 'profile-request');
});

test('organizer counts each booked event and planning request once without reviving completed or cancelled events', async () => {
  const state = fixture();
  const own = state.requests[0];
  state.requests = [
    { ...own, requestId: 'booked', eventId: 'evt-booked', status: 'confirmed', paymentStatus: 'fully_paid', eventName: 'Booked conference' },
    { ...own, requestId: 'planning', status: 'planning', eventName: 'Planning conference' },
    { ...own, requestId: 'planning', status: 'planning', eventName: 'Planning conference' },
    { ...own, requestId: 'ended', eventId: 'evt-ended', status: 'planning', eventName: 'Already completed' },
    { ...own, requestId: 'cancelled', eventId: 'evt-cancelled', status: 'planning', eventName: 'Already cancelled' },
  ];
  const booked = { eventId: 'evt-booked', organizerUserId: 'usr-org-001', name: 'Booked conference', status: 'ongoing', date: own.eventDate };
  state.events = [booked, { ...booked },
    { eventId: 'evt-ended', organizerUserId: 'usr-org-001', status: 'completed', name: 'Already completed' },
    { eventId: 'evt-cancelled', organizerUserId: 'usr-org-001', status: 'cancelled', name: 'Already cancelled' },
    { eventId: 'unrelated', organizerUserId: 'usr-org-001', status: 'ongoing', name: 'Unlinked public event' },
  ];
  const h = harness('organizer', state);
  await h.context.syncWorkflowData();
  loadOrganizerEventViews(h);
  const items = h.context.getOngoingWorkflowItems();
  assert.equal(items.length, 2);
  assert.equal(items.filter(item => item.isPlanning).length, 1);
  assert.equal(items.filter(item => !item.isPlanning).length, 1);
  const html = h.context.pageWorkflowEvents();
  assert.match(html, /Ongoing Events \(2\)/);
  assert.equal((html.match(/<strong>Booked conference<\/strong>/g) || []).length, 1);
  assert.equal((html.match(/<strong>Planning conference<\/strong>/g) || []).length, 1);
  assert.doesNotMatch(h.context.pageOngoingEvents(true), /Already completed|Already cancelled|Unlinked public event/);
  state.requests[0].status = 'completed';
  state.events[0].status = state.events[1].status = 'completed';
  await h.context.syncWorkflowData();
  assert.equal(h.context.getOngoingWorkflowItems().length, 1);
  assert.match(h.context.pageWorkflowEvents(), /Ongoing Events \(1\)/);
});

async function rejectionDialog() {
  const state = fixture(), h = harness('organizer', state), calls = [], notices = [];
  await h.render();
  const classes = new Set(['hidden']);
  const overlay = { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
  const footer = { children: [], style: {}, set innerHTML(value) { this.children = []; }, appendChild(button) { this.children.push(button); } };
  for (const [id, value] of Object.entries({
    'modal-title': {}, 'modal-body': {}, 'modal-foot': footer, 'modal-overlay': overlay,
    'workflow-reject-type': { value: 'budget' }, 'workflow-reject-reason': { value: '' },
    'workflow-reject-budget': { style: {} }, 'workflow-reject-date': { style: {} },
    'workflow-reject-policy': { style: {} }, 'workflow-change-policy': { checked: false },
    'workflow-new-budget': { value: '' }, 'workflow-new-date': { value: '' }, 'workflow-reject-error': { textContent: '' },
  })) h.elements.set(id, value);
  h.context.document = { createElement() { return { attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } }; } };
  h.context.requestAnimationFrame = callback => callback();
  h.context.toast = (message, type) => notices.push({ message, type });
  h.context.apiRequest = async (endpoint, options) => {
    const body = JSON.parse(options.body);
    calls.push({ endpoint, method: options.method, body });
    Object.assign(state.requests[0], body.reasonType === 'permanent'
      ? { status: 'rejected', rejectionReason: body.reason }
      : { status: 'changes_requested' });
    return { success: true, data: structuredClone(state.requests[0]) };
  };
  vm.runInContext(section(sources.organizer, '    function openModal(', '    function closeModalOnBg(')
    + section(sources.organizer, 'async function apiRejectEventRequest(', 'async function apiRespondToEventRequest('), h.context);
  await h.context.openWorkflowRejectModal('req-flow');
  return { ...h, calls, notices, footer, isOpen: () => classes.has('open'), click(label) {
    const button = footer.children.find(item => item.textContent === label);
    assert.ok(button, `Missing ${label} button`);
    return typeof button.onclick === 'function' ? button.onclick() : vm.runInContext(button.attributes.onclick, h.context);
  } };
}

test('organizer rejection dialog has one Cancel, a Reject action, and the existing Send Response action', async () => {
  const h = await rejectionDialog();
  assert.deepEqual(h.footer.children.map(button => button.textContent), ['Cancel', 'Reject', 'Send Response']);
  await h.click('Reject');
  assert.equal(h.elements.get('workflow-reject-error').textContent, 'Please enter a reason.');
  assert.equal(h.calls.length, 0);
  assert.equal(h.isOpen(), true);
  h.click('Cancel');
  assert.equal(h.isOpen(), false);
  assert.equal(h.calls.length, 0);
});

test('Reject permanently rejects the request with its reason even when budget change is selected', async () => {
  const h = await rejectionDialog();
  h.elements.get('workflow-reject-reason').value = '  The requested date is unavailable.  ';
  await h.click('Reject');
  assert.deepEqual(h.calls, [{ endpoint: '/event-requests/req-flow/reject', method: 'POST',
    body: { reason: 'The requested date is unavailable.', reasonType: 'permanent' } }]);
  assert.equal(h.context.DB.eventRequests[0].status, 'rejected');
  assert.equal(h.context.DB.eventRequests[0].rejectionReason, 'The requested date is unavailable.');
  assert.equal(h.isOpen(), false);
  assert.ok(h.notices.some(notice => notice.type === 'success' && notice.message === 'Request permanently rejected'));
});

test('failed permanent rejection keeps the dialog and reason available for retry', async () => {
  const h = await rejectionDialog();
  h.elements.get('workflow-reject-reason').value = 'The venue is unavailable.';
  h.context.apiRequest = async () => { throw new Error('Unable to save rejection'); };
  await h.click('Reject');
  assert.equal(h.context.DB.eventRequests[0].status, 'submitted');
  assert.equal(h.elements.get('workflow-reject-reason').value, 'The venue is unavailable.');
  assert.equal(h.isOpen(), true);
  assert.ok(h.notices.some(notice => notice.type === 'error' && notice.message === 'Unable to save rejection'));
  assert.equal(h.notices.some(notice => notice.type === 'success'), false);
});

test('Send Response still requires policy agreement and sends the proposed budget as a change', async () => {
  const h = await rejectionDialog();
  h.elements.get('workflow-reject-reason').value = 'Catering requires a larger budget.';
  h.elements.get('workflow-new-budget').value = '55000';
  await h.click('Send Response');
  assert.equal(h.calls.length, 0);
  h.elements.get('workflow-change-policy').checked = true;
  await h.click('Send Response');
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].body.reasonType, 'budget');
  assert.equal(h.calls[0].body.proposedBudget, 55000);
  assert.equal(h.calls[0].body.acceptedPolicyVersion, policy.version);
  assert.equal(h.context.DB.eventRequests[0].status, 'changes_requested');
});

test('both pages refresh the same workflow and expose actions only to the responsible role', async () => {
  const state = fixture();
  const client = harness('client', state);
  const organizer = harness('organizer', state);
  assert.match(await organizer.render(), /onclick="acceptWorkflowRequest/);
  assert.doesNotMatch(await client.render(), /onclick="acceptWorkflowRequest/);
  state.requests[0].status = 'planning';
  assert.match(await organizer.render(), /Create Event Plan/);
  assert.doesNotMatch(await client.render(), /onclick="openWorkflowPlanModal/);
  state.requests[0].status = 'plan_submitted';
  state.requests[0].activeEventPlanId = 'plan-flow';
  state.plans.push({ eventPlanId: 'plan-flow', requestId: 'req-flow', title: 'Full plan', description: 'Detailed event plan', budget: 50000, approvalStatus: 'pending', documentFileName: 'plan.pdf', documentName: 'Conference plan.pdf' });
  const clientPlan = await client.render();
  assert.match(clientPlan, /Accept Plan/);
  assert.match(clientPlan, /Request New Plan/);
  assert.match(clientPlan, /View PDF/);
  assert.doesNotMatch(await organizer.render(), /onclick="reviewWorkflowPlan/);
  state.requests[0].status = 'plan_revision_requested';
  state.plans[0].approvalStatus = 'revision_requested';
  state.plans[0].revisionReason = 'Please revise catering.';
  assert.match(await organizer.render(), /Edit and Resubmit Plan/);
  assert.match(await client.render(), /Please revise catering/);
  assert.equal(client.context.DB.eventRequests[0].clientId, 'usr-client-001');
  assert.equal(organizer.context.DB.eventRequests[0].organizer, 'usr-org-001');
});

test('clients see negotiation choices and escaped rejection reasons', async () => {
  const state = fixture();
  const h = harness('client', state);
  state.requests[0].status = 'changes_requested';
  state.requests[0].negotiations = [{ action: 'changes_requested', reason: 'A larger budget is needed.', budget: 60000 }];
  let html = await h.render();
  for (const label of ['Accept Changes', 'Reject Changes', 'Send Counteroffer', 'A larger budget is needed.']) assert.ok(html.includes(label));
  state.requests[0].status = 'rejected';
  state.requests[0].rejectionReason = 'The <venue> is unavailable & cannot be booked.';
  html = await h.render();
  assert.match(html, /Reason for declining/);
  assert.match(html, /The &lt;venue&gt; is unavailable &amp; cannot be booked/);
  assert.doesNotMatch(html, /onclick="respondToWorkflowChanges/);
});

test('approved events show payment for the client and completion requirements for the organizer', async () => {
  const state = fixture();
  Object.assign(state.requests[0], { status: 'confirmed', eventId: 'evt-flow', paymentStatus: 'unpaid' });
  state.events.push({ eventId: 'evt-flow', name: 'Client conference', date: '2099-11-20', status: 'ongoing', clientId: 'cli-001', organizerId: 'org-001' });
  const client = harness('client', state);
  const organizer = harness('organizer', state);
  assert.match(await client.render(), /Pay Remaining Amount/);
  assert.doesNotMatch(await organizer.render(), /onclick="payWorkflowEvent/);
  assert.match(organizer.content.innerHTML, /client must complete full payment/);
  state.requests[0].paymentStatus = 'fully_paid';
  assert.doesNotMatch(await client.render(), /Pay Remaining Amount|Pay Now/);
  assert.match(await organizer.render(), /Completion is available after the event date/);
  state.requests[0].eventDate = '2000-01-01';
  assert.match(await organizer.render(), /Mark Event as Completed/);
  assert.equal(client.context.DB.events.filter(item => item.eventId === 'evt-flow').length, 1);
});

test('client submission calls the backend and cannot create a local-only request', async () => {
  const h = harness('client', fixture());
  await h.context.syncWorkflowData();
  h.elements.set('req-policy', { checked: true });
  const values = { 'req-title': 'New conference', 'req-type': 'Conference', 'req-date': '2099-11-20', 'req-city': 'Mumbai', 'req-guests': '80', 'req-budget': '50000', 'req-desc': 'Conference requirements', 'req-venue': 'City Hall' };
  for (const [id, value] of Object.entries(values)) h.elements.set(id, { value });
  h.context.openModal = () => {};
  const notices = [];
  h.context.toast = (...args) => notices.push(args);
  h.context.DB.users.push({ id: 'usr-org-001', role: 'organizer', name: 'Test Organizer' });
  let payload;
  h.context.apiCreateEventRequest = async data => { payload = data; };
  h.context.runWorkflowAction = action => action();
  vm.runInContext(section(sources.client, '    let eventRequestDraft = null;', '    function pageUpcomingEvents('), h.context);
  await h.context.loadWorkflowEventPolicy();
  const before = h.context.DB.eventRequests.length;
  h.elements.get('req-policy').checked = false;
  h.context.reviewEventRequest('usr-org-001');
  await h.context.submitEventRequest('usr-org-001');
  assert.equal(payload, undefined, 'Unchecked terms must block submission');
  h.elements.get('req-policy').checked = true;
  h.context.reviewEventRequest('usr-org-001');
  assert.ok(vm.runInContext('eventRequestDraft', h.context), `Accepted request should reach the review step: ${JSON.stringify(notices)}`);
  await h.context.submitEventRequest('usr-org-001');
  assert.equal(payload.organizerId, 'usr-org-001');
  assert.equal(payload.eventName, 'New conference');
  assert.equal(payload.capacity, 80);
  assert.equal(payload.policyAccepted, true);
  assert.equal(payload.acceptedPolicyVersion, policy.version);
  assert.equal(payload.startTime, undefined);
  assert.equal(payload.endTime, undefined);
  assert.equal(payload.budgetFlexibility, undefined);
  assert.equal(h.context.DB.eventRequests.length, before);
});

test('client event request submission excludes startTime, endTime, budgetFlexibility, prevents duplicates, and preserves draft on error', async () => {
  const h = harness('client', fixture());
  await h.context.syncWorkflowData();
  h.elements.set('req-policy', { checked: true });
  const values = {
    'req-title': 'Corporate Gala',
    'req-type': 'Gala',
    'req-date': '2099-12-25',
    'req-city': 'Bengaluru',
    'req-guests': '150',
    'req-budget': '75000',
    'req-ticket-price': '499.50',
    'req-visibility': 'private',
    'req-desc': 'Annual end-of-year celebration with banquet and awards',
    'req-venue': 'Grand Palace Hall',
  };
  for (const [id, value] of Object.entries(values)) h.elements.set(id, { value });
  let modalTitle = null, modalContent = null;
  h.context.openModal = (title, body) => {
    modalTitle = title;
    modalContent = body;
  };
  let closeModalCalls = 0;
  h.context.closeModal = () => { closeModalCalls++; };
  const toasts = [];
  h.context.toast = (msg, type) => toasts.push({ msg, type });
  h.context.DB.users.push({ id: 'usr-org-001', role: 'organizer', name: 'Test Organizer' });

  vm.runInContext(section(sources.client, '    let eventRequestDraft = null;', '    function pageUpcomingEvents('), h.context);
  await h.context.loadWorkflowEventPolicy();

  for (const invalid of ['-1', '1.234', 'not-a-price']) {
    h.elements.get('req-ticket-price').value = invalid;
    h.context.reviewEventRequest('usr-org-001');
    assert.equal(vm.runInContext('eventRequestDraft', h.context), null);
    assert.equal(toasts.at(-1)?.type, 'error');
  }
  h.elements.get('req-ticket-price').value = '499.50';
  h.context.reviewEventRequest('usr-org-001');
  assert.equal(modalTitle, 'Review Event Request');
  assert.match(modalContent, /Corporate Gala/);
  assert.match(modalContent, /₹75,000/);
  assert.match(modalContent, /Grand Palace Hall/);
  assert.match(modalContent, /Ticket Price per Attendee/);
  assert.match(modalContent, /499\.5/);
  assert.doesNotMatch(modalContent, /18:30|23:00|flexibility/i);

  const draft = vm.runInContext('eventRequestDraft', h.context);
  assert.ok(draft);
  assert.equal(draft.startTime, undefined);
  assert.equal(draft.endTime, undefined);
  assert.equal(draft.budgetFlexibility, undefined);
  assert.equal(draft.budget, 75000);
  assert.equal(draft.ticketPrice, 499.5);
  assert.equal(draft.visibility, 'private');
  await h.context.openRequestModal('usr-org-001', true);
  assert.match(modalContent, /id="req-ticket-price"[^>]*value="499\.5"/);
  assert.match(modalContent, /value="private" selected/);

  let submitCalls = 0;
  h.context.apiCreateEventRequest = async () => {
    submitCalls++;
    throw new Error('Server error occurred');
  };

  await h.context.submitEventRequest();
  assert.equal(submitCalls, 1);
  assert.equal(closeModalCalls, 0, 'Modal should remain open on failure');
  assert.ok(vm.runInContext('eventRequestDraft', h.context), 'Draft should be preserved for retry');
  assert.equal(toasts.at(-1)?.type, 'error');

  let resolveSubmission;
  const inFlightPromise = new Promise(resolve => { resolveSubmission = resolve; });
  let payloadSent = null;
  h.context.apiCreateEventRequest = async (payload) => {
    submitCalls++;
    payloadSent = payload;
    await inFlightPromise;
    return { success: true, message: 'Request sent to organizer!' };
  };

  const p1 = h.context.submitEventRequest();
  const p2 = h.context.submitEventRequest();
  assert.equal(submitCalls, 2);

  resolveSubmission();
  await Promise.all([p1, p2]);

  assert.equal(submitCalls, 2, 'Duplicate concurrent submission must be blocked');
  assert.equal(payloadSent.startTime, undefined);
  assert.equal(payloadSent.endTime, undefined);
  assert.equal(payloadSent.budgetFlexibility, undefined);
  assert.equal(payloadSent.budget, 75000);
  assert.equal(payloadSent.ticketPrice, 499.5);
  assert.equal(payloadSent.visibility, 'private');
  assert.equal(closeModalCalls, 1, 'Modal should be closed on success');
  assert.equal(vm.runInContext('eventRequestDraft', h.context), null, 'Draft should be cleared on success');
  assert.equal(toasts.at(-1)?.type, 'success');
});


test('organizer submits the selected PDF before submitting its linked event plan', async () => {
  const state = fixture();
  state.requests[0].status = 'planning';
  const h = harness('organizer', state);
  await h.render();
  const calls = [];
  h.elements.set('workflow-plan-pdf', { files: [{ name: 'conference.pdf', type: 'application/pdf', size: 100 }] });
  h.context.apiUploadEventPlanDocument = async (id, file) => calls.push(['upload', id, file.name]);
  h.context.apiCreateEventPlan = async body => calls.push(['submit', body.requestId, body.budget, body.capacity]);
  let pending;
  h.context.runWorkflowAction = action => { pending = action(); return pending; };
  await h.context.submitWorkflowPlan('req-flow');
  await pending;
  assert.deepEqual(calls, [['upload', 'req-flow', 'conference.pdf'], ['submit', 'req-flow', 50000, 80]]);
});

test('both client creation entry points link to policies and terms and require agreement before calling the server', async () => {
  const h = harness('client', fixture());
  const panels = [];
  h.context.openModal = (title, body) => panels.push(body);
  h.context.openDrawer = (title, body) => panels.push(body);
  h.context.syncOrganizerDirectory = async () => {};
  h.context.DB.users.push({ id: 'usr-org-001', role: 'organizer', name: 'Test Organizer' });
  vm.runInContext(section(sources.client, '    async function openNewRequestForm(', '    function submitPlan('), h.context);
  vm.runInContext(section(sources.client, '    async function openRequestModal(', '    function pageUpcomingEvents('), h.context);
  await h.context.openNewRequestForm();
  await h.context.openRequestModal('usr-org-001');
  assert.match(panels[0], /id="nr-policy"/);
  assert.match(panels[1], /id="req-policy"/);
  assert.match(panels[0], /id="nr-ticket-price"[^>]*min="0"[^>]*step="0\.01"/);
  assert.match(panels[1], /id="req-ticket-price"[^>]*min="0"[^>]*step="0\.01"/);
  assert.match(panels[0], /id="nr-visibility"/);
  assert.match(panels[1], /id="req-visibility"/);
  for (const html of panels) {
    assert.match(html, /Event Policies &amp; Rules/);
    assert.match(html, /Terms and Conditions/);
    assert.match(html, /14 days/);
    assert.match(html, /cancellation fee is 10%/);
    assert.doesNotMatch(html, /<details|Agree on venue permissions|The client approves the final event plan/);
  }
  const values = { 'nr-organizer': 'usr-org-001', 'nr-title': 'New conference', 'nr-type': 'Conference', 'nr-date': '2099-11-20', 'nr-guests': '80', 'nr-budget': '50000', 'nr-desc': 'Conference requirements', 'nr-venue': 'City Hall' };
  for (const [id, value] of Object.entries(values)) h.elements.set(id, { value });
  let payload;
  h.context.apiCreateEventRequest = async data => { payload = data; };
  h.context.runWorkflowAction = action => action();
  h.elements.set('nr-policy', { checked: false });
  await h.context.submitRequest();
  assert.equal(payload, undefined);
  h.elements.get('nr-policy').checked = true;
  h.elements.set('nr-ticket-price', { value: '-5' });
  await h.context.submitRequest();
  assert.equal(payload, undefined);
  h.elements.get('nr-ticket-price').value = '250.25';
  await h.context.submitRequest();
  assert.equal(payload.policyAccepted, true);
  assert.equal(payload.acceptedPolicyVersion, policy.version);
  assert.equal(payload.ticketPrice, 250.25);
  assert.equal(payload.visibility, 'public');
});

test('client and organizer open separate policy and terms views without losing form values or agreement', async () => {
  for (const role of ['client', 'organizer']) {
    const state = fixture();
    const savedPolicy = structuredClone(policy);
    savedPolicy.version = 'saved-request-policy';
    savedPolicy.sections[0].items.push('Confirm the <venue> capacity & safety rules.');
    state.requests[0].policySnapshot = savedPolicy;
    const h = harness(role, state);
    const html = await h.render();
    assert.match(html, /openWorkflowPolicyDocument\('policies'/);
    assert.match(html, /openWorkflowPolicyDocument\('terms'/);
    let focused, openModalCalls = 0;
    const input = { value: 'Unsaved conference details', isConnected: true, focus() { focused = input; } };
    const checkbox = { checked: true };
    h.elements.set('req-title', input);
    h.elements.set('workflow-accept-policy', checkbox);
    const overlays = [];
    const document = { activeElement: input, body: { appendChild(node) { overlays.push(node); } }, createElement() {
      const listeners = {};
      const closeButton = { focus() { focused = closeButton; } };
      return { style: {}, innerHTML: '', removed: false, listeners, setAttribute() {}, addEventListener(type, handler) { listeners[type] = handler; },
        querySelector() { return closeButton; }, remove() { this.removed = true; } };
    } };
    h.context.document = document;
    h.context.openModal = () => { openModalCalls++; };
    h.context.openWorkflowPolicyDocument('policies', savedPolicy.version);
    assert.equal(overlays.length, 1);
    assert.match(overlays[0].innerHTML, /Cancellation and refund policy/);
    assert.match(overlays[0].innerHTML, /10% fee/);
    assert.match(overlays[0].innerHTML, /Confirm the &lt;venue&gt; capacity &amp; safety rules/);
    assert.doesNotMatch(overlays[0].innerHTML, /The client approves the final event plan/);
    assert.match(overlays[0].innerHTML, /saved-request-policy/);
    h.context.closeWorkflowPolicyDocument();
    assert.equal(overlays[0].removed, true);
    assert.equal(focused, input);
    h.context.openWorkflowPolicyDocument('terms', savedPolicy.version);
    assert.equal(overlays.length, 2);
    assert.match(overlays[1].innerHTML, /Terms and conditions/);
    assert.match(overlays[1].innerHTML, /The client approves the final event plan/);
    assert.doesNotMatch(overlays[1].innerHTML, /Cancellation and refund policy|Confirm the &lt;venue&gt;/);
    overlays[1].listeners.keydown({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
    assert.equal(overlays[1].removed, true);
    assert.equal(input.value, 'Unsaved conference details');
    assert.equal(checkbox.checked, true);
    assert.equal(openModalCalls, 0, 'Reading documents must leave the parent event form intact');
    assert.equal(focused, input);
  }
});

test('organizer acceptance, counteroffers, and proposed changes use the exact policy saved with the request', async () => {
  const state = fixture();
  const savedPolicy = { ...structuredClone(policy), version: 'saved-policy-version' };
  state.requests[0].policySnapshot = savedPolicy;
  const h = harness('organizer', state);
  await h.render();
  let modal, payload, calls = 0;
  h.context.openModal = (title, body) => { modal = body; };
  h.context.apiAcceptEventRequest = async (id, body) => { calls++; payload = body; };
  h.context.apiAcceptCounteroffer = h.context.apiAcceptEventRequest;
  h.context.apiRejectEventRequest = h.context.apiAcceptEventRequest;
  h.context.runWorkflowAction = action => action();
  h.elements.set('workflow-accept-policy', { checked: false });
  await h.context.acceptWorkflowRequest('req-flow');
  assert.match(modal, /saved-policy-version/);
  await h.context.submitWorkflowAcceptance('req-flow');
  assert.equal(calls, 0);
  h.elements.get('workflow-accept-policy').checked = true;
  await h.context.submitWorkflowAcceptance('req-flow');
  assert.equal(payload.acceptedPolicyVersion, savedPolicy.version);
  await h.context.acceptWorkflowCounteroffer('req-flow');
  await h.context.submitWorkflowAcceptance('req-flow');
  assert.equal(calls, 2);
  h.elements.set('workflow-reject-type', { value: 'budget' });
  h.elements.set('workflow-reject-reason', { value: 'Catering needs a larger budget.' });
  h.elements.set('workflow-new-budget', { value: '55000' });
  h.elements.set('workflow-change-policy', { checked: false });
  await h.context.openWorkflowRejectModal('req-flow');
  assert.match(modal, /saved-policy-version/);
  h.context.submitWorkflowReject('req-flow');
  assert.equal(calls, 2);
  h.elements.get('workflow-change-policy').checked = true;
  h.context.submitWorkflowReject('req-flow');
  assert.equal(calls, 3);
  assert.equal(payload.acceptedPolicyVersion, savedPolicy.version);
  assert.equal(payload.proposedBudget, 55000);
});

function cancellationFixture() {
  const state = fixture();
  Object.assign(state.requests[0], { status: 'confirmed', eventId: 'evt-flow', paymentStatus: 'fully_paid' });
  state.events.push({ eventId: 'evt-flow', name: 'Client conference', date: '2099-11-20', status: 'ongoing', clientId: 'cli-001', organizerId: 'org-001' });
  const preview = { eventId: 'evt-flow', canCancel: true, minimumNoticeDays: 14, cancellationDeadline: '2099-11-06T04:30:00.000Z', paidAmount: 50000, cancellationFeePercent: 10, cancellationFee: 5000, refundAmount: 45000, policy };
  return { state, preview };
}

test('client cancellation previews the fee and refund, requires a reason and consent, then displays the saved result for both roles', async () => {
  const { state, preview } = cancellationFixture();
  const h = harness('client', state);
  const organizer = harness('organizer', state);
  assert.match(await h.render(), /onclick="openWorkflowCancellation/);
  assert.doesNotMatch(await organizer.render(), /onclick="openWorkflowCancellation/);
  let modal, actions, payload, visited;
  h.context.openModal = (title, body, buttons) => { modal = body; actions = buttons; };
  h.context.apiPreviewClientEventCancellation = async () => ({ data: structuredClone(preview) });
  h.context.apiCancelClientEvent = async (id, body) => {
    payload = body;
    state.requests[0].status = state.events[0].status = 'cancelled';
    state.requests[0].cancellation = { reason: body.reason, paidAmount: 50000, cancellationFeePercent: 10, cancellationFee: 5000, refundAmount: 45000, refundStatus: 'pending', cancelledAt: '2099-10-01T10:00:00Z' };
  };
  h.context.viewWorkflowRequestDrawer = id => { visited = id; };
  await h.context.openWorkflowCancellation('evt-flow');
  for (const text of ['50,000.00', '5,000.00', '45,000.00', 'Cancellation fee (10%)', 'Cancellation deadline', 'pending review']) assert.ok(modal.includes(text), text);
  assert.ok(actions.some(item => item.lbl === 'Confirm Cancellation'));
  h.elements.set('workflow-cancel-error', { textContent: '' });
  h.elements.set('workflow-cancel-reason', { value: ' ' });
  h.elements.set('workflow-cancel-policy', { checked: false });
  await h.context.submitWorkflowCancellation('evt-flow');
  assert.equal(payload, undefined);
  assert.match(h.elements.get('workflow-cancel-error').textContent, /10 to 1000/);
  h.elements.get('workflow-cancel-reason').value = '  Our conference plans changed.  ';
  await h.context.submitWorkflowCancellation('evt-flow');
  assert.equal(payload, undefined);
  h.elements.get('workflow-cancel-policy').checked = true;
  await h.context.submitWorkflowCancellation('evt-flow');
  assert.equal(payload.reason, 'Our conference plans changed.');
  assert.equal(payload.expectedPaidAmount, 50000);
  assert.equal(payload.acceptedPolicyVersion, policy.version);
  assert.equal(visited, 'req-flow');
  for (const page of [h, organizer]) {
    const html = await page.render();
    assert.match(html, /Our conference plans changed/);
    assert.match(html, /45,000.00/);
    assert.match(html, /Refund pending review/);
    assert.doesNotMatch(html, /onclick="openWorkflowCancellation|Pay Remaining Amount|Pay Now/);
  }
});

test('a closed cancellation window has no confirmation action and failed cancellation preserves the reason for retry', async () => {
  const { state, preview } = cancellationFixture();
  const h = harness('client', state);
  await h.render();
  let modal, actions, calls = 0;
  h.context.openModal = (title, body, buttons) => { modal = body; actions = buttons; };
  h.context.apiPreviewClientEventCancellation = async () => ({ data: { ...preview, canCancel: false, unavailableReason: 'Cancellation closes 14 days before the event.' } });
  h.context.apiCancelClientEvent = async () => { calls++; throw Error('Payment changed. Review a new quote.'); };
  await h.context.openWorkflowCancellation('evt-flow');
  assert.match(modal, /Cancellation closes 14 days/);
  assert.ok(!actions.some(item => item.lbl === 'Confirm Cancellation'));
  await h.context.submitWorkflowCancellation('evt-flow');
  assert.equal(calls, 0);
  h.context.apiPreviewClientEventCancellation = async () => ({ data: preview });
  await h.context.openWorkflowCancellation('evt-flow');
  h.elements.set('workflow-cancel-reason', { value: 'Our conference plans changed.' });
  h.elements.set('workflow-cancel-policy', { checked: true });
  h.elements.set('workflow-cancel-error', { textContent: '' });
  await h.context.submitWorkflowCancellation('evt-flow');
  assert.equal(calls, 1);
  assert.match(h.elements.get('workflow-cancel-error').textContent, /Payment changed/);
  assert.equal(h.elements.get('workflow-cancel-reason').value, 'Our conference plans changed.');
  assert.equal(h.context.DB.events[0].status, 'ongoing');
});

test('organizer reports use the requesting client and save files through the API, preserving failures for retry', async () => {
  const state = fixture();
  Object.assign(state.requests[0], { eventId: 'evt-report', status: 'completed' });
  state.events.push({ eventId: 'evt-report', name: 'Client conference', status: 'completed', clientId: 'cli-001', clientUserId: 'usr-client-001', organizerId: 'org-001' });
  const h = harness('organizer', state);
  await h.render();
  h.context.DB.users.push({ id: 'usr-admin-001', name: 'Admin', role: 'superuser' }, { id: 'usr-client-001', name: 'Requesting Client', email: 'client@example.com', role: 'client' });
  vm.runInContext(section(sources.organizer, '    function reportContactHtml(', '    function pageReports('), h.context);
  vm.runInContext(section(sources.organizer, '    function getEventReportRecipients(', '    function deleteEventReport('), h.context);
  let modal, submissions = 0, closes = 0;
  h.context.openModal = (title, body) => { modal = body; };
  h.context.closeModal = () => { closes++; };
  h.context.openSubmitReportModal('evt-report');
  assert.match(modal, /Requesting Client/);
  assert.match(modal, /automatically to the client who requested this event/);
  assert.doesNotMatch(modal, /<select|Admin/);
  const file = { name: 'event-report.pdf', size: 100 };
  h.elements.set('report-file', { files: [file] });
  h.elements.set('event-report-error', { textContent: '' });
  h.context.apiUploadEventReport = async () => { submissions++; throw Error('Upload failed; try again.'); };
  await h.context.submitEventReport('evt-report');
  assert.equal(closes, 0);
  assert.match(h.elements.get('event-report-error').textContent, /Upload failed/);
  assert.equal(h.elements.get('report-file').files[0], file);
  assert.equal(h.context.DB.reports.length, 0);
  h.context.apiUploadEventReport = async (eventId, selected) => { submissions++; assert.equal(eventId, 'evt-report'); assert.equal(selected, file); };
  await h.context.submitEventReport('evt-report');
  assert.equal(submissions, 2);
  assert.equal(closes, 1);
  assert.equal(h.context.getEventReportRecipients({ id: 'unlinked-event' }).length, 0, 'An event without a client must never fall back to admin');
});

test('the client can see and download organizer report files in the completed event details', async () => {
  const state = fixture();
  Object.assign(state.requests[0], { eventId: 'evt-report', status: 'completed' });
  state.events.push({ eventId: 'evt-report', name: 'Client conference', status: 'completed', clientId: 'cli-001' });
  state.fileReports = [{ eventReportId: 'rpt-file', eventId: 'evt-report', clientId: 'cli-001', clientUserId: 'usr-client-001', clientName: 'Michael Torres', reportTitle: 'Conference summary', reportDetails: 'Final event services and expenses.', documentName: 'conference-summary.pdf', documentFileName: 'stored-report.pdf' }];
  const h = harness('client', state);
  const html = await h.render();
  assert.match(html, /Conference summary/);
  assert.match(html, /Final event services and expenses/);
  assert.match(html, /downloadWorkflowEventReport\('rpt-file'\)/);
  assert.match(html, /conference-summary.pdf/);
  assert.equal(h.context.DB.reports[0].recipientId, 'usr-client-001');
});

test('organizer submitted reports open real uploads and labeled sample files with working download controls', async () => {
  const h = harness('organizer', fixture());
  vm.runInContext(section(sources.organizer, '    const organizerReportSamples =', '    function reportContactHtml('), h.context);
  const sample = { id: 'rpt-org-001', submittedBy: 'usr-org-001', fileName: 'healthcare-innovation-forum-final-report.pdf' };
  const uploaded = { id: 'rpt-upload', eventReportId: 'rpt-upload', submittedBy: 'usr-org-001', documentName: 'uploaded-summary.pdf', documentFileName: 'stored.pdf' };
  const missing = { id: 'rpt-legacy', submittedBy: 'usr-org-001', fileName: 'original-not-saved.pdf' };
  h.context.DB.reports = [sample, uploaded, missing];
  const sampleHtml = h.context.renderOrganizerReportFile(sample);
  assert.match(sampleHtml, /View File/);
  assert.match(sampleHtml, /Download/);
  assert.match(sampleHtml, /Sample/);
  assert.match(sampleHtml, /-sample.html/);
  assert.match(h.context.renderOrganizerReportFile(uploaded), /uploaded-summary.pdf/);
  assert.match(h.context.renderOrganizerReportFile(uploaded), /View File/);
  assert.doesNotMatch(h.context.renderOrganizerReportFile(uploaded), /Sample/);
  assert.match(h.context.renderOrganizerReportFile(missing), /No file saved/);
  assert.doesNotMatch(h.context.renderOrganizerReportFile(missing), /View File|Download/);
  const calls = [], previews = [], links = [], errors = [];
  h.context.API_BASE_URL = 'http://localhost/api';
  h.context.getAuthHeader = () => 'Bearer test-token';
  h.context.window = { open() { const preview = { location: {}, close() { this.closed = true; } }; previews.push(preview); return preview; } };
  h.context.URL = { createObjectURL: () => 'blob:report-file', revokeObjectURL() {} };
  h.context.setTimeout = () => {};
  h.context.document = { body: { appendChild(link) { links.push(link); } }, createElement() { return { click() { this.clicked = true; }, remove() {} }; } };
  h.context.toast = message => errors.push(message);
  h.context.fetch = async (url, options) => { calls.push([url, options]); return { ok: true, blob: async () => ({}) }; };
  await h.context.openOrganizerReportFile(sample.id);
  assert.equal(calls[0][0], '/assets/demo-reports/rpt-org-001.html');
  assert.equal(calls[0][1].headers, undefined);
  assert.equal(previews[0].location.href, 'blob:report-file');
  assert.equal(previews[0].opener, null);
  const sampleFile = path.join(__dirname, '../public/assets/demo-reports/rpt-org-001.html');
  assert.match(fs.readFileSync(sampleFile, 'utf8'), /SAMPLE REPORT/);
  await h.context.openOrganizerReportFile(uploaded.id, true);
  assert.equal(calls[1][0], 'http://localhost/api/reports/events/rpt-upload/file');
  assert.equal(calls[1][1].headers.Authorization, 'Bearer test-token');
  assert.equal(links[0].download, 'uploaded-summary.pdf');
  assert.equal(links[0].clicked, true);
  h.context.fetch = async () => ({ ok: false });
  await h.context.openOrganizerReportFile(uploaded.id);
  assert.equal(previews[1].closed, true);
  assert.match(errors[0], /could not be loaded/);
});
