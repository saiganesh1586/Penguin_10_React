const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  transpileOnly: true,
});

test('public signup saves real accounts and grants workspace access according to approval status', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-public-registration-'));
  const previousDirectory = process.cwd(),
    previousFile = process.env.EVENTFLOW_DATA_FILE;
  process.chdir(directory);
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  const { DataStore } = require('../src/common/data-store');
  DataStore.instance = undefined;
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../src/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
  );
  t.after(async () => {
    await app.close();
    DataStore.instance = undefined;
    process.chdir(previousDirectory);
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-public-registration-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
  const call = async (route, body, token, status = 200, method = body ? 'POST' : 'GET') => {
    const response = await fetch(base + route, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    assert.equal(response.status, status, `${method} ${route}: ${JSON.stringify(result)}`);
    return result.data ?? result;
  };
  let client;
  await t.test(
    'attendees receive a token that loads their dashboard and a persisted profile',
    async () => {
      const account = await call(
        '/auth/register',
        {
          name: 'New Attendee',
          email: 'new-attendee@example.com',
          password: 'Test@123',
          userRole: 'attendee',
          phoneNo: '9876543210',
          profile: {
            dateOfBirth: '2000-01-01',
            gender: 'Female',
            city: 'Hyderabad',
            interests: 'Music',
          },
        },
        null,
        201
      );
      assert.ok(account.token);
      assert.equal(account.status, 'active');
      assert.equal(account.password, undefined);
      const snapshot = await call('/workspace', null, account.token);
      assert.equal(snapshot.currentUser.userId, account.userId);
      assert.equal(snapshot.currentUser.userRole, 'attendee');
      assert.equal(snapshot.currentUser.profile.city, 'Hyderabad');
      const saved = JSON.parse(fs.readFileSync(process.env.EVENTFLOW_DATA_FILE, 'utf8'));
      assert.ok(saved.users.some(user => user.userId === account.userId));
      assert.ok(saved.attendees.some(profile => profile.userId === account.userId));
    }
  );
  await t.test(
    'clients are saved as pending and receive no unauthenticated dashboard session',
    async () => {
      client = await call(
        '/auth/register',
        {
          name: 'New Client',
          email: 'new-client@example.com',
          password: 'Test@123',
          userRole: 'client',
          phoneNo: '9876543211',
          address: 'Example address',
          profile: { organizationType: 'Self', organizationName: '' },
        },
        null,
        201
      );
      assert.equal(client.status, 'pending');
      assert.equal(client.token, undefined);
      const snapshot = DataStore.getInstance();
      assert.ok(snapshot.clients.some(profile => profile.userId === client.userId));
      assert.equal(snapshot.findUserById(client.userId).profile.organizationType, 'Self');
      await call('/auth/login', { email: client.email, password: 'Test@123' }, null, 400);
    }
  );
  await t.test('approved clients can sign in and load their own workspace', async () => {
    const admin = await call('/auth/login', {
      email: 'superadmin@example.com',
      password: 'Admin@123',
    });
    await call(`/users/${client.userId}/status`, { status: 'active' }, admin.token, 200, 'PATCH');
    const account = await call('/auth/login', { email: client.email, password: 'Test@123' });
    assert.ok(account.token);
    const snapshot = await call('/workspace', null, account.token);
    assert.equal(snapshot.currentUser.userId, client.userId);
    assert.equal(snapshot.currentUser.userRole, 'client');
  });
});
