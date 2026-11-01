const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('organizer attendee demos populate the selected event and preserve approvals across reloads', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-attendee-demo-'));
  const previousFile = process.env.EVENTFLOW_DATA_FILE, previousEnv = process.env.NODE_ENV;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  process.env.NODE_ENV = 'test';
  const { DataStore } = require('../src/common/data-store');
  const { seedOrganizerAttendeeDemo, PRIVATE_ATTENDEE_DEMO_EVENT } = require('../src/common/organizer-attendee-demo');
  const { RegistrationsService } = require('../src/modules/registrations/registrations.service');
  const { EventsService } = require('../src/modules/events/events.service');
  const { UserRole } = require('../src/common/constants');
  DataStore.instance = undefined;
  try {
    const db = DataStore.getInstance(), registrations = new RegistrationsService(), events = new EventsService();
    const original = structuredClone(db.registrations.find(item => !item.registrationId.startsWith('reg-demo-orgatt-')));
    const publicRows = registrations.findAll(UserRole.EVENT_ORGANIZER, 'usr-org-001').filter(item => item.eventId === 'evt-orgdash-017');
    assert.equal(publicRows.length, 10);
    assert.ok(publicRows.every(item => item.attendee?.name && item.attendee?.email));
    assert.equal(publicRows.filter(item => item.status === 'registered').length, 7);
    assert.equal(publicRows.filter(item => item.status === 'pending_payment').length, 2);
    assert.ok(publicRows.some(item => item.payment?.status === 'failed'));
    assert.ok(publicRows.some(item => item.refund?.status === 'pending'));
    assert.ok(publicRows.filter(item => item.status === 'registered').every(item => item.verificationId && item.payment?.amount === 1100));
    assert.equal(registrations.findAll(UserRole.EVENT_ORGANIZER, 'usr-org-002').some(item => item.registrationId.startsWith('reg-demo-orgatt-')), false);

    const storage = new Map([['org_attendees_event', 'evt-orgdash-017']]);
    const context = vm.createContext({
      CU: { id: 'usr-org-001', role: 'organizer' }, DB: { users: [], events: [], registrations: [] },
      sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, String(value)) },
      g: () => ({ value: '' }), v: () => '',
      escapeHtml: value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]),
      apiGetEvents: async () => events.findAll(UserRole.EVENT_ORGANIZER, undefined, undefined, 'usr-org-001'),
      apiGetAttendeeRegistrations: async () => registrations.findAll(UserRole.EVENT_ORGANIZER, 'usr-org-001'),
    });
    const runtime = require('../../React_frontend/scripts/portal-source.cjs')('organizer');
    vm.runInContext(runtime.slice(runtime.indexOf('    let organizerRegistrationEvents = [];'), runtime.indexOf('    function viewAttendeeProfile(')), context);
    await context.syncOrganizerAttendees();
    const markup = context.pageAttendees();
    assert.match(markup, /Women in Engineering Conference/);
    assert.match(markup, /10 attendees/);
    assert.match(markup, /Aditi Shah/);
    assert.doesNotMatch(markup, /No registrations yet|organiserApproveAttendee\('/);
    storage.set('org_attendees_event', PRIVATE_ATTENDEE_DEMO_EVENT);
    assert.match(context.pageAttendees(), /organiserRejectAttendee\('/);

    const pending = db.registrations.filter(item => item.eventId === PRIVATE_ATTENDEE_DEMO_EVENT && item.status === 'pending_approval');
    assert.ok(pending.some(item => item.attendeeId === 'att-001'), 'The standard attendee account can exercise private approval');
    assert.throws(() => registrations.review(pending[0].registrationId, { decision: 'approved' }, UserRole.EVENT_ORGANIZER, 'usr-org-002'), /your own events/);
    await registrations.review(pending[0].registrationId, { decision: 'approved' }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
    const reason = 'This roundtable requires an engineering leadership role.';
    registrations.review(pending[1].registrationId, { decision: 'rejected', reason }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
    seedOrganizerAttendeeDemo(db);
    db.persist();
    DataStore.instance = undefined;
    const restored = DataStore.getInstance();
    assert.equal(restored.registrations.find(item => item.registrationId === pending[0].registrationId).status, 'pending_payment');
    assert.equal(restored.registrations.find(item => item.registrationId === pending[1].registrationId).rejectionReason, reason);
    assert.equal(new Set(restored.registrations.map(item => item.registrationId)).size, restored.registrations.length);
    assert.equal(new Set(restored.payments.map(item => item.paymentId)).size, restored.payments.length);
    assert.equal(JSON.stringify(restored.registrations.find(item => item.registrationId === original.registrationId)), JSON.stringify(original));

    process.env.NODE_ENV = 'production';
    DataStore.instance = undefined;
    const production = DataStore.getInstance();
    assert.equal(production.events.some(item => item.eventId === PRIVATE_ATTENDEE_DEMO_EVENT), false);
    assert.equal(production.users.some(item => item.userId.startsWith('usr-demo-orgatt-')), false);
    assert.equal(production.attendees.some(item => item.attendeeId.startsWith('att-demo-orgatt-')), false);
    assert.equal(production.registrations.some(item => item.registrationId.startsWith('reg-demo-orgatt-')), false);
    assert.equal(production.payments.some(item => item.registrationId.startsWith('reg-demo-orgatt-')), false);
    assert.equal(production.refunds.some(item => item.registrationId.startsWith('reg-demo-orgatt-')), false);
    assert.ok(production.users.some(item => item.userId === 'usr-attendee-001'));
    assert.ok(production.events.some(item => item.eventId === 'evt-orgdash-017'));
    assert.ok(production.registrations.some(item => item.registrationId === original.registrationId));
  } finally {
    DataStore.instance = undefined;
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previousFile;
    if (previousEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnv;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-attendee-demo-'));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
