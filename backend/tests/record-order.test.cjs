const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  transpileOnly: true,
});
const { newestRecords } = require('../src/common/utils/record-order');
const { DataStore } = require('../src/common/data-store');
const { UserRole } = require('../src/common/constants');
const { getEventPolicy } = require('../src/common/event-policy');
const { EventsService } = require('../src/modules/events/events.service');
const { RegistrationsService } = require('../src/modules/registrations/registrations.service');
const { EventRequestsService } = require('../src/modules/event-requests/event-requests.service');
const { WorkspaceService } = require('../src/modules/analytics/workspace.service');
const { UsersService } = require('../src/modules/users/users.service');

test('equal creation times put later insertions first without changing the stored array', () => {
  const rows = [
    { id: 'old', createdAt: '2026-11-02T10:00:00Z', updatedAt: '2099-01-01' },
    { id: 'new', createdAt: '2026-11-02T10:00:00Z' },
  ];
  assert.deepEqual(
    newestRecords(rows).map(row => row.id),
    ['new', 'old']
  );
  assert.deepEqual(
    rows.map(row => row.id),
    ['old', 'new']
  );
});

test('new events, requests and registrations lead API and workspace lists after reload', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-record-order-'));
  const previous = process.env.EVENTFLOW_DATA_FILE;
  const previousEnvironment = process.env.NODE_ENV;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  // Reload only the saved test records, without inserting development demo scenarios.
  process.env.NODE_ENV = 'production';
  DataStore.instance = undefined;
  t.after(() => {
    DataStore.instance = undefined;
    if (previous === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previous;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const db = DataStore.getInstance();
  const oldDate = new Date('2020-01-01');
  db.users = [
    {
      userId: 'org-user',
      userRole: UserRole.EVENT_ORGANIZER,
      name: 'Organizer',
      email: 'organizer@example.com',
      status: 'active',
    },
    {
      userId: 'client-user',
      userRole: UserRole.CLIENT,
      name: 'Client',
      email: 'client@example.com',
      status: 'active',
    },
    {
      userId: 'attendee-user',
      userRole: UserRole.ATTENDEE,
      name: 'Attendee',
      email: 'attendee@example.com',
      status: 'active',
    },
  ];
  db.organizers = [
    {
      organizerId: 'org',
      userId: 'org-user',
      rating: 0,
      verificationStatus: 'Approved',
      createdAt: oldDate,
    },
  ];
  db.clients = [{ clientId: 'client', userId: 'client-user' }];
  db.attendees = [{ attendeeId: 'attendee', userId: 'attendee-user' }];
  db.events = [
    {
      eventId: 'old-event',
      organizerId: 'org',
      name: 'Old event on a later date',
      date: '2099-12-01',
      time: '10:00',
      location: 'Hall',
      capacity: 50,
      ticketPrice: 0,
      visibility: 'public',
      status: 'published',
      createdAt: oldDate,
      updatedAt: oldDate,
    },
  ];
  db.registrations = [
    {
      registrationId: 'old-registration',
      eventId: 'old-event',
      attendeeId: 'attendee',
      registrationDate: '2020-01-01',
      status: 'registered',
      createdAt: oldDate,
      updatedAt: oldDate,
    },
  ];
  db.eventRequests = [
    {
      requestId: 'old-request',
      clientId: 'client',
      organizerId: 'org',
      eventName: 'Old request',
      eventDate: '2099-12-01',
      status: 'submitted',
      budget: 50000,
      capacity: 50,
      createdAt: oldDate,
      updatedAt: oldDate,
    },
  ];
  db.payments = [];
  db.refunds = [];
  db.attendance = [];
  const events = new EventsService();
  const requests = new EventRequestsService();
  const registrations = new RegistrationsService();
  const created = events.create(
    {
      name: 'Newest event on an earlier date',
      date: '2099-11-01',
      time: '10:00',
      location: 'Hall',
      capacity: 50,
      status: 'published',
      ticketPrice: 0,
    },
    UserRole.EVENT_ORGANIZER,
    'org-user'
  );
  const requested = requests.create(
    {
      clientId: 'client',
      organizerId: 'org',
      eventName: 'Newest request',
      eventDate: '2099-11-01',
      budget: 50000,
      capacity: 50,
      policyAccepted: true,
      acceptedPolicyVersion: getEventPolicy().version,
    },
    UserRole.CLIENT,
    'client-user'
  ).data;
  const registered = (
    await registrations.create(
      { eventId: created.eventId, attendeeId: 'attendee' },
      UserRole.ATTENDEE,
      'attendee-user'
    )
  ).data;
  // Updating an older record must not displace the newly created record.
  db.events[0].updatedAt = new Date('2099-01-01');
  db.eventRequests[0].updatedAt = new Date('2099-01-01');
  const storedRegistrationOrder = db.registrations.map(row => row.registrationId);
  function verify() {
    const eventService = new EventsService();
    const registrationService = new RegistrationsService();
    assert.equal(
      eventService.findAll(UserRole.EVENT_ORGANIZER, undefined, undefined, 'org-user')[0].eventId,
      created.eventId
    );
    assert.equal(eventService.findAllPublic()[0].eventId, created.eventId);
    assert.equal(
      new EventRequestsService().findAll(UserRole.CLIENT, 'client-user')[0].requestId,
      requested.requestId
    );
    assert.equal(
      registrationService.findAll(UserRole.ATTENDEE, 'attendee-user')[0].registrationId,
      registered.registrationId
    );
    const snapshot = new WorkspaceService(
      eventService,
      registrationService,
      new UsersService()
    ).snapshot(UserRole.EVENT_ORGANIZER, 'org-user');
    assert.equal(snapshot.events[0].eventId, created.eventId);
    assert.equal(snapshot.eventRequests[0].requestId, requested.requestId);
    assert.equal(snapshot.registrations[0].registrationId, registered.registrationId);
    assert.deepEqual(
      DataStore.getInstance().registrations.map(row => row.registrationId),
      storedRegistrationOrder
    );
  }
  verify();
  db.persist();
  DataStore.instance = undefined;
  verify();
});
