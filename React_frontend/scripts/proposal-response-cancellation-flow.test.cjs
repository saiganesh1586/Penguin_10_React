const portalSource = require('./portal-source.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const clientRuntime = portalSource('client');

test('Accept Changes refreshes the saved request and opens Ongoing Events as planning from either client entry', async () => {
  for (const entry of ['review-modal', 'workflow-details']) {
    const request = { id: 'req-changes', requestId: 'req-changes', clientId: 'usr-client-001', organizerId: 'org-001',
      eventName: 'Changed Conference', eventDate: '2099-11-20', budget: 50000, status: 'changes_requested',
      agreementStatus: 'not_sent', paymentStatus: 'unpaid', negotiations: [{ action: 'changes_requested', budget: 65000, eventDate: '2099-11-22', reason: 'Venue availability.' }] };
    const h = setupClientHarness([request]), navigation = [];
    const server = structuredClone(request);
    h.context.goNav = page => navigation.push(page);
    h.context.apiRespondToEventProposal = async (id, decision) => {
      assert.equal(id, request.id); assert.equal(decision, 'accept_changes');
      Object.assign(server, { status: 'planning', budget: 65000, eventDate: '2099-11-22',
        auditHistory: [{ action: 'Client Accepted Requested Changes' }] });
      return { success: true, data: structuredClone(server) };
    };
    h.context.apiGetClientRequests = async () => ({ data: [structuredClone(server)] });
    const syncStart = clientRuntime.indexOf('    async function syncClientEventRequests(');
    const responseStart = clientRuntime.indexOf('    function respondToWorkflowChanges(');
    const events = clientRuntime.match(/function getClientWorkflowEvents\(\)[\s\S]*?window\.pageWorkflowEvents = pageWorkflowEvents;/)[0];
    vm.runInContext("let _workflowEventTab = 'upcoming';" + events
      + clientRuntime.slice(syncStart, clientRuntime.indexOf('    function pageRequestStatus(', syncStart))
      + clientRuntime.slice(responseStart, clientRuntime.indexOf('    function openWorkflowCounterofferModal(', responseStart)), h.context);
    if (entry === 'review-modal') {
      h.context.openClientPlanReview(request.id);
      const action = h.getModal().buttons.find(button => button.lbl === 'Accept Changes');
      await vm.runInContext(action.fn, h.context);
    } else await h.context.respondToWorkflowChanges(request.id, 'accept_changes');
    assert.deepEqual(navigation, ['my-events'], entry);
    assert.equal(h.context.window._workflowEventTab, 'ongoing', entry);
    const data = h.context.getClientWorkflowEvents();
    assert.equal(data.ongoing.length, 1, entry);
    assert.equal(data.ongoing[0].budget, 65000, entry);
    assert.equal(data.ongoing[0].date, '2099-11-22', entry);
    assert.equal(data.ongoing[0].bookingStatus, 'planning', entry);
    assert.equal(data.ongoing[0].paymentStatus, 'unpaid', entry);
    assert.equal(h.context.DB.events.length, 0, entry);
    assert.ok(h.toasts.some(item => item.type === 'success' && /Changes accepted/.test(item.msg)), entry);
    assert.equal(h.toasts.some(item => /revision request was sent/.test(item.msg)), false, entry);
  }
});

test('a failed Accept Changes save keeps the review open and does not navigate or claim acceptance', async () => {
  const request = { id: 'req-changes', clientId: 'usr-client-001', eventName: 'Changed Conference', status: 'changes_requested' };
  const h = setupClientHarness([request]), navigation = [];
  h.context.setWorkflowEventTab = tab => navigation.push(tab);
  h.context.apiRespondToEventProposal = async () => { throw new Error('Server unavailable'); };
  const previousGetElement = h.context.g;
  h.context.g = id => id === 'client-reproposal-error' ? null : previousGetElement(id);
  h.context.openClientPlanReview(request.id);
  const modal = h.getModal(), action = modal.buttons.find(button => button.lbl === 'Accept Changes');
  await vm.runInContext(action.fn, h.context);
  assert.equal(h.getModal(), modal);
  assert.deepEqual(navigation, []);
  assert.equal(h.context.DB.eventRequests[0].status, 'changes_requested');
  assert.ok(h.toasts.some(item => item.type === 'error' && item.msg === 'Server unavailable'));
  assert.equal(h.toasts.some(item => item.type === 'success'), false);
});

function setupClientHarness(initialRequests = [], initialEvents = [], initialPayments = []) {
  const toasts = [];
  let modalState = null;
  const elements = new Map();
  const apiCalls = [];

  const context = vm.createContext({
    console,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    JSON,
    encodeURIComponent,
    window: {},
    CU: { id: 'usr-client-001', role: 'client', name: 'Alice Client' },
    DB: {
      users: [
        { id: 'usr-client-001', role: 'client', name: 'Alice Client' },
        { id: 'usr-org-001', role: 'organizer', name: 'Elite Events' },
      ],
      organizers: [
        { id: 'usr-org-001', organizerId: 'org-001', userId: 'usr-org-001', name: 'Elite Events' },
      ],
      eventRequests: structuredClone(initialRequests),
      events: structuredClone(initialEvents),
      payments: structuredClone(initialPayments),
      eventWorkflowPayments: structuredClone(initialPayments),
      eventPlans: [],
    },
    toast: (msg, type) => { toasts.push({ msg, type }); },
    openModal: (title, html, buttons, closable) => { modalState = { title, html, buttons, closable }; },
    closeModal: () => { modalState = null; },
    closeDrawer: () => {},
    escapeHtml: str => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    workflowHtml: str => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    workflowPolicyDate: d => String(d),
    workflowPayload: res => res?.data || res,
    reqBadge: s => s || 'gray',
    clientStatusReadable: s => (s || '').toUpperCase(),
    g: id => elements.get(id) || { id, value: 'Change of Plans', checked: true, textContent: '', style: {}, querySelectorAll: () => [] },
    v: id => elements.get(id)?.value || (id === 'mock-pay-method' ? 'UPI' : id === 'client-withdraw-reason' ? 'Change of Plans' : ''),
    setElement: (id, val, checked = true) => elements.set(id, { value: val, checked, textContent: '', style: {} }),
    document: {
      querySelector: () => ({ value: 'deposit', checked: true }),
    },
    syncWorkflowData: async () => {},
    syncClientEventRequests: async () => {},
    loadClientRecentActivity: () => {},
    renderPage: () => {},
    renderWorkflowRequestDetails: () => {},
    apiPreviewClientRequestCancellation: async (id) => ({
      success: true,
      data: {
        requestId: id,
        eventName: 'Confirmed Booking Event',
        status: 'confirmed',
        canCancel: true,
        cancellationDeadline: '2026-12-11T00:00:00.000Z',
        minimumNoticeDays: 14,
        isConfirmed: true,
        paidAmount: 30000,
        cancellationFeePercent: 10,
        cancellationFee: 3000,
        refundAmount: 27000,
        refundProcessingTimeline: '5–7 business days (pending review)',
        policy: { version: '1.0' },
      },
    }),
    apiCancelClientRequest: async (id, payload) => {
      apiCalls.push({ endpoint: 'cancel', id, payload });
      return { success: true, message: 'Cancellation processed' };
    },
    apiRespondToEventProposal: async (id, decision, notes) => {
      apiCalls.push({ endpoint: 'proposal-response', id, decision, notes });
      return { success: true };
    },
    apiUpdateAgreementStatus: async (id, agreementStatus) => {
      apiCalls.push({ endpoint: 'agreement', id, agreementStatus });
      return { success: true };
    },
    apiPayDeposit: async (id, payload) => {
      apiCalls.push({ endpoint: 'pay-deposit', id, payload });
      return { success: true, data: { bookingStatus: 'confirmed' } };
    },
    apiPayForWorkflowEvent: async (eventId) => {
      apiCalls.push({ endpoint: 'pay-event', eventId });
      return { success: true };
    },
  });

  const codeToRun = `
    ${clientRuntime.slice(clientRuntime.indexOf('function getClientBookingAmounts('), clientRuntime.indexOf('async function openEventPlanPdf('))}
    ${clientRuntime.slice(clientRuntime.indexOf('function openClientPlanReview('), clientRuntime.indexOf('function confirmWithdrawRequest('))}
    ${clientRuntime.slice(clientRuntime.indexOf('async function submitClientPlanDecision('), clientRuntime.indexOf('function switchReqStatTab('))}
    ${clientRuntime.slice(clientRuntime.indexOf('function openClientPaymentModal('), clientRuntime.indexOf('function openUpdateConfirmedEventModal('))}
    ${clientRuntime.slice(clientRuntime.indexOf('let _clientCancelPreview = null;'), clientRuntime.indexOf('function cancelReq('))}
  `;

  vm.runInContext(codeToRun, context);
  return { context, toasts, getModal: () => modalState, apiCalls };
}

test('1. Proposal Review Modal: displays full details, pricing, advance deposit, balance, and version history', () => {
  const req = {
    id: 'req-active-001',
    requestId: 'req-active-001',
    clientId: 'usr-client-001',
    organizerId: 'org-001',
    title: 'Active Gala Request',
    eventName: 'Active Gala Request',
    eventType: 'Corporate',
    status: 'proposal_sent',
    date: '2026-12-10',
    budget: 60000,
    guests: 150,
    proposals: [
      {
        version: 1,
        amount: 60000,
        depositRequired: 18000,
        organizerFee: 12000,
        taxes: 10800,
        status: 'pending_client',
        validUntil: '2026-11-20',
        eventPlan: 'Full banquet setup, AV equipment, and catering.',
        timeline: '09:00 Setup; 11:00 Registration; 17:00 Wrap-up',
        includedServices: 'Venue coordination, staffing, catering',
        excludedServices: 'Alcoholic beverages',
        paymentSchedule: '30% Advance Deposit on Approval, 70% Final Balance upon Completion',
        cancellationTerms: '14+ days notice: 10% fee, 90% net refund. Less than 14 days: Non-refundable.',
      },
    ],
    agreementStatus: 'not_sent',
    paymentStatus: 'unpaid',
    auditHistory: [],
  };

  const { context, getModal } = setupClientHarness([req]);
  context.openClientPlanReview('req-active-001');
  const m = getModal();
  assert.ok(m, 'Modal must open');

  assert.match(m.title, /Review Proposed Plan \(v1\)/);
  assert.match(m.html, /TOTAL PROPOSAL PRICE/);
  assert.match(m.html, /REQUIRED ADVANCE DEPOSIT/);
  assert.match(m.html, /OUTSTANDING BALANCE/);
  assert.match(m.html, /ORGANIZER FEE/);
  assert.match(m.html, /TAXES & GST/);
  assert.match(m.html, /Execution Timeline/);
  assert.match(m.html, /Included Services:/);
  assert.match(m.html, /Excluded Services:/);
  assert.match(m.html, /Payment Schedule/);
  assert.match(m.html, /Cancellation Terms/);
  assert.match(m.html, /Proposal Valid Until/);

  const btnLabels = m.buttons.map(b => b.lbl);
  assert.ok(btnLabels.includes('Accept & Proceed to Payment'));
  assert.ok(btnLabels.includes('Request Revision'));
  assert.ok(btnLabels.includes('Decline'));
  assert.ok(btnLabels.includes('Withdraw Request'));
});

test('2. Expired Proposal: shows expired banner and restricts actions to revision or withdrawal', () => {
  const req = {
    id: 'req-expired-002',
    requestId: 'req-expired-002',
    clientId: 'usr-client-001',
    organizerId: 'org-001',
    title: 'Expired Proposal Request',
    eventName: 'Expired Proposal Request',
    status: 'expired',
    date: '2026-12-15',
    budget: 40000,
    guests: 80,
    proposals: [
      {
        version: 1,
        amount: 40000,
        depositRequired: 12000,
        status: 'expired',
        validUntil: '2025-01-01',
        eventPlan: 'Conference hall and audio.',
      },
    ],
    auditHistory: [],
  };

  const { context, getModal } = setupClientHarness([req]);
  context.openClientPlanReview('req-expired-002');
  const m = getModal();
  assert.ok(m, 'Modal must open');

  assert.match(m.html, /Proposal Expired/);
  const btnLabels = m.buttons.map(b => b.lbl);
  assert.ok(!btnLabels.includes('Accept & Proceed to Payment'), 'Expired proposal cannot be accepted');
  assert.ok(btnLabels.includes('Request Revision'));
  assert.ok(btnLabels.includes('Withdraw Request'));
});

test('3. Pre-booking Request Withdrawal: opens clean withdrawal modal WITHOUT booking cancellation fees or refund windows', () => {
  const req = {
    id: 'req-active-001',
    requestId: 'req-active-001',
    clientId: 'usr-client-001',
    organizerId: 'org-001',
    title: 'Active Gala Request',
    status: 'proposal_sent',
    date: '2026-12-10',
    budget: 60000,
    guests: 150,
  };

  const { context, getModal } = setupClientHarness([req]);
  context.openClientCancelRequestModal('req-active-001');
  const m = getModal();
  assert.ok(m, 'Modal must open');

  assert.equal(m.title, 'Withdraw Event Request');
  assert.match(m.html, /Pre-Booking Withdrawal/);
  assert.match(m.html, /No cancellation fees apply and no payments have been charged/);
  assert.ok(!m.html.includes('ESTIMATED REFUND'), 'Unpaid unconfirmed requests must not show estimated refund');
  assert.ok(!m.html.includes('CANCELLATION FEE (10%)'), 'Unpaid unconfirmed requests must not show cancellation fees');
  assert.ok(!m.html.includes('REFUND TIMELINE'), 'Unpaid unconfirmed requests must not show refund timeline');

  const btnLabels = m.buttons.map(b => b.lbl);
  assert.ok(btnLabels.includes('Keep Request'));
  assert.ok(btnLabels.includes('Confirm Withdrawal'));
});

test('4. Confirmed Booking Cancellation: opens 2-step modal with policy, deadline, paid amounts, fees, and refunds', async () => {
  const req = {
    id: 'req-confirmed-003',
    requestId: 'req-confirmed-003',
    eventId: 'evt-conf-003',
    clientId: 'usr-client-001',
    organizerId: 'org-001',
    title: 'Confirmed Booking Event',
    status: 'confirmed',
    date: '2026-12-25',
    budget: 100000,
    guests: 200,
    agreementStatus: 'agreed',
    paymentStatus: 'deposit_paid',
  };

  const payments = [
    { paymentId: 'pay-003', requestId: 'req-confirmed-003', eventId: 'evt-conf-003', amount: 30000, status: 'completed' },
  ];

  const { context, getModal } = setupClientHarness([req], [], payments);
  await context.openClientCancelRequestModal('req-confirmed-003');
  const m = getModal();
  assert.ok(m, 'Modal must open');

  assert.equal(m.title, 'Cancel Event Booking');
  assert.match(m.html, /Cancellation Policy & Window/);
  assert.match(m.html, /Notice window:/);
  assert.match(m.html, /AMOUNT PAID/);
  assert.match(m.html, /CANCELLATION FEE \(10%\)/);
  assert.match(m.html, /ESTIMATED REFUND/);
  assert.match(m.html, /REFUND TIMELINE/);

  const btnLabels = m.buttons.map(b => b.lbl);
  assert.ok(btnLabels.includes('Keep Booking'));
  assert.ok(btnLabels.includes('Continue to Cancel'));
});

test('5. Payment & Booking Confirmation: presents demo provider, terms agreement checkbox, and confirms booking upon deposit', async () => {
  const req = {
    id: 'req-active-001',
    requestId: 'req-active-001',
    clientId: 'usr-client-001',
    organizerId: 'org-001',
    title: 'Active Gala Request',
    status: 'awaiting_client',
    budget: 60000,
    guests: 150,
    proposals: [
      { version: 1, amount: 60000, depositRequired: 18000, status: 'accepted' },
    ],
    agreementStatus: 'pending_signature',
    paymentStatus: 'deposit_pending',
  };

  const { context, getModal, apiCalls } = setupClientHarness([req]);
  context.openClientPaymentModal('req-active-001');
  const m = getModal();
  assert.ok(m, 'Modal must open');

  assert.match(m.title, /Payment & Booking Confirmation/);
  assert.match(m.html, /DEMO PAYMENT PROVIDER · SIMULATED TRANSACTION/);
  assert.match(m.html, /BOOKING ID/);
  assert.match(m.html, /TOTAL PROPOSAL AMOUNT/);
  assert.match(m.html, /ADVANCE DEPOSIT REQUIRED/);
  assert.match(m.html, /OUTSTANDING BALANCE/);
  assert.match(m.html, /client-agree-terms/);

  // Submit payment
  await context.processClientDepositPayment('req-active-001', undefined, 'UPI');
  assert.ok(apiCalls.some(c => c.endpoint === 'agreement' && c.agreementStatus === 'agreed'), 'Agreement acknowledged before payment');
  assert.ok(apiCalls.some(c => c.endpoint === 'pay-deposit'), 'Deposit payment submitted via demo provider');
});
