import ImageWithFallback from '../../../app/ImageWithFallback.jsx';
import { useOrganizerContext } from '../context/OrganizerContext.jsx';
export default function CompletedEventsPage({ embedded = false }) {
  const portalContext = useOrganizerContext();
  const portalActions = portalContext.actions;
  const { DB: workspaceData, workflowEventPhase } = portalContext;
  const completed = workspaceData.events
    .filter(event => workflowEventPhase(event) === 'completed')
    .sort((leftEvent, rightEvent) => new Date(rightEvent.date) - new Date(leftEvent.date));
  return (
    <>
      {embedded ? (
        ''
      ) : (
        <div className="page-hd">
          <div className="page-hd-left">
            <div className="page-title">Completed Events</div>
            <div className="page-sub">Events that have been successfully completed</div>
          </div>
        </div>
      )}
      <div className="events-grid">
        {completed.length === 0 ? (
          <div
            className="empty"
            style={{
              gridColumn: '1/-1',
            }}
          >
            <div className="empty-icon">✅</div>
            <div className="empty-title">No completed events</div>
          </div>
        ) : (
          completed.map((event, index) => {
            const bannerContent = event.image ? (
              <>
                <ImageWithFallback
                  src={event.image}
                  alt={event.title || 'Event'}
                  className="ev-banner-img"
                  fallbackTag="div"
                  fallbackProps={{
                    className: 'ev-banner-fallback',
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '52px',
                      width: '100%',
                      height: '100%',
                    },
                  }}
                >
                  {event.emoji || '📅'}
                </ImageWithFallback>

                <div className="ev-banner-overlay"></div>
              </>
            ) : (
              <span
                style={{
                  fontSize: '52px',
                }}
              >
                {event.emoji || '📅'}
              </span>
            );
            return (
              <div className="ev-card" key={event?.date ?? event?.title ?? index}>
                <div
                  className="ev-banner"
                  style={{
                    background: `${event.color || 'var(--accent)'}18`,
                  }}
                >
                  {bannerContent}
                  <div className="ev-banner-tag">
                    <span className="badge badge-green">✓ Completed</span>
                  </div>
                  <div className="ev-banner-price">
                    {event.price === 0 ? 'Free' : '₹' + event.price}
                  </div>
                </div>
                <div className="ev-body">
                  <div className="ev-title">{event.title}</div>
                  <div className="ev-meta">
                    <div className="ev-meta-row">
                      <span>📅</span>
                      {event.date} · {event.time}
                    </div>
                    <div className="ev-meta-row">
                      <span>📍</span>
                      {event.venue}
                    </div>
                    <div className="ev-meta-row">
                      <span>🏷️</span>
                      {event.category}
                    </div>
                  </div>
                  <div
                    style={{
                      marginBottom: '12px',
                    }}
                  >
                    <div className="flex justify-between ev-cap mb-4">
                      <span>
                        {event.registered}/{event.capacity} attended
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--green)',
                        marginTop: '8px',
                      }}
                    >
                      ✓ Event Successfully Completed
                    </div>
                  </div>
                  <div className="ev-footer">
                    <div
                      className="flex gap-6"
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                      }}
                    >
                      <button
                        className="btn btn-ghost btn-xs w-full"
                        onClick={() => portalActions.onViewWorkflowEventDetails(event.id)}
                        title="View event details"
                      >
                        👁️ View Details
                      </button>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => portalActions.onViewWorkflowEventReport(event.id)}
                        title="View completion report"
                      >
                        📊 View Report
                      </button>
                    </div>
                    <div
                      className="tag-list"
                      style={{
                        flex: '1',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {(event.tags || []).slice(0, 2).map((tag, index) => (
                        <span
                          className="tag"
                          key={
                            tag?.id ??
                            tag?.requestId ??
                            tag?.eventId ??
                            tag?.registrationId ??
                            tag?.reportId ??
                            tag?.label ??
                            (typeof tag === 'string' || typeof tag === 'number' ? tag : index)
                          }
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
