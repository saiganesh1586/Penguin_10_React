const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('staff removal migrates department accounts and preserves remaining workflows', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-staff-removal-'));
  const previousFile = process.env.EVENTFLOW_DATA_FILE;
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  const { DataStore } = require('../src/common/data-store');
  const { upgradeEmployeeAccounts } = require('../src/common/migrations/employee-accounts');
  const { AuthService } = require('../src/modules/auth/auth.service');
  const { JwtService } = require('@nestjs/jwt');
  const { jwtConfig } = require('../src/config/jwt.config');
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../src/app.module');
  DataStore.instance = undefined;
  let db = DataStore.getInstance();
  db.persist();
  const saved = JSON.parse(fs.readFileSync(process.env.EVENTFLOW_DATA_FILE, 'utf8'));
  saved.accountSchemaVersion = 1;
  saved.users.find(user => user.userId === 'usr-emp-001').userRole = 'event_staff';
  saved.users.push({ userId: 'usr-staff-001', userRole: 'event_staff', name: 'Removed account', email: 'staff@example.com', status: 'active' });
  saved.staffProfiles = [{ staffId: 'staff-001', userId: 'usr-staff-001' }];
  saved.staffAssignments = [{ assignmentId: 'assignment', staffId: 'staff-001' }];
  saved.staffReports = [{ staffReportId: 'report', staffId: 'staff-001' }];
  const history = JSON.stringify([saved.events, saved.registrations, saved.payments, saved.eventRequests]);
  fs.writeFileSync(process.env.EVENTFLOW_DATA_FILE, JSON.stringify(saved));
  DataStore.instance = undefined;
  db = DataStore.getInstance();
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  t.after(async () => {
    await app.close(); DataStore.instance = undefined;
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE; else process.env.EVENTFLOW_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-staff-removal-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
  async function call(token, method, route, body, expected = 200) {
    const response = await fetch(base + route, { method, headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}),
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${route}: ${JSON.stringify(result)}`);
    return result.data ?? result;
  }
  const login = (email, password) => app.get(AuthService).login({ email, password }).data;
  const admin = login('superadmin@example.com', 'Admin@123').token;
  await t.test('saved data upgrades idempotently without changing bookings and payments', () => {
    assert.equal(db.findUserById('usr-staff-001'), undefined);
    assert.equal(db.findUserById('usr-emp-001').userRole, 'employee');
    assert.equal(Object.keys(db).some(key => /staff/i.test(key)), false);
    const upgraded = upgradeEmployeeAccounts(saved);
    assert.equal(JSON.stringify([upgraded.events, upgraded.registrations, upgraded.payments, upgraded.eventRequests]), history);
    assert.equal(JSON.stringify(db.payments), JSON.stringify(upgraded.payments));
    assert.deepEqual(upgradeEmployeeAccounts(upgraded), upgraded);
    const persisted = JSON.parse(fs.readFileSync(process.env.EVENTFLOW_DATA_FILE, 'utf8'));
    assert.equal(persisted.accountSchemaVersion, 2);
    assert.equal(Object.keys(persisted).some(key => /staff/i.test(key)), false);
  });
  await t.test('removed accounts cannot log in or register and their endpoints no longer exist', async () => {
    await call(null, 'POST', '/auth/login', { email: 'staff@example.com', password: 'Staff@123' }, 401);
    const body = { name: 'Removed Role', email: 'removed@example.com', password: 'Staff@123', userRole: 'event_staff' };
    await call(null, 'POST', '/auth/register', body, 400);
    await call(admin, 'POST', '/users', body, 400);
    for (const route of ['/staff', '/staff-assignments', '/reports/staff', '/reviews/staff', '/analytics/staff-dashboard']) await call(admin, 'GET', route, null, 404);
  });
  await t.test('old staff tokens are rejected and existing executive tokens retain access', async () => {
    const jwt = app.get(JwtService);
    const token = userId => jwt.sign({ userId, email: 'old@example.com', userRole: 'event_staff' }, { secret: jwtConfig.secret });
    await call(token('usr-staff-001'), 'GET', '/workspace', null, 401);
    const snapshot = await call(token('usr-emp-001'), 'GET', '/workspace');
    assert.equal(snapshot.currentUser.userRole, 'employee');
    await call(token('usr-emp-001'), 'GET', '/analytics/employee-dashboard');
  });
  await t.test('remaining roles can log in and receive workspaces without staff collections', async () => {
    for (const [email, password] of [
      ['superadmin@example.com', 'Admin@123'], ['attendee@example.com', 'Attendee@123'],
      ['client@example.com', 'Client@123'], ['organizer@example.com', 'Organizer@123'],
      ['employee@example.com', 'Employee@123'], ['marcus.ops@eventflow.com', 'Employee@123'],
    ]) {
      const user = login(email, password);
      const snapshot = await call(user.token, 'GET', '/workspace');
      assert.equal(snapshot.currentUser.userId, user.userId);
      assert.equal(Object.keys(snapshot).some(key => /staff/i.test(key)), false);
    }
  });
});
