import ImageWithFallback from '../../../app/ImageWithFallback.jsx';
import { useOrganizerContext } from '../context/OrganizerContext.jsx';
import { EventCard } from '../components/EventCards.jsx';
import { OrganizerEventActions } from '../components/EventActions.jsx';
export default function OngoingEventsPage({ embedded = false }) {
  const portalContext = useOrganizerContext();
  const portalActions = portalContext.actions;
  const {
    CU: currentUser,
    DB: workspaceData,
    getOngoingWorkflowItems,
    workflowEventPhase,
  } = portalContext;
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
                role={'attendee'}
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
  const ongoing = getOngoingWorkflowItems();
  return (
    <>
      {embedded ? (
        ''
      ) : (
        <div className="page-hd">
          <div className="page-hd-left">
            <div className="page-title">Ongoing Events</div>
            <div className="page-sub">
              Track event planning, approved client events, payment, and completion reports
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
          ongoing.map(({ event, request, isPlanning }, index) => {
            const paid = request?.paymentStatus === 'fully_paid';
            const depositPaid = request?.paymentStatus === 'deposit_paid';
            const paymentLabel = paid ? 'Paid' : depositPaid ? 'Deposit Paid' : 'Unpaid';
            const paymentColor = paid
              ? 'var(--green)'
              : depositPaid
              ? 'var(--blue)'
              : 'var(--yellow)';
            const isUpcoming = !isPlanning && workflowEventPhase(event) === 'upcoming';
            const stage = isPlanning
              ? {
                  planning: 'Planning',
                  plan_submitted: 'Awaiting Client Review',
                  plan_revision_requested: 'Plan Revision Requested',
                  proposal_sent: 'Awaiting Client Review',
                  awaiting_client: 'Awaiting Payment',
                  changes_requested: 'Changes Requested',
                  counteroffer_received: 'Counteroffer Received',
                }[request?.status] || 'Planning'
              : isUpcoming
              ? 'Upcoming'
              : 'Ongoing';
            const stageBadgeCls = isPlanning || isUpcoming ? 'blue' : 'green';
            const title = isPlanning
              ? request?.eventName || request?.title || 'Event Planning'
              : event?.name || event?.title || 'Ongoing Event';
            const date = isPlanning
              ? request?.eventDate || request?.date || 'TBD'
              : event?.date || 'TBD';
            const time = isPlanning ? request?.eventTime || request?.time || '' : event?.time || '';
            const venue = isPlanning
              ? request?.venue || request?.location || 'Venue TBD'
              : event?.location || event?.venue || 'Venue TBD';
            const category = isPlanning
              ? request?.category || request?.eventType || 'Corporate'
              : event?.category || 'Event';
            const budgetAmount = Number(
              request?.agreedPrice ??
                request?.budget ??
                (request?.proposals?.length
                  ? request.proposals[request.proposals.length - 1].totalPrice
                  : 0)
            );
            const priceBadge =
              budgetAmount > 0 ? '₹' + budgetAmount.toLocaleString('en-IN') : 'Budget not set';
            const capacity = isPlanning
              ? request?.guestCount || request?.capacity || 0
              : event?.capacity || request?.guestCount || 0;
            const registered = isPlanning
              ? request?.registered || request?.confirmedAttendees || 0
              : event?.registered || 0;
            const pct = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
            const regText =
              capacity > 0
                ? `${registered}/${capacity} registered`
                : isPlanning
                ? 'Planning in progress'
                : 'Ongoing Event';
            const image = (!isPlanning && event?.image) || null;
            const emoji = (!isPlanning && event?.emoji) || (isPlanning ? '📋' : '⏱️');
            const color = (!isPlanning && event?.color) || 'var(--accent)';
            const bannerContent = image ? (
              <>
                <ImageWithFallback
                  src={image}
                  alt={title}
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
                  {emoji}
                </ImageWithFallback>

                <div className="ev-banner-overlay"></div>
              </>
            ) : (
              <span
                style={{
                  fontSize: '52px',
                }}
              >
                {emoji}
              </span>
            );
            const details = isPlanning
              ? () => portalActions.onViewWorkflowRequestDrawer(request?.id || request?.requestId)
              : domEvent =>
                  portalActions.onViewWorkflowEventDetails(domEvent?.eventId || domEvent?.id);
            return (
              <div
                className="ev-card"
                key={event?.id ?? event?.eventId ?? event?.requestId ?? event?.reportId ?? index}
              >
                <div
                  className="ev-banner"
                  style={{
                    background: `${color}18`,
                  }}
                >
                  {bannerContent}
                  <div className="ev-banner-tag">
                    <span className={`badge badge-${stageBadgeCls}`}>{stage}</span>
                  </div>
                  <div className="ev-banner-price">{priceBadge}</div>
                </div>
                <div className="ev-body">
                  <div className="ev-title">{title}</div>
                  <div className="ev-meta">
                    <div className="ev-meta-row">
                      <span>📅</span>
                      {date}
                      {time ? ` · ${time}` : ''}
                    </div>
                    <div className="ev-meta-row">
                      <span>📍</span>
                      {venue}
                    </div>
                    <div className="ev-meta-row">
                      <span>🏷️</span>
                      {category}
                    </div>
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
                  </div>
                  <div
                    style={{
                      marginBottom: '12px',
                    }}
                  >
                    <div className="flex justify-between ev-cap mb-4">
                      <span>{regText}</span>
                      <span>{capacity > 0 ? pct + '%' : ''}</span>
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
                    {!isPlanning && currentUser.role === 'organizer' ? (
                      <OrganizerEventActions
                        organizerEventRequest={portalContext.organizerEventRequest}
                        onOpenEditEventModal={portalContext.actions.onOpenEditEventModal}
                        registrations={portalContext.DB.registrations}
                        payments={portalContext.DB.payments}
                        eventWorkflowPayments={portalContext.DB.eventWorkflowPayments}
                        onHandleOrganizerDeleteEvent={
                          portalContext.actions.onHandleOrganizerDeleteEvent
                        }
                        onOpenOrganizerEventCancellationModal={
                          portalContext.actions.onOpenOrganizerEventCancellationModal
                        }
                        organizerEventCardStatus={portalContext.organizerEventCardStatus}
                        ownsOrganizerEvent={portalContext.ownsOrganizerEvent}
                        event={event}
                        request={request}
                        onViewWorkflowEventDetails={
                          portalContext.actions.onViewWorkflowEventDetails
                        }
                        onOpenViewEventDrawer={portalContext.actions.onOpenViewEventDrawer}
                      />
                    ) : (
                      <button
                        className="btn btn-ghost btn-xs w-full"
                        onClick={details}
                        title="View event details"
                      >
                        👁️ View Details
                      </button>
                    )}
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
