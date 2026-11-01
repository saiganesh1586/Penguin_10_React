const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('every client booking cancellation records its actor and sends a linked financial confirmation', async t => {
  for (const driver of ['organizer-request', 'organizer-event', 'client-request', 'client-event']) await t.test(driver, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-cancellation-notice-'));
    const previousFile = process.env.EVENTFLOW_DATA_FILE;
    process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
    const { DataStore } = require('../src/common/data-store');
    const { UserRole } = require('../src/common/constants');
    const { getEventPolicy } = require('../src/common/event-policy');
    const { EventRequestsService } = require('../src/modules/event-requests/event-requests.service');
    const { EventsService } = require('../src/modules/events/events.service');
    DataStore.instance = undefined;
    try {
      const db = DataStore.getInstance(), now = new Date(), policy = getEventPolicy();
      const requestId = `req-notice-${driver}`, eventId = `evt-notice-${driver}`;
      const request = { requestId, eventId, clientId: 'cli-001', organizerId: 'org-001', eventName: 'Cancellation notice conference',
        eventDate: '2099-11-20', eventTime: '10:00', budget: 100000, capacity: 80, requirements: 'Conference requirements.',
        status: 'confirmed', agreementStatus: 'agreed', paymentStatus: 'deposit_paid', policySnapshot: policy, createdAt: now, updatedAt: now };
      db.eventRequests.push(request);
      const event = { eventId, organizerId: 'org-001', clientId: 'cli-001', name: request.eventName, date: request.eventDate,
        time: '10:00', category: 'Conference', location: 'Conference Hall', capacity: 80, ticketPrice: 0, status: 'ongoing', policySnapshot: policy, createdAt: now, updatedAt: now };
      db.events.push(event);
      db.eventWorkflowPayments.push({ paymentId: `pay-${driver}`, requestId, eventId, clientId: 'cli-001', organizerId: 'org-001',
        amount: 30000, status: 'completed', paymentMethod: 'DEMO_PROVIDER', paymentDate: '2026-11-02', createdAt: now, updatedAt: now });
      db.notifications = [];
      const organizer = driver.startsWith('organizer');
      const role = organizer ? UserRole.EVENT_ORGANIZER : UserRole.CLIENT;
      const userId = organizer ? 'usr-org-001' : 'usr-client-001';
      const reason = 'The venue is unavailable for the planned conference.';
      if (driver === 'organizer-event') new EventsService().update(eventId, { status: 'cancelled', changeReason: reason }, role, userId);
      else {
        const dto = { reason, expectedPaidAmount: 30000, policyAccepted: true, acceptedPolicyVersion: policy.version };
        if (driver === 'client-event') new EventsService().cancelClientEvent(eventId, dto, role, userId);
        else new EventRequestsService().cancelRequest(requestId, dto, role, userId);
      }
      assert.equal(request.status, 'cancelled');
      assert.equal(request.cancellation.cancelledByRole, role);
      assert.equal(request.cancellation.cancelledByName, organizer ? 'Sarah Chen' : 'Michael Torres');
      assert.equal(request.cancellation.paidAmount, 30000);
      assert.equal(request.cancellation.cancellationFee, organizer ? 0 : 3000);
      assert.equal(request.cancellation.refundAmount, organizer ? 30000 : 27000);
      assert.equal(request.cancellation.refundStatus, 'pending');
      const notices = db.notifications.filter(item => item.userId === 'usr-client-001' && item.eventId === eventId);
      assert.equal(notices.length, 1);
      assert.equal(notices[0].requestId, requestId);
      assert.ok(notices[0].message.includes(reason));
      assert.match(notices[0].message, /Amount paid: ₹30000.00/);
      assert.match(notices[0].message, organizer ? /Cancellation fee: ₹0.00/ : /Cancellation fee: ₹3000.00/);
      assert.match(notices[0].message, /simulated; pending provider confirmation/);
      assert.match(notices[0].message, /No further booking payments are due/);
      assert.equal(db.eventWorkflowRefunds.filter(item => item.requestId === requestId).length, 1);
      db.persist();
      DataStore.instance = undefined;
      const restored = DataStore.getInstance();
      assert.equal(restored.eventRequests.find(item => item.requestId === requestId).cancellation.cancelledByRole, role);
      assert.ok(restored.notifications.some(item => item.requestId === requestId && item.userId === 'usr-client-001'));
    } finally {
      DataStore.instance = undefined;
      if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previousFile;
      assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
      assert.ok(path.basename(directory).startsWith('eventflow-cancellation-notice-'));
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
