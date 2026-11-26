import { AdminContext } from '../context/AdminContext.jsx';
import usePortalData from '../../../store/hooks/usePortalData.js';
import { adminSlice } from '../../../store/slices/adminSlice.js';
import { adminActions } from '../api/admin-api.js';
import { LoadingState, ErrorState } from '../../../app/components/PageFeedback.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import EmployeeReportsPage from '../pages/EmployeeReportsPage.jsx';
import EventReportsPage from '../pages/EventReportsPage.jsx';
import RevenueReportsPage from '../pages/RevenueReportsPage.jsx';
import UserReportsPage from '../pages/UserReportsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import AccountSettingsPage from '../../../app/components/AccountSettingsPage.jsx';
import PortalProvider from '../../../store/Provider.jsx';
const pages = {
  dashboard: DashboardPage,
  'employee-reports': EmployeeReportsPage,
  'event-reports': EventReportsPage,
  'revenue-reports': RevenueReportsPage,
  'user-reports': UserReportsPage,
  profile: ProfilePage,
  settings: AccountSettingsPage,
};
export const adminPageNames = Object.keys(pages);
function AdminPageContent({ page, pageProps }) {
  const { data, loading, error, retry } = usePortalData(
    adminSlice,
    page,
    pageProps,
    adminActions,
    window.EventFlowAdminRuntime
  );
  const Page = pages[page];
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (loading || !data?.actions) return <LoadingState title="Loading…" />;
  return (
    <AdminContext.Provider value={data}>
      {page === 'settings' ? (
        <AccountSettingsPage
          user={data.CU}
          roleLabel={data.ROLE_LABELS[data.CU.role]}
          actions={data.actions}
          admin
        />
      ) : (
        <Page {...data.pageProps} page={page} />
      )}
    </AdminContext.Provider>
  );
}

export default function AdminPageContainer(props) {
  return (
    <PortalProvider>
      <AdminPageContent {...props} />
    </PortalProvider>
  );
}
