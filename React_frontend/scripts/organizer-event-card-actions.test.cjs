const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const portalSource = require('./portal-source.cjs');

const source = portalSource('organizer');
const section = (start, end) =>
  source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));

function setup() {
  const event = {
    id: 'local-event',
    eventId: 'booked-event',
    title: 'Client conference',
    organizerUserId: 'user-organizer',
    organizerId: 'org-profile',
    clientId: 'client-profile',
    date: '2099-11-06',
    time: '10:00',
    venue: 'Conference Hall',
    category: 'Corporate',
    status: 'ongoing',
    backendStatus: 'ongoing',
    price: 0,
    capacity: 200,
    registered: 1,
  };
  const request = {
    id: 'local-request',
    requestId: 'confirmed-request',
    eventId: event.eventId,
    organizerUserId: 'user-organizer',
    organizerId: 'org-profile',
    status: 'confirmed',
    paymentStatus: 'deposit_paid',
    agreedPrice: 5000000,
    budget: 6000000,
  };
  const elements = new Map(
    ['ev-q', 'ev-st', 'ev-cat', 'ev-grid'].map(id => [id, { value: '', innerHTML: '' }])
  );
  const cancellations = [];
  const html = value =>
    String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
      .replaceAll('<', '&lt;');
  const context = vm.createContext({
    CU: { role: 'organizer', id: 'user-organizer', organizerId: 'org-profile' },
    DB: {
      events: [event],
      eventRequests: [request],
      registrations: [],
      payments: [],
      organizers: [],
    },
    escapeHtml: html,
    workflowHtml: html,
    evStatBadge: () => 'gray',
    g: id => elements.get(id),
    openOrganizerEventCancellationModal: (...ids) => cancellations.push(ids),
  });
  vm.runInContext(section('function pageEvents(', 'function openAddEventModal('), context);
  vm.runInContext(section('function isCancelledWorkflowEvent(', 'function openModal('), context);
  return { context, event, request, elements, cancellations };
}

test('both organizer event views show the same status, payment, budget and explicit cancellation action', () => {
  const h = setup();
  // An attendee ticket price must not replace the agreed client budget.
  h.event.price = 1000;
  for (const html of [h.context.evCard(h.event, 'organizer'), h.context.pageOngoingEvents(true)]) {
    assert.match(html, />Upcoming<\/span>/);
    assert.match(html, /₹50,00,000/);
    assert.match(html, /Deposit Paid/);
    assert.match(html, />View Details<\/button>/);
    assert.match(html, />Cancel Event<\/button>/);
    assert.doesNotMatch(html, /openEditEventModal|deleteEvent\(|handleOrganizerDeleteEvent/);
    const action = html
      .match(/onclick="(openOrganizerEventCancellationModal[^\"]*)"/)[1]
      .replaceAll('&#39;', "'");
    vm.runInContext(action, h.context);
  }
  assert.deepEqual(h.cancellations, [
    ['booked-event', 'confirmed-request'],
    ['booked-event', 'confirmed-request'],
  ]);
});

test('active public events offer Edit and Cancel Event; only unused drafts offer Delete Draft', () => {
  const { context, event } = setup();
  context.DB.eventRequests = [];
  delete event.clientId;
  let html = context.evCard(event, 'organizer');
  assert.match(html, />Edit<\/button>/);
  assert.match(html, />Cancel Event<\/button>/);
  assert.doesNotMatch(html, /handleOrganizerDeleteEvent|deleteEvent\(/);
  event.status = event.backendStatus = 'draft';
  event.registered = 0;
  html = context.evCard(event, 'organizer');
  assert.match(html, />Delete Draft<\/button>/);
  assert.doesNotMatch(html, />Cancel Event<\/button>/);
  context.DB.payments.push({ eventId: event.eventId, status: 'completed', amount: 100 });
  html = context.evCard(event, 'organizer');
  assert.doesNotMatch(html, /handleOrganizerDeleteEvent|Delete Draft/);
  assert.match(html, />Cancel Event<\/button>/);
});

test('closed events preserve history and neither view offers edit, delete or repeated cancellation', () => {
  const { context, event, request } = setup();
  for (const status of ['completed', 'cancelled']) {
    event.status = event.backendStatus = request.status = status;
    const html = context.evCard(event, 'organizer');
    assert.doesNotMatch(
      html,
      /openEditEventModal|handleOrganizerDeleteEvent|openOrganizerEventCancellationModal|deleteEvent\(/
    );
    assert.doesNotMatch(context.pageOngoingEvents(true), /Client conference/);
    if (status === 'cancelled') assert.match(html, />View Cancellation History<\/button>/);
  }
});

test('planning and other organizers events offer no cancellation action', () => {
  const { context, event, request } = setup();
  request.status = 'planning';
  request.activeEventPlanId = 'plan-one';
  context.DB.events = [];
  const planning = context.pageOngoingEvents(true);
  assert.match(planning, /viewWorkflowRequestDrawer/);
  assert.doesNotMatch(planning, /openOrganizerEventCancellationModal/);
  request.status = 'confirmed';
  request.organizerUserId = event.organizerUserId = 'another-user';
  request.organizerId = event.organizerId = 'another-profile';
  const html = context.evCard(event, 'organizer');
  assert.doesNotMatch(
    html,
    /openEditEventModal|handleOrganizerDeleteEvent|openOrganizerEventCancellationModal/
  );
});

test('generic events view includes cancelled records, exposes history and filters by the displayed status', () => {
  const { context, event, request, elements } = setup();
  context.DB.events.push({
    ...event,
    id: 'cancelled-local',
    eventId: 'cancelled-event',
    title: 'Cancelled conference',
    status: 'cancelled',
    backendStatus: 'cancelled',
  });
  context.DB.eventRequests.push({
    ...request,
    requestId: 'cancelled-request',
    eventId: 'cancelled-event',
    status: 'cancelled',
  });
  const page = context.pageEvents();
  assert.match(page, /Cancelled Events \(1\)/);
  assert.match(page, /setWorkflowEventTab\('cancelled'\)/);
  assert.match(page, /<option value="cancelled">Cancelled<\/option>/);
  assert.match(page, /Cancelled conference/);
  elements.get('ev-st').value = 'cancelled';
  context.refreshEvents();
  let html = elements.get('ev-grid').innerHTML;
  assert.match(html, /Cancelled conference/);
  assert.doesNotMatch(html, />Client conference<|openOrganizerEventCancellationModal/);
  elements.get('ev-st').value = 'upcoming';
  context.refreshEvents();
  html = elements.get('ev-grid').innerHTML;
  assert.match(html, /Client conference/);
  assert.doesNotMatch(html, /Cancelled conference/);
});
