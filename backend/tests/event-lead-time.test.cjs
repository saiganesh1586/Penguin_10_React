const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  transpileOnly: true,
});
const { minimumEventDate, assertEventLeadTime } = require('../src/common/utils/event-date');
const { DataStore } = require('../src/common/data-store');
const { UserRole } = require('../src/common/constants');
const { getEventPolicy } = require('../src/common/event-policy');
const { EventsService } = require('../src/modules/events/events.service');
const { EventRequestsService } = require('../src/modules/event-requests/event-requests.service');

test('the seven-day boundary follows India calendar dates, including midnight and month changes', () => {
  assert.equal(minimumEventDate(new Date('2026-11-02T18:29:59Z')), '2026-11-09');
  assert.equal(minimumEventDate(new Date('2026-11-02T18:30:00Z')), '2026-11-10');
  assert.equal(minimumEventDate(new Date('2026-12-28T04:00:00Z')), '2027-01-04');
  assert.equal(minimumEventDate(new Date('2028-02-22T04:00:00Z')), '2028-02-29');
  const now = new Date('2026-11-02T04:00:00Z');
  assert.throws(() => assertEventLeadTime('2026-11-08', now), /at least 7 days/);
  assert.doesNotThrow(() => assertEventLeadTime('2026-11-09', now));
  for (const invalid of ['', '2026-02-30', '2026-11-09T10:00:00Z']) {
    assert.throws(() => assertEventLeadTime(invalid, now), /valid event date/);
  }
});

test('event and request creation reject days zero through six before changing stored records', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-11-02T04:00:00Z') });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-lead-time-'));
  const previous = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  DataStore.instance = undefined;
  t.after(() => {
    DataStore.instance = undefined;
    if (previous === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previous;
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const db = DataStore.getInstance();
  db.users = [{ userId: 'organizer-user', name: 'Organizer', status: 'active' }];
  db.organizers = [
    { organizerId: 'organizer', userId: 'organizer-user', verificationStatus: 'Approved' },
  ];
  db.clients = [{ clientId: 'client', userId: 'client-user' }];
  db.events = [];
  db.eventRequests = [];
  db.notifications = [];
  db.registrations = [];
  db.eventChanges = [];
  const events = new EventsService();
  const requests = new EventRequestsService();
  const event = { name: 'Conference', time: '10:00', location: 'Hall', status: 'published' };
  const request = {
    clientId: 'client',
    organizerId: 'organizer',
    eventName: 'Conference',
    budget: 50000,
    capacity: 100,
    policyAccepted: true,
    acceptedPolicyVersion: getEventPolicy().version,
  };
  for (let day = 2; day <= 8; day++) {
    const date = `2026-11-${String(day).padStart(2, '0')}`;
    assert.throws(
      () => events.create({ ...event, date }, UserRole.EVENT_ORGANIZER, 'organizer-user'),
      /at least 7 days/
    );
    assert.throws(
      () => events.create({ ...event, date, organizerId: 'organizer' }, UserRole.SUPER_ADMIN),
      /at least 7 days/
    );
    assert.throws(
      () => requests.create({ ...request, eventDate: date }, UserRole.CLIENT, 'client-user'),
      day === 2 ? /in the future/ : /at least 7 days/
    );
  }
  assert.equal(db.events.length, 0);
  assert.equal(db.eventRequests.length, 0);
  assert.equal(db.notifications.length, 0);
  assert.equal(db.eventChanges.length, 0);
  for (const date of ['2026-11-09', '2026-11-10']) {
    const created = events.create({ ...event, date }, UserRole.EVENT_ORGANIZER, 'organizer-user');
    assert.equal(created.date, date);
    const submitted = requests.create(
      { ...request, eventDate: date },
      UserRole.CLIENT,
      'client-user'
    );
    assert.equal(submitted.data.eventDate, date);
  }
});
