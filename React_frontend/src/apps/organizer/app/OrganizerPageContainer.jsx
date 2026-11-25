import CustomerSupportPage from '../../customer-support/pages/CustomerSupportPage.jsx';
import { OrganizerContext } from '../context/OrganizerContext.jsx';
import usePortalData from '../../../app/usePortalData.js';
import { organizerSlice } from '../store/organizerSlice.js';
import { organizerActions } from '../api/organizer-api.js';
import { LoadingState, ErrorState } from '../../../app/PageFeedback.jsx';
import AttendeesPage from '../pages/AttendeesPage.jsx';
import CompletedEventsPage from '../pages/CompletedEventsPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import EventRequestsPage from '../pages/EventRequestsPage.jsx';
import MyEventsPage from '../pages/MyEventsPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import OngoingEventsPage from '../pages/OngoingEventsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import RequestDetailsPage from '../pages/RequestDetailsPage.jsx';
import AccountSettingsPage from '../../../app/AccountSettingsPage.jsx';
import UpcomingEventsPage from '../pages/UpcomingEventsPage.jsx';
import EventsPage from '../pages/EventsPage.jsx';
import PortalProvider from '../../../app/state/PortalProvider.jsx';
const pages = {
  'customer-support': CustomerSupportPage,
  attendees: AttendeesPage,
  'completed-events': CompletedEventsPage,
  dashboard: DashboardPage,
  'event-requests': EventRequestsPage,
  'my-events': MyEventsPage,
  notifications: NotificationsPage,
  'ongoing-events': OngoingEventsPage,
  profile: ProfilePage,
  reports: ReportsPage,
  'request-details': RequestDetailsPage,
  settings: AccountSettingsPage,
  'upcoming-events': UpcomingEventsPage,
  events: EventsPage,
};
export const organizerPageNames = Object.keys(pages);
function OrganizerPageContent({ page, pageProps }) {
  const { data, loading, error, retry } = usePortalData(
    organizerSlice,
    page,
    pageProps,
    organizerActions,
    window.EventFlowOrganizerRuntime
  );
  const Page = pages[page];
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (loading || !data?.actions) return <LoadingState title="Loading…" />;
  return (
    <OrganizerContext.Provider value={data}>
      {page === 'settings' ? (
        <AccountSettingsPage
          user={data.CU}
          roleLabel={data.ROLE_LABELS[data.CU.role]}
          preferenceControls={data.preferenceControls}
          actions={data.actions}
        />
      ) : (
        <Page {...data.pageProps} page={page} />
      )}
    </OrganizerContext.Provider>
  );
}

export default function OrganizerPageContainer(props) {
  return (
    <PortalProvider>
      {props.page === 'customer-support' ? (
        <CustomerSupportPage onBack={() => window.goNav('settings')} />
      ) : (
        <OrganizerPageContent {...props} />
      )}
    </PortalProvider>
  );
}
