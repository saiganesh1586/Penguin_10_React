const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function policy() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/app/account-policy.js'), 'utf8'), context);
  return context.window.EventFlowAccountPolicy;
}

test('saved ordinary staff accounts cannot restore a session', () => {
  const access = policy();
  for (const role of ['staff', 'event_staff', 'event-staff']) assert.equal(access.normalizeSavedAccount({ role, token: 'old-token' }), null);
  const client = { role: 'client', token: 'client-token' };
  assert.equal(access.normalizeSavedAccount(client), client);
});

test('saved Support and Finance Executive accounts retain their identity and token', () => {
  const access = policy();
  for (const employeeType of ['SUPPORT_EXECUTIVE', 'REGISTRATION_VERIFICATION', 'EVENT_OPERATIONS', 'SUPPORT_FINANCE', 'FINANCE_EXECUTIVE']) {
    const restored = access.normalizeSavedAccount({ id: 'executive', role: 'staff', employeeType, token: 'existing-token' });
    assert.equal(restored.role, 'employee');
    assert.equal(restored.id, 'executive');
    assert.equal(restored.token, 'existing-token');
    assert.equal(restored.employeeType, employeeType);
  }
});

test('browser migration removes staff collections and preserves event and payment records', () => {
  const access = policy();
  const event = { id: 'event', title: 'Staff appreciation dinner' }, payment = { id: 'payment', amount: 1250 };
  const db = { users: [{ id: 'retired', role: 'staff' }, { id: 'support', role: 'staff', employeeType: 'SUPPORT_EXECUTIVE' }, { id: 'client', role: 'client' }],
    currentUser: { role: 'staff' }, staffAssignments: [{ id: 1 }], staffAvailability: {}, events: [event], financeTransactions: [payment] };
  access.migrateLegacyDemoData(db);
  assert.equal(db.accountSchemaVersion, 2);
  assert.equal(db.currentUser, null);
  assert.equal(db.users.length, 2);
  assert.equal(db.users[0].role, 'employee');
  assert.equal(Object.keys(db).some(key => /staff/i.test(key)), false);
  assert.equal(db.events[0], event);
  assert.equal(db.financeTransactions[0], payment);
});

test('every remaining role entry routes migrated executives to their own workspace', () => {
  for (const role of ['admin', 'attendee', 'client', 'finance-executive', 'organizer', 'landing', 'support-executive']) {
    const source = fs.readFileSync(path.join(__dirname, '../src/apps', role, role === 'landing' ? 'runtime.js' : 'app/runtime.js'), 'utf8');
    const start = source.indexOf('function getRoleWorkspace(user)');
    const end = source.indexOf('function routeToRoleWorkspace(', start);
    const context = vm.createContext({});
    vm.runInContext(source.slice(start, end), context);
    assert.equal(context.getRoleWorkspace({ role: 'employee', employeeType: 'SUPPORT_EXECUTIVE' }).key, 'employee1');
    assert.equal(context.getRoleWorkspace({ role: 'employee', employeeType: 'SUPPORT_FINANCE' }).key, 'employee2');
    assert.equal(context.getRoleWorkspace({ role: 'staff' }), null);
  }
});
