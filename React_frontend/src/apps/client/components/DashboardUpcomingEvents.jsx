export default function DashboardUpcomingEvents({ events, onViewEvent, clientUpcomingEventDate }) {
  return (
    <>
      <div className="h4 mb-12">Upcoming Events</div>
      {events.length ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {events.map(event => (
            <div
              key={event.id}
              className="flex justify-between items-center gap-10"
              style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13.5,
                  }}
                >
                  {event.title || 'Event'}
                </div>
                <div
                  className="small"
                  style={{
                    color: 'var(--text2)',
                  }}
                >
                  {clientUpcomingEventDate(event)}
                  {event.location ? ` · ${event.location}` : ''}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => onViewEvent(event.id)}
              >
                View Event
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="empty"
          style={{
            padding: '20px 0',
          }}
        >
          <div className="empty-title">No upcoming events</div>
          <div className="empty-desc">Published future events will appear here.</div>
        </div>
      )}
    </>
  );
}
