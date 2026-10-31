const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const portalSource = require('./portal-source.cjs');

const actors = ['admin', 'attendee', 'client', 'organizer', 'support-executive', 'finance-executive'];
for (const actor of actors) {
  test(`${actor} runtime assembles without missing sections`, () => {
    const source = portalSource(actor);
    assert.doesNotMatch(source, /PORTAL_SECTION_|PORTAL_RUNTIME_START|ATTENDEE_PAGE_|ATTENDEE_RUNTIME_START/);
    new vm.Script(source);
  });
}

test('extracted actor page components compile', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    for (const actor of actors.filter(actor => actor !== 'attendee')) {
      const app = fs.readFileSync(path.join(__dirname, '../src/apps', actor, 'app/App.jsx'), 'utf8');
      for (const [, page] of app.matchAll(/import raw([A-Za-z]+) from '\.\.\/pages\/[A-Za-z]+\.jsx\?raw';/g)) {
        const component = await server.ssrLoadModule(`/src/apps/${actor}/pages/${page}.jsx`);
        assert.equal(typeof component.default, 'function', `${actor}/${page}`);
      }
    }
  } finally { await server.close(); }
});
