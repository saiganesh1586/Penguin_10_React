import { ErrorState, LoadingState } from '../../../app/PageFeedback.jsx';
import CustomerSupportPage from '../../customer-support/pages/CustomerSupportPage.jsx';
import usePortalData from '../../../app/usePortalData.js';
import { attendeeSlice } from '../store/attendeeSlice.js';
import DashboardPage from '../pages/DashboardPage.jsx';
import BrowseEventsPage from '../pages/BrowseEventsPage.jsx';
import MyTicketsPage from '../pages/MyTicketsPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import PortalProvider from '../../../app/state/PortalProvider.jsx';

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

function LoadedPage({ page }) {
  const { data, loading, error, retry } = usePortalData(attendeeSlice, page, dataForPage[page]);
  const Page = pages[page];
  const waiting = loading || (!error && !data);
  if (page === 'settings') {
    if (error) return <ErrorState message={error} onRetry={retry} />;
    if (waiting) return <LoadingState title="Loading settings…" />;
  }
  return (
    <Page
      {...data}
      user={data?.CU ?? undefined}
      loading={waiting}
      error={error}
      onRetry={retry}
      {...attendeeActions}
    />
  );
}

export default function AttendeePageContainer({ page }) {
  return (
    <PortalProvider>
      {page === 'customer-support' ? (
        <CustomerSupportPage onBack={() => window.goNav('settings')} />
      ) : (
        <LoadedPage page={page} />
      )}
    </PortalProvider>
  );
}
