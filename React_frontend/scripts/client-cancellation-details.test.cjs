const test = require('node:test');
const assert = require('node:assert/strict');
const parser = require('@babel/parser');
const vm = require('node:vm');
const source = require('./portal-source.cjs')('client');

function harness(overrides = {}) {
  const request = {
    id: 'req-cancelled',
    requestId: 'req-cancelled',
    clientId: 'usr-client-001',
    clientUserId: 'usr-client-001',
    organizerId: 'org-001',
    organizerUserId: 'usr-org-001',
    eventId: 'evt-cancelled',
    eventName: 'Cancelled conference',
    title: 'Cancelled conference',
    type: 'Conference',
    date: '2099-11-06',
    eventDate: '2099-11-06',
    guests: 200,
    budget: 9999981,
    desc: 'Conference requirements.',
    status: 'cancelled',
    paymentStatus: 'deposit_paid',
    proposals: [],
    cancellation: {
      reason: 'Venue unavailable <script>alert(1)</script>',
      cancelledBy: 'usr-org-001',
      cancelledAt: '2026-10-31T12:12:17.374Z',
      paidAmount: 2999994,
      cancellationFeePercent: 0,
      cancellationFee: 0,
      refundAmount: 2999994,
      refundStatus: 'pending',
    },
    ...overrides,
  };
  const storage = new Map(),
    content = { innerHTML: '' },
    notices = [],
    visited = [],
    marked = [];
  const context = vm.createContext({
    CU: { id: 'usr-client-001', name: 'Michael Torres', role: 'client' },
    DB: {
      eventRequests: [request],
      events: [],
      eventPlans: [],
      users: [{ id: 'usr-org-001', role: 'organizer', name: 'Sarah Chen' }],
      notifications: [],
    },
    sessionStorage: {
      getItem: key => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
    },
    g: id => (id === 'page-content' ? content : null),
    v: () => '',
    reqBadge: () => 'gray',
    escapeHtml: value =>
      String(value ?? '').replace(
        /[&<>"']/g,
        char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])
      ),
    toast: message => notices.push(message),
    _workflowReturnPage: 'request-status',
    _currentPage: 'request-status',
  });
  vm.runInContext(
    source.slice(
      source.indexOf('function workflowPayload('),
      source.indexOf('function viewRequestDrawer(')
    ),
    context
  );
  const pageFunctions = new Set(['pageRequestStatus', 'pageNotifications']);
  const definitions = parser
    .parse(source, { sourceType: 'script' })
    .program.body.filter(
      node => node.type === 'FunctionDeclaration' && pageFunctions.has(node.id.name)
    );
  vm.runInContext(definitions.map(node => source.slice(node.start, node.end)).join('\n'), context);
  context.visibleNotifications = () => context.DB.notifications;
  context.markNotifRead = async id => {
    marked.push(id);
  };
  context.viewWorkflowRequestDrawer = id => visited.push(id);
  return { context, request, content, notices, visited, marked };
}

test('the request card and details show the actual organizer cancellation, zero fee and full pending refund', () => {
  const h = harness();
  const card = h.context.pageRequestStatus();
  h.context.renderWorkflowRequestDetails(h.request.id);
  for (const html of [card, h.content.innerHTML]) {
    for (const text of [
      'Cancelled by organizer',
      'Sarah Chen',
      'Venue unavailable &lt;script&gt;',
      'Amount paid',
      'Cancellation fee (0%)',
      'Full refund due',
      '29,99,994.00',
      'Refund pending review',
      'It has not been paid yet.',
      'No further booking payments are due.',
    ])
      assert.ok(html.includes(text), text);
    assert.doesNotMatch(
      html,
      /<script>alert|Refund completed|Pay Remaining Amount|Proceed to Payment|>Cancel Booking</
    );
  }
  assert.match(card, /View Cancellation Details/);
  h.context.DB.events.push({
    id: h.request.eventId,
    eventId: h.request.eventId,
    status: 'cancelled',
  });
  h.context.renderWorkflowRequestDetails(h.request.id);
  assert.doesNotMatch(h.content.innerHTML, /Ongoing Event Workflow|Pay Remaining Amount/);
  assert.equal((h.content.innerHTML.match(/aria-label="Cancellation details"/g) || []).length, 1);
  assert.ok(
    h.content.innerHTML.indexOf('Cancellation details') <
      h.content.innerHTML.indexOf('Event details')
  );
});

