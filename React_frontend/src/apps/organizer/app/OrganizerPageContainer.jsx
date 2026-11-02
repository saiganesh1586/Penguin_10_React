import React from 'react';
import { OrganizerContext } from '../context/OrganizerContext.jsx';
import useOrganizerData from '../context/useOrganizerData.js';
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
import SettingsPage from '../pages/SettingsPage.jsx';
import UpcomingEventsPage from '../pages/UpcomingEventsPage.jsx';
import EventsPage from '../pages/EventsPage.jsx';
const pages = {
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
  settings: SettingsPage,
  'upcoming-events': UpcomingEventsPage,
  events: EventsPage,
};
export const organizerPageNames = Object.keys(pages);
export default function OrganizerPageContainer({ page, initialData }) {
  const { data, loading, error, retry } = useOrganizerData(page, initialData);
  const Page = pages[page];
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (loading || !data?.actions) return <LoadingState title="Loading…" />;
  return (
    <OrganizerContext.Provider value={data}>
      <Page {...data.pageProps} page={page} />
    </OrganizerContext.Provider>
  );
}
