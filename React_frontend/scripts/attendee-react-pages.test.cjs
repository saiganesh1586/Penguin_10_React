const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const source = require('./attendee-source.cjs')();

test('Attendee runtime remains executable and all pages render JSX without HTML wrappers', async () => {
  assert.doesNotMatch(source, /ATTENDEE_PAGE_|ATTENDEE_RUNTIME_START/);
  new vm.Script(source);
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const event = { id: 'e1', title: 'Sample Event', date: '2099-01-01', time: '09:00', venue: 'Hall', category: 'Workshop', price: 0, capacity: 20, registered: 1, status: 'upcoming', visibility: 'public' };
    const registration = { id: 'r1', registrationId: 'r1', eventId: 'e1', status: 'confirmed', ticketId: 'T-1', amount: 0 };
    const props = { events: [event], registrations: [registration], user: { name: 'Attendee', email: 'attendee@example.test' }, notifications: [{ id: 'n1', title: 'Update', msg: 'Message', time: 'Now', read: false }] };
    const titles = { DashboardPage: 'My Dashboard', BrowseEventsPage: 'Browse Events', MyTicketsPage: 'My Tickets', NotificationsPage: 'Notifications', ProfilePage: 'My Profile', SettingsPage: 'Account Settings' };
    for (const name of Object.keys(titles)) {
      const { default: Page } = await server.ssrLoadModule(`/src/apps/attendee/pages/${name}.jsx`);
      const html = renderToStaticMarkup(React.createElement(Page, props));
      assert.ok(html.includes(titles[name]), `${name} should render its page heading`);
      assert.doesNotMatch(html, /onclick=|oninput=|ATTENDEE_RUNTIME_START/);
    }
    const { default: EventDetailsPage } = await server.ssrLoadModule('/src/apps/attendee/pages/EventDetailsPage.jsx');
    assert.match(renderToStaticMarkup(React.createElement(EventDetailsPage, { event, registrationCount: 1 })), /Sample Event|Category/);
  } finally {
    await server.close();
  }
});
