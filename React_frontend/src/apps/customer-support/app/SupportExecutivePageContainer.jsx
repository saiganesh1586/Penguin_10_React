import SupportIssuesPage from '../pages/SupportIssuesPage.jsx';
import React from 'react';
import { SupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
import useSupportExecutiveData from '../context/useSupportExecutiveData.js';
import { LoadingState, ErrorState } from '../../../app/PageFeedback.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import ReportsAnalyticsPage from '../pages/ReportsAnalyticsPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import UserEventManagementPage from '../pages/UserEventManagementPage.jsx';
import FinancePage from '../pages/FinancePage.jsx';
import FinanceReportsPage from '../pages/FinanceReportsPage.jsx';
const pages = {
  'customer-requests': SupportIssuesPage,
  'support-issues': SupportIssuesPage,
  dashboard: DashboardPage,
  notifications: NotificationsPage,
  profile: ProfilePage,
  'reports-analytics': ReportsAnalyticsPage,
  settings: SettingsPage,
  'user-event-management': UserEventManagementPage,
  finance: FinancePage,
  'finance-reports': FinanceReportsPage,
};
export const supportExecutivePageNames = Object.keys(pages);
export default function SupportExecutivePageContainer({ page, initialData }) {
  const { data, loading, error, retry } = useSupportExecutiveData(page, initialData);
  const Page = pages[page];
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (loading || !data?.actions) return <LoadingState title="Loading…" />;
  return (
    <SupportExecutiveContext.Provider value={data}>
      <Page {...data.pageProps} page={page} />
    </SupportExecutiveContext.Provider>
  );
}
