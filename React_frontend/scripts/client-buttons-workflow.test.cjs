const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setupClientEnvironment() {
  const runtimeCode = fs.readFileSync(path.resolve(__dirname, '../src/apps/client/app/runtime.js'), 'utf8');

  let lastToast = null;
  let renderedPage = '';
  const apiCalls = [];
  const domElements = new Map();

  function makeElement(id) {
    if (!domElements.has(id)) {
      const classList = new Set();
      const children = [];
      const el = {
        id,
        tagName: 'DIV',
        value: '',
        checked: false,
        disabled: false,
        textContent: '',
        innerHTML: '',
        children,
        style: { display: 'block' },
        classList: {
          add: (...cls) => cls.forEach(c => classList.add(c)),
          remove: (...cls) => cls.forEach(c => classList.delete(c)),
          contains: (c) => classList.has(c),
          toggle: (c) => classList.has(c) ? classList.delete(c) : classList.add(c),
        },
        setAttribute: (k, v) => { el[k] = v; },
        getAttribute: (k) => el[k],
        appendChild: (child) => { children.push(child); return child; },
        remove: () => {},
        querySelectorAll: (sel) => {
          if (sel === 'button') {
            return children.filter(c => c.tagName === 'BUTTON');
          }
          return [];
        },
      };
      domElements.set(id, el);
    }
    return domElements.get(id);
  }

  const toastsContainer = makeElement('toasts');
  const origAppendChild = toastsContainer.appendChild;
  toastsContainer.appendChild = (child) => {
    origAppendChild(child);
    const cls = child.className || '';
    const type = cls.includes('success') ? 'success' : cls.includes('error') ? 'error' : cls.includes('warning') ? 'warning' : 'info';
    lastToast = { msg: child.innerHTML, type };
    return child;
  };

  const testUser = {
    id: 'usr-client-001',
    userId: 'usr-client-001',
    clientId: 'cli-001',
    name: 'Michael Torres',
    role: 'client',
    email: 'client@example.com',
    token: 'mock-test-jwt-token',
  };

  class HTMLElement {}
  class HTMLInputElement extends HTMLElement {}
  class HTMLButtonElement extends HTMLElement {}
  class HTMLSelectElement extends HTMLElement {}
  global.HTMLInputElement = HTMLInputElement;
  global.HTMLElement = HTMLElement;

  const sandbox = {
    HTMLElement,
    HTMLInputElement,
    HTMLButtonElement,
    HTMLSelectElement,
    console,
    Date,
    Math,
    String,
    Number,
    Boolean,
    RegExp,
    Set,
    Map,
    Array,
    Object,
    JSON,
    parseInt,
    parseFloat,
    encodeURIComponent,
    decodeURIComponent,
    setTimeout: (cb) => { cb(); return 1; },
    clearTimeout: () => {},
    requestAnimationFrame: (cb) => cb(),
    sessionStorage: {
      getItem: (k) => k === 'ef_cu' ? JSON.stringify(testUser) : null,
      setItem: () => {},
      removeItem: () => {},
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    fetch: async (url, options = {}) => {
      const urlStr = String(url);
      const method = (options.method || 'GET').toUpperCase();
      let body = {};
      try {
        if (options.body) body = JSON.parse(options.body);
      } catch (e) {
        body = {};
      }

      const match = urlStr.match(/\/event-requests\/([^/]+)/);
      const reqId = match ? decodeURIComponent(match[1]) : '';

      if (urlStr.includes('/cancel')) {
        apiCalls.push({ endpoint: 'cancelRequest', url: urlStr, reqId, payload: body });
        const req = (sandbox.window.DB?.eventRequests || []).find(r => r.requestId === reqId || r.id === reqId);
        if (req) {
          req.status = 'withdrawn';
          req.withdrawalReason = body.reason;
        }
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, message: 'Event request withdrawn successfully.' }),
          text: async () => JSON.stringify({ success: true, message: 'Event request withdrawn successfully.' }),
        };
      }

      if (urlStr.includes('/pay-deposit')) {
        apiCalls.push({ endpoint: 'payDeposit', url: urlStr, reqId, payload: body });
        if (body.simulateFailure) {
          return {
            ok: false,
            status: 400,
            headers: { get: () => 'application/json' },
            json: async () => ({ message: 'Payment transaction failed. Please check your payment details or try a different method.' }),
            text: async () => JSON.stringify({ message: 'Payment transaction failed. Please check your payment details or try a different method.' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            data: {
              bookingId: `BKG-${reqId.toUpperCase()}`,
              paymentId: 'PAY-DEP-TEST-12345',
              amountPaid: 22500,
              outstandingBalance: 52500,
              totalAmount: 75000,
              paymentStatus: 'deposit_paid',
              bookingStatus: 'confirmed',
              receipt: {
                receiptNumber: 'REC-TEST-9988',
                bookingId: `BKG-${reqId.toUpperCase()}`,
                amountPaid: 22500,
                outstandingBalance: 52500,
              }
            }
          }),
          text: async () => JSON.stringify({ success: true }),
        };
      }

      if (urlStr.includes('/agreement')) {
        apiCalls.push({ endpoint: 'updateAgreement', url: urlStr, payload: body });
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true }),
          text: async () => JSON.stringify({ success: true }),
        };
      }

      // If GET /event-requests, return current requests
      if (urlStr.includes('/event-requests') && method === 'GET') {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ success: true, data: sandbox.window.DB?.eventRequests || [] }),
          text: async () => JSON.stringify({ success: true, data: sandbox.window.DB?.eventRequests || [] }),
        };
      }

      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, data: [] }),
        text: async () => JSON.stringify({ success: true, data: [] }),
      };
    },
    document: {
      getElementById: (id) => makeElement(id),
      createElement: (tag) => {
        const elem = makeElement(`elem-${Date.now()}-${Math.random()}`);
        elem.tagName = (tag || 'DIV').toUpperCase();
        return elem;
      },
      querySelector: (selector) => {
        if (selector.includes('client-agree-terms')) return makeElement('client-agree-terms');
        if (selector.includes('mock-pay-method')) return makeElement('mock-pay-method');
        if (selector.includes('client-withdraw-reason')) return makeElement('client-withdraw-reason');
        if (selector.includes('client-withdraw-explanation')) return makeElement('client-withdraw-explanation');
        const cleanId = selector.replace(/[#.[\]="'\s]/g, '');
        return makeElement(cleanId);
      },
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    window: {},
  };

  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(runtimeCode, context);

  // Expose internal DB and sync CU
  vm.runInContext(`
    window.DB = DB;
    window.CU = CU;
    CU = getCurrentUser();
  `, context);

  context.window.setCurrentUser(testUser);

  // Add test records to internal DB
  context.window.DB.eventRequests.push(
    {
      id: 'req-001',
      requestId: 'req-001',
      clientId: 'cli-001',
      organizerId: 'org-001',
      eventName: 'Tech Product Launch 2026',
      eventType: 'Corporate',
      eventDate: '2026-11-20',
      eventTime: '14:00',
      venue: 'Grand Hyatt Convention Hall',
      city: 'Mumbai',
      capacity: 250,
      budget: 50000,
      requirements: 'High-end audiovisual, live streaming, catering for 250 executives.',
      status: 'submitted',
      agreementStatus: 'not_sent',
      paymentStatus: 'unpaid',
      proposals: [],
      auditHistory: [],
    },
    {
      id: 'req-002',
      requestId: 'req-002',
      clientId: 'cli-001',
      organizerId: 'org-001',
      eventName: 'Annual Leadership Summit',
      eventType: 'Conference',
      eventDate: '2026-12-10',
      eventTime: '09:00',
      venue: 'Taj Palace Hotel',
      city: 'New Delhi',
      capacity: 400,
      budget: 80000,
      requirements: 'Keynote hall, breakout rooms, dinner buffet.',
      status: 'awaiting_client',
      agreementStatus: 'agreed',
      paymentStatus: 'unpaid',
      proposals: [
        {
          version: 1,
          amount: 75000,
          depositRequired: 22500,
          validUntil: '2026-11-30',
          status: 'accepted',
          terms: 'Standard summit production package.',
          clientNotes: 'Accepted agreed pricing.',
        }
      ],
      auditHistory: [
        { action: 'Proposal Accepted', role: 'client', timestamp: new Date() }
      ],
    },
    {
      id: 'req-unauth',
      requestId: 'req-unauth',
      clientId: 'cli-other-999',
      organizerId: 'org-002',
      eventName: 'Other Client Private Gala',
      eventType: 'Private',
      eventDate: '2026-12-25',
      capacity: 100,
      budget: 30000,
      requirements: 'Private gala.',
      status: 'submitted',
      agreementStatus: 'not_sent',
      paymentStatus: 'unpaid',
      proposals: [],
    },
    {
      id: 'req-terminal',
      requestId: 'req-terminal',
      clientId: 'cli-001',
      organizerId: 'org-001',
      eventName: 'Withdrawn Music Festival',
      eventType: 'Concert',
      eventDate: '2026-09-01',
      capacity: 500,
      budget: 100000,
      status: 'withdrawn',
      withdrawReason: 'Changed Plans',
      agreementStatus: 'not_sent',
      paymentStatus: 'unpaid',
      proposals: [],
    }
  );

  // Add organizer for req-001/002
  context.window.DB.organizers = context.window.DB.organizers || [];
  context.window.DB.organizers.push({
    organizerId: 'org-001',
    id: 'org-001',
    name: 'Apex Event Solutions',
    businessName: 'Apex Event Solutions',
    email: 'apex@example.com',
    phone: '+91 98765 43210',
  });

  function getModal() {
    const foot = makeElement('modal-foot');
    const buttons = foot.children.map(b => ({ lbl: b.textContent, cls: b.className, fn: b['onclick'] }));
    const container = domElements.get('payment-modal-container');
    const body = (container && container.innerHTML) ? container.innerHTML : makeElement('modal-body').innerHTML;
    return {
      isOpen: makeElement('modal-overlay').classList.contains('open'),
      title: makeElement('modal-title').textContent,
      body,
      buttons,
      foot,
    };
  }

  function getDrawer() {
    return {
      isOpen: makeElement('drawer').classList.contains('open') || makeElement('drawer-overlay').classList.contains('open'),
      title: makeElement('drawer-title').textContent,
      body: makeElement('drawer-body').innerHTML,
    };
  }

  return {
    context,
    sandbox,
    getModal,
    getDrawer,
    getLastToast: () => lastToast,
    getRenderedPage: () => renderedPage,
    getApiCalls: () => apiCalls,
    makeElement,
  };
}

test('EventFlow Client Workflow Buttons Test Suite', async (t) => {
  await t.test('1. View Details button displays distinct details for different requests from real persisted records', () => {
    const env = setupClientEnvironment();

    // Test Request 1
    env.context.viewRequestDrawer('req-001');
    const d1 = env.getDrawer();
    assert.equal(d1.isOpen, true, 'Drawer should open for req-001');
    assert.match(d1.title, /Tech Product Launch 2026/, 'Drawer must display exact event title for req-001');
    assert.match(d1.body, /Apex Event Solutions/, 'Must display assigned organizer');
    assert.match(d1.body, /apex@example\.com/, 'Must display organizer contact email');
    assert.match(d1.body, /Grand Hyatt Convention Hall/, 'Must display venue');
    assert.match(d1.body, /250 attendees/, 'Must display guests');
    assert.match(d1.body, /50,000/, 'Must display budget');
    assert.match(d1.body, /Withdraw Request/, 'Must offer Withdraw Request for submitted status');
    assert.ok(!d1.body.includes('Cancel Booking'), 'Must not offer Cancel Booking for unconfirmed request');

    // Test Request 2 (different record)
    env.context.viewRequestDrawer('req-002');
    const d2 = env.getDrawer();
    assert.equal(d2.isOpen, true, 'Drawer should open for req-002');
    assert.match(d2.title, /Annual Leadership Summit/, 'Drawer must display exact event title for req-002');
    assert.match(d2.body, /Taj Palace Hotel/, 'Must display venue for req-002');
    assert.match(d2.body, /400 attendees/, 'Must display guests for req-002');
    assert.match(d2.body, /80,000/, 'Must display budget for req-002');
    assert.match(d2.body, /Version 1/, 'Must display proposal version');
    assert.match(d2.body, /75,000/, 'Must display proposal price');
    assert.match(d2.body, /Proceed to Payment &(?:amp;)? Confirmation/, 'Must offer payment button for accepted proposal');
    assert.ok(!d2.body.includes('Tech Product Launch 2026'), 'Must not display req-001 data in req-002');
  });

  await t.test('2. View Details handles missing record and unauthorized request cleanly', () => {
    const env = setupClientEnvironment();

    // Non-existent request
    env.context.viewRequestDrawer('non-existent-id');
    const missing = env.getDrawer();
    assert.equal(missing.isOpen, true);
    assert.match(missing.body, /Request Record Not Found/, 'Should display missing-record state');

    // Unauthorized request belonging to another client
    env.context.viewRequestDrawer('req-unauth');
    const unauth = env.getDrawer();
    assert.equal(unauth.isOpen, true);
    assert.match(unauth.body, /Access Denied/, 'Should display unauthorized access state');
  });

  await t.test('3. Proceed to Payment & Confirmation opens functional modal with pricing breakdown and policy', () => {
    const env = setupClientEnvironment();

    // Call payment modal on accepted proposal (req-002)
    env.context.openClientPaymentModal('req-002');
    const modal = env.getModal();

    assert.equal(modal.isOpen, true);
    assert.equal(modal.title, 'Payment & Booking Confirmation');
    assert.match(modal.body, /Annual Leadership Summit/, 'Must display event title');
    assert.match(modal.body, /Apex Event Solutions/, 'Must display organizer name');
    assert.match(modal.body, /Version 1/, 'Must display accepted proposal version');
    assert.match(modal.body, /75,000/, 'Must display total agreed price');
    assert.match(modal.body, /22,500/, 'Must display required advance deposit');
    assert.match(modal.body, /52,500/, 'Must display amount remaining after deposit');
    assert.match(modal.body, /Minimum 14 days/, 'Must display cancellation policy terms');
    assert.match(modal.body, /DEMO PAYMENT PROVIDER · SIMULATED TRANSACTION/, 'Must label demo simulated payment');

    // Check Pay Now button
    const payBtn = modal.buttons.find(b => b.lbl.includes('Pay Now'));
    assert.ok(payBtn, 'Must provide Pay Now button');
    assert.match(payBtn.lbl, /22,500/, 'Pay Now button must show amount payable now');
  });

  await t.test('4. Payment validation prevents payment on ineligible/unaccepted requests', () => {
    const env = setupClientEnvironment();

    // Unaccepted proposal / submitted status
    env.context.openClientPaymentModal('req-001');
    const m1 = env.getModal();
    assert.equal(m1.title, 'Payment Unavailable');
    assert.match(m1.body, /Payment requires an accepted proposal/, 'Must explain why payment is unavailable');

    // Terminal status (withdrawn)
    env.context.openClientPaymentModal('req-terminal');
    const m2 = env.getModal();
    assert.equal(m2.title, 'Payment Unavailable');
    assert.match(m2.body, /already been withdrawn/, 'Must explain terminal state');
  });

  await t.test('5. Successful payment flow: agreement validation, API submission, persistence, and booking navigation', async () => {
    const env = setupClientEnvironment();

    // Open payment modal
    env.context.openClientPaymentModal('req-002');

    // Check terms
    const agreeEl = env.makeElement('client-agree-terms');
    agreeEl.checked = true;

    const methodEl = env.makeElement('mock-pay-method');
    methodEl.value = 'UPI';

    // Persist payment after checkout authorizes the selected method.
    await env.context.processClientDepositPayment('req-002', undefined, 'UPI');

    const apiCalls = env.getApiCalls();
    const payCall = apiCalls.find(c => c.endpoint === 'payDeposit');
    assert.ok(payCall, 'Must call backend apiPayDeposit');
    assert.equal(payCall.reqId, 'req-002', 'Must pass correct request ID');
    assert.equal(payCall.payload.paymentMethod, 'DEMO_PROVIDER');

    // Check modal displays Success screen
    const modal = env.getModal();
    assert.match(modal.body, /Payment Verified &amp; Booking Confirmed!/, 'Must show success screen');
    assert.match(modal.body, /PAY-DEP-TEST-12345/, 'Must display transaction reference ID');
    assert.match(modal.body, /22,500/, 'Must display deposit paid');
    assert.match(modal.body, /52,500/, 'Must display remaining balance');
    assert.match(modal.body, /My Events/, 'Must link the confirmed booking to My Events without claiming a future event is already underway');
    assert.match(env.makeElement('modal-foot').innerHTML, /viewClientPaidBooking/);
  });

  await t.test('6. Failed payment flow: shows failure screen and offers Retry Payment button', async () => {
    const env = setupClientEnvironment();

    // Open payment modal
    env.context.openClientPaymentModal('req-002');

    const agreeEl = env.makeElement('client-agree-terms');
    agreeEl.checked = true;

    // Simulate failure method
    const methodEl = env.makeElement('mock-pay-method');
    methodEl.value = 'FAIL';

    // Persist the simulated provider failure after checkout authorization.
    await env.context.processClientDepositPayment('req-002', undefined, 'FAIL');

    // Check modal displays Failure screen with Retry Payment button
    const modal = env.getModal();
    assert.match(modal.body, /Payment Transaction Failed/, 'Must show failure screen');
    assert.match(modal.body, /Payment transaction failed/, 'Must display error message');

    const foot = env.makeElement('modal-foot');
    const footText = foot.innerHTML || foot.children.map(b => b.textContent).join(' ');
    assert.match(footText, /Retry Payment/, 'Must provide Retry Payment action');
  });

  await t.test('7. Withdraw Request button opens confirmation modal with required reason dropdown and clear consequences', () => {
    const env = setupClientEnvironment();

    // Click Withdraw Request on unconfirmed request
    env.context.openClientCancelRequestModal('req-001');
    const modal = env.getModal();

    assert.equal(modal.isOpen, true);
    assert.equal(modal.title, 'Withdraw Event Request');
    assert.match(modal.body, /Tech Product Launch 2026/, 'Must display event title');
    assert.match(modal.body, /Withdrawal ends this event request and stops any further negotiation/, 'Must clearly explain consequences');
    assert.match(modal.body, /Reason for Withdrawal/, 'Must have required reason selector');
    assert.match(modal.body, /Changed Plans/, 'Must include Changed Plans');
    assert.match(modal.body, /Budget Changes/, 'Must include Budget Changes');
    assert.match(modal.body, /Date\/Venue Changes/, 'Must include Date/Venue Changes');
    assert.match(modal.body, /Found Another Organizer/, 'Must include Found Another Organizer');
    assert.match(modal.body, /Other/, 'Must include Other');
    assert.match(modal.body, /No cancellation fees apply/, 'Must confirm no cancellation fees for unconfirmed request');

    // Check buttons
    const keepBtn = modal.buttons.find(b => b.lbl === 'Keep Request');
    const confirmBtn = modal.buttons.find(b => b.lbl === 'Confirm Withdrawal');
    assert.ok(keepBtn, 'Must provide Keep Request button');
    assert.ok(confirmBtn, 'Must provide Confirm Withdrawal button');

    // Test Keep Request cancels without withdrawing
    assert.equal(env.sandbox.window.DB.eventRequests.find(r => r.id === 'req-001').status, 'submitted');
  });

  await t.test('8. Confirming withdrawal requires reason, persists withdrawal via API, and updates status', async () => {
    const env = setupClientEnvironment();

    env.context.openClientCancelRequestModal('req-001');

    // Without reason: blocked with error
    const reasonEl = env.makeElement('client-withdraw-reason');
    reasonEl.value = '';
    await env.context.submitClientWithdrawal('req-001');

    const errEl = env.makeElement('client-withdraw-error');
    assert.equal(errEl.textContent, 'Please select a reason for withdrawal.');
    assert.equal(env.sandbox.window.DB.eventRequests.find(r => r.id === 'req-001').status, 'submitted');

    // With reason: successfully withdraws
    reasonEl.value = 'Changed Plans';
    const explEl = env.makeElement('client-withdraw-explanation');
    explEl.value = 'Postponing to next fiscal year.';

    await env.context.submitClientWithdrawal('req-001');

    const apiCalls = env.getApiCalls();
    const cancelCall = apiCalls.find(c => c.endpoint === 'cancelRequest');
    assert.ok(cancelCall, 'Must call backend apiCancelClientRequest');
    assert.equal(cancelCall.reqId, 'req-001', 'Must pass correct request ID');
    assert.equal(cancelCall.payload.reason, 'Changed Plans');

    // Verify request status transitioned to withdrawn
    const req = env.sandbox.window.DB.eventRequests.find(r => r.id === 'req-001');
    assert.equal(req.status, 'withdrawn');
    assert.equal(req.withdrawalReason, 'Changed Plans');
    assert.equal(env.getLastToast()?.type, 'success');
  });

  await t.test('9. Unauthorized withdrawal and duplicate withdrawal are prevented', async () => {
    const env = setupClientEnvironment();

    // Unauthorized request
    await env.context.openClientCancelRequestModal('req-unauth');
    assert.equal(env.getLastToast()?.type, 'error');
    assert.match(env.getLastToast()?.msg, /not authorized/);

    // Ineligible/already withdrawn request
    await env.context.openClientCancelRequestModal('req-terminal');
    assert.equal(env.getLastToast()?.type, 'warning');
    assert.match(env.getLastToast()?.msg, /already been withdrawn/);
  });
});
