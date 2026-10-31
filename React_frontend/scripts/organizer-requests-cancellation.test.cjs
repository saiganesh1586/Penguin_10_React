const portalSource = require('./portal-source.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const orgRuntime = portalSource('organizer');
const clientRuntime = portalSource('client');

const policy = {
  version: 'policy-test-1',
  cancellation: { minimumNoticeDays: 14, feePercent: 10 },
  sections: []
};

function dateInDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function setupOrganizerHarness(initialRequests = [], initialEvents = [], initialPayments = []) {
  const session = new Map();
  const elements = new Map();
  const toasts = [];
  let modalState = null;
  const context = vm.createContext({
    CU: { id: 'usr-org-001', role: 'organizer', name: 'James Wilson' },
    DB: {
      users: [
        { id: 'usr-client-001', name: 'Michael Torres', email: 'michael@torres.com', role: 'client' },
        { id: 'usr-org-001', name: 'James Wilson', email: 'james@wilson.com', role: 'organizer' }
      ],
      eventRequests: structuredClone(initialRequests),
      events: structuredClone(initialEvents),
      payments: structuredClone(initialPayments),
      eventWorkflowPayments: [],
      refunds: [],
      eventPlans: [],
      notifications: [],
      eventCompletionReports: []
    },
    workflowEventPolicy: policy,
    sessionStorage: {
      getItem: key => session.get(key) || null,
      setItem: (key, val) => session.set(key, String(val)),
      removeItem: key => session.delete(key),
      clear: () => session.clear()
    },
    escapeHtml: str => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    toast: (msg, type) => { toasts.push({ msg, type }); },
    openModal: (title, html, buttons) => { modalState = { title, html, buttons }; },
    closeModal: () => { modalState = null; },
    g: id => elements.get(id) || null,
    v: id => elements.get(id)?.value || '',
    setElement: (id, val) => elements.set(id, { value: val, style: {} }),
    renderPage: () => {},
    goNav: () => {},
    saveDB: () => {},
    today: () => '2026-10-25',
    apiCancelOrganizerEvent: async () => ({ status: 'cancelled' }),
    apiRequest: async (url, options) => {
      const requestId = decodeURIComponent(url.split('/')[2]);
      const request = context.DB.eventRequests.find(item => String(item.id || item.requestId) === requestId);
      if (!request) throw new Error('Booking record not found');
      const payload = JSON.parse(options.body);
      request.status = 'cancelled';
      request.cancellation = {
        reason: payload.reason,
        explanation: payload.explanation,
        paidAmount: payload.expectedPaidAmount,
        cancellationFee: 0,
        refundAmount: payload.expectedPaidAmount,
        refundStatus: payload.expectedPaidAmount > 0 ? 'pending' : 'not_applicable'
      };
      request.auditHistory = [...(request.auditHistory || []), { action: 'Event Booking Cancelled by Organizer' }];
      return { data: { request: structuredClone(request) } };
    }
  });
  context.window = context;
  context.EventFlowData = { invalidate: () => {}, sync: async () => {} };

  // Extract functions from runtime
  const codeToRun = `
    ${orgRuntime.slice(orgRuntime.indexOf('function normalizeEventRequest('), orgRuntime.indexOf('function pageEventRequests()'))}
    ${orgRuntime.slice(orgRuntime.indexOf('function renderOrganizerRowActions('), orgRuntime.indexOf('function workflowPayload('))}
    ${orgRuntime.slice(orgRuntime.indexOf('let _pendingOrganizerCancel = null;'), orgRuntime.indexOf('function openRejectModal('))}
  `;

  vm.runInContext(codeToRun, context);
  return { context, session, toasts, getModal: () => modalState };
}

test('1. Dynamic Status Filters: calculates real counts and filters across all 5 functional groups', () => {
  const requests = [
    { id: 'req-1', organizer: 'usr-org-001', status: 'submitted', eventName: 'Tech Gala', eventDate: '2026-12-01', budget: 50000 },
    { id: 'req-2', organizer: 'usr-org-001', status: 'pending', eventName: 'Music Fest', eventDate: '2026-12-02', budget: 30000 },
    { id: 'req-3', organizer: 'usr-org-001', status: 'proposal_sent', eventName: 'AI Summit', eventDate: '2026-12-03', budget: 80000 },
    { id: 'req-4', organizer: 'usr-org-001', status: 'changes_requested', eventName: 'Auto Expo', eventDate: '2026-12-04', budget: 60000 },
    { id: 'req-5', organizer: 'usr-org-001', status: 'under_review', eventName: 'Startup Pitch', eventDate: '2026-12-05', budget: 25000 },
    { id: 'req-6', organizer: 'usr-org-001', status: 'info_requested', eventName: 'Art Show', eventDate: '2026-12-06', budget: 15000 },
    { id: 'req-7', organizer: 'usr-org-001', status: 'confirmed', eventName: 'Annual Conference', eventDate: '2026-12-07', budget: 120000 },
    { id: 'req-8', organizer: 'usr-org-001', status: 'approved', eventName: 'Winter Ball', eventDate: '2026-12-08', budget: 90000 },
    { id: 'req-9', organizer: 'usr-org-001', status: 'cancelled', eventName: 'Cancelled Event', eventDate: '2026-12-09', budget: 10000 },
    { id: 'req-10', organizer: 'usr-org-001', status: 'rejected', eventName: 'Rejected Event', eventDate: '2026-12-10', budget: 20000 },
    { id: 'req-11', organizer: 'usr-org-001', status: 'withdrawn', eventName: 'Withdrawn Event', eventDate: '2026-12-11', budget: 12000 },
    { id: 'req-12', organizer: 'usr-org-001', status: 'expired', eventName: 'Expired Event', eventDate: '2026-12-12', budget: 18000 },
  ];

  const { context, session } = setupOrganizerHarness(requests);

  // All Requests view
  session.set('org_reqs_tab', 'all');
  let html = context.pageEventRequests();
  assert.match(html, /All Requests \(12\)/);
  assert.match(html, /Action Required \(4\)/); // submitted, pending, proposal_sent, changes_requested
  assert.match(html, /Under Review \(2\)/);     // under_review, info_requested
  assert.match(html, /Confirmed Bookings \(2\)/); // confirmed, approved
  assert.match(html, /Closed Requests \(4\)/);     // cancelled, rejected, withdrawn, expired
  assert.match(html, /Showing 12 of 12 requests/);

  // Dropdown verification
  assert.match(html, /<option value="all"[^>]*>All Requests \(12\)<\/option>/);
  assert.match(html, /<option value="action_required"[^>]*>Action Required \(4\)<\/option>/);
  assert.match(html, /<option value="under_review"[^>]*>Under Review \(2\)<\/option>/);
  assert.match(html, /<option value="confirmed"[^>]*>Confirmed Bookings \(2\)<\/option>/);
  assert.match(html, /<option value="closed"[^>]*>Closed Requests \(4\)<\/option>/);

  // Action Required filter
  session.set('org_reqs_tab', 'action_required');
  html = context.pageEventRequests();
  assert.match(html, /Showing 4 of 12 requests/);
  assert.match(html, /Tech Gala/);
  assert.match(html, /Music Fest/);
  assert.match(html, /AI Summit/);
  assert.match(html, /Auto Expo/);
  assert.doesNotMatch(html, /Startup Pitch/);

  // Under Review filter
  session.set('org_reqs_tab', 'under_review');
  html = context.pageEventRequests();
  assert.match(html, /Showing 2 of 12 requests/);
  assert.match(html, /Startup Pitch/);
  assert.match(html, /Art Show/);

  // Confirmed filter
  session.set('org_reqs_tab', 'confirmed');
  html = context.pageEventRequests();
  assert.match(html, /Showing 2 of 12 requests/);
  assert.match(html, /Annual Conference/);
  assert.match(html, /Winter Ball/);

  // Closed filter
  session.set('org_reqs_tab', 'closed');
  html = context.pageEventRequests();
  assert.match(html, /Showing 4 of 12 requests/);
  assert.match(html, /Cancelled Event/);
  assert.match(html, /Rejected Event/);
  assert.match(html, /Withdrawn Event/);
  assert.match(html, /Expired Event/);
});

test('2. Dynamic Actions by Status: shows only permitted actions for each lifecycle state', () => {
  const { context } = setupOrganizerHarness([]);

  // 1. Submitted / Pending: Review Request only
  const submittedHtml = context.renderOrganizerRowActions({ id: 'r1', status: 'submitted' });
  assert.match(submittedHtml, /Review Request/);
  assert.doesNotMatch(submittedHtml, />Reject</);
  assert.doesNotMatch(submittedHtml, /Send Proposal/);

  const pendingHtml = context.renderOrganizerRowActions({ id: 'r2', status: 'pending' });
  assert.match(pendingHtml, /Review Request/);
  assert.doesNotMatch(pendingHtml, />Reject</);

  // 2. Under Review: Continue Review only
  const reviewHtml = context.renderOrganizerRowActions({ id: 'r3', status: 'under_review' });
  assert.match(reviewHtml, /Continue Review/);
  assert.doesNotMatch(reviewHtml, />Reject</);

  // 3. Awaiting Client Response: View Proposal Status only
  const awaitingHtml = context.renderOrganizerRowActions({ id: 'r4', status: 'proposal_sent' });
  assert.match(awaitingHtml, /View Proposal Status/);
  assert.doesNotMatch(awaitingHtml, /Send Proposal/);
  assert.doesNotMatch(awaitingHtml, /Start Review/);

  // 4. Counteroffer / Changes Requested: Review Changes only
  const changesHtml = context.renderOrganizerRowActions({ id: 'r5', status: 'changes_requested' });
  assert.match(changesHtml, /Review Changes/);
  assert.doesNotMatch(changesHtml, /Send Revised Proposal/);
  assert.doesNotMatch(changesHtml, />Reject</);

  // 5. Confirmed Booking: Manage Event only
  const confirmedHtml = context.renderOrganizerRowActions({ id: 'r6', status: 'confirmed' });
  assert.match(confirmedHtml, /Manage Event/);

  // 6. Closed: View Details only
  for (const st of ['withdrawn', 'cancelled', 'rejected', 'expired']) {
    const closedHtml = context.renderOrganizerRowActions({ id: 'r7', status: st });
    assert.match(closedHtml, /View Details/);
    assert.doesNotMatch(closedHtml, /View History/);
    assert.doesNotMatch(closedHtml, /Cancel Booking/);
    assert.doesNotMatch(closedHtml, /Send Proposal/);
    assert.doesNotMatch(closedHtml, /Start Review/);
  }
});

test('3. Cancellation Validation: blocks missing IDs, unauthorized access, and unconfirmed requests', () => {
  const requests = [
    { id: 'req-unconfirmed', organizer: 'usr-org-001', status: 'under_review', eventName: 'Draft Pitch', eventDate: '2026-11-20' },
    { id: 'req-other-org', organizer: 'usr-other-org', status: 'confirmed', eventName: 'Secret Gala', eventDate: '2026-11-20' },
    { id: 'req-confirmed', organizer: 'usr-org-001', status: 'confirmed', eventName: 'Valid Gala', eventDate: '2026-11-20' }
  ];

  const { context, toasts, getModal } = setupOrganizerHarness(requests);

  // Missing ID
  context.openOrganizerEventCancellationModal('', '');
  assert.ok(toasts.some(t => t.msg.includes('Missing booking ID')));

  // Non-existent ID
  toasts.length = 0;
  context.openOrganizerEventCancellationModal('', 'non-existent-id');
  assert.ok(toasts.some(t => t.msg.includes('Booking record not found')));

  // Unauthorized organizer
  toasts.length = 0;
  context.openOrganizerEventCancellationModal('', 'req-other-org');
  assert.ok(toasts.some(t => t.msg.includes('Unauthorized')));

  // Unconfirmed request (must use rejection/withdrawal)
  context.openOrganizerEventCancellationModal('', 'req-unconfirmed');
  const unconfirmedModal = getModal();
  assert.equal(unconfirmedModal.title, 'Cancellation Not Permitted');
  assert.match(unconfirmedModal.html, /Booking cancellation is only permitted for confirmed bookings/);
  assert.match(unconfirmedModal.html, /withdrawal or rejection workflow/);
});

test('4. Cancellation Policy Window: displays the cutoff and permits organizer-initiated cancellation', () => {
  const requests = [
    { id: 'req-valid-date', organizer: 'usr-org-001', status: 'confirmed', eventName: 'Future Summit', eventDate: dateInDays(31), budget: 50000 },
    { id: 'req-past-cutoff', organizer: 'usr-org-001', status: 'confirmed', eventName: 'Imminent Summit', eventDate: dateInDays(5), budget: 50000 }
  ];

  const { context, getModal } = setupOrganizerHarness(requests);

  // The client-policy cutoff is shown, but organizer-initiated cancellation is still allowed.
  context.openOrganizerEventCancellationModal('', 'req-past-cutoff');
  const pastCutoffModal = getModal();
  assert.equal(pastCutoffModal.title, 'Cancel Event');
  assert.match(pastCutoffModal.html, /\(passed\)/);
  assert.match(pastCutoffModal.html, /14 days notice/);

  // Event is 31 days away -> within the cancellation window.
  context.openOrganizerEventCancellationModal('', 'req-valid-date');
  const allowedModal = getModal();
  assert.equal(allowedModal.title, 'Cancel Event');
  assert.match(allowedModal.html, /Organizer Initiated Cancellation/);
  assert.match(allowedModal.html, /Mandatory Cancellation Reason/);
});

test('5. Payment and Refund Calculation: unpaid cancellations owe no refund; organizer cancellations refund paid amounts in full', () => {
  const requests = [
    { id: 'req-unpaid', organizer: 'usr-org-001', status: 'confirmed', eventName: 'Unpaid Gala', eventDate: dateInDays(31), budget: 100000, paymentStatus: 'unpaid' },
    { id: 'req-paid', organizer: 'usr-org-001', status: 'confirmed', eventName: 'Paid Gala', eventDate: dateInDays(31), budget: 100000, paymentStatus: 'fully_paid' }
  ];
  const payments = [
    { paymentId: 'p-1', requestId: 'req-paid', amount: 100000, status: 'completed' }
  ];

  const { context, getModal } = setupOrganizerHarness(requests, [], payments);

  // Unpaid: ₹0 paid, ₹0 fee, ₹0 refund due (no invented numbers)
  context.openOrganizerEventCancellationModal('', 'req-unpaid');
  let modal = getModal();
  assert.match(modal.html, /Amount Actually Paid:<\/span>\s*<strong>₹0<\/strong>/);
  assert.match(modal.html, /Applicable Cancellation Fee \(0%\):<\/span>\s*<strong>₹0<\/strong>/);
  assert.match(modal.html, /Estimated Refund:<\/span>\s*<strong>₹0 \(No refund due\)<\/strong>/);

  // Organizer-initiated cancellation has no fee: the full paid amount is refundable.
  context.openOrganizerEventCancellationModal('', 'req-paid');
  modal = getModal();
  assert.match(modal.html, /Amount Actually Paid:<\/span>\s*<strong>(?:₹100,000|₹1,00,000)<\/strong>/);
  assert.match(modal.html, /Applicable Cancellation Fee \(0%\):<\/span>\s*<strong>₹0<\/strong>/);
  assert.match(modal.html, /Estimated Refund:<\/span>\s*<strong>(?:₹100,000|₹1,00,000) \(Pending review\)<\/strong>/);
});

test('6. Two-Step Confirmation and Duplicate Prevention: requires mandatory reason, summarizes consequences, and prevents duplicates', async () => {
  const requests = [
    { id: 'req-booking', organizer: 'usr-org-001', status: 'confirmed', eventName: 'Leadership Retreat', eventDate: dateInDays(31), budget: 40000 }
  ];
  const payments = [
    { paymentId: 'p-ret', requestId: 'req-booking', amount: 40000, status: 'completed' }
  ];

  const { context, getModal } = setupOrganizerHarness(requests, [], payments);
  context.setElement('org-cancel-err', '');

  // Step 1: Open cancellation modal
  context.openOrganizerEventCancellationModal('', 'req-booking');
  let modal = getModal();
  assert.equal(modal.title, 'Cancel Event');

  // Attempting Continue to Cancel without mandatory reason fails
  context.setElement('org-cancel-reason', '   ');
  context.proceedOrganizerCancelToFinalConfirmation('', 'req-booking');
  assert.equal(getModal().title, 'Cancel Event'); // Stays on step 1
  assert.match(context.g('org-cancel-err').textContent, /mandatory cancellation reason/);

  // Valid mandatory reason opens Step 2 (Final Confirmation)
  context.setElement('org-cancel-reason', 'Venue double-booked by property management');
  context.setElement('org-cancel-explanation', 'Attempted reschedule but client declined alternate dates');
  context.proceedOrganizerCancelToFinalConfirmation('', 'req-booking');

  modal = getModal();
  assert.equal(modal.title, 'Final Confirmation: Cancel Booking');
  assert.match(modal.html, /Consequences Summary/);
  assert.match(modal.html, /Venue double-booked by property management/);
  assert.match(modal.html, /Attempted reschedule but client declined alternate dates/);
  assert.match(modal.html, /Amount Paid:<\/span> <strong>₹40,000<\/strong>/);
  assert.match(modal.html, /Cancellation Fee:<\/span> <strong>₹0<\/strong>/);
  assert.match(modal.html, /Estimated Refund:<\/span> <strong>₹40,000<\/strong>/);
  assert.doesNotMatch(modal.html, /staff.*assigned/i);
  assert.match(modal.html, /All attendee registrations and QR tickets will be invalidated/);

  // Submit final cancellation
  await context.submitOrganizerEventCancellation('', 'req-booking');

  // Verify status updated and audit history preserved
  const r = context.DB.eventRequests.find(x => x.id === 'req-booking');
  assert.equal(r.status, 'cancelled');
  assert.equal(r.cancellation.reason, 'Venue double-booked by property management');
  assert.equal(r.cancellation.paidAmount, 40000);
  assert.equal(r.cancellation.cancellationFee, 0);
  assert.equal(r.cancellation.refundAmount, 40000);
  assert.equal(r.cancellation.refundStatus, 'pending');
  assert.ok(r.auditHistory.some(a => a.action === 'Event Booking Cancelled by Organizer'));

  // Refund records are backend-owned and are not duplicated by the frontend.
  assert.equal(context.DB.refunds.length, 0);

  // Duplicate cancellation is blocked
  context.openOrganizerEventCancellationModal('', 'req-booking');
  const duplicateModal = getModal();
  assert.equal(duplicateModal.title, 'Already Cancelled');
  assert.match(duplicateModal.html, /already cancelled/i);
  assert.ok(duplicateModal.buttons.some(button => button.lbl === 'Close'));
});
