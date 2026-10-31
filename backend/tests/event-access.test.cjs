const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });
const { DataStore } = require('../src/common/data-store');
const { UserRole } = require('../src/common/constants');
const { RegistrationsService } = require('../src/modules/registrations/registrations.service');
const { PaymentsService } = require('../src/modules/payments/payments.service');
const { EventsService } = require('../src/modules/events/events.service');
const { QrCodeService } = require('../src/common/utils/qr-code.service');
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-access-'));
  const previous = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  DataStore.instance = undefined;
  const db = DataStore.getInstance(), now = new Date();
  const event = { eventId: 'private-1', organizerId: 'org-001', name: 'Private conference', category: 'Conference', date: '2099-12-01', time: '10:00', location: 'Hall A', capacity: 10, ticketPrice: 149.85, visibility: 'private', status: 'published', createdAt: now, updatedAt: now };
  db.events = [event]; db.eventRequests = []; db.registrations = []; db.payments = []; db.refunds = []; db.notifications = [];
  t.after(() => {
    DataStore.instance = undefined;
    if (previous === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previous;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-access-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const registrations = new RegistrationsService(), payments = new PaymentsService();
  const attendee = db.attendees.find(item => item.userId === 'usr-attendee-001');
  const other = db.attendees.find(item => item.userId !== attendee.userId);
  const register = (who = attendee, extra = {}) => registrations.create({ attendeeId: who.attendeeId, eventId: event.eventId, ticketType: 'General', ...extra }, UserRole.ATTENDEE, who.userId);
  const pay = registration => payments.create({ registrationId: registration.registrationId, amount: event.ticketPrice, paymentMethod: 'DEMO_PROVIDER', paymentDate: '2026-10-26' }, UserRole.ATTENDEE, attendee.userId);
  const approve = registration => registrations.review(registration.registrationId, { decision: 'approved' }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  return { db, event, attendee, other, registrations, payments, register, pay, approve };
}

test('public paid and free events confirm registration without organizer review', async t => {
  const h = fixture(t); h.event.visibility = 'public';
  const registration = (await h.register()).data;
  assert.equal(registration.status, 'pending_payment');
  assert.equal(registration.reviewStatus, 'approved');
  assert.equal(registration.verificationId, undefined);
  assert.equal((await h.pay(registration)).data.status, 'completed');
  assert.equal(h.db.registrations[0].status, 'registered');
  assert.ok(h.db.registrations[0].qrCode);
  assert.throws(() => h.approve(registration), /do not require organizer approval/);
  h.event.ticketPrice = 0;
  const free = (await h.register(h.other)).data;
  assert.equal(free.status, 'registered');
  assert.equal(free.reviewStatus, 'approved');
  assert.ok(free.qrCode);
  assert.equal(h.db.payments.length, 1);
});

test('new organizer events retain selected visibility and registration decisions after reload', async t => {
  const h = fixture(t), events = new EventsService();
  const details = { category: 'Conference', date: '2099-12-02', time: '10:00', location: 'Hall B', capacity: 10, ticketPrice: 0, status: 'published' };
  const publicEvent = events.create({ ...details, name: 'New public event', visibility: 'public' }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  const privateEvent = events.create({ ...details, name: 'New private event', visibility: 'private' }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  const defaultEvent = events.create({ ...details, name: 'Default access event' }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  assert.equal(publicEvent.visibility, 'public');
  assert.equal(privateEvent.visibility, 'private');
  assert.equal(defaultEvent.visibility, 'public');
  assert.ok(events.findAll(UserRole.ATTENDEE).some(event => event.eventId === privateEvent.eventId));

  const createRegistration = (who, eventId) => h.registrations.create({ attendeeId: who.attendeeId, eventId, ticketType: 'General' }, UserRole.ATTENDEE, who.userId);
  const direct = (await createRegistration(h.attendee, publicEvent.eventId)).data;
  assert.equal(direct.status, 'registered');
  await assert.rejects(createRegistration(h.attendee, publicEvent.eventId), /already have an active registration/);
  const pending = (await createRegistration(h.attendee, privateEvent.eventId)).data;
  assert.equal(pending.status, 'pending_approval');
  const approved = (await h.registrations.review(pending.registrationId, { decision: 'approved' }, UserRole.EVENT_ORGANIZER, 'usr-org-001')).data;
  assert.equal(approved.status, 'registered');
  assert.equal(approved.reviewStatus, 'approved');
  const declinedRequest = (await createRegistration(h.other, privateEvent.eventId)).data;
  const declined = (await h.registrations.review(declinedRequest.registrationId, { decision: 'rejected', reason: 'Restricted private event.' }, UserRole.EVENT_ORGANIZER, 'usr-org-001')).data;
  assert.equal(declined.status, 'rejected');
  await assert.rejects(createRegistration(h.other, privateEvent.eventId), /already have an active registration/);

  const draft = events.create({ ...details, name: 'Publish later', status: 'draft', visibility: 'private' }, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  events.publish(draft.eventId, UserRole.EVENT_ORGANIZER, 'usr-org-001');
  DataStore.instance = undefined;
  const restored = DataStore.getInstance();
  assert.equal(restored.events.find(event => event.eventId === publicEvent.eventId).visibility, 'public');
  assert.equal(restored.events.find(event => event.eventId === privateEvent.eventId).visibility, 'private');
  assert.equal(restored.events.find(event => event.eventId === draft.eventId).status, 'published');
  assert.equal(restored.registrations.find(registration => registration.registrationId === direct.registrationId).status, 'registered');
  assert.equal(restored.registrations.find(registration => registration.registrationId === approved.registrationId).reviewStatus, 'approved');
  assert.equal(restored.registrations.find(registration => registration.registrationId === declined.registrationId).status, 'rejected');
});

test('private paid registrations require approval before reserving a seat, payment and QR issuance', async t => {
  const h = fixture(t), registration = (await h.register()).data;
  assert.equal(registration.status, 'pending_approval');
  assert.equal(registration.reservationExpiresAt, undefined);
  assert.equal(registration.qrCode, undefined);
  assert.equal(registration.verificationId, undefined);
  assert.equal(h.db.payments.length, 0);
  await assert.rejects(h.pay(registration), /approval is required/);
  await assert.rejects(h.register(), /already have an active registration/);
  const approved = (await h.approve(registration)).data;
  assert.equal(approved.status, 'pending_payment');
  assert.equal(approved.reviewStatus, 'approved');
  assert.ok(approved.reservationExpiresAt > new Date());
  assert.equal(approved.qrCode, undefined);
  assert.equal((await h.pay(registration)).data.status, 'completed');
  assert.ok(h.db.registrations[0].qrCode);
  assert.equal(h.db.registrations[0].status, 'registered');
  await assert.rejects(h.pay(registration), /not awaiting payment/);
  h.db.persist(); DataStore.instance = undefined;
  const restored = DataStore.getInstance();
  assert.equal(restored.events[0].visibility, 'private');
  assert.equal(restored.registrations[0].reviewStatus, 'approved');
});

test('private free registrations issue a ticket only after approval and never take payment', async t => {
  const h = fixture(t); h.event.ticketPrice = 0;
  const registration = (await h.register()).data;
  assert.equal(registration.status, 'pending_approval');
  assert.equal(registration.qrCode, undefined);
  const approved = (await h.approve(registration)).data;
  assert.equal(approved.status, 'registered');
  assert.ok(approved.qrCode);
  assert.ok(approved.verificationId);
  assert.equal(h.db.payments.length, 0);
});

test('declining a private request does not charge, issue a ticket or create a refund', async t => {
  const h = fixture(t), registration = (await h.register()).data;
  const declined = h.registrations.review(registration.registrationId, { decision: 'rejected', reason: 'This private event is restricted to invited participants.' }, UserRole.EVENT_ORGANIZER, 'usr-org-001').data;
  assert.equal(declined.status, 'rejected');
  assert.equal(declined.qrCode, undefined);
  assert.equal(h.db.payments.length, 0); assert.equal(h.db.refunds.length, 0);
  await assert.rejects(h.pay(registration), /approval is required/);
});

test('approvals respect capacity, release expired payment holds and prevent late payment', async t => {
  const h = fixture(t); h.event.capacity = 1;
  const first = (await h.register()).data, second = (await h.register(h.other)).data;
  await h.approve(first);
  assert.throws(() => h.approve(second), /No seats/);
  h.db.registrations[0].reservationExpiresAt = new Date(0);
  await h.approve(second);
  await assert.rejects(h.pay(first), /expired/);
  assert.equal(h.db.registrations[0].status, 'cancelled');
  assert.equal(h.db.registrations[1].status, 'pending_payment');
  assert.equal(h.db.payments.length, 0);
});

test('failed free-ticket generation rolls approval back and private events stay off the anonymous catalog', async t => {
  const h = fixture(t); h.event.ticketPrice = 0;
  const registration = (await h.register()).data;
  const original = QrCodeService.generateQRCode;
  t.after(() => { QrCodeService.generateQRCode = original; });
  QrCodeService.generateQRCode = async () => { throw Error('QR unavailable'); };
  await assert.rejects(h.approve(registration), /QR unavailable/);
  assert.equal(h.db.registrations[0].status, 'pending_approval');
  assert.equal(h.db.registrations[0].reviewStatus, undefined);
  const events = new EventsService();
  assert.equal(events.findAllPublic().length, 0);
  assert.equal(events.findAll(UserRole.ATTENDEE).length, 1);
});

test('private waitlist requests need approval before an offer or ticket can be accepted', async t => {
  const h = fixture(t); h.event.capacity = 1; h.event.ticketPrice = 0; h.event.waitlistEnabled = true;
  const first = (await h.register()).data;
  await h.approve(first);
  const second = (await h.register(h.other, { joinWaitlist: true })).data;
  assert.equal(second.status, 'waitlisted');
  h.registrations.cancel(first.registrationId, 'My plans have changed.', UserRole.ATTENDEE, h.attendee.userId);
  const stored = h.db.registrations.find(item => item.registrationId === second.registrationId);
  assert.equal(stored.offerExpiresAt, undefined);
  stored.offerExpiresAt = new Date(Date.now() + 60000);
  await assert.rejects(h.registrations.confirmWaitlist(second.registrationId, UserRole.ATTENDEE, h.other.userId), /approval is required/);
  stored.offerExpiresAt = undefined;
  await h.approve(second);
  assert.ok(stored.offerExpiresAt > new Date());
  const confirmed = (await h.registrations.confirmWaitlist(second.registrationId, UserRole.ATTENDEE, h.other.userId)).data;
  assert.equal(confirmed.status, 'registered');
  assert.ok(confirmed.qrCode);
  assert.equal(h.db.payments.length, 0);
});

test('client event cancellation closes private approval requests without collecting or refunding money', async t => {
  const h = fixture(t), registration = (await h.register()).data;
  h.event.clientId = 'cli-001'; h.event.status = 'ongoing';
  const events = new EventsService();
  const preview = events.clientCancellationPreview(h.event.eventId, UserRole.CLIENT, 'usr-client-001');
  events.cancelClientEvent(h.event.eventId, { reason: 'Our event plans have changed.', expectedPaidAmount: 0, policyAccepted: true, acceptedPolicyVersion: preview.policy.version }, UserRole.CLIENT, 'usr-client-001');
  assert.equal(h.db.registrations[0].status, 'cancelled');
  assert.equal(h.db.registrations[0].qrCode, undefined);
  assert.equal(h.db.payments.length, 0); assert.equal(h.db.refunds.length, 0);
  assert.ok(h.db.notifications.some(item => item.registrationId === registration.registrationId && item.type === 'event_cancelled'));
  assert.throws(() => h.approve(registration), /no longer pending review/);
});
