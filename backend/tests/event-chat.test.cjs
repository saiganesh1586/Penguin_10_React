const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  transpileOnly: true,
});

test('event chat persists messages and restricts each conversation to its participants', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eventflow-chat-test-'));
  const previousCwd = process.cwd();
  const previousFile = process.env.EVENTFLOW_DATA_FILE;
  process.chdir(directory);
  process.env.EVENTFLOW_DATA_FILE = path.join(directory, 'store.json');
  const { DataStore } = require('../src/common/data-store');
  const { AppModule } = require('../src/app.module');
  const { ValidationPipe } = require('@nestjs/common');
  const { NestFactory } = require('@nestjs/core');
  DataStore.instance = undefined;
  let app;
  t.after(async () => {
    await app?.close();
    DataStore.instance = undefined;
    process.chdir(previousCwd);
    if (previousFile === undefined) delete process.env.EVENTFLOW_DATA_FILE;
    else process.env.EVENTFLOW_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('eventflow-chat-test-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const db = DataStore.getInstance();
  const client = db.clients.find(item => item.userId === 'usr-client-001');
  const organizer = db.organizers.find(item => item.userId === 'usr-org-001');
  const booking = {
    ...db.events[0],
    clientId: client.clientId,
    organizerId: organizer.organizerId,
  };
  db.events.push({ ...booking, eventId: 'chat-booking' }, { ...booking, eventId: 'chat-other' });
  app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;

  async function login(email, password) {
    const response = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(response.status, 200);
    return (await response.json()).data.token;
  }

  const clientToken = await login('client@example.com', 'Client@123');
  const organizerToken = await login('organizer@example.com', 'Organizer@123');
  const attendeeToken = await login('attendee@example.com', 'Attendee@123');
  function chat(token, message, eventId = 'chat-booking') {
    return fetch(`${base}/events/${eventId}/chat`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(message && { 'Content-Type': 'application/json' }),
      },
      ...(message && { method: 'POST', body: JSON.stringify(message) }),
    });
  }

  const first = { id: randomUUID(), text: '  Can we move the rehearsal?  ' };
  const reply = { id: randomUUID(), text: 'Yes, 5 pm works.' };
  assert.equal((await chat(null)).status, 401);
  assert.equal((await chat(attendeeToken)).status, 403);
  assert.equal((await chat(attendeeToken, first)).status, 403);
  assert.equal((await chat(clientToken, { ...first, text: '   ' })).status, 400);
  assert.equal((await chat(clientToken, { ...first, text: 123 })).status, 400);
  assert.equal((await chat(clientToken, first)).status, 204);
  assert.equal((await chat(clientToken, first)).status, 204);
  assert.equal((await chat(organizerToken, reply)).status, 204);

  const organizerChat = await (await chat(organizerToken)).json();
  const clientChat = await (await chat(clientToken)).json();
  assert.deepEqual(
    organizerChat.messages.map(item => [item.text, item.isOwn]),
    [
      [first.text.trim(), false],
      [reply.text, true],
    ]
  );
  assert.deepEqual(
    clientChat.messages.map(item => item.isOwn),
    [true, false]
  );
  assert.equal(clientChat.participantName, db.findUserById(organizer.userId).name);
  assert.deepEqual((await (await chat(clientToken, undefined, 'chat-other')).json()).messages, []);

  const messageUrl = `${base}/events/chat-booking/chat/${clientChat.messages[0].id}`;
  const edit = (token, text) =>
    fetch(messageUrl, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  const remove = token =>
    fetch(messageUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await edit(organizerToken, 'Not my message')).status, 404);
  assert.equal((await remove(organizerToken)).status, 404);
  assert.equal((await edit(clientToken, '  ')).status, 400);
  assert.equal((await edit(clientToken, '  Can we meet at six?  ')).status, 204);
  assert.equal((await (await chat(organizerToken)).json()).messages[0].text, 'Can we meet at six?');
  assert.equal((await remove(clientToken)).status, 204);
  assert.deepEqual((await (await chat(organizerToken)).json()).messages.map(item => item.text), [
    reply.text,
  ]);
  assert.deepEqual(new DataStore().eventChatMessages, db.eventChatMessages);
});
