import SupportIssuesPage from '../pages/SupportIssuesPage.jsx';
import { SupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
import usePortalData from '../../../app/usePortalData.js';
import { supportExecutiveSlice } from '../store/supportExecutiveSlice.js';
import { supportExecutiveActions } from '../api/support-executive-api.js';
import { LoadingState, ErrorState } from '../../../app/PageFeedback.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import ReportsAnalyticsPage from '../pages/ReportsAnalyticsPage.jsx';
import AccountSettingsPage from '../../../app/AccountSettingsPage.jsx';
import UserEventManagementPage from '../pages/UserEventManagementPage.jsx';
import FinancePage from '../pages/FinancePage.jsx';
import FinanceReportsPage from '../pages/FinanceReportsPage.jsx';
import PortalProvider from '../../../app/state/PortalProvider.jsx';
const pages = {
  'customer-requests': SupportIssuesPage,
  'support-issues': SupportIssuesPage,
  dashboard: DashboardPage,
  notifications: NotificationsPage,
  profile: ProfilePage,
  'reports-analytics': ReportsAnalyticsPage,
  settings: AccountSettingsPage,
  'user-event-management': UserEventManagementPage,
  finance: FinancePage,
  'finance-reports': FinanceReportsPage,
};
export const supportExecutivePageNames = Object.keys(pages);
function SupportExecutivePageContent({ page, pageProps }) {
  const { data, loading, error, retry } = usePortalData(
    supportExecutiveSlice,
    page,
    pageProps,
    supportExecutiveActions,
    window.EventFlowSupportExecutiveRuntime
  );
  const Page = pages[page];
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (loading || !data?.actions) return <LoadingState title="Loading…" />;
  return (
    <SupportExecutiveContext.Provider value={data}>
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
    </SupportExecutiveContext.Provider>
  );
}

export default function SupportExecutivePageContainer(props) {
  return (
    <PortalProvider>
      <SupportExecutivePageContent {...props} />
    </PortalProvider>
  );
}
