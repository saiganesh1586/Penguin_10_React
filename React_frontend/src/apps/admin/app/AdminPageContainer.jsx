import React from 'react';
import { AdminContext } from '../context/AdminContext.jsx';
import useAdminData from '../context/useAdminData.js';
import { LoadingState, ErrorState } from '../../../app/PageFeedback.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import EmployeeReportsPage from '../pages/EmployeeReportsPage.jsx';
import EventReportsPage from '../pages/EventReportsPage.jsx';
import RevenueReportsPage from '../pages/RevenueReportsPage.jsx';
import UserReportsPage from '../pages/UserReportsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
const pages = {
  dashboard: DashboardPage,
  'employee-reports': EmployeeReportsPage,
  'event-reports': EventReportsPage,
  'revenue-reports': RevenueReportsPage,
  'user-reports': UserReportsPage,
  profile: ProfilePage,
  settings: SettingsPage,
};
export const adminPageNames = Object.keys(pages);
export default function AdminPageContainer({ page, initialData }) {
  const { data, loading, error, retry } = useAdminData(page, initialData);
  const Page = pages[page];
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (loading || !data?.actions) return <LoadingState title="Loading…" />;
  return (
    <AdminContext.Provider value={data}>
      <Page {...data.pageProps} page={page} />
    </AdminContext.Provider>
  );
}
