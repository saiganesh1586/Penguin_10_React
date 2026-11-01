const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  transpileOnly: true,
});

test('cancellation demos support real previews, preserve interactions after reload, and stay out of production', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-cancellation-demo-'));
  const previousFile = process.env.EVENTFLOW_DATA_FILE;
  const previousEnv = process.env.NODE_ENV;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  process.env.NODE_ENV = 'test';
  const { DataStore } = require('../src/common/data-store');
  const {
    seedEventCancellationDemo,
    CANCELLATION_DEMO_SCENARIO,
  } = require('../src/common/event-cancellation-demo');
  const { EventsService } = require('../src/modules/events/events.service');
  const { UserRole } = require('../src/common/constants');
  DataStore.instance = undefined;
  try {
    const db = DataStore.getInstance();
    const service = new EventsService();
    const demos = db.eventRequests.filter(item => item.demoScenario === CANCELLATION_DEMO_SCENARIO);
    assert.equal(demos.length, 6);
    assert.ok(demos.every(item => item.clientId === 'cli-001' && item.organizerId === 'org-001'));
    for (const [key, paid, fee, refund] of [
      ['deposit-ready', 30000, 3000, 27000],
      ['paid-ready', 120000, 12000, 108000],
      ['unpaid-ready', 0, 0, 0],
    ]) {
      const preview = service.clientCancellationPreview(
        `evt-demo-cancel-${key}`,
        UserRole.CLIENT,
        'usr-client-001'
      );
      assert.equal(preview.canCancel, true, key);
      assert.equal(preview.paidAmount, paid, key);
      assert.equal(preview.cancellationFee, fee, key);
      assert.equal(preview.refundAmount, refund, key);
    }
    const blocked = service.clientCancellationPreview(
      'evt-demo-cancel-deadline-closed',
      UserRole.CLIENT,
      'usr-client-001'
    );
    assert.equal(blocked.canCancel, false);
    assert.match(blocked.unavailableReason, /14 days/);
    for (const [key, fee, refund] of [
      ['client-cancelled', 6000, 54000],
      ['organizer-cancelled', 0, 24000],
    ]) {
      const request = demos.find(item => item.requestId === `req-demo-cancel-${key}`);
      const event = db.events.find(item => item.eventId === request.eventId);
      const refundRecord = db.eventWorkflowRefunds.find(
        item => item.refundId === request.cancellation.refundId
      );
      assert.equal(event.status, 'cancelled');
      assert.deepEqual(event.cancellation, request.cancellation);
      assert.equal(request.cancellation.cancellationFee, fee);
      assert.equal(refundRecord.amount, refund);
      assert.equal(refundRecord.status, 'pending');
    }

    // Exercise an editable example, then ensure seeding never restores its old booking.
    const preview = service.clientCancellationPreview(
      'evt-demo-cancel-deposit-ready',
      UserRole.CLIENT,
      'usr-client-001'
    );
    const cancelled = service.cancelClientEvent(
      preview.eventId,
      {
        reason: 'Our team has postponed the demo event.',
        expectedPaidAmount: preview.paidAmount,
        policyAccepted: true,
        acceptedPolicyVersion: preview.policy.version,
      },
      UserRole.CLIENT,
      'usr-client-001'
    );
    assert.equal(cancelled.data.cancellation.refundAmount, 27000);
    const savedRequest = db.eventRequests.find(item => item.eventId === preview.eventId);
    const sentinel = {
      ...savedRequest,
      requestId: 'req-user-record',
      eventId: undefined,
      demoScenario: undefined,
      notes: 'Keep my existing booking.',
    };
    db.eventRequests.push(sentinel);
    const before = JSON.stringify(demos.map(item => item.cancellation));
    seedEventCancellationDemo(db);
    assert.equal(JSON.stringify(demos.map(item => item.cancellation)), before);
    db.persist();
    DataStore.instance = undefined;
    const restored = DataStore.getInstance();
    assert.equal(
      restored.eventRequests.find(item => item.requestId === savedRequest.requestId).status,
      'cancelled'
    );
    assert.equal(
      restored.eventRequests.find(item => item.requestId === sentinel.requestId).notes,
      sentinel.notes
    );
    for (const [collection, key] of [
      ['events', 'eventId'],
      ['eventRequests', 'requestId'],
      ['eventPlans', 'eventPlanId'],
      ['eventWorkflowPayments', 'paymentId'],
      ['eventWorkflowRefunds', 'refundId'],
      ['notifications', 'notificationId'],
    ]) {
      assert.equal(
        new Set(restored[collection].map(item => item[key])).size,
        restored[collection].length,
        collection
      );
    }

    process.env.NODE_ENV = 'production';
    DataStore.instance = undefined;
    const production = DataStore.getInstance();
    assert.equal(
      production.eventRequests.some(item => item.demoScenario === CANCELLATION_DEMO_SCENARIO),
      false
    );
    assert.equal(
      production.events.some(item => item.eventId.startsWith('evt-demo-cancel-')),
      false
    );
    assert.equal(
      production.eventPlans.some(item => item.demoScenario === CANCELLATION_DEMO_SCENARIO),
      false
    );
    assert.equal(
      production.eventWorkflowPayments.some(item => item.eventId.startsWith('evt-demo-cancel-')),
      false
    );
    assert.equal(
      production.eventWorkflowRefunds.some(item => item.eventId.startsWith('evt-demo-cancel-')),
      false
    );
    assert.equal(
      production.notifications.some(item => item.eventId?.startsWith('evt-demo-cancel-')),
      false
    );
    assert.equal(
      production.eventRequests.find(item => item.requestId === sentinel.requestId).notes,
      sentinel.notes
    );
  } finally {
    DataStore.instance = undefined;
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previousFile;
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-cancellation-demo-'));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
