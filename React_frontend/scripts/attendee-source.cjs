const fs = require('node:fs');
const path = require('node:path');

module.exports = function attendeeSource() {
  const root = path.join(__dirname, '../src/apps/attendee');
  const sections = {
    api: 'api/attendee-api.js', state: 'context/attendee-state.js',
    dashboard: 'pages/DashboardPage.jsx', eventDetails: 'pages/EventDetailsPage.jsx',
    browseEvents: 'pages/BrowseEventsPage.jsx', registration: 'components/RegistrationFlow.jsx',
    myTickets: 'pages/MyTicketsPage.jsx', notifications: 'pages/NotificationsPage.jsx',
    profile: 'pages/ProfilePage.jsx', settings: 'pages/SettingsPage.jsx',
  };
  let source = fs.readFileSync(path.join(root, 'app/runtime.js'), 'utf8');
  for (const [name, file] of Object.entries(sections)) {
    const marker = `/* ATTENDEE_PAGE_${name} */\n`;
    if (!source.includes(marker)) throw Error(`Missing Attendee section ${name}`);
    const raw = fs.readFileSync(path.join(root, file), 'utf8');
    const start = '/* ATTENDEE_RUNTIME_START */';
    const end = '/* ATTENDEE_RUNTIME_END */';
    const page = raw.includes(start) ? raw.slice(raw.indexOf(start) + start.length, raw.indexOf(end)) : raw;
    source = source.replace(marker, page);
  }
  return source;
};
