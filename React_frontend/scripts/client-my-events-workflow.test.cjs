const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const portalSource = require('./portal-source.cjs');

const runtimePath = path.resolve(__dirname, '../src/apps/client/app/runtime.js');
const runtimeSource = portalSource('client');

test('accepted changes appear as ongoing planning without creating a confirmed or paid booking', () => {
  const sandbox = setupSandbox({ eventRequests: [{
    id: 'req-planning', requestId: 'req-planning', clientId: 'cli-001', organizerId: 'org-001',
    eventName: 'Accepted Changes Conference', eventDate: '2099-11-20', eventTime: '10:00', budget: 65000,
    status: 'planning', agreementStatus: 'not_sent', paymentStatus: 'unpaid',
    auditHistory: [{ action: 'Client Accepted Requested Changes' }],
  }] });
  const data = sandbox.getClientWorkflowEvents();
  assert.equal(data.ongoing.length, 1);
  assert.equal(data.upcoming.length, 0);
  const item = data.ongoing[0];
  assert.equal(item.bookingStatus, 'planning');
  assert.equal(item.paymentStatus, 'unpaid');
  assert.equal(item.eventId, undefined);
  assert.equal(item.budget, 65000);
  const card = sandbox.renderWorkflowEventCard(item, 'ongoing');
  assert.match(card, />Planning<\/span>/);
  assert.match(card, /Planning in progress/);
  assert.match(card, /viewWorkflowRequestDrawer\('req-planning'\)/);
  assert.match(card, /Withdraw Request/);
  assert.doesNotMatch(card, /Confirmed|Deposit Paid|Fully Paid|Cancel Booking|Event currently underway/);
  sandbox.setWorkflowEventTab('ongoing');
  assert.match(sandbox.pageWorkflowEvents(), /Accepted Changes Conference/);
  const detailsStart = runtimeSource.indexOf('    function viewWorkflowRequestDrawer(');
  vm.runInContext("let _workflowRequestId = null; let _workflowReturnPage = 'request-status';"
    + runtimeSource.slice(detailsStart, runtimeSource.indexOf('    function viewWorkflowEventDetails(', detailsStart)), sandbox);
  vm.runInContext(card.match(/onclick="([^"]+)"/)[1], sandbox);
  assert.equal(vm.runInContext('_workflowRequestId', sandbox), 'req-planning');
  assert.equal(vm.runInContext('_workflowReturnPage', sandbox), 'my-events');
  assert.equal(vm.runInContext('_currentPage', sandbox), 'request-details');
});

test('accepted planning stays visible through proposal review and payment while excluding closed and other clients requests', () => {
  for (const status of ['planning', 'plan_submitted', 'plan_revision_requested', 'proposal_sent', 'awaiting_client']) {
    const request = { id: 'req-planning', clientId: 'cli-001', organizerId: 'org-001', eventName: 'Planning Conference',
      eventDate: '2099-11-20', status, paymentStatus: 'deposit_pending',
      auditHistory: [{ action: 'Client Accepted Requested Changes' }] };
    const sandbox = setupSandbox({ eventRequests: [request,
      { ...request, id: 'req-other', clientId: 'cli-other' },
      ...['withdrawn', 'rejected', 'expired', 'cancelled'].map(closed => ({ ...request, id: closed, status: closed })),
      { ...request, id: 'req-cancellation', cancellation: { reason: 'Cancelled' } },
    ] });
    const data = sandbox.getClientWorkflowEvents();
    assert.equal(data.all.length, 1, status);
    assert.equal(data.ongoing[0].requestId, request.id, status);
    const card = sandbox.renderWorkflowEventCard(data.ongoing[0], 'ongoing');
    if (status === 'proposal_sent') assert.match(card, /openClientPlanReview\('req-planning'\)/);
    if (status === 'awaiting_client') assert.match(card, /openClientPaymentModal\('req-planning'\)/);
  }
});

test('confirmation moves an accepted planning request into its scheduled booking tab without duplicating it', () => {
  const sandbox = setupSandbox({ eventRequests: [{
    id: 'req-confirmed', requestId: 'req-confirmed', eventId: 'evt-confirmed', clientId: 'cli-001', organizerId: 'org-001',
    eventName: 'Confirmed Planning Conference', eventDate: '2099-11-20', status: 'confirmed', paymentStatus: 'deposit_paid',
    auditHistory: [{ action: 'Client Accepted Requested Changes' }],
  }], events: [{ eventId: 'evt-confirmed', clientId: 'cli-001', organizerId: 'org-001', name: 'Confirmed Planning Conference',
    date: '2099-11-20', time: '10:00', status: 'ongoing' }] });
  const data = sandbox.getClientWorkflowEvents();
  assert.equal(data.all.length, 1);
  assert.equal(data.upcoming.length, 1);
  assert.equal(data.ongoing.length, 0);
  assert.equal(data.upcoming[0].isPlanning, false);
  assert.equal(data.upcoming[0].paymentStatus, 'deposit_paid');
});

