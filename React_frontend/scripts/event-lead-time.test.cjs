const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const portalSource = require('./portal-source.cjs');
const rules = fs.readFileSync(path.join(__dirname, '../src/app/event-date-rules.js'), 'utf8');

function harness() {
  let now = Date.parse('2026-11-02T04:00:00Z');
  class Clock extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
    static now() {
      return now;
    }
  }
  const values = {
    'ne-title': 'Conference',
    'ne-date': '2026-11-08',
    'ne-venue': 'Hall',
    'ne-cap': '50',
    'req-title': 'Conference',
    'req-date': '2026-11-08',
    'req-type': 'Conference',
    'req-city': 'Chennai',
    'req-guests': '50',
    'req-budget': '50000',
    'req-desc': 'Conference with catering',
    'req-venue': 'Hall',
  };
  const notices = [],
    sent = [];
  let markup = '';
  const context = vm.createContext({
    Date: Clock,
    CU: { id: 'client', role: 'client' },
    DB: { users: [{ id: 'organizer', name: 'Organizer' }] },
    v: id => values[id] || '',
    g: () => null,
    toast: message => notices.push(message),
    openModal: (_, body) => {
      markup = body;
    },
    escapeHtml: value => String(value),
    loadWorkflowEventPolicy: async () => {},
    workflowEventPolicy: {},
    workflowPolicyAcknowledgement: () => ({ policyAccepted: true }),
    renderWorkflowEventPolicy: () => '',
    apiCreateEvent: payload => {
      sent.push(payload);
      return new Promise(() => {});
    },
    apiCreateEventRequest: async payload => {
      sent.push(payload);
      return {};
    },
    closeModal() {},
  });
  vm.runInContext(rules, context);
  return {
    context,
    values,
    notices,
    sent,
    markup: () => markup,
    nextDay: () => {
      now += 86400000;
    },
  };
}

test('date validation allows exactly seven days and follows midnight in India', () => {
  const { EventFlowEventDates: dates } = harness().context;
  assert.equal(dates.minimumEventDate(new Date('2026-11-02T18:29:59Z')), '2026-11-09');
  assert.equal(dates.minimumEventDate(new Date('2026-11-02T18:30:00Z')), '2026-11-10');
  assert.equal(dates.minimumEventDate(new Date('2026-12-28T04:00:00Z')), '2027-01-04');
  assert.equal(dates.validateEventLeadTime('2026-11-09'), '');
  assert.match(dates.validateEventLeadTime('2026-11-08'), /at least 7 days/);
  assert.match(dates.validateEventLeadTime('2026-02-30'), /valid event date/);
});

for (const role of ['client', 'organizer', 'admin', 'support-executive', 'finance-executive']) {
  test(`${role} creation form excludes close dates and checks typed dates before sending`, () => {
    const h = harness();
    const source = portalSource(role);
    vm.runInContext(
      source.slice(
        source.indexOf('function openAddEventModal('),
        source.indexOf('function openEditEventModal(')
      ),
      h.context
    );
    h.context.openAddEventModal();
    assert.match(h.markup(), /id="ne-date"[^>]*min="2026-11-09"/);
    h.context.saveNewEvent();
    assert.equal(h.sent.length, 0);
    assert.match(h.notices.at(-1), /at least 7 days/);
    h.values['ne-date'] = '2026-11-09';
    h.context.saveNewEvent();
    assert.equal(h.sent.length, 1);
    assert.equal(h.sent[0].date, '2026-11-09');
  });
}

test('client requests validate at review and again when a draft is submitted later', async () => {
  const h = harness();
  const source = portalSource('client');
  vm.runInContext(
    source.slice(
      source.indexOf('let eventRequestDraft = null;'),
      source.indexOf('function pageUpcomingEvents(')
    ),
    h.context
  );
  await h.context.openRequestModal('organizer');
  assert.match(h.markup(), /id="req-date"[^>]*min="2026-11-09"/);
  h.context.reviewEventRequest('organizer');
  assert.equal(vm.runInContext('eventRequestDraft', h.context), null);
  h.values['req-date'] = '2026-11-09';
  h.context.reviewEventRequest('organizer');
  assert.ok(vm.runInContext('eventRequestDraft', h.context));
  h.nextDay();
  await h.context.submitEventRequest('organizer');
  assert.equal(h.sent.length, 0);
  assert.match(h.notices.at(-1), /2026-11-10 or later/);
  h.values['req-date'] = '2026-11-10';
  h.context.reviewEventRequest('organizer');
  await h.context.submitEventRequest('organizer');
  assert.equal(h.sent.length, 1);
  assert.equal(h.sent[0].eventDate, '2026-11-10');
});
