const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const source = require('./portal-source.cjs')('client');

function harness(overrides = {}) {
  const dom = new JSDOM('<div id="modal-overlay" class="hidden"><div id="modal-box"><header id="modal-title"></header><div id="modal-body"></div><footer id="modal-foot"></footer></div></div>');
  const document = dom.window.document;
  const state = { preview: { requestId: 'req-server', eventName: 'Client Conference', status: 'confirmed', canCancel: true,
    cancellationDeadline: '2099-11-06T04:30:00Z', minimumNoticeDays: 14, paidAmount: 1500000, cancellationFeePercent: 10,
    cancellationFee: 150000, refundAmount: 1350000, refundProcessingTimeline: '5–7 business days (pending review)',
    policy: { version: 'saved-policy-1' }, ...overrides }, fail: false };
  const calls = [], previews = [];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const context = vm.createContext({
    CU: { id: 'client', role: 'client' }, DB: { users: [], eventRequests: [{ id: 'display-id', requestId: 'req-server',
      clientId: 'client', organizerId: 'organizer', status: 'confirmed', title: 'Client Conference', budget: 5000000 }] },
    document, g: id => document.getElementById(id), reqBadge: () => 'green', escapeHtml: escape, workflowHtml: escape,
    workflowPayload: response => response.data ?? response, workflowPolicyDate: date => String(date),
    isClientOwner: request => request.clientId === 'client', requestAnimationFrame: callback => callback(),
    apiPreviewClientRequestCancellation: async id => { previews.push(id); return { data: structuredClone(state.preview) }; },
    apiCancelClientRequest: async (id, body) => { calls.push({ id, body }); if (state.fail) throw new Error('Unable to cancel now'); return { success: true }; },
    closeDrawer() {}, toast() {}, syncClientEventRequests: async () => {}, syncWorkflowData: async () => {}, loadClientRecentActivity() {},
    renderPage() {}, _currentPage: 'request-status',
  });
  context.window = context;
  vm.runInContext(source.slice(source.indexOf('    function openModal('), source.indexOf('    function closeModalOnBg(')), context);
  vm.runInContext(source.slice(source.indexOf('    let _clientCancelPreview = null;'), source.indexOf('    function cancelReq(')), context);
  const button = label => [...document.querySelectorAll('#modal-foot button')].find(item => item.textContent === label);
  return { context, document, state, calls, previews, button,
    open: () => context.openClientCancelRequestModal('display-id'),
    click(label) { const target = button(label); assert.ok(target, `Missing ${label}`); if (!target.disabled) return vm.runInContext(target.getAttribute('onclick'), context); },
    title: () => document.getElementById('modal-title').textContent,
    body: () => document.getElementById('modal-body').textContent,
  };
}

test('a closed cancellation window shows a disabled Cancel Event action without an editable form or promised refund', async () => {
  const h = harness({ canCancel: false, unavailableReason: 'Cancellation window closed. At least 14 days notice is required.' });
  await h.open();
  assert.equal(h.title(), 'Cancel Event');
  assert.ok(h.button('Cancel Event'));
  assert.equal(h.button('Cancel Event').disabled, true);
  assert.match(h.body(), /14 days|cancellation deadline/i);
  assert.match(h.body(), /Your event has not been cancelled/);
  assert.doesNotMatch(h.body(), /ESTIMATED REFUND|REFUND TIMELINE|CANCELLATION FEE \(/);
  assert.equal(h.document.querySelectorAll('select, textarea').length, 0);
  await h.click('Cancel Event');
  await h.context.proceedClientCancelStep2('req-server');
  await h.context.submitClientFinalCancellation('req-server');
  assert.equal(h.calls.length, 0);
  assert.equal(h.context.DB.eventRequests[0].status, 'confirmed');
  h.click('Close');
  assert.equal(h.document.getElementById('modal-overlay').classList.contains('open'), false);
});

test('an eligible client can select a reason, review the cancellation, and confirm through the visible footer action', async () => {
  const h = harness();
  await h.open();
  assert.deepEqual(h.previews, ['req-server']);
  assert.equal(h.title(), 'Cancel Event');
  assert.match(h.body(), /You are cancelling this event as the client/);
  assert.equal(h.button('Cancel Event').disabled, false);
  assert.equal(h.button('Cancel Event').closest('#modal-foot').id, 'modal-foot');
  assert.equal(h.document.querySelector('#modal-body button'), null);
  h.click('Cancel Event');
  assert.match(h.document.getElementById('client-cancel-error').textContent, /select.*reason/);
  assert.equal(h.calls.length, 0);
  h.document.getElementById('client-cancel-reason').value = 'Organizer Issue';
  h.document.getElementById('client-cancel-explanation').value = '  The venue arrangement changed.  ';
  h.click('Cancel Event');
  assert.equal(h.title(), 'Confirm Event Cancellation');
  assert.match(h.body(), /Organizer Issue/);
  assert.match(h.body(), /The venue arrangement changed/);
  assert.equal(h.calls.length, 0);
  await h.click('Yes, Cancel Event');
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].id, 'req-server');
  assert.equal(h.calls[0].body.reason, 'Organizer Issue');
  assert.equal(h.calls[0].body.explanation, 'The venue arrangement changed.');
  assert.equal(h.calls[0].body.expectedPaidAmount, 1500000);
  assert.equal(h.calls[0].body.acceptedPolicyVersion, 'saved-policy-1');
  assert.equal(h.document.getElementById('modal-overlay').classList.contains('open'), false);
});

test('zero-percent policies stay zero and keeping an event never submits a cancellation', async () => {
  const h = harness({ cancellationFeePercent: 0, cancellationFee: 0, refundAmount: 1500000 });
  await h.open();
  assert.match(h.body(), /CANCELLATION FEE \(0%\)/);
  assert.doesNotMatch(h.body(), /10% fee|90% net refund/);
  h.click('Keep Event');
  assert.equal(h.calls.length, 0);
  assert.equal(h.context.DB.eventRequests[0].status, 'confirmed');
});

test('a failed confirmation keeps its summary available and enables retry with the same reason', async () => {
  const h = harness();
  await h.open();
  h.document.getElementById('client-cancel-reason').value = 'Change of Plans';
  h.click('Cancel Event');
  h.state.fail = true;
  await h.click('Yes, Cancel Event');
  assert.match(h.document.getElementById('client-cancel-final-error').textContent, /Unable to cancel now/);
  assert.equal(h.title(), 'Confirm Event Cancellation');
  assert.equal(h.button('Yes, Cancel Event').disabled, false);
  h.state.fail = false;
  await h.click('Yes, Cancel Event');
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].body.reason, 'Change of Plans');
});