function setupSandbox(customDB = {}) {
  const domListeners = {};
  const mockStorage = new Map();

  const mockDB = {
    users: [
      { id: 'usr-client-001', userId: 'usr-client-001', name: 'Michael Torres', email: 'client@example.com', role: 'client' },
      { id: 'usr-org-001', userId: 'usr-org-001', name: 'Sarah Chen', email: 'organizer@example.com', role: 'organizer' },
      { id: 'usr-org-002', userId: 'usr-org-002', name: 'Marcus Vance', email: 'organizer2@example.com', role: 'organizer' },
    ],
    clients: [
      { clientId: 'cli-001', userId: 'usr-client-001', companyName: 'Torres Tech Ltd' },
    ],
    organizers: [
      { organizerId: 'org-001', userId: 'usr-org-001', businessName: 'Chen Premier Events' },
      { organizerId: 'org-002', userId: 'usr-org-002', businessName: 'Vance Executive Events' },
    ],
    eventRequests: [],
    events: [],
    ...customDB,
  };

  const sandbox = {
    console,
    Date,
    Math,
    String,
    Number,
    Boolean,
    Array,
    Object,
    RegExp,
    Set,
    Map,
    Intl,
    JSON,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    sessionStorage: {
      getItem: (k) => mockStorage.get(k) || null,
      setItem: (k, v) => mockStorage.set(k, String(v)),
      removeItem: (k) => mockStorage.delete(k),
    },
    localStorage: {
      getItem: (k) => mockStorage.get(k) || null,
      setItem: (k, v) => mockStorage.set(k, String(v)),
      removeItem: (k) => mockStorage.delete(k),
    },
    document: {
      getElementById: (id) => ({
        id,
        innerHTML: '',
        textContent: '',
        value: '',
        style: {},
        classList: { add() {}, remove() {}, toggle() {} },
        setAttribute() {},
        appendChild() {},
      }),
      querySelectorAll: () => [],
      addEventListener: (type, fn) => { domListeners[type] = fn; },
    },
    window: {},
  };

  // Extract functions
  const fnMatch = runtimeSource.match(/function getClientWorkflowEvents\(\)[\s\S]*?window\.pageWorkflowEvents = pageWorkflowEvents;/);
  if (!fnMatch) {
    throw new Error('Could not locate getClientWorkflowEvents block in client runtime');
  }

  const codeToRun = `
    let CU = { id: 'usr-client-001', userId: 'usr-client-001', role: 'client', name: 'Michael Torres' };
    let DB = ${JSON.stringify(mockDB)};
    let _workflowEventTab = 'upcoming';
    let _currentPage = 'my-events';
    function workflowHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function goNav(pg) { _currentPage = pg; }
    function today() { return new Date().toISOString().split('T')[0]; }

    ${fnMatch[0]}
  `;

  vm.createContext(sandbox);
  vm.runInContext(codeToRun, sandbox);

  return sandbox;
}

