const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const portalSource = require('./portal-source.cjs');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const portals = ['landing/app/runtime.js', ...['admin', 'attendee', 'client', 'organizer', 'finance-executive', 'support-executive'].map(role => `${role}/app/runtime.js`)];
const flush = () => new Promise(resolve => setImmediate(resolve));

async function fixture(t, portal = portals[0]) {
  const errors = [], virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM('<div id="modal-overlay"><div id="modal-box" class="modal-box"><h2 id="modal-title"></h2><div id="modal-body"></div><div id="modal-foot"></div></div></div>',
    { url: 'http://localhost:5173/landing', runScripts: 'dangerously', virtualConsole });
  t.after(() => { dom.window.close(); assert.deepEqual(errors, []); });
  const w = dom.window, d = w.document, toasts = [], requests = [], routes = [];
  await new Promise(resolve => w.addEventListener('load', resolve, { once: true }));
  w.g = id => d.getElementById(id);
  w.v = id => w.g(id)?.value.trim() || '';
  w.toast = (message, type) => toasts.push({ message, type });
  w.DB = { users: [], _nextId: { users: 100 } };
  w.EventFlowAccountPolicy = { isEmailInUse: (users, email) => users.some(user => user.email.toLowerCase() === email.toLowerCase()) };
  w.requestAnimationFrame = fn => fn();
  w.generateCaptcha = () => ({ question: '8 + 4 = ?', answer: 12 });
  const sessionScript = d.createElement('script');
  sessionScript.textContent = 'let CU = null;';
  d.head.appendChild(sessionScript);
  w.routeToRoleWorkspace = user => { routes.push({ user, stored: JSON.parse(w.sessionStorage.getItem('ef_cu')) }); return true; };
  const server = { error: null, hold: null };
  w.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    requests.push({ url, body });
    if (server.hold) await server.hold;
    if (server.error) return { ok: false, json: async () => ({ message: server.error }) };
    return { ok: true, json: async () => ({ success: true, data: {
      userId: 'usr-server-101', name: body.name, email: body.email, userRole: body.userRole, profile: body.profile,
      phoneNo: body.phoneNo, address: body.address,
      ...(body.userRole === 'attendee' ? { status: 'active', token: 'server-issued-token' } : { status: 'pending' }),
    } }) };
  };
  // Give the global validator the same visible-field condition it sees in a browser.
  w.HTMLElement.prototype.getClientRects = function () { return this.closest('[style*="display:none"]') ? [] : [{}]; };
  const source = portalSource(portal.split('/')[0]);
  w.eval(source.slice(source.indexOf('function openModal('), source.indexOf('function closeModalOnBg(')));
  w.eval(read('src/app/theme.js'));
  w.eval(read('src/apps/organizer/utils/organizer-registration.js'));
  w.eval(read('src/app/data-sync.js'));
  w.eval(source.slice(source.indexOf('/* ===== EventFlow source: validation.js ===== */')));
  d.dispatchEvent(new w.Event('DOMContentLoaded'));
  const input = (id, value) => {
    const field = w.g(id);
    assert.ok(field, id);
    field.value = value;
    field.dispatchEvent(new w.Event('input', { bubbles: true }));
  };
  const click = handler => {
    const button = [...d.querySelectorAll('button')].find(button => button.getAttribute('onclick')?.includes(handler));
    assert.ok(button, handler);
    button.click();
  };
  const reg = w.EventFlowOrganizerRegistration;
  const fillClient = async (type = 'Self') => {
    reg.openClientRegisterForm();
    await flush();
    for (const [id, value] of Object.entries({ 'rg-client-name': 'Jane Doe', 'rg-client-email': 'jane@example.com', 'rg-client-pass': 'Secret@123', 'rg-client-phone': '9876543210', 'rg-client-address': 'Example address', 'rg-captcha': '12' })) input(id, value);
    w.g('rg-organization-type').value = type;
    w.g('rg-organization-type').dispatchEvent(new w.Event('change', { bubbles: true }));
    if (type !== 'Self') input('rg-organization-name', 'Example company');
  };
  const verifyClient = async channel => {
    click(`triggerClientVerification('${channel}')`);
    await flush();
    input(`client-${channel}-otp-input`, reg.getClientState()[`${channel}DemoCode`]);
    click(`confirmClientVerification('${channel}')`);
    await flush();
  };
  return { w, d, reg, toasts, requests, routes, server, input, click, fillClient, verifyClient };
}

