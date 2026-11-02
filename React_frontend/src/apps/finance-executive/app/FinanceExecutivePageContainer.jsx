import React from 'react';
import { FinanceExecutiveContext } from '../context/FinanceExecutiveContext.jsx';
import useFinanceExecutiveData from '../context/useFinanceExecutiveData.js';
import { ErrorState } from '../../../app/PageFeedback.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import CommissionsPage from '../pages/CommissionsPage.jsx';
import FinancePage from '../pages/FinancePage.jsx';
import ReconciliationPage from '../pages/ReconciliationPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
const pages = {
  notifications: NotificationsPage,
  profile: ProfilePage,
  settings: SettingsPage,
  dashboard: DashboardPage,
  commissions: CommissionsPage,
  transactions: FinancePage,
  refunds: FinancePage,
  reconciliation: ReconciliationPage,
  reports: ReportsPage,
};
export const financeExecutivePageNames = Object.keys(pages);
export default function FinanceExecutivePageContainer({ page, initialData }) {
  const { data, loading, error, retry } = useFinanceExecutiveData(page, initialData);
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
      <Page {...data.pageProps} page={page} />
    </FinanceExecutiveContext.Provider>
  );
}