test('1. My Events Dashboard: exactly 3 summary cards and 3 tabs without Awaiting Confirmation', () => {
  const sandbox = setupSandbox({
    eventRequests: [
      {
        id: 'req-up', requestId: 'req-up', clientId: 'cli-001',
        eventName: 'Future Leadership Summit', eventDate: '2099-12-01', eventTime: '10:00',
        venue: 'Grand Convention Hall', organizerId: 'org-001', status: 'confirmed',
        paymentStatus: 'deposit_paid',
      },
      {
        id: 'req-comp', requestId: 'req-comp', clientId: 'cli-001',
        eventName: 'Past AI Conference', eventDate: '2025-01-15', eventTime: '09:00',
        venue: 'Tech Auditorium', organizerId: 'org-001', status: 'completed',
        paymentStatus: 'fully_paid',
      },
    ],
    events: [
      {
        id: 'evt-ongoing', eventId: 'evt-ongoing', clientId: 'cli-001', organizerId: 'org-002',
        name: 'Live Cloud Hackathon', date: '2026-10-25', time: '08:00',
        location: 'Innovation Arena', status: 'ongoing',
      },
    ],
  });

  const html = sandbox.pageWorkflowEvents();

  // Exactly three summary cards
  assert.match(html, /Upcoming Events/);
  assert.match(html, /Ongoing Events/);
  assert.match(html, /Completed Events/);
  assert.doesNotMatch(html, /Total Events/);
  assert.doesNotMatch(html, /Awaiting Confirmation/);

  // Exactly three tabs
  assert.match(html, /onclick="setWorkflowEventTab\('upcoming'\)"/);
  assert.match(html, /onclick="setWorkflowEventTab\('ongoing'\)"/);
  assert.match(html, /onclick="setWorkflowEventTab\('completed'\)"/);
  assert.doesNotMatch(html, /setWorkflowEventTab\('awaiting'/);

  // Switching tab
  sandbox.setWorkflowEventTab('ongoing');
  assert.equal(sandbox.window._workflowEventTab, 'ongoing');
  const ongoingHtml = sandbox.pageWorkflowEvents();
  assert.match(ongoingHtml, /Live Cloud Hackathon/);

  sandbox.setWorkflowEventTab('completed');
  assert.equal(sandbox.window._workflowEventTab, 'completed');
  const completedHtml = sandbox.pageWorkflowEvents();
  assert.match(completedHtml, /Past AI Conference/);
});

test('2. Dynamic counts & exclusion of withdrawn, rejected, expired, and cancelled bookings', () => {
  const sandbox = setupSandbox({
    eventRequests: [
      // Active confirmed / completed
      { id: 'req-1', clientId: 'cli-001', eventName: 'Upcoming Gala', eventDate: '2099-05-10', eventTime: '18:00', venue: 'Grand Ballroom', organizerId: 'org-001', status: 'confirmed' },
      { id: 'req-2', clientId: 'cli-001', eventName: 'Completed Symposium', eventDate: '2025-06-10', eventTime: '10:00', venue: 'Hall B', organizerId: 'org-001', status: 'completed' },
      // Excluded requests
      { id: 'req-wd', clientId: 'cli-001', eventName: 'Withdrawn Meeting', eventDate: '2099-01-01', status: 'withdrawn' },
      { id: 'req-rej', clientId: 'cli-001', eventName: 'Rejected Pitch', eventDate: '2099-02-01', status: 'rejected' },
      { id: 'req-exp', clientId: 'cli-001', eventName: 'Expired Proposal', eventDate: '2026-09-01', status: 'expired' },
      { id: 'req-canc', clientId: 'cli-001', eventName: 'Cancelled Booking', eventDate: '2099-03-01', status: 'cancelled', cancellation: { reason: 'Budget' } },
      // Different client's booking
      { id: 'req-other', clientId: 'cli-999', eventName: 'Other Client Event', eventDate: '2099-07-01', status: 'confirmed' },
    ],
    events: [
      // Cancelled event
      { id: 'evt-canc', eventId: 'evt-canc', clientId: 'cli-001', name: 'Cancelled Event', date: '2099-04-01', status: 'cancelled' },
    ],
  });

  const data = sandbox.getClientWorkflowEvents();
  assert.equal(data.upcoming.length, 1, 'Upcoming should only count confirmed future booking for this client');
  assert.equal(data.completed.length, 1, 'Completed should only count recorded completed booking for this client');
  assert.equal(data.ongoing.length, 0, 'No ongoing events scheduled');
  assert.equal(data.all.length, 2, 'Total active events should strictly be 2');

  // Verify excluded bookings do not appear
  const titles = data.all.map(item => item.title);
  assert.ok(!titles.includes('Withdrawn Meeting'));
  assert.ok(!titles.includes('Rejected Pitch'));
  assert.ok(!titles.includes('Expired Proposal'));
  assert.ok(!titles.includes('Cancelled Booking'));
  assert.ok(!titles.includes('Cancelled Event'));
  assert.ok(!titles.includes('Other Client Event'));
});

test('3. Lifecycle transitions & time checks: future date to upcoming, scheduled start to ongoing, completion to completed', () => {
  const sandbox = setupSandbox({
    eventRequests: [
      { id: 'req-future', clientId: 'cli-001', eventName: 'Future Summit', eventDate: '2099-01-01', eventTime: '10:00', venue: 'Future Hall', organizerId: 'org-001', status: 'confirmed' },
      { id: 'req-today-started', clientId: 'cli-001', eventName: 'Started Today Event', eventDate: '2026-10-25', eventTime: '06:00', venue: 'Metro Hall', organizerId: 'org-002', status: 'confirmed' },
      { id: 'req-done', clientId: 'cli-001', eventName: 'Done Event', eventDate: '2026-10-20', eventTime: '10:00', venue: 'Past Hall', organizerId: 'org-001', status: 'completed' },
      // Proposal acceptance alone (awaiting_client) must not be in active events
      { id: 'req-prop-acc', clientId: 'cli-001', eventName: 'Accepted Proposal Only', eventDate: '2099-02-01', status: 'awaiting_client', proposals: [{ version: 1, status: 'accepted' }] },
    ],
  });

  const data = sandbox.getClientWorkflowEvents();
  assert.equal(data.upcoming.length, 1);
  assert.equal(data.upcoming[0].title, 'Future Summit');

  assert.equal(data.ongoing.length, 1);
  assert.equal(data.ongoing[0].title, 'Started Today Event');

  assert.equal(data.completed.length, 1);
  assert.equal(data.completed[0].title, 'Done Event');

  // Proposal acceptance alone is not confirmed
  assert.ok(!data.all.some(item => item.title === 'Accepted Proposal Only'));
});

test('4. Event cards content & actions by tab', () => {
  const sandbox = setupSandbox({
    eventRequests: [
      {
        id: 'req-card-test', clientId: 'cli-001', eventName: 'Executive Tech Forum',
        eventDate: '2099-10-15', eventTime: '11:00', venue: 'The Leela Palace',
        organizerId: 'org-001', status: 'confirmed', paymentStatus: 'deposit_paid',
      },
    ],
  });

  sandbox._workflowEventTab = 'upcoming';
  const html = sandbox.pageWorkflowEvents();

  // Card details
  assert.match(html, /Executive Tech Forum/);
  assert.match(html, /2099-10-15 · 11:00/);
  assert.match(html, /The Leela Palace/);
  assert.match(html, /Chen Premier Events|Sarah Chen/);
  assert.match(html, /Confirmed/);
  assert.doesNotMatch(html, /ev-banner-price|Deposit Paid|Fully Paid|Unpaid|Deposit Pending/);

  // Actions
  assert.match(html, /View Details/);
  assert.match(html, /Cancel Event/);

  // Ongoing card actions
  const ongoingCard = sandbox.renderWorkflowEventCard({
    id: 'evt-og-1', title: 'Live Coding Expo', date: '2026-10-25', time: '09:00',
    venue: 'Convention Hall', organizerName: 'Sarah Chen', bookingStatus: 'ongoing',
    paymentStatus: 'fully_paid', requestId: 'req-og-1',
  }, 'ongoing');

  assert.match(ongoingCard, /Event currently underway/);
  assert.match(ongoingCard, /View Details/);
  assert.match(ongoingCard, /Cancel Event/);

  // Completed card actions
  const completedCard = sandbox.renderWorkflowEventCard({
    id: 'evt-cp-1', title: 'Finished Summit', date: '2026-05-10', time: '10:00',
    venue: 'Convention Hall', organizerName: 'Sarah Chen', bookingStatus: 'completed',
    paymentStatus: 'fully_paid', requestId: 'req-cp-1',
  }, 'completed');

  assert.match(completedCard, /Event Successfully Completed/);
  assert.match(completedCard, /View Details/);
  assert.match(completedCard, /View Report/);
});

test('5. Deduplication: linked events and requests yield exactly one unified card', () => {
  const sandbox = setupSandbox({
    eventRequests: [
      {
        id: 'req-shared', requestId: 'req-shared', clientId: 'cli-001', eventId: 'evt-shared',
        eventName: 'Unified Conference', eventDate: '2099-11-20', eventTime: '09:00',
        venue: 'Grand Arena', organizerId: 'org-001', status: 'confirmed',
        paymentStatus: 'fully_paid',
      },
    ],
    events: [
      {
        id: 'evt-shared', eventId: 'evt-shared', clientId: 'cli-001', organizerId: 'org-001',
        title: 'Unified Conference', date: '2099-11-20', time: '09:00',
        venue: 'Grand Arena', status: 'published',
      },
    ],
  });

  const data = sandbox.getClientWorkflowEvents();
  assert.equal(data.all.length, 1, 'Linked event and request must be deduplicated into exactly 1 event record');
  assert.equal(data.upcoming.length, 1);
  assert.equal(data.ongoing.length, 0);
  assert.equal(data.completed.length, 0);
});
