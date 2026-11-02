import { useClientContext } from '../context/ClientContext.jsx';
import { EventCard } from '../components/EventCards.jsx';
import { compareNewestFirst } from '../../../app/record-order.js';
export default function UpcomingEventsPage() {
  const portalContext = useClientContext();
  const portalActions = portalContext.actions;
  const { CU: currentUser, DB: workspaceData } = portalContext;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = workspaceData.events
    .filter(event => {
      const eDate = new Date(event.date);
      return eDate >= today && event.status === 'upcoming';
    })
    .sort(compareNewestFirst);
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Upcoming Events</div>
          <div className="page-sub">Events happening soon that you might be interested in</div>
        </div>
      </div>
      <div className="events-grid">
        {upcoming.length === 0 ? (
          <div
            className="empty"
            style={{
              gridColumn: '1/-1',
            }}
          >
            <div className="empty-icon">📅</div>
            <div className="empty-title">No upcoming events</div>
          </div>
        ) : (
          upcoming.map((event, index) => (
            <EventCard
              registrations={portalContext.DB.registrations}
              onRegForEvent={portalContext.actions.onRegForEvent}
              onOpenViewEventDrawer={portalContext.actions.onOpenViewEventDrawer}
              onOpenEditEventModal={portalContext.actions.onOpenEditEventModal}
              onDeleteEvent={portalContext.actions.onDeleteEvent}
              user={portalContext.CU}
              evStatBadge={portalContext.evStatBadge}
              event={event}
              role={currentUser.role === 'client' ? 'client' : 'attendee'}
              key={
                event?.id ??
                event?.requestId ??
                event?.eventId ??
                event?.registrationId ??
                event?.reportId ??
                event?.label ??
                (typeof event === 'string' || typeof event === 'number' ? event : index)
              }
            />
          ))
        )}
      </div>
    </>
  );
}
