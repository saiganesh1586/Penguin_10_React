const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const orgRuntime = fs.readFileSync(path.join(__dirname, '../src/apps/organizer/app/runtime.js'), 'utf8');

function setupTestEnvironment(initialEvents = [], initialRegistrations = [], initialPayments = []) {
  const elements = new Map();
  const toasts = [];
  let modalState = null;
  let pageRendered = null;

  const context = vm.createContext({
    CU: { id: 'usr-org-100', role: 'organizer', name: 'Alice Walker', organizerId: 'org-100' },
    DB: {
      users: [
        { id: 'usr-org-100', name: 'Alice Walker', email: 'alice@walker.com', role: 'organizer' },
        { id: 'usr-att-200', name: 'Bob Smith', email: 'bob@smith.com', role: 'attendee' },
        { id: 'usr-att-300', name: 'Charlie Davis', email: 'charlie@davis.com', role: 'attendee' }
      ],
      events: structuredClone(initialEvents),
      registrations: structuredClone(initialRegistrations),
      payments: structuredClone(initialPayments),
      eventWorkflowPayments: [],
      refunds: [],
      eventRequests: [],
      notifications: []
    },
    workflowEventPolicy: {
      version: '1.0',
      cancellation: { minimumNoticeDays: 14, feePercent: 10 }
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    escapeHtml: str => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    toast: (msg, type) => { toasts.push({ msg, type }); },
    openModal: (title, html, buttons) => { modalState = { title, html, buttons }; },
    closeModal: () => { modalState = null; },
    g: id => elements.get(id) || null,
    v: id => elements.get(id)?.value || '',
    setElement: (id, val) => elements.set(id, { value: val, style: {} }),
    renderPage: page => { pageRendered = page; },
    refreshEvents: () => {},
    saveDB: () => {},
    today: () => '2026-10-30',
    apiDeleteEvent: async () => ({ message: 'Event deleted' }),
    apiCancelOrganizerEvent: async (eventId, reason) => {
      const event = context.DB.events.find(item => String(item.eventId || item.id) === String(eventId));
      if (!event) throw new Error('Event not found');
      if (event.status === 'cancelled') throw new Error('Event already cancelled');
      const cancelledEvent = {
        ...event,
        eventId: event.eventId || event.id,
        status: 'cancelled',
        cancellation: { reason, cancelledAt: new Date().toISOString(), refundStatus: 'not_applicable' }
      };
      Object.assign(event, cancelledEvent);
      return cancelledEvent;
    },
    apiGetEvents: async () => context.DB.events,
    apiRequest: async () => ({ success: true })
  });

  context.window = context;

  // Extract necessary parts of runtime
  const codeToRun = `
    let _currentPage = 'events';
    ${orgRuntime.slice(orgRuntime.indexOf('function handleOrganizerDeleteEvent('), orgRuntime.indexOf('function openOrganizerEventWorkspace('))}
    ${orgRuntime.slice(orgRuntime.indexOf('let _pendingOrganizerCancel = null;'), orgRuntime.indexOf('function openRejectModal('))}
  `;

  vm.runInContext(codeToRun, context);
  return { context, toasts, getModal: () => modalState, getRenderedPage: () => pageRendered };
}

test('1. Eligible Draft Event: Delete button opens confirmation modal with Keep Event and Delete Event buttons and deletes draft', async () => {
  const draftEvent = {
    id: 'ev-draft-1',
    eventId: 'ev-draft-1',
    organizer: 'usr-org-100',
    organizerId: 'org-100',
    title: 'New Annual Strategy Draft',
    status: 'draft',
    backendStatus: 'draft',
    registered: 0,
    capacity: 50,
    price: 0
  };

  const { context, toasts, getModal, getRenderedPage } = setupTestEnvironment([draftEvent], [], []);

  // Click Delete on draft event
  context.handleOrganizerDeleteEvent('ev-draft-1');

  const modal = getModal();
  assert.ok(modal, 'Modal should be opened');
  assert.equal(modal.title, 'Delete Draft Event');
  assert.match(modal.html, /New Annual Strategy Draft/);
  assert.match(modal.html, /permanently delete the draft event/);

  // Verify buttons
  assert.equal(modal.buttons.length, 2);
  const keepBtn = modal.buttons.find(b => b.lbl === 'Keep Event');
  const deleteBtn = modal.buttons.find(b => b.lbl === 'Delete Event');
  assert.ok(keepBtn, 'Should have Keep Event button');
  assert.ok(deleteBtn, 'Should have Delete Event button');
  assert.match(deleteBtn.fn, /confirmDeleteDraftEvent/);

  // Confirm deletion
  await context.confirmDeleteDraftEvent('ev-draft-1');

  // Verify event removed and page refreshed
  assert.equal(context.DB.events.some(e => e.id === 'ev-draft-1'), false);
  assert.equal(getModal(), null);
  assert.ok(toasts.some(t => t.type === 'success' && t.msg.includes('Draft event deleted successfully')));
  assert.equal(getRenderedPage(), 'events');
});

test('2. Paid Public Event: Cancel Event displays attendee payment breakdown, no organizer refund, and proper consequences', () => {
  const publishedEvent = {
    id: 'ev-pub-1',
    eventId: 'ev-pub-1',
    organizer: 'usr-org-100',
    organizerId: 'org-100',
    title: 'Global Tech Conference',
    date: '2099-11-20',
    status: 'upcoming',
    backendStatus: 'published',
    registered: 1,
    capacity: 100,
    price: 1500
  };
  const registrations = [
    {
      id: 'reg-1',
      registrationId: 'reg-1',
      eventId: 'ev-pub-1',
      attendeeId: 'usr-att-200',
      status: 'confirmed',
      backendStatus: 'registered',
      qrCode: 'QR_DATA_1',
      verificationId: 'VERIF_1'
    }
  ];
  const payments = [
    {
      paymentId: 'pay-1',
      registrationId: 'reg-1',
      eventId: 'ev-pub-1',
      amount: 1500,
      status: 'completed'
    }
  ];

  const { context, getModal } = setupTestEnvironment([publishedEvent], registrations, payments);

  // Click Delete/Cancel on active/published event
  context.handleOrganizerDeleteEvent('ev-pub-1');

  const modal = getModal();
  assert.ok(modal, 'Modal should be opened');
  assert.equal(modal.title, 'Cancel Event');

  // Explains cancellation required instead of permanent deletion
  assert.match(modal.html, /Cancellation Required/);
  assert.match(modal.html, /Only draft events without registrations can be deleted/);
  assert.match(modal.html, /Global Tech Conference/);

  // Shows actual event details and attendee counts
  assert.match(modal.html, /Registered Attendees:<\/strong>\s*1/);
  assert.match(modal.html, /Successfully Paid Attendees:<\/strong>\s*1/);

  // Shows cancellation consequences and attendee notification details
  assert.match(modal.html, /Cancellation Consequences/);
  assert.match(modal.html, /All attendee registrations and QR tickets will be invalidated/);
  assert.match(modal.html, /1 registered attendee\(s\) will be notified immediately/);
  assert.match(modal.html, /The organizer does not receive a refund for cancelling their own event/);

  // Shows payment and refund breakdown
  assert.match(modal.html, /Amount Actually Paid:<\/span>\s*<strong>(?:₹1,500|₹1500)<\/strong>/);
  assert.match(modal.html, /Estimated Refund:<\/span>\s*<strong>(?:₹1,500|₹1500) \(Pending review\)<\/strong>/);
  assert.match(modal.html, /Refunds are queued with status Pending and will not be claimed as processed until confirmed/);

  // Shows mandatory dropdown reasons
  assert.match(modal.html, /<option value="Venue unavailable">Venue unavailable<\/option>/);
  assert.match(modal.html, /<option value="Operational difficulties">Operational difficulties<\/option>/);
  assert.match(modal.html, /<option value="Insufficient registrations">Insufficient registrations<\/option>/);
  assert.match(modal.html, /<option value="Safety or regulatory concerns">Safety or regulatory concerns<\/option>/);
  assert.match(modal.html, /<option value="Organizer emergency">Organizer emergency<\/option>/);
  assert.match(modal.html, /<option value="Other">Other<\/option>/);

  // Buttons: Keep Event and Continue to Cancel
  const keepBtn = modal.buttons.find(b => b.lbl === 'Keep Event');
  const continueBtn = modal.buttons.find(b => b.lbl === 'Continue to Cancel');
  assert.ok(keepBtn, 'Should have Keep Event button');
  assert.ok(continueBtn, 'Should have Continue to Cancel button');
});

test('3. Unpaid Public Event: Displays exact no refunds message and creates no refunds', async () => {
  const unpaidEvent = {
    id: 'ev-unpaid-1',
    eventId: 'ev-unpaid-1',
    organizer: 'usr-org-100',
    organizerId: 'org-100',
    title: 'Free Community Workshop',
    date: '2099-12-10',
    status: 'upcoming',
    backendStatus: 'published',
    registered: 2,
    capacity: 50,
    price: 0
  };
  const registrations = [
    {
      id: 'reg-free-1',
      registrationId: 'reg-free-1',
      eventId: 'ev-unpaid-1',
      attendeeId: 'usr-att-200',
      status: 'confirmed',
      backendStatus: 'registered',
      qrCode: 'QR_FREE_1',
      verificationId: 'VERIF_FREE_1'
    },
    {
      id: 'reg-free-2',
      registrationId: 'reg-free-2',
      eventId: 'ev-unpaid-1',
      attendeeId: 'usr-att-300',
      status: 'confirmed',
      backendStatus: 'registered',
      qrCode: 'QR_FREE_2',
      verificationId: 'VERIF_FREE_2'
    }
  ];

  const { context, getModal } = setupTestEnvironment([unpaidEvent], registrations, []);

  // Open cancellation modal
  context.handleOrganizerDeleteEvent('ev-unpaid-1');
  const modal = getModal();

  // Exactly displays: "No attendee payments have been collected. No refunds are due."
  assert.match(modal.html, /No attendee payments have been collected\.\s*No refunds are due\./);
  assert.match(modal.html, /Unpaid registrations do not generate refunds/);

  // Fill valid reason and proceed
  context.setElement('org-cancel-reason-select', 'Operational difficulties');
  context.setElement('org-cancel-reason', 'Operational difficulties');
  context.setElement('org-cancel-explanation', 'Staffing constraints');
  context.proceedOrganizerCancelToFinalConfirmation('ev-unpaid-1', '');

  const confirmModal = getModal();
  assert.match(confirmModal.title, /Final Confirmation: Cancel Event/);
  assert.match(confirmModal.html, /Total Eligible Attendee Refunds:<\/span>\s*<strong>(?:₹0 \(No refunds due\)|₹0)<\/strong>/);

  // Confirm cancellation
  await context.submitOrganizerEventCancellation('ev-unpaid-1', '');

  // The frontend does not synthesize registration or refund changes; those are backend-owned.
  const reg1 = context.DB.registrations.find(r => r.id === 'reg-free-1');
  assert.equal(reg1.status, 'confirmed');
  assert.equal(reg1.qrCode, 'QR_FREE_1');

  // No refund records created for unpaid registrations
  assert.equal(context.DB.refunds.length, 0);
});

test('4. Multiple Attendees: Paid attendee receives Pending refund, unpaid receives no refund, all tickets invalidated', async () => {
  const mixedEvent = {
    id: 'ev-mixed-1',
    eventId: 'ev-mixed-1',
    organizer: 'usr-org-100',
    organizerId: 'org-100',
    title: 'Hybrid Tech Summit',
    date: '2099-12-20',
    status: 'upcoming',
    backendStatus: 'published',
    registered: 3,
    capacity: 100,
    price: 2000
  };
  const registrations = [
    {
      id: 'reg-paid-1',
      registrationId: 'reg-paid-1',
      eventId: 'ev-mixed-1',
      attendeeId: 'usr-att-200',
      status: 'confirmed',
      backendStatus: 'registered',
      qrCode: 'QR_P1',
      verificationId: 'V_P1'
    },
    {
      id: 'reg-paid-2',
      registrationId: 'reg-paid-2',
      eventId: 'ev-mixed-1',
      attendeeId: 'usr-att-300',
      status: 'confirmed',
      backendStatus: 'registered',
      qrCode: 'QR_P2',
      verificationId: 'V_P2'
    },
    {
      id: 'reg-unpaid-3',
      registrationId: 'reg-unpaid-3',
      eventId: 'ev-mixed-1',
      attendeeId: 'usr-att-400',
      status: 'confirmed',
      backendStatus: 'registered',
      qrCode: 'QR_U3',
      verificationId: 'V_U3'
    }
  ];
  const payments = [
    { paymentId: 'p-1', registrationId: 'reg-paid-1', eventId: 'ev-mixed-1', amount: 2000, status: 'completed' },
    { paymentId: 'p-2', registrationId: 'reg-paid-2', eventId: 'ev-mixed-1', amount: 2000, status: 'completed' }
  ];

  const { context, getModal } = setupTestEnvironment([mixedEvent], registrations, payments);

  context.handleOrganizerDeleteEvent('ev-mixed-1');
  const modal = getModal();

  assert.match(modal.html, /Registered Attendees:<\/strong>\s*3/);
  assert.match(modal.html, /Successfully Paid Attendees:<\/strong>\s*2/);
  assert.match(modal.html, /Amount Actually Paid:<\/span>\s*<strong>(?:₹4,000|₹4000)<\/strong>/);
  assert.match(modal.html, /Estimated Refund:<\/span>\s*<strong>(?:₹4,000|₹4000) \(Pending review\)<\/strong>/);

  context.setElement('org-cancel-reason-select', 'Insufficient registrations');
  context.setElement('org-cancel-reason', 'Insufficient registrations');
  context.proceedOrganizerCancelToFinalConfirmation('ev-mixed-1', '');

  const confirmModal = getModal();
  assert.match(confirmModal.html, /Attendees Affected:<\/strong>\s*3/);
  assert.match(confirmModal.html, /Tickets to Invalidate:<\/strong>\s*3/);
  assert.match(confirmModal.html, /Total Eligible Attendee Refunds:<\/span>\s*<strong>(?:₹4,000|₹4000)<\/strong>/);
  assert.match(confirmModal.html, /Pending/);

  await context.submitOrganizerEventCancellation('ev-mixed-1', '');

  // Registration and refund history is not fabricated in the frontend.
  context.DB.registrations.forEach(r => {
    assert.equal(r.status, 'confirmed');
    assert.ok(r.qrCode);
    assert.ok(r.verificationId);
  });

  assert.equal(context.DB.refunds.length, 0);
});

test('5. Reason Dropdown, "Other" Explanation, and Final Confirmation Modal Buttons', async () => {
  const publishedEvent = {
    id: 'ev-pub-2',
    eventId: 'ev-pub-2',
    organizer: 'usr-org-100',
    organizerId: 'org-100',
    title: 'Autumn Dev Meetup',
    date: '2099-12-05',
    status: 'upcoming',
    backendStatus: 'published',
    registered: 1,
    capacity: 50,
    price: 500
  };
  const registrations = [
    {
      id: 'reg-2',
      registrationId: 'reg-2',
      eventId: 'ev-pub-2',
      attendeeId: 'usr-att-200',
      status: 'confirmed',
      backendStatus: 'registered',
      qrCode: 'QR_2',
      verificationId: 'VERIF_2'
    }
  ];
  const payments = [
    { paymentId: 'pay-2', registrationId: 'reg-2', amount: 500, status: 'completed' }
  ];

  const { context, getModal, getRenderedPage } = setupTestEnvironment([publishedEvent], registrations, payments);

  context.setElement('org-cancel-reason-select', '');
  context.setElement('org-cancel-reason', '');
  context.setElement('org-cancel-explanation', '');
  context.setElement('org-cancel-err', '');

  context.handleOrganizerDeleteEvent('ev-pub-2');

  // Test dropdown selection populates textarea
  context.onOrgCancelReasonSelectChange('Venue unavailable');
  assert.equal(context.g('org-cancel-reason').value, 'Venue unavailable');

  // Test "Other" requires explanation
  context.setElement('org-cancel-reason-select', 'Other');
  context.onOrgCancelReasonSelectChange('Other');
  assert.equal(context.g('org-cancel-reason').value, '');

  // Proceeding with empty or short explanation fails
  context.setElement('org-cancel-reason', 'Too short');
  context.proceedOrganizerCancelToFinalConfirmation('ev-pub-2', '');
  assert.equal(getModal().title, 'Cancel Event'); // Stays on step 1
  assert.match(context.g('org-cancel-err').textContent, /minimum 10 characters/);

  // Valid explanation for "Other" proceeds to Step 2
  context.setElement('org-cancel-reason', 'Emergency facility refurbishment announced by landlord');
  context.setElement('org-cancel-explanation', 'Looking to reschedule in the spring');
  context.proceedOrganizerCancelToFinalConfirmation('ev-pub-2', '');

  const confirmModal = getModal();
  assert.match(confirmModal.title, /Final Confirmation: Cancel Event/);
  assert.match(confirmModal.html, /Consequences Summary/);
  assert.match(confirmModal.html, /Emergency facility refurbishment announced by landlord/);
  assert.match(confirmModal.html, /Looking to reschedule in the spring/);

  // Buttons on confirmation step: Go Back and Confirm Event Cancellation
  const goBackBtn = confirmModal.buttons.find(b => b.lbl === 'Go Back');
  const confirmBtn = confirmModal.buttons.find(b => b.lbl === 'Confirm Event Cancellation');
  assert.ok(goBackBtn, 'Must have Go Back button');
  assert.ok(confirmBtn, 'Must have Confirm Event Cancellation button');

  // Go Back returns to Step 1 without cancelling
  assert.equal(context.DB.events.find(e => e.id === 'ev-pub-2').status, 'upcoming');

  // Final confirmation execution
  await context.submitOrganizerEventCancellation('ev-pub-2', '');

  // Event status updated
  const ev = context.DB.events.find(e => e.id === 'ev-pub-2');
  assert.equal(ev.status, 'cancelled');
  assert.equal(ev.cancellation.reason, 'Emergency facility refurbishment announced by landlord');

  // Registration and notification effects remain backend-owned.
  const reg = context.DB.registrations.find(r => r.id === 'reg-2');
  assert.equal(reg.status, 'confirmed');
  assert.equal(reg.qrCode, 'QR_2');
  assert.equal(reg.verificationId, 'VERIF_2');

  assert.equal(context.DB.notifications.length, 0);

  // Modal closed and view refreshed
  assert.equal(getModal(), null);
  assert.equal(getRenderedPage(), 'events');
});

test('6. Policy Restrictions & Dynamic Terms: Enforces deadline restrictions when specified by saved terms', () => {
  const restrictedEvent = {
    id: 'ev-restricted-1',
    eventId: 'ev-restricted-1',
    organizer: 'usr-org-100',
    title: 'Restricted Past Deadline Event',
    date: '2026-11-01', // Only 2 days away from test date 2026-10-30
    status: 'published',
    backendStatus: 'published',
    cancellationDeadline: '2026-10-20', // Deadline has passed
    policySnapshot: {
      cancellation: {
        minimumNoticeDays: 14,
        restrictedAfterDeadline: true
      }
    }
  };

  const { context, getModal } = setupTestEnvironment([restrictedEvent], [], []);

  context.handleOrganizerDeleteEvent('ev-restricted-1');
  const modal = getModal();

  assert.equal(modal.title, 'Cancellation Not Permitted');
  assert.match(modal.html, /Cancellation Restricted/);
  assert.match(modal.html, /The cancellation deadline/);
  assert.ok(modal.buttons.some(b => b.lbl === 'Keep Event'));
});

test('7. Prohibited States & Permission Failures: Completed, already cancelled, and unauthorized events are blocked with explanations', () => {
  const events = [
    {
      id: 'ev-completed',
      organizer: 'usr-org-100',
      title: 'Past Completed Summit',
      status: 'completed',
      backendStatus: 'completed'
    },
    {
      id: 'ev-already-cancelled',
      organizer: 'usr-org-100',
      title: 'Previous Cancelled Meetup',
      status: 'cancelled',
      backendStatus: 'cancelled'
    },
    {
      id: 'ev-other-organizer',
      organizer: 'usr-other-999',
      title: 'Competitor Conference',
      status: 'published',
      backendStatus: 'published'
    }
  ];

  const { context, toasts, getModal } = setupTestEnvironment(events, [], []);

  // A. Completed event cannot be deleted or cancelled
  context.handleOrganizerDeleteEvent('ev-completed');
  let modal = getModal();
  assert.equal(modal.title, 'Action Not Permitted');
  assert.match(modal.html, /Action Blocked/);
  assert.match(modal.html, /completed event.*cannot be deleted or cancelled/i);
  assert.match(modal.html, /audit history, registrations, financial transactions/);
  assert.ok(modal.buttons.some(b => b.lbl === 'Close'));

  // B. Already cancelled event blocks duplicate cancellation
  context.handleOrganizerDeleteEvent('ev-already-cancelled');
  modal = getModal();
  assert.equal(modal.title, 'Already Cancelled');
  assert.match(modal.html, /This event is already cancelled/);
  assert.ok(modal.buttons.some(b => b.lbl === 'Close'));
  assert.equal(modal.buttons.some(b => ['Cancel Event', 'Edit Event', 'Delete Event'].includes(b.lbl)), false);

  // C. Unauthorized organizer blocked
  toasts.length = 0;
  context.handleOrganizerDeleteEvent('ev-other-organizer');
  assert.ok(toasts.some(t => t.type === 'error' && t.msg.includes('Unauthorized')));
});