for (const portal of portals) {
  test(`${portal}: organizer code confirmation works with the real global validators`, async t => {
    const { w, reg, input, click, toasts } = await fixture(t, portal);
    reg.openOrganizerRegisterStep(1);
    await flush();
    input('org-reg-email', 'organizer@example.com');
    click('triggerEmailVerify()');
    await flush();
    input('org-email-otp-input', '999999');
    assert.equal(w.g('org-email-otp-input').classList.contains('is-error'), false);
    click('confirmEmailCode()');
    assert.equal(reg.getState().emailVerified, false);
    assert.match(w.g('email-otp-err').textContent, /Invalid verification code/);
    input('org-email-otp-input', reg.getState().emailDemoCode);
    click('confirmEmailCode()');
    assert.equal(reg.getState().emailVerified, true);
    assert.equal(reg.getState().mobileVerified, false);
    assert.equal(toasts.some(toast => /fix the errors|valid email format/.test(toast.message)), false);
  });
}

test('client registration requires both checks, rejects wrong codes and preserves all fields and CAPTCHA', async t => {
  const { w, reg, click, input, fillClient, verifyClient, requests, routes } = await fixture(t);
  await fillClient();
  click('submitClientForm()');
  await flush();
  assert.equal(w.DB.users.length, 0);
  assert.equal(requests.length, 0);
  assert.match(w.g('modal-body').textContent, /Email verification is required/);
  click("triggerClientVerification('email')");
  await flush();
  input('client-email-otp-input', '123456');
  click("confirmClientVerification('email')");
  assert.equal(reg.getClientState().emailVerified, false);
  assert.match(w.g('client-email-otp-err').textContent, /Invalid verification code/);
  input('client-email-otp-input', ` ${reg.getClientState().emailDemoCode} `);
  click("confirmClientVerification('email')");
  await flush();
  click('submitClientForm()');
  await flush();
  assert.equal(w.DB.users.length, 0, 'Email verification alone must not create an account');
  assert.equal(requests.length, 0);
  await verifyClient('mobile');
  assert.equal(w.g('rg-client-name').value, 'Jane Doe');
  assert.equal(w.g('rg-client-pass').value, 'Secret@123');
  assert.equal(w.g('rg-client-address').value, 'Example address');
  assert.equal(w.g('rg-captcha').value, '12');
  assert.equal(w.g('rg-captcha-question').textContent, '8 + 4 = ?');
  assert.equal(w.g('rg-organization-name').disabled, true);
  click('submitClientForm()');
  await flush();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].body.userRole, 'client');
  assert.equal(requests[0].body.address, 'Example address');
  assert.equal(requests[0].body.profile.organizationType, 'Self');
  assert.equal(w.DB.users.length, 0, 'No browser-only account is created');
  assert.equal(w.sessionStorage.getItem('ef_cu'), null);
  assert.deepEqual(routes, []);
  assert.match(w.g('modal-body').textContent, /awaiting admin approval/);
});

test('client contact edits invalidate only that contact and preserve focus; stale prompts cannot verify a new contact', async t => {
  const { w, reg, input, click, fillClient, verifyClient } = await fixture(t);
  await fillClient('Other');
  await verifyClient('email');
  await verifyClient('mobile');
  const email = w.g('rg-client-email');
  email.focus();
  input('rg-client-email', 'changed@example.com');
  assert.equal(w.document.activeElement, email);
  assert.equal(reg.getClientState().emailVerified, false);
  assert.equal(reg.getClientState().mobileVerified, true);
  assert.equal(w.g('rg-organization-name').value, 'Example company');
  click('submitClientForm()');
  await flush();
  assert.equal(w.DB.users.length, 0);
  click("triggerClientVerification('email')");
  await flush();
  input('rg-client-email', 'changed-again@example.com');
  assert.equal(w.g('client-email-otp-input'), null);
  reg.confirmClientVerification('email');
  assert.equal(reg.getClientState().emailVerified, false);
  await verifyClient('email');
  input('rg-client-phone', '9876543211');
  assert.equal(reg.getClientState().emailVerified, true);
  assert.equal(reg.getClientState().mobileVerified, false);
  click('submitClientForm()');
  assert.equal(w.DB.users.length, 0);
});

test('client confirmations can run before other fields are filled; cancel and reopening reset prompts', async t => {
  const { w, reg, input, click } = await fixture(t);
  reg.openClientRegisterForm();
  await flush();
  input('rg-client-email', 'jane@example.com');
  click("triggerClientVerification('email')");
  await flush();
  input('client-email-otp-input', reg.getClientState().emailDemoCode);
  click("confirmClientVerification('email')");
  assert.equal(reg.getClientState().emailVerified, true);
  input('rg-client-phone', '9876543210');
  click("triggerClientVerification('mobile')");
  await flush();
  input('client-mobile-otp-input', '000000');
  click("confirmClientVerification('mobile')");
  assert.equal(reg.getClientState().mobileVerified, false);
  click("cancelContactVerification('mobile', true)");
  assert.equal(w.g('client-mobile-otp-input'), null);
  assert.equal(w.g('rg-client-email').value, 'jane@example.com');
  reg.openClientRegisterForm();
  assert.equal(reg.getClientState().emailVerified, false);
  assert.equal(reg.getClientState().mobileVerified, false);
  assert.equal(w.g('rg-client-email').value, '');
});

