import CustomerSupportPage from '../../customer-support/pages/CustomerSupportPage.jsx';
import { AttendeeContext } from '../context/AttendeeContext.jsx';
import usePortalData from '../../../store/hooks/usePortalData.js';
import { attendeeSlice } from '../../../store/slices/attendeeSlice.js';
import { attendeeActions } from '../api/attendeeActions.js';
import { ErrorState, LoadingState } from '../../../app/components/PageFeedback.jsx';
import AccountSettingsPage from '../../../app/components/AccountSettingsPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import BrowseEventsPage from '../pages/BrowseEventsPage.jsx';
import MyTicketsPage from '../pages/MyTicketsPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import PortalProvider from '../../../store/Provider.jsx';

const pages = {
  'customer-support': CustomerSupportPage,
  dashboard: DashboardPage,
  'browse-events': BrowseEventsPage,
  'my-tickets': MyTicketsPage,
  notifications: NotificationsPage,
  profile: ProfilePage,
  settings: AccountSettingsPage,
};
export const attendeePageNames = Object.keys(pages);

function AttendeePageContent({ page, pageProps }) {
  const { data, loading, error, retry } = usePortalData(
    attendeeSlice, page, pageProps, attendeeActions
  );
  const Page = pages[page];
  if (error && !data) return <ErrorState message={error} onRetry={retry} />;
  if (!data?.actions) return <LoadingState title="Loading…" />;
  return (
    <AttendeeContext.Provider value={data}>
      {error && (
        <div role="alert" className="card mb-16">
          {error} <button className="btn btn-ghost btn-sm" onClick={retry}>Try Again</button>
        </div>
      )}
      {page === 'settings' ? (
        <AccountSettingsPage
          user={data.CU || {}}
          roleLabel="Attendee"
          preferenceControls={data.preferenceControls}
          actions={data.actions}
        />
      ) : (
        <Page
          {...data}
          {...data.actions}
          user={data.CU || {}}
          loading={false}
          error=""
          onRetry={retry}
          page={page}
          {...pageProps}
        />
      )}
    </AttendeeContext.Provider>
  );
}

export default function AttendeePageContainer(props) {
  return (
    <PortalProvider>
      {props.page === 'customer-support' ? (
        <CustomerSupportPage onBack={() => window.goNav('settings')} />
      ) : (
        <AttendeePageContent {...props} />
      )}
    </PortalProvider>
  );
}
