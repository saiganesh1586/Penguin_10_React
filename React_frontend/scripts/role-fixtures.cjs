const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const parser = require('@babel/parser');
const portalSource = require('./portal-source.cjs');

const pascalCase = role =>
  role
    .split('-')
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join('');

function roleFixture(role, document, storage) {
  let source = portalSource(role);
  if (role === 'finance-executive')
    source +=
      '\n' +
      fs.readFileSync(
        path.join(__dirname, '../src/apps/finance-executive/app/finance-workspace.js'),
        'utf8'
      );
  const ast = parser.parse(source, { sourceType: 'script' });
  const declarations = ast.program.body.filter(
    node => node.type === 'FunctionDeclaration' || node.type === 'VariableDeclaration'
  );
  const sandbox = {
    document,
    sessionStorage: storage,
    localStorage: storage,
    console,
    URLSearchParams,
    Date,
    Intl,
    setTimeout,
    clearTimeout,
    EventFlowAccountPolicy: {
      visibleAccounts: (_, users) => users,
      canManageAccounts: () => false,
      canManageAccount: () => false,
      canRequestSupport: () => true,
      isSupportExecutiveAccount: () => role === 'support-executive',
    },
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(declarations.map(node => source.slice(node.start, node.end)).join('\n'), context);
  const runtime = `EventFlow${pascalCase(role)}Runtime`;
  const snapshot = ast.program.body.find(
    node =>
      node.type === 'ExpressionStatement' &&
      node.expression.left?.object?.name === 'window' &&
      node.expression.left?.property?.name === runtime
  );
  vm.runInContext(source.slice(snapshot.start, snapshot.end), context);
  const user = {
    id: role === 'organizer' ? 'organizer-1' : role === 'client' ? 'client-1' : 'employee-1',
    organizerId: 'org-1',
    name: 'Test User',
    email: 'test@example.com',
    role,
    avatar: 'TU',
    phone: '9876543210',
    joinedAt: '2026-01-01',
    department: role === 'finance-executive' ? 'Finance Executive' : 'Support Executive',
  };
  if (role === 'admin') user.role = 'superuser';
  if (role.endsWith('-executive')) {
    user.role = 'employee';
    user.employeeType =
      role === 'finance-executive' ? 'FINANCE_EXECUTIVE' : 'REGISTRATION_VERIFICATION';
  }
  const event = {
    id: 'event-1',
    eventId: 'event-1',
    title: 'Client conference',
    organizer: 'organizer-1',
    organizerUserId: 'organizer-1',
    organizerId: 'org-1',
    clientId: 'client-1',
    date: '2099-11-20',
    time: '10:00',
    venue: 'Conference Hall',
    location: 'Chennai',
    category: 'Corporate',
    status: 'ongoing',
    backendStatus: 'ongoing',
    capacity: 20,
    registered: 1,
    price: 100,
    visibility: 'private',
  };
  const request = {
    id: 'request-1',
    requestId: 'request-1',
    clientId: 'client-1',
    clientUserId: 'client-1',
    organizerId: 'org-1',
    organizerUserId: 'organizer-1',
    organizer: 'organizer-1',
    eventId: event.id,
    eventName: event.title,
    title: event.title,
    name: event.title,
    eventType: 'Corporate',
    type: 'Corporate',
    eventDate: event.date,
    date: event.date,
    guests: 20,
    guestCount: 20,
    capacity: 20,
    budget: 10000,
    agreedPrice: 10000,
    status: 'confirmed',
    paymentStatus: 'paid',
    totalPaid: 10000,
  };
  const registration = {
    id: 'reg-1',
    eventId: event.id,
    attendeeId: 'attendee-1',
    ticketId: 'TICKET-1',
    status: 'confirmed',
    reviewStatus: 'approved',
    payment: 'paid',
    amount: 100,
    organizerManaged: true,
    date: '2026-10-01',
  };
  const records = {
    users: [
      user,
      {
        id: 'attendee-1',
        role: 'attendee',
        name: 'Anita Rao',
        email: 'anita@example.com',
        avatar: 'AR',
        status: 'active',
      },
    ],
    events: [event],
    registrations: [registration],
    eventRequests: [request],
    eventPlans: [],
    payments: [],
    notifications: [],
    financeTransactions: [],
    financeRefunds: [],
    reports: [],
    organizers: [],
    organizerApplications: [],
    eventOperationsTasks: [],
    userQueries: [],
    supportRequests: [],
    operationalReports: [],
    privateOrganizerReviews: [],
  };
  context.fixtureUser = user;
  context.fixtureRecords = records;
  vm.runInContext('CU=fixtureUser;Object.assign(DB,fixtureRecords);', context);
  if (role === 'organizer') vm.runInContext('organizerRegistrationEvents=DB.events;', context);
  const data = context[runtime].snapshot({ id: request.id });
  data.actions = new Proxy({}, { get: () => () => {} });
  data.dashboardData = null;
  data.financeData = {
    totals: {},
    recentTransactions: [],
    recentRefunds: [],
    revenueTrend: [],
    paymentStatuses: [],
    eventRevenue: [],
    refundTrend: [],
    data: [],
    pagination: { total: 0, page: 1, totalPages: 0 },
    rows: [],
    options: { events: [], organizers: [] },
    summary: {},
    total: 0,
    reason: 'Simulated provider',
    generatedAt: '2026-11-01',
  };
  data.financeResults = [
    { totals: {}, eventRevenue: [], revenueTrend: [] },
    { data: [], pagination: { total: 0, page: 1, totalPages: 0 } },
  ];
  data.financeReportData = { totals: {}, eventRevenue: [] };
  return { data, context, records, user, event, request, registration };
}

module.exports = { roleFixture };