test('closed bookings cannot reopen checkout through stale accepted-proposal payment flags', () => {
  const h = harness({
    paymentStatus: 'deposit_pending',
    proposals: [{ status: 'accepted', version: 1, amount: 100000, depositRequired: 30000 }],
  });
  assert.doesNotMatch(h.context.pageRequestStatus(), /Proceed to Payment|>Cancel Booking</);
  h.context.renderWorkflowRequestDetails(h.request.id);
  assert.doesNotMatch(
    h.content.innerHTML,
    /Proceed to Payment|Pay Remaining Amount|>Cancel Request</
  );
});

test('client cancellations retain the fee and distinguish no-payment and missing financial records', () => {
  const h = harness();
  const own = {
    ...h.request.cancellation,
    cancelledBy: 'usr-client-001',
    paidAmount: 30000,
    cancellationFeePercent: 10,
    cancellationFee: 3000,
    refundAmount: 27000,
    explanation: 'The company schedule changed.',
  };
  const html = h.context.renderWorkflowCancellation(own, h.request);
  assert.match(html, /Cancelled by you/);
  assert.match(html, /27,000.00/);
  assert.match(html, /The company schedule changed/);
  assert.doesNotMatch(html, /Full refund due|Refund completed/);
  const simulated = h.context.renderWorkflowCancellation(
    { ...own, refundSimulated: true },
    h.request
  );
  assert.match(simulated, /Simulated refund pending provider confirmation/);
  assert.match(simulated, /This demo refund is simulated/);
  const unpaid = h.context.renderWorkflowCancellation(
    { ...own, paidAmount: 0, cancellationFee: 0, refundAmount: 0, refundStatus: 'not_applicable' },
    h.request
  );
  assert.match(unpaid, /No payment was taken; no refund is needed/);
  assert.doesNotMatch(unpaid, /awaiting review|It has not been paid/);
  const unknown = h.context.renderWorkflowCancellation(undefined, {
    ...h.request,
    cancellation: undefined,
    cancelReason: 'Older booking cancelled.',
  });
  assert.match(unknown, /Older booking cancelled/);
  assert.match(unknown, /Payment and refund details not recorded/);
  assert.doesNotMatch(unknown, /₹0|Refund completed|Full refund due/);
});

test('cancellation notifications escape their reason and open the linked booking after marking them read', async () => {
  const h = harness();
  h.context.DB.notifications = [
    {
      id: 'notice-cancelled',
      userId: 'usr-client-001',
      requestId: h.request.id,
      eventId: h.request.eventId,
      type: 'booking_cancelled',
      title: 'Booking cancelled',
      msg: '<script>unsafe</script>',
      read: false,
    },
  ];
  const html = h.context.pageNotifications();
  assert.match(html, /View Cancellation Details/);
  assert.match(html, /&lt;script&gt;unsafe/);
  assert.doesNotMatch(html, /<script>unsafe/);
  await h.context.openClientCancellationNotification('notice-cancelled');
  assert.deepEqual(h.marked, ['notice-cancelled']);
  assert.deepEqual(h.visited, [h.request.id]);
  h.context.DB.notifications[0].userId = 'usr-other-client';
  await h.context.openClientCancellationNotification('notice-cancelled');
  assert.equal(h.visited.length, 1);
  assert.match(h.notices[0], /unavailable/);
});
