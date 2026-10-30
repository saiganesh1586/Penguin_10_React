const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
require('ts-node').register({ project: path.join(__dirname, '../tsconfig.json'), transpileOnly: true });

test('Organizer counteroffer review and acceptance workflow with edge cases', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-counteroffer-test-'));
  const previousCwd = process.cwd();
  const previousDataFile = process.env.EVENTFLOW_DATA_FILE;
  const dataFile = path.join(directory, 'store.json');
  process.chdir(directory);
  process.env.EVENTFLOW_DATA_FILE = dataFile;

  const { DataStore } = require('../src/common/data-store');
  DataStore.instance = undefined;
  const db = DataStore.getInstance();
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../src/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  t.after(async () => {
    await app.close();
    DataStore.instance = undefined;
    process.chdir(previousCwd);
    if (previousDataFile === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previousDataFile;
    fs.rmSync(directory, { recursive: true, force: true });
  });

  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;

  async function call(token, method, url, body, expected = 200) {
    const response = await fetch(base + url, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { result = text; }
    assert.equal(response.status, expected, `${method} ${url}: ${text}`);
    return result;
  }

  async function login(email, password) {
    return (await call(null, 'POST', '/auth/login', { email, password })).data.token;
  }

  const organizer = await login('organizer@example.com', 'Organizer@123');
  const orgUser = db.users.find(u => u.email === 'organizer@example.com');
  db.users.push({ ...orgUser, userId: 'usr-other-org', email: 'other-organizer@example.com', password: 'Organizer@123' });
  db.organizers.push({ ...db.organizers.find(o => o.userId === orgUser.userId), organizerId: 'other-org', userId: 'usr-other-org' });
  const otherOrganizer = await login('other-organizer@example.com', 'Organizer@123');
  const client = await login('client@example.com', 'Client@123');

  const policy = (await call(client, 'GET', '/event-requests/policies')).data;
  const policyAck = { policyAccepted: true, acceptedPolicyVersion: policy.version };
  const future = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  let sequence = 0;
  async function createRequest(overrides = {}) {
    return (await call(client, 'POST', '/event-requests', {
      clientId: 'usr-client-001', organizerId: 'usr-org-001', eventName: `Counteroffer test event ${++sequence}`,
      eventDate: future(400 + sequence), eventType: 'Conference', venue: 'City Hall', budget: 50000,
      capacity: 80, requirements: 'A conference with catering and sound equipment.', ...policyAck, ...overrides,
    }, 201)).data;
  }

  await t.test('Seed request req-orgdash-action-005 loads counteroffer and can be accepted with agreed proposal', async () => {
    const record = await call(organizer, 'GET', '/event-requests/req-orgdash-action-005');
    assert.equal(record.status, 'counteroffer_received');
    assert(Array.isArray(record.negotiations) && record.negotiations.length > 0);
    const co = [...record.negotiations].reverse().find(n => n.action === 'counteroffer');
    assert.ok(co, 'Counteroffer must exist');
    assert.equal(co.budget, 135000);
    assert.equal(co.depositRequired, 40500);
    assert.equal(co.remainingBalance, 94500);

    // Other organizer receives 403 Forbidden
    await call(otherOrganizer, 'POST', '/event-requests/req-orgdash-action-005/accept-counteroffer', policyAck, 403);

    // Assigned organizer accepts counteroffer
    const res = await call(organizer, 'POST', '/event-requests/req-orgdash-action-005/accept-counteroffer', policyAck, 201);
    assert.equal(res.message, 'Counteroffer accepted. Both parties have agreed to the revised proposal.');
    assert.equal(res.data.status, 'planning');
    assert.equal(res.data.negotiationStatus, 'mutually_accepted');
    assert.equal(res.data.agreementStatus, 'pending_signature');
    assert.equal(res.data.paymentStatus, 'deposit_pending');
    assert.equal(res.data.budget, 135000);

    // Proposals history preserved
    assert.ok(res.data.proposals.length >= 2);
    const agreedProposal = res.data.proposals[res.data.proposals.length - 1];
    assert.equal(agreedProposal.status, 'accepted');
    assert.equal(agreedProposal.amount, 135000);
    assert.equal(agreedProposal.depositRequired, 40500);

    // Accepting again throws 400
    await call(organizer, 'POST', '/event-requests/req-orgdash-action-005/accept-counteroffer', policyAck, 400);
  });

  await t.test('Full client counteroffer -> organizer acceptance with rich details and payment step', async () => {
    // 1. Client creates request
    const created = await createRequest({ budget: 80000, capacity: 120 });

    // 2. Organizer proposes budget/date revision
    await call(organizer, 'POST', `/event-requests/${created.requestId}/reject`, {
      ...policyAck,
      reasonType: 'both',
      reason: 'The venue and catering need a larger budget and different date.',
      proposedBudget: 90000,
      proposedDate: future(450),
    }, 201);

    let reqRecord = await call(client, 'GET', `/event-requests/${created.requestId}`);
    assert.equal(reqRecord.status, 'changes_requested');

    // 3. Client submits counteroffer with rich details
    await call(client, 'POST', `/event-requests/${created.requestId}/client-response`, {
      decision: 'counteroffer',
      counterofferBudget: 85000,
      counterofferDeposit: 25500,
      counterofferServices: 'Event management, premium AV setup, vegetarian catering',
      counterofferDeliverables: 'Stage layout, lighting design, catering service',
      counterofferTimeline: '09:00 Setup; 11:30 Event; 17:30 Teardown',
      counterofferPaymentTerms: '30% Advance Deposit on Agreement, 70% Final Balance',
      counterofferCancellationTerms: 'Standard 14+ day cancellation policy',
      counterofferValidUntil: future(470),
      notes: 'We can commit to ₹85,000 with 30% advance deposit.',
    }, 201);

    reqRecord = await call(organizer, 'GET', `/event-requests/${created.requestId}`);
    assert.equal(reqRecord.status, 'counteroffer_received');
    const latestCo = [...reqRecord.negotiations].reverse().find(n => n.action === 'counteroffer');
    assert.equal(latestCo.budget, 85000);
    assert.equal(latestCo.depositRequired, 25500);
    assert.equal(latestCo.remainingBalance, 59500);
    assert.equal(latestCo.services, 'Event management, premium AV setup, vegetarian catering');

    // 4. Organizer accepts client counteroffer
    const acceptRes = await call(organizer, 'POST', `/event-requests/${created.requestId}/accept-counteroffer`, policyAck, 201);
    assert.equal(acceptRes.message, 'Counteroffer accepted. Both parties have agreed to the revised proposal.');
    assert.equal(acceptRes.data.status, 'planning');
    assert.equal(acceptRes.data.negotiationStatus, 'mutually_accepted');
    assert.equal(acceptRes.data.agreementStatus, 'pending_signature');
    assert.equal(acceptRes.data.paymentStatus, 'deposit_pending');
    assert.equal(acceptRes.data.budget, 85000);

    const agreedProposal = acceptRes.data.proposals[acceptRes.data.proposals.length - 1];
    assert.equal(agreedProposal.status, 'accepted');
    assert.equal(agreedProposal.amount, 85000);
    assert.equal(agreedProposal.depositRequired, 25500);

    // 5. Client acknowledges agreement terms per agreed counteroffer
    const agreeRes = await call(client, 'POST', `/event-requests/${created.requestId}/agreement`, {
      agreementStatus: 'agreed',
    }, 201);
    assert.equal(agreeRes.data.agreementStatus, 'agreed');

    // 6. Client proceeds with deposit payment
    const depositRes = await call(client, 'POST', `/event-requests/${created.requestId}/pay-deposit`, {
      paymentMethod: 'card',
    }, 201);
    assert.equal(depositRes.data.paymentStatus, 'deposit_paid');
    assert.equal(depositRes.data.bookingStatus, 'confirmed');

    const updatedAfterPayment = await call(client, 'GET', `/event-requests/${created.requestId}`);
    assert.equal(updatedAfterPayment.paymentStatus, 'deposit_paid');
    assert.equal(updatedAfterPayment.status, 'confirmed');
    assert.ok(updatedAfterPayment.eventId);
  });

  await t.test('Expired counteroffer rejection', async () => {
    const expiredReq = {
      requestId: 'req-expired-test-001',
      clientId: 'usr-client-001',
      organizerId: 'usr-org-001',
      eventName: 'Past Expired Conference',
      eventType: 'conference',
      eventDate: '2026-12-15',
      capacity: 50,
      budget: 40000,
      status: 'counteroffer_received',
      negotiations: [{
        id: 'neg-expired-001',
        action: 'counteroffer',
        performedBy: 'usr-client-001',
        role: 'client',
        version: 1,
        budget: 35000,
        validUntil: '2021-01-01',
        timestamp: new Date('2021-01-01'),
      }],
      proposals: [{
        version: 1,
        amount: 40000,
        depositRequired: 12000,
        status: 'revision_requested',
        sentAt: new Date('2020-12-01'),
      }],
      createdAt: new Date('2021-01-01'),
      updatedAt: new Date('2021-01-01'),
    };
    db.eventRequests.push(expiredReq);

    await call(organizer, 'POST', `/event-requests/${expiredReq.requestId}/accept-counteroffer`, policyAck, 400);
  });
});
