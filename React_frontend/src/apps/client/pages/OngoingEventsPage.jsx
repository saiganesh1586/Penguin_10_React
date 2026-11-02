import { useClientContext } from '../context/ClientContext.jsx';
import { EventCard } from '../components/EventCards.jsx';
export default function OngoingEventsPage({ embedded = false }) {
  const portalContext = useClientContext();
  const portalActions = portalContext.actions;
  const { CU: currentUser, DB: workspaceData } = portalContext;
  if (!['client', 'organizer'].includes(currentUser.role)) {
    const publicOngoing = workspaceData.events.filter(event => event.status === 'ongoing');
    return (
      <>
        <div className="page-hd">
          <div className="page-hd-left">
            <div className="page-title">Ongoing Events</div>
            <div className="page-sub">Events currently happening right now</div>
          </div>
        </div>
        <div className="events-grid">
          {publicOngoing.length ? (
            publicOngoing.map((event, index) => (
              <EventCard
                registrations={portalContext.DB.registrations}
                onRegForEvent={portalContext.actions.onRegForEvent}
                onOpenViewEventDrawer={portalContext.actions.onOpenViewEventDrawer}
                onOpenEditEventModal={portalContext.actions.onOpenEditEventModal}
                onDeleteEvent={portalContext.actions.onDeleteEvent}
                user={portalContext.CU}
                evStatBadge={portalContext.evStatBadge}
                event={event}
                role={'attendee'}
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
          ) : (
            <div
              className="empty"
              style={{
                gridColumn: '1/-1',
              }}
            >
              <div className="empty-icon">⏱️</div>
              <div className="empty-title">No ongoing events</div>
            </div>
          )}
        </div>
      </>
    );
  }
  const ongoing = workspaceData.events.filter(
    event =>
      event.status === 'ongoing' &&
      workspaceData.eventRequests.some(
        request => String(request.eventId) === String(event.eventId || event.id)
      )
  );
  return (
    <>
      {embedded ? (
        ''
      ) : (
        <div className="page-hd">
          <div className="page-hd-left">
            <div className="page-title">Ongoing Events</div>
            <div className="page-sub">
              Track your approved client–organizer events, payment, and completion reports
            </div>
          </div>
        </div>
      )}
      <div className="events-grid">
        {ongoing.length === 0 ? (
          <div
            className="empty"
            style={{
              gridColumn: '1/-1',
            }}
          >
            <div className="empty-icon">⏱️</div>
            <div className="empty-title">No ongoing events</div>
          </div>
        ) : (
          ongoing.map((event, index) => {
            const request = workspaceData.eventRequests.find(
              item => String(item.eventId) === String(event.eventId || event.id)
            );
            const paid = request?.paymentStatus === 'fully_paid';
            return (
              <div
                className="card"
                key={
                  event?.id ?? event?.eventId ?? event?.date ?? event?.name ?? event?.title ?? index
                }
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  <strong>{event.name || event.title}</strong>
                  <span className="badge badge-blue">Ongoing</span>
                </div>
                <div
                  style={{
                    marginTop: '10px',
                    color: 'var(--text2)',
                    fontSize: '13px',
                  }}
                >
                  📅 {event.date} · 📍 {event.location || event.venue || '—'}
                </div>
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '13px',
                  }}
                >
                  Payment:{' '}
                  <strong
                    style={{
                      color: paid ? 'var(--green)' : 'var(--yellow)',
                    }}
                  >
                    {paid ? 'Paid' : 'Unpaid'}
                  </strong>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{
                    marginTop: '12px',
                  }}
                  onClick={() =>
                    portalActions.onViewWorkflowEventDetails(event.eventId || event.id)
                  }
                >
                  View Details
                </button>
                {currentUser.role === 'client' ? (
                  <button
                    className="btn btn-danger btn-sm"
                    style={{
                      marginTop: '12px',
                    }}
                    onClick={() =>
                      portalActions.onOpenWorkflowCancellation(event.eventId || event.id)
                    }
                  >
                    Cancel Event
                  </button>
                ) : (
                  ''
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
