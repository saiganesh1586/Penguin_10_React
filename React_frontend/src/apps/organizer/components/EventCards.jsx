import ImageWithFallback from '../../../app/ImageWithFallback.jsx';
import { OrganizerEventActions } from './EventActions.jsx';
export function EventCard({
  registrations,
  onRegForEvent,
  onOpenViewEventDrawer,
  user: currentUser,
  evStatBadge,
  isCancelledWorkflowEvent,
  organizerEventCardStatus,
  organizerEventRequest,
  onOpenEditEventModal,
  payments,
  eventWorkflowPayments,
  onHandleOrganizerDeleteEvent,
  onOpenOrganizerEventCancellationModal,
  ownsOrganizerEvent,
  event,
  role,
  reg = null,
  onViewWorkflowEventDetails,
}) {
  const pct =
    event.capacity > 0
      ? Math.min(100, Math.round(((event.registered || 0) / event.capacity) * 100))
      : 0;
  const regForThis =
    reg ||
    registrations.find(
      registration =>
        String(registration.attendeeId) === String(currentUser.id) &&
        String(registration.eventId) === String(event.id)
    );
  const isCancelled = isCancelledWorkflowEvent(event);
  const request = role === 'organizer' ? organizerEventRequest(event) : null;
  const status = role === 'organizer' ? organizerEventCardStatus(event) : event.status;
  const statusLabel =
    role === 'organizer'
      ? {
          upcoming: 'Upcoming',
          ongoing: 'Ongoing',
          completed: 'Completed',
          cancelled: 'Cancelled',
          draft: 'Draft',
        }[status] || status
      : status;
  const statusColor =
    role === 'organizer'
      ? {
          upcoming: 'blue',
          ongoing: 'green',
          completed: 'green',
          cancelled: 'red',
          draft: 'yellow',
        }[status] || evStatBadge(status)
      : evStatBadge(status);
  const budget = request ? Number(request.agreedPrice ?? request.budget ?? 0) : null;
  const paymentLabel =
    request?.paymentStatus === 'fully_paid'
      ? 'Paid'
      : request?.paymentStatus === 'deposit_paid'
      ? 'Deposit Paid'
      : 'Unpaid';
  const paymentColor =
    request?.paymentStatus === 'fully_paid'
      ? 'var(--green)'
      : request?.paymentStatus === 'deposit_paid'
      ? 'var(--blue)'
      : 'var(--yellow)';
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
          <span className={`badge badge-${statusColor}`}>{statusLabel}</span>
        </div>
        <div className="ev-banner-price">
          {request
            ? budget > 0
              ? '₹' + budget.toLocaleString('en-IN')
              : 'Budget not set'
            : event.price === 0
            ? 'Free'
            : '₹' + event.price}
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
          {request ? (
            <div className="ev-meta-row">
              <span>💳</span>Payment:{' '}
              <strong
                style={{
                  color: paymentColor,
                }}
              >
                {paymentLabel}
              </strong>
            </div>
          ) : (
            ''
          )}
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
                {...((event.status === 'full' && !regForThis) ||
                event.status === 'completed' ||
                isCancelled
                  ? {
                      disabled: true,
                    }
                  : {})}
                style={
                  (event.status === 'full' && !regForThis) ||
                  event.status === 'completed' ||
                  isCancelled
                    ? {
                        opacity: '.5',
                      }
                    : {}
                }
              >
                {isCancelled
                  ? 'Event Cancelled'
                  : regForThis
                  ? '✓ Registered'
                  : event.status === 'full'
                  ? 'Event Full'
                  : 'Register'}
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
            <OrganizerEventActions
              organizerEventRequest={organizerEventRequest}
              onOpenEditEventModal={onOpenEditEventModal}
              registrations={registrations}
              payments={payments}
              eventWorkflowPayments={eventWorkflowPayments}
              onHandleOrganizerDeleteEvent={onHandleOrganizerDeleteEvent}
              onOpenOrganizerEventCancellationModal={onOpenOrganizerEventCancellationModal}
              organizerEventCardStatus={organizerEventCardStatus}
              ownsOrganizerEvent={ownsOrganizerEvent}
              event={event}
              request={request}
              onViewWorkflowEventDetails={onViewWorkflowEventDetails}
              onOpenViewEventDrawer={onOpenViewEventDrawer}
            />
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
export function CancelledEvents({
  events,
  onOpenViewEventDrawer,
  onViewWorkflowEventDetails,
  isCancelledWorkflowEvent,
  embedded = false,
}) {
  const cancelled = (events || [])
    .filter(isCancelledWorkflowEvent)
    .sort(
      (a, b) =>
        new Date(b.cancellation?.cancelledAt || b.updatedAt || 0) -
        new Date(a.cancellation?.cancelledAt || a.updatedAt || 0)
    );
  const refundStatus = event => {
    const refunds = event.registrationSummary?.refunds || {};
    const statuses = ['pending', 'completed', 'failed']
      .filter(status => Number(refunds[status]) > 0)
      .map((status, index) => `${Number(refunds[status])} ${status}`);
    if (statuses.length) return statuses.join(', ');
    const cancellationStatus = String(event.cancellation?.refundStatus || '').toLowerCase();
    return cancellationStatus === 'pending'
      ? 'Pending'
      : cancellationStatus === 'not_applicable'
      ? 'Not applicable'
      : cancellationStatus || 'Not recorded';
  };
  return (
    <>
      {embedded ? (
        ''
      ) : (
        <div className="page-hd">
          <div className="page-hd-left">
            <div className="page-title">Cancelled Events</div>
            <div className="page-sub">Preserved cancellation and refund history</div>
          </div>
        </div>
      )}
      <div className="events-grid">
        {cancelled.length ? (
          cancelled.map((event, index) => (
            <div className="ev-card" key={event?.date ?? event?.name ?? event?.title ?? index}>
              <div className="ev-body">
                <div className="flex justify-between gap-8">
                  <div className="ev-title">{event.title || event.name || 'Cancelled Event'}</div>
                  <span className="badge badge-red">Cancelled</span>
                </div>
                <div className="ev-meta">
                  <div className="ev-meta-row">
                    <span>📅</span>Event date: {event.date || 'Date unavailable'} ·{' '}
                    {event.time || ''}
                  </div>
                  <div className="ev-meta-row">
                    <span>📍</span>
                    {event.venue || event.location || 'Venue unavailable'}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text2)',
                    marginTop: '10px',
                  }}
                >
                  <strong>Cancellation reason:</strong>{' '}
                  {event.cancellation?.reason || event.cancellationReason || 'No reason recorded'}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text2)',
                    marginTop: '6px',
                  }}
                >
                  <strong>Cancellation date:</strong>{' '}
                  {event.cancellation?.cancelledAt
                    ? new Date(event.cancellation.cancelledAt).toLocaleString()
                    : 'Date unavailable'}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text2)',
                    marginTop: '6px',
                  }}
                >
                  <strong>Refund status:</strong> {refundStatus(event)}
                </div>
                <div className="ev-footer">
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => onOpenViewEventDrawer(event.eventId || event.id)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => onViewWorkflowEventDetails(event.eventId || event.id)}
                  >
                    View Cancellation History
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            className="empty"
            style={{
              gridColumn: '1/-1',
            }}
          >
            <div className="empty-icon">📁</div>
            <div className="empty-title">No cancelled events</div>
          </div>
        )}
      </div>
    </>
  );
}
