const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

const { DataStore } = require('../src/common/data-store');
const { ActivityLogService } = require('../src/modules/activity-log/activity-log.service');
const { EventRequestsService } = require('../src/modules/event-requests/event-requests.service');
const { UserRole } = require('../src/common/constants');

test('Client Recent Activity and Cancellation Workflow Verification', async t => {
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const activityService = new ActivityLogService();
  const requestsService = new EventRequestsService();

  await t.test('1. Recent Activity returns meaningful client records without raw HTTP methods', () => {
    const activities = activityService.findForClient('usr-client-001', UserRole.CLIENT, 10);
    assert.ok(activities.length > 0, 'Should return client activities');

    for (const act of activities) {
      assert.ok(!['POST', 'GET', 'PUT', 'PATCH', 'DELETE'].includes(act.action), `Action must not be raw HTTP method: ${act.action}`);
      assert.ok(act.details?.eventName || act.details?.description, 'Must contain eventName or description');
      assert.ok(act.timestamp instanceof Date, 'Must have valid Date timestamp');
    }

    const descriptions = activities.map(a => a.details?.description || '');
    assert.ok(descriptions.some(d => d.includes('submitted') || d.includes('Torres Tech')), 'Should include submitted activity');
  });

  await t.test('2. Cancellation preview calculates fees and permits/denies cancellation based on policy', () => {
    // Test unconfirmed request preview
    const pendingReq = db.eventRequests.find(r => r.clientId === 'cli-001' && r.status !== 'confirmed' && !['cancelled', 'withdrawn'].includes(r.status));
    assert.ok(pendingReq, 'Should have an unconfirmed client request');

    const previewUnconfirmed = requestsService.requestCancellationPreview(pendingReq.requestId, UserRole.CLIENT, 'usr-client-001').data;
    assert.equal(previewUnconfirmed.canCancel, true, 'Unconfirmed request should be cancellable');
    assert.equal(previewUnconfirmed.isConfirmed, false, 'Should be marked as not confirmed');
    assert.equal(previewUnconfirmed.cancellationFee, 0, 'Unconfirmed request should have 0 fee');
    assert.equal(previewUnconfirmed.refundAmount, 0, 'Unconfirmed request should have 0 refund');
  });

  await t.test('3. Confirmed request cancellation enforces deadline, fees and records cancellation', () => {
    // Setup a confirmed request far in the future (> 14 days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);
    const dateStr = futureDate.toISOString().slice(0, 10);

    const testReq = {
      requestId: 'req-test-cancel-001',
      clientId: 'cli-001',
      organizerId: 'org-001',
      eventName: 'Future Test Gala',
      eventType: 'Gala',
      eventDate: dateStr,
      budget: 100000,
      capacity: 100,
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.eventRequests.push(testReq);

    // Add a completed payment of 20,000 for this request
    db.payments.push({
      paymentId: 'pay-test-cancel-001',
      requestId: 'req-test-cancel-001',
      amount: 20000,
      status: 'completed',
      type: 'event_booking',
      createdAt: new Date(),
    });

    // Preview
    const preview = requestsService.requestCancellationPreview(testReq.requestId, UserRole.CLIENT, 'usr-client-001').data;
    assert.equal(preview.canCancel, true);
    assert.equal(preview.isConfirmed, true);
    assert.equal(preview.paidAmount, 20000);
    assert.equal(preview.cancellationFeePercent, 10);
    assert.equal(preview.cancellationFee, 2000); // 10% of 20000
    assert.equal(preview.refundAmount, 18000); // 90% of 20000

    // Cancelling without reason must fail
    assert.throws(() => {
      requestsService.cancelRequest(testReq.requestId, { reason: '' }, UserRole.CLIENT, 'usr-client-001');
    }, /reason is required/);

    // Cancel with reason
    const result = requestsService.cancelRequest(
      testReq.requestId,
      { reason: 'Budget Constraints', explanation: 'Downsizing our annual budget.' },
      UserRole.CLIENT,
      'usr-client-001',
    );
    assert.equal(result.success, true);
    assert.equal(testReq.status, 'cancelled');
    assert.equal(testReq.cancellation.reason, 'Budget Constraints');
    assert.equal(testReq.cancellation.cancellationFee, 2000);
    assert.equal(testReq.cancellation.refundAmount, 18000);
    assert.equal(testReq.cancellation.refundStatus, 'pending');

    // Duplicate cancellation must fail
    assert.throws(() => {
      requestsService.cancelRequest(testReq.requestId, { reason: 'Other' }, UserRole.CLIENT, 'usr-client-001');
    }, /already been recorded/);
  });

  await t.test('4. Confirmed request within the notice deadline cannot be cancelled', () => {
    // Setup a confirmed request within 5 days (< 14 days notice)
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + 5);
    const closeDateStr = closeDate.toISOString().slice(0, 10);

    const closeReq = {
      requestId: 'req-test-cancel-close',
      clientId: 'cli-001',
      organizerId: 'org-001',
      eventName: 'Imminent Test Expo',
      eventType: 'Expo',
      eventDate: closeDateStr,
      budget: 50000,
      capacity: 50,
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.eventRequests.push(closeReq);

    const preview = requestsService.requestCancellationPreview(closeReq.requestId, UserRole.CLIENT, 'usr-client-001').data;
    assert.equal(preview.canCancel, false);
    assert.ok(preview.unavailableReason.includes('Cancellation window closed'));

    // Attempting to cancel must throw
    assert.throws(() => {
      requestsService.cancelRequest(closeReq.requestId, { reason: 'Change of Plans' }, UserRole.CLIENT, 'usr-client-001');
    }, /Cancellation window closed/);
  });
});
