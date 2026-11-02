const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const portalSource = require('./portal-source.cjs');

const actors = [
  'admin',
  'attendee',
  'client',
  'organizer',
  'support-executive',
  'finance-executive',
];
for (const actor of actors) {
  test(`${actor} runtime assembles without missing sections`, () => {
    const source = portalSource(actor);
    assert.doesNotMatch(
      source,
      /PORTAL_SECTION_|PORTAL_RUNTIME_START|ATTENDEE_PAGE_|ATTENDEE_RUNTIME_START/
    );
    new vm.Script(source);
  });
}

test('attendee runtime assembles with both Windows and Unix line endings', t => {
  const readFile = fs.readFileSync.bind(fs);
  let lineEnding = '\n';
  t.mock.method(fs, 'readFileSync', (file, options) => {
    const contents = readFile(file, options);
    const isAttendeeRuntime = /[\\/]attendee[\\/]app[\\/]runtime\.js$/.test(String(file));
    return isAttendeeRuntime && typeof contents === 'string'
      ? contents.replace(/\r\n|\r|\n/g, lineEnding)
      : contents;
  });
  for (const ending of ['\n', '\r\n']) {
    lineEnding = ending;
    const source = portalSource('attendee');
    assert.doesNotMatch(source, /ATTENDEE_PAGE_/);
    new vm.Script(source);
  }
});

test('extracted actor page components compile', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  });
  try {
    for (const actor of actors.filter(actor => actor !== 'attendee')) {
      const pagesDirectory = path.join(__dirname, '../src/apps', actor, 'pages');
      for (const page of fs.readdirSync(pagesDirectory).filter(file => file.endsWith('.jsx'))) {
        const component = await server.ssrLoadModule(`/src/apps/${actor}/pages/${page}`);
        assert.equal(typeof component.default, 'function', `${actor}/${page}`);
      }
    }
  } finally {
    await server.close();
  }
});
