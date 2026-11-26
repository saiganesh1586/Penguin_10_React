import CustomerSupportPage from '../../customer-support/pages/CustomerSupportPage.jsx';
import { ClientContext } from '../context/ClientContext.jsx';
import usePortalData from '../../../store/hooks/usePortalData.js';
import { clientSlice } from '../../../store/slices/clientSlice.js';
import { clientActions } from '../api/client-api.js';
import { LoadingState, ErrorState } from '../../../app/components/PageFeedback.jsx';
import CompletedEventsPage from '../pages/CompletedEventsPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import FindOrganizersPage from '../pages/FindOrganizersPage.jsx';
import MyEventsPage from '../pages/MyEventsPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import OngoingEventsPage from '../pages/OngoingEventsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import RequestDetailsPage from '../pages/RequestDetailsPage.jsx';
import RequestStatusPage from '../pages/RequestStatusPage.jsx';
import AccountSettingsPage from '../../../app/components/AccountSettingsPage.jsx';
import UpcomingEventsPage from '../pages/UpcomingEventsPage.jsx';
import PortalProvider from '../../../store/Provider.jsx';
const pages = {
  'customer-support': CustomerSupportPage,
  'completed-events': CompletedEventsPage,
  dashboard: DashboardPage,
  'find-organizers': FindOrganizersPage,
  'my-events': MyEventsPage,
  notifications: NotificationsPage,
  'ongoing-events': OngoingEventsPage,
  profile: ProfilePage,
  'request-details': RequestDetailsPage,
  'request-status': RequestStatusPage,
  settings: AccountSettingsPage,
  'upcoming-events': UpcomingEventsPage,
};
export const clientPageNames = Object.keys(pages);
function ClientPageContent({ page, pageProps }) {
  const { data, loading, error, retry } = usePortalData(
    clientSlice,
    page,
    pageProps,
    clientActions,
    window.EventFlowClientRuntime
  );
  const Page = pages[page];
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (loading || !data?.actions) return <LoadingState title="Loading…" />;
  return (
    <ClientContext.Provider value={data}>
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
    </ClientContext.Provider>
  );
}

export default function ClientPageContainer(props) {
  return (
    <PortalProvider>
      {props.page === 'customer-support' ? (
        <CustomerSupportPage onBack={() => window.goNav('settings')} />
      ) : (
        <ClientPageContent {...props} />
      )}
    </PortalProvider>
  );
}
