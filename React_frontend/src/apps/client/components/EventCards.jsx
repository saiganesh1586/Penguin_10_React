import ImageWithFallback from '../../../app/ImageWithFallback.jsx';
export function WorkflowEventCard({
  onViewWorkflowRequestDrawer,
  onOpenClientPlanReview,
  onOpenClientPaymentModal,
  onOpenClientCancelRequestModal,
  onViewWorkflowEventDetails,
  onViewWorkflowEventReport,
  item,
  tab,
}) {
  const bannerContent = item.image ? (
    <>
      <ImageWithFallback
        src={item.image}
        alt={item.title || 'Event'}
        className="ev-banner-img"
        fallbackTag="div"
        fallbackProps={{
          className: 'ev-banner-fallback',
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            width: '100%',
            height: '100%',
          },
        }}
      >
        {item.emoji || '📅'}
      </ImageWithFallback>

      <div className="ev-banner-overlay"></div>
    </>
  ) : (
    <span
      style={{
        fontSize: '48px',
      }}
    >
      {item.emoji || '📅'}
    </span>
  );
  let statusBadge = '';
  if (item.isPlanning) {
    const stage =
      {
        planning: 'Planning',
        plan_submitted: 'Plan Ready',
        plan_revision_requested: 'Plan Revision Requested',
        proposal_sent: 'Review Proposal',
        awaiting_client: 'Awaiting Payment',
        changes_requested: 'Changes Requested',
        counteroffer_received: 'Counteroffer Sent',
      }[item.rawRequest?.status] || 'Planning';
    statusBadge = <span className="badge badge-blue">{stage}</span>;
  } else if (tab === 'completed') {
    statusBadge = <span className="badge badge-green">✓ Completed</span>;
  } else if (tab === 'ongoing') {
    statusBadge = <span className="badge badge-blue">⏱️ Ongoing</span>;
  } else {
    statusBadge = <span className="badge badge-green">✓ Confirmed</span>;
  }
  let actionsHtml = '';
  const eventTargetId = item.eventId || item.id;
  if (item.isPlanning) {
    actionsHtml = (
      <>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text2)',
            marginBottom: '8px',
          }}
        >
          Planning in progress. Open details for the next step.
        </div>
        <div
          className="flex gap-6"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onViewWorkflowRequestDrawer(item.requestId)}
          >
            View Details
          </button>
          {item.rawRequest?.status === 'proposal_sent' ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onOpenClientPlanReview(item.requestId)}
            >
              Review Proposal
            </button>
          ) : (
            ''
          )}
          {item.rawRequest?.status === 'awaiting_client' ||
          (item.rawRequest?.paymentStatus === 'deposit_pending' &&
            (item.rawRequest?.proposals || []).some(proposal => proposal.status === 'accepted')) ? (
            <button
              className="btn btn-success btn-sm"
              onClick={() => onOpenClientPaymentModal(item.requestId)}
            >
              Proceed to Payment &amp; Confirmation
            </button>
          ) : (
            ''
          )}
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onOpenClientCancelRequestModal(item.requestId)}
          >
            Withdraw Request
          </button>
        </div>
      </>
    );
  } else if (tab === 'upcoming') {
    actionsHtml = (
      <div
        className="flex gap-6"
        style={{
          width: '100%',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onViewWorkflowEventDetails(eventTargetId)}
        >
          👁️ View Details
        </button>
        {item.requestId ? (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onOpenClientCancelRequestModal(item.requestId)}
          >
            Cancel Event
          </button>
        ) : (
          ''
        )}
      </div>
    );
  } else if (tab === 'ongoing') {
    actionsHtml = (
      <>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text2)',
            marginBottom: '8px',
          }}
        >
          ⏱️ Event currently underway. Live on-site coordination in progress.
        </div>
        <div
          className="flex gap-6"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onViewWorkflowEventDetails(eventTargetId)}
          >
            👁️ View Details
          </button>
          {item.requestId ? (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onOpenClientCancelRequestModal(item.requestId)}
            >
              Cancel Event
            </button>
          ) : (
            ''
          )}
        </div>
      </>
    );
  } else {
    actionsHtml = (
      <>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--green)',
            marginBottom: '8px',
          }}
        >
          ✓ Event Successfully Completed
        </div>
        <div
          className="flex gap-6"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onViewWorkflowEventDetails(eventTargetId)}
          >
            👁️ View Details
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onViewWorkflowEventReport(eventTargetId)}
          >
            📊 View Report
          </button>
        </div>
      </>
    );
  }
  return (
    <div
      className="ev-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="ev-banner"
        style={{
          background: `${item.color || 'var(--accent)'}18`,
        }}
      >
        {bannerContent}
        <div className="ev-banner-tag">{statusBadge}</div>
      </div>
      <div
        className="ev-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1',
        }}
      >
        <div
          className="ev-title"
          style={{
            marginBottom: '8px',
          }}
        >
          {item.title}
        </div>
        <div
          className="ev-meta"
          style={{
            flex: '1',
          }}
        >
          <div className="ev-meta-row">
            <span>📅</span>
            {item.date} · {item.time || '10:00'}
          </div>
          <div className="ev-meta-row">
            <span>📍</span>
            {item.venue || item.location || 'Venue TBD'}
          </div>
          <div className="ev-meta-row">
            <span>👤</span>
            <strong>Organizer:</strong> {item.organizerName || 'Assigned Organizer'}
          </div>
          <div className="ev-meta-row">
            <span>🏷️</span>
            {item.category || 'Event'}
          </div>
        </div>
        <div
          className="ev-footer"
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          {actionsHtml}
        </div>
      </div>
    </div>
  );
}
export function EventCard({
  registrations,
  onRegForEvent,
  onOpenViewEventDrawer,
  onOpenEditEventModal,
  onDeleteEvent,
  user: currentUser,
  evStatBadge,
  event,
  role,
  reg = null,
}) {
  const pct = Math.min(100, Math.round((event.registered / event.capacity) * 100));
  const regForThis =
    reg ||
    registrations.find(
      registration =>
        String(registration.attendeeId) === String(currentUser.id) &&
        String(registration.eventId) === String(event.id)
    );
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
    <div className="ev-card">
      <div
        className="ev-banner"
        style={{
          background: `${event.color || 'var(--accent)'}18`,
        }}
      >
        {bannerContent}
        <div className="ev-banner-tag">
          <span className={`badge badge-${evStatBadge(event.status)}`}>{event.status}</span>
        </div>
        <div className="ev-banner-price">{event.price === 0 ? 'Free' : '₹' + event.price}</div>
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
              {event.registered}/{event.capacity} registered
            </span>
            <span>{pct}%</span>
          </div>
          <div className="prog">
            <div
              className="prog-fill"
              style={{
                width: `${pct}%`,
              }}
            ></div>
          </div>
        </div>
        <div className="ev-footer">
          {role === 'attendee' ? (
            <div
              className="flex gap-6"
              style={{
                width: '100%',
                justifyContent: 'space-between',
              }}
            >
              <button
                className={`btn btn-sm ${regForThis ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => onRegForEvent(event.id)}
                {...((event.status === 'full' && !regForThis) || event.status === 'completed'
                  ? {
                      disabled: true,
                    }
                  : {})}
                style={
                  (event.status === 'full' && !regForThis) || event.status === 'completed'
                    ? {
                        opacity: '.5',
                      }
                    : {}
                }
              >
                {regForThis ? '✓ Registered' : event.status === 'full' ? 'Event Full' : 'Register'}
              </button>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => onOpenViewEventDrawer(event.id)}
                title="View event details"
              >
                View Details
              </button>
            </div>
          ) : role === 'organizer' ? (
            <div className="actions">
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => onOpenViewEventDrawer(event.id)}
                title="View event details"
              >
                👁️ View
              </button>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => onOpenEditEventModal(event.id)}
              >
                ✏️ Edit
              </button>
              <button className="btn btn-xs btn-danger" onClick={() => onDeleteEvent(event.id)}>
                🗑️
              </button>
            </div>
          ) : role === 'superuser' ? (
            <div className="actions">
              <button
                className="btn btn-ghost btn-xs w-full"
                onClick={() => onOpenViewEventDrawer(event.id)}
                title="View event details"
              >
                👁️ View
              </button>
            </div>
          ) : role === 'employee' || role === 'client' ? (
            <div className="flex gap-6">
              <button
                className="btn btn-ghost btn-xs w-full"
                onClick={() => onOpenViewEventDrawer(event.id)}
                title="View event details"
              >
                👁️ View Details
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => onOpenViewEventDrawer(event.id)}
              title="View event details"
            >
              👁️ Details
            </button>
          )}
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
}