test('attendee signup persists the server session before routing to its workspace', async t => {
  const { w, reg, input, click, requests, routes } = await fixture(t);
  reg.openAttendeeRegisterForm();
  await flush();
  assert.deepEqual([...w.g('modal-foot').querySelectorAll('button')].map(button => button.textContent), ['Create Account']);
  assert.match(w.g('modal-body').textContent, /Back to Role Selection/);
  for (const [id, value] of Object.entries({ 'rg-name': 'Jane Doe', 'rg-email': 'jane@example.com', 'rg-pass': 'Secret@123', 'rg-phone': '9876543210',
    'rg-date-of-birth': '2000-01-01', 'rg-city': 'Hyderabad', 'rg-interests': 'Music', 'rg-captcha': '12' })) input(id, value);
  w.g('rg-gender').value = 'Female';
  w.DB.users.push({ id: 'browser-only', name: 'Old browser account', email: 'jane@example.com', role: 'attendee' });
  click('submitAttendeeForm()');
  await flush();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'http://localhost:3001/api/auth/register');
  assert.equal(requests[0].body.userRole, 'attendee');
  assert.equal(requests[0].body.phoneNo, '9876543210');
  assert.equal(requests[0].body.profile.dateOfBirth, '2000-01-01');
  const session = JSON.parse(w.sessionStorage.getItem('ef_cu'));
  assert.equal(session.token, 'server-issued-token');
  assert.equal(session.userId, 'usr-server-101');
  assert.equal(session.role, 'attendee');
  assert.equal(w.eval('CU').token, session.token, 'The runtime lexical CU must be updated');
  assert.deepEqual(routes.map(route => route.user.role), ['attendee']);
  assert.equal(routes[0].stored.token, session.token, 'Session must be stored before navigation');
  assert.equal(w.DB.users.length, 1, 'A stale browser record must not prevent server registration or be duplicated');
});

test('a client account left by the old browser-only signup can be registered with the server', async t => {
  const { w, reg, fillClient, verifyClient, requests } = await fixture(t);
  await fillClient();
  w.DB.users.push({ id: 'browser-only', name: 'Old browser account', email: 'jane@example.com', role: 'client' });
  await verifyClient('email');
  await verifyClient('mobile');
  await reg.submitClientForm();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].body.email, 'jane@example.com');
  assert.equal(w.DB.users.length, 1);
  assert.match(w.g('modal-body').textContent, /awaiting admin approval/);
});

test('client signup has no bottom Back button and an API failure preserves the verified form for retry', async t => {
  const { w, reg, input, click, fillClient, verifyClient, server, requests, routes, toasts } = await fixture(t);
  await fillClient();
  assert.deepEqual([...w.g('modal-foot').querySelectorAll('button')].map(button => button.textContent), ['Create Account']);
  await verifyClient('email');
  await verifyClient('mobile');
  server.error = 'Email already registered';
  await reg.submitClientForm();
  assert.equal(requests.length, 1);
  assert.equal(w.g('rg-client-email').value, 'jane@example.com');
  assert.equal(w.g('rg-client-pass').value, 'Secret@123');
  assert.equal(reg.getClientState().emailVerified, true);
  assert.equal(reg.getClientState().mobileVerified, true);
  assert.equal(w.sessionStorage.getItem('ef_cu'), null);
  assert.equal(w.eval('CU'), null);
  assert.deepEqual(routes, []);
  assert.equal(w.DB.users.length, 0);
  assert.equal(toasts.at(-1).message, 'Email already registered');
  input('rg-client-address', 'Updated address');
  server.error = null;
  click('submitClientForm()');
  await flush();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].body.address, 'Updated address');
  assert.match(w.g('modal-body').textContent, /awaiting admin approval/);
});

test('repeated Create Account clicks send only one registration request while it is pending', async t => {
  const { reg, fillClient, verifyClient, server, requests } = await fixture(t);
  await fillClient();
  await verifyClient('email');
  await verifyClient('mobile');
  let release;
  server.hold = new Promise(resolve => { release = resolve; });
  const first = reg.submitClientForm();
  const second = reg.submitClientForm();
  assert.equal(requests.length, 1);
  release();
  await Promise.all([first, second]);
  assert.equal(requests.length, 1);
});
