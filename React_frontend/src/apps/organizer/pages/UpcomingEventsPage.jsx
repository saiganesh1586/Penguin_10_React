import { useOrganizerContext } from '../context/OrganizerContext.jsx';
import { compareNewestFirst } from '../../../app/record-order.js';
import { EventCard } from '../components/EventCards.jsx';
export default function UpcomingEventsPage() {
  const portalContext = useOrganizerContext();
  const portalActions = portalContext.actions;
  const { CU: currentUser, DB: workspaceData, isCancelledWorkflowEvent } = portalContext;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = workspaceData.events
    .filter(event => {
      const eDate = new Date(event.date);
      return eDate >= today && event.status === 'upcoming' && !isCancelledWorkflowEvent(event);
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
              user={portalContext.CU}
              evStatBadge={portalContext.evStatBadge}
              isCancelledWorkflowEvent={portalContext.isCancelledWorkflowEvent}
              organizerEventCardStatus={portalContext.organizerEventCardStatus}
              organizerEventRequest={portalContext.organizerEventRequest}
              onOpenEditEventModal={portalContext.actions.onOpenEditEventModal}
              payments={portalContext.DB.payments}
              eventWorkflowPayments={portalContext.DB.eventWorkflowPayments}
              onHandleOrganizerDeleteEvent={portalContext.actions.onHandleOrganizerDeleteEvent}
              onOpenOrganizerEventCancellationModal={
                portalContext.actions.onOpenOrganizerEventCancellationModal
              }
              ownsOrganizerEvent={portalContext.ownsOrganizerEvent}
              event={event}
              role={currentUser.role === 'client' ? 'client' : 'attendee'}
              onViewWorkflowEventDetails={portalContext.actions.onViewWorkflowEventDetails}
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
