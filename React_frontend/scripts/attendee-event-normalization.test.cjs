const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../src/apps/attendee/app/runtime.js'), 'utf8');
const start = source.indexOf('function normalizeAttendeeEvent(event) {');
const end = source.indexOf('function getRegisteredEventIdSet()', start);
assert.ok(start >= 0 && end > start);

class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : ['2026-10-31T12:00:00'])); }
  static now() { return new Date('2026-10-31T12:00:00').getTime(); }
}

function catalog() {
  const context = { DB: { events: [] }, Date: FixedDate };
  vm.runInNewContext(source.slice(start, end), context);
  return { events: context.DB.events, normalize: context.normalizeAttendeeEvent };
}

function attendeeCard(event, registration = null) {
  const start = source.indexOf('function evCard(e, role, reg = null) {');
  const end = source.indexOf('function openAddEventModal()', start);
  assert.ok(start >= 0 && end > start);
  const context = { DB: { registrations: [] }, CU: { id: 'attendee-1' }, attendeeRegistrationCatalog: [], evStatBadge: () => 'green' };
  vm.runInNewContext(source.slice(start, end), context);
  return context.evCard(event, 'attendee', registration);
}

test('event badges follow schedule, including a future booked event', () => {
  const { normalize } = catalog();
  const event = (eventId, date, time, status = 'published') => ({ eventId, name: eventId, date, time, status, visibility: 'public', capacity: 10, registered: 0 });
  assert.equal(normalize(event('beatreapers', '2026-11-07', '00:00', 'ongoing')).status, 'upcoming');
  assert.equal(normalize(event('later-today', '2026-10-31', '18:00')).status, 'upcoming');
  assert.equal(normalize(event('active', '2026-10-31', '09:00')).status, 'ongoing');
  assert.equal(normalize(event('past', '2026-10-30', '09:00')).status, 'completed');
});

test('backend visibility and IDs determine registration access without duplicate cards', () => {
  const { events, normalize } = catalog();
  const base = { eventId: 'evt-1', name: 'Shared title', date: '2026-11-07', time: '09:00', status: 'published', capacity: 10, registered: 2 };
  assert.equal(normalize({ ...base, visibility: 'public' }).visibility, 'public');
  assert.equal(normalize({ ...base, visibility: 'private' }).visibility, 'private');
  assert.equal(events.length, 1);
  assert.equal(normalize({ ...base, eventId: 'evt-2', visibility: 'public' }).visibility, 'public');
  assert.equal(events.length, 2);
  assert.equal(normalize({ ...base, eventId: 'evt-2' }).visibility, 'public');
  assert.equal(events[1].registered, 2);
});

test('public cards register directly, private cards request approval, registered cards show their state', () => {
  const event = { id: 'evt-1', title: 'Concert', date: '2026-11-07', time: '09:00', venue: 'Hall', category: 'Concert', status: 'upcoming', capacity: 10, registered: 2, price: 0 };
  assert.match(attendeeCard({ ...event, visibility: 'public' }), />Register<\/button>/);
  assert.match(attendeeCard({ ...event, visibility: 'private' }), />Request Approval<\/button>/);
  assert.match(attendeeCard({ ...event, visibility: 'public' }, { status: 'confirmed' }), />✓ Registered<\/button>/);
  assert.match(attendeeCard({ ...event, visibility: 'private' }, { status: 'pending_approval' }), />Approval Pending<\/button>/);
  assert.match(attendeeCard({ ...event, visibility: 'private' }, { status: 'rejected' }), />Declined<\/button>/);
  assert.match(attendeeCard({ ...event, visibility: 'public', registrationDeadline: '2020-01-01' }), /disabled[^>]*>Registration Closed<\/button>/);
  assert.match(attendeeCard({ ...event, visibility: 'public', status: 'full' }, { status: 'confirmed' }), />✓ Registered<\/button>/);
});

test('Browse Events excludes this attendee’s registrations and requests in initial and filtered results', () => {
  const start = source.indexOf('function getRegisteredEventIdSet() {');
  const end = source.indexOf('function toggleRegTerms(', start);
  const elements = { 'browse-grid': { innerHTML: '' } };
  const event = id => ({ id, eventId: id, title: id, date: '2099-12-01', status: 'upcoming', category: 'Concert', city: 'Mumbai', price: 0, createdAt: '2026-10-31' });
  const context = {
    DB: { registrations: [{ attendeeId: 'someone-else', eventId: 'other', status: 'registered' }] },
    CU: { id: 'attendee-1' },
    attendeeEventCatalog: ['registered', 'pending', 'cancelled', 'other'].map(event),
    attendeeRegistrationCatalog: [
      { eventId: 'registered', status: 'registered' },
      { eventId: 'pending', status: 'pending_approval' },
      { eventId: 'cancelled', status: 'cancelled' },
    ],
    evCard: e => `<article>${e.id}</article>`, escapeHtml: String,
    g: id => elements[id] || { value: '' },
  };
  vm.runInNewContext(source.slice(start, end), context);
  const initial = context.pageBrowseEvents();
  assert.doesNotMatch(initial, /<article>registered<\/article>|<article>pending<\/article>/);
  assert.match(initial, /<article>cancelled<\/article>/);
  assert.match(initial, /<article>other<\/article>/);
  context.refreshBrowse();
  assert.doesNotMatch(elements['browse-grid'].innerHTML, /<article>registered<\/article>|<article>pending<\/article>/);
  assert.match(elements['browse-grid'].innerHTML, /<article>cancelled<\/article>/);
});
