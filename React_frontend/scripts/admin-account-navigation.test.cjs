const portalSource = require('./portal-source.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const parser = require('@babel/parser');

const source = portalSource('admin');
const component = fs.readFileSync(path.join(__dirname, '../src/apps/admin/app/App.jsx'), 'utf8');
const supportSource = fs.readFileSync(
  path.join(__dirname, '../src/apps/customer-support/api/legacySupport.js'),
  'utf8'
);
function section(from, to) {
  const start = source.indexOf(from);
  const end = source.indexOf(to, start);
  assert.ok(start >= 0 && end > start, `Missing runtime section: ${from}`);
  return source.slice(start, end);
}
function harness() {
  const content = {
    innerHTML: '',
    querySelector: () => null,
    appendChild: element => calls.push(element),
  };
  const calls = [];
  const context = vm.createContext({
    CU: {
      id: 'usr-admin-001',
      name: 'Alex Johnson',
      email: 'superadmin@example.com',
      phone: '+91 9876543201',
      role: 'superuser',
      avatar: 'AJ',
    },
    DB: {
      staffAssignments: [],
      registrations: [],
      events: [],
      supportRequests: [],
      financeTransactions: [],
      operationalReports: [],
    },
    ROLE_LABELS: { superuser: 'Super Administrator' },
    ROLE_COLORS: { superuser: 'red' },
    _currentPage: 'dashboard',
    g: id => (id === 'page-content' ? content : undefined),
    isDepartmentEmployee: () => false,
    dashAdmin: () => 'System Overview',
    pageUserReports: () => 'User Reports',
    pageEventReports: () => 'Event Reports',
    pageRevenueReports: () => 'Revenue Reports',
    escapeHtml: value =>
      String(value).replace(
        /[&<>"']/g,
        char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])
      ),
    window: {},
    document: {
      createElement() {
        throw new Error('Admin settings must not create a Customer Support entry');
      },
    },
  });
  vm.runInContext(supportSource, context);
  context.window.EventFlowSupportReports = {
    renderAdmin: async element => {
      element.innerHTML = 'Submitted Support Executive Reports';
    },
  };
  vm.runInContext(section('async function renderPageContent(', 'function dashAdmin('), context);
  vm.runInContext(section('function adminChartText(', 'function adminChartNumber('), context);
  vm.runInContext(section('function pageProfile(', 'async function saveSettings('), context);
  return { context, content, calls };
}

test('admin Profile opens the actual account profile instead of User Reports', async () => {
  const h = harness();
  await h.context.renderPageContent('profile');
  assert.match(h.content.innerHTML, /My Profile/);
  assert.match(h.content.innerHTML, /Alex Johnson/);
  assert.match(h.content.innerHTML, /superadmin@example\.com/);
  assert.match(h.content.innerHTML, /goNav\('settings'\)/);
  assert.doesNotMatch(h.content.innerHTML, /User Reports/);
});

test('the admin account button and Edit Profile open Settings without Customer Support', async () => {
  const h = harness();
  let accountAction;
  function findAccountAction(node) {
    if (!node || typeof node !== 'object') return;
    if (
      node.type === 'JSXOpeningElement' &&
      node.attributes.some(
        attribute => attribute.name?.name === 'className' && attribute.value?.value === 'sb-user'
      )
    )
      accountAction = node.attributes.find(attribute => attribute.name?.name === 'onClick')?.value
        ?.expression;
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(findAccountAction);
      else if (value && typeof value === 'object') findAccountAction(value);
    }
  }
  findAccountAction(parser.parse(component, { sourceType: 'module', plugins: ['jsx'] }));
  assert.ok(accountAction, 'The account button must have a navigation action');
  h.context.window.goNav = page => h.context.renderPageContent(page);
  const clickAccount = vm.runInContext(
    `(${component.slice(accountAction.start, accountAction.end)})`,
    h.context
  );
  await clickAccount();
  assert.match(h.content.innerHTML, /Account Settings/);
  assert.match(h.content.innerHTML, /Personal Information/);
  assert.match(h.content.innerHTML, /value="Alex Johnson"/);
  assert.equal(h.calls.length, 0);
});

test('admin reporting pages still route to their original reports', async () => {
  const h = harness();
  for (const [page, expected] of [
    ['dashboard', 'System Overview'],
    ['users', 'User Reports'],
    ['user-reports', 'User Reports'],
    ['event-reports', 'Event Reports'],
    ['revenue-reports', 'Revenue Reports'],
  ]) {
    await h.context.renderPageContent(page);
    assert.equal(h.content.innerHTML, expected);
  }
  assert.equal(h.calls.length, 0);
});

test('admin has a dedicated Reports page for Support Executive submissions', async () => {
  const h = harness();
  assert.match(source, /lbl:\s*'Reports',\s*pg:\s*'reports'/);
  await h.context.renderPageContent('reports');
  assert.equal(h.content.innerHTML, 'Submitted Support Executive Reports');
});
