import { FinanceExecutiveContext } from '../context/FinanceExecutiveContext.jsx';
import usePortalData from '../../../store/hooks/usePortalData.js';
import { financeExecutiveSlice } from '../../../store/slices/financeExecutiveSlice.js';
import { financeExecutiveActions } from '../api/finance-executive-api.js';
import { ErrorState } from '../../../app/components/PageFeedback.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import AccountSettingsPage from '../../../app/components/AccountSettingsPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import CommissionsPage from '../pages/CommissionsPage.jsx';
import FinancePage from '../pages/FinancePage.jsx';
import ReconciliationPage from '../pages/ReconciliationPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import PortalProvider from '../../../store/Provider.jsx';
const pages = {
  notifications: NotificationsPage,
  profile: ProfilePage,
  settings: AccountSettingsPage,
  dashboard: DashboardPage,
  commissions: CommissionsPage,
  transactions: FinancePage,
  refunds: FinancePage,
  reconciliation: ReconciliationPage,
  reports: ReportsPage,
};
export const financeExecutivePageNames = Object.keys(pages);
function FinanceExecutivePageContent({ page, pageProps }) {
  const { data, loading, error, retry } = usePortalData(
    financeExecutiveSlice,
    page,
    pageProps,
    financeExecutiveActions,
    window.EventFlowFinanceExecutiveRuntime
  );
  const Page = pages[page];
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (loading || !data?.actions)
    return (
      <div className="finance-loading">
        {[1, 2, 3].map(row => (
          <div className="finance-skeleton" key={row} />
        ))}
      </div>
    );
  return (
    <FinanceExecutiveContext.Provider value={data}>
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
    </FinanceExecutiveContext.Provider>
  );
}

export default function FinanceExecutivePageContainer(props) {
  return (
    <PortalProvider>
      <FinanceExecutivePageContent {...props} />
    </PortalProvider>
  );
}
