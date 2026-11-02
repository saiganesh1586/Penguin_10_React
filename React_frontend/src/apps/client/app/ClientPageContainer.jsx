import React from 'react';
import { ClientContext } from '../context/ClientContext.jsx';
import useClientData from '../context/useClientData.js';
import { LoadingState, ErrorState } from '../../../app/PageFeedback.jsx';
import CompletedEventsPage from '../pages/CompletedEventsPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import FindOrganizersPage from '../pages/FindOrganizersPage.jsx';
import MyEventsPage from '../pages/MyEventsPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import OngoingEventsPage from '../pages/OngoingEventsPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import RequestDetailsPage from '../pages/RequestDetailsPage.jsx';
import RequestStatusPage from '../pages/RequestStatusPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import UpcomingEventsPage from '../pages/UpcomingEventsPage.jsx';
const pages = {
  'completed-events': CompletedEventsPage,
  dashboard: DashboardPage,
  'find-organizers': FindOrganizersPage,
  'my-events': MyEventsPage,
  notifications: NotificationsPage,
  'ongoing-events': OngoingEventsPage,
  profile: ProfilePage,
  'request-details': RequestDetailsPage,
  'request-status': RequestStatusPage,
  settings: SettingsPage,
  'upcoming-events': UpcomingEventsPage,
};
export const clientPageNames = Object.keys(pages);
export default function ClientPageContainer({ page, initialData }) {
  const { data, loading, error, retry } = useClientData(page, initialData);
  const Page = pages[page];
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (loading || !data?.actions) return <LoadingState title="Loading…" />;
  return (
    <ClientContext.Provider value={data}>
      <Page {...data.pageProps} page={page} />
    </ClientContext.Provider>
  );
}
