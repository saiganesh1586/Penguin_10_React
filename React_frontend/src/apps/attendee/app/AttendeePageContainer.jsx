import React from 'react';
import useAttendeeData from '../context/useAttendeeData.js';
import DashboardPage from '../pages/DashboardPage.jsx';
import BrowseEventsPage from '../pages/BrowseEventsPage.jsx';
import MyTicketsPage from '../pages/MyTicketsPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';

const pages = {
  dashboard: DashboardPage,
  'browse-events': BrowseEventsPage,
  'my-tickets': MyTicketsPage,
  notifications: NotificationsPage,
  profile: ProfilePage,
  settings: SettingsPage,
};

const dataForPage = {
  dashboard: { events: true, registrations: true },
  'browse-events': { events: true, registrations: true },
  'my-tickets': { events: true, registrations: true },
  notifications: { notifications: true },
  profile: { events: true, registrations: true },
};

export const attendeeActions = {
  onNavigate: page => window.goNav(page),
  onRegister: eventId => window.regForEvent(String(eventId)),
  onViewEvent: (eventId, registrationId) =>
    window.openViewEventDrawer(
      String(eventId),
      registrationId == null ? null : String(registrationId)
    ),
  onViewTicket: id => window.openViewTicketModal(String(id)),
  onPay: id => window.completeDemoPayment(String(id)),
  onCancel: id => window.cancelTicket(String(id)),
  onMarkNotificationRead: id => window.markNotifRead(String(id)),
  onMarkAllRead: () => window.markAllRead(),
  onSaveSettings: values => window.saveSettings(values),
  onChangePassword: values => window.changePass(values),
  onSignOut: () => window.doLogout(),
};

function LoadedPage({ page, user }) {
  const data = useAttendeeData(dataForPage[page]);
  const Page = pages[page];
  return <Page {...data} user={user} onRetry={data.retry} {...attendeeActions} />;
}

export default function AttendeePageContainer({ page, user }) {
  if (page === 'settings') return <SettingsPage user={user} {...attendeeActions} />;
  return <LoadedPage page={page} user={user} />;
}
