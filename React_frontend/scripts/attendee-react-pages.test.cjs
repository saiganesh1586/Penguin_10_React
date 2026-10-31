const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const source = require('./attendee-source.cjs')();

test('separated Attendee source remains executable and JSX pages preserve their markup and handlers', async () => {
  assert.doesNotMatch(source, /ATTENDEE_PAGE_|ATTENDEE_RUNTIME_START/);
  new vm.Script(source);
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    for (const name of ['DashboardPage', 'BrowseEventsPage', 'MyTicketsPage', 'NotificationsPage', 'ProfilePage', 'SettingsPage']) {
      const { default: Page } = await server.ssrLoadModule(`/src/apps/attendee/pages/${name}.jsx`);
      const html = renderToStaticMarkup(React.createElement(Page, { html: `<button onclick="attendeePageClick()">${name}</button>` }));
      assert.match(html, new RegExp(`<button onclick="attendeePageClick\\(\\)">${name}</button>`));
    }
  } finally {
    await server.close();
  }
});
