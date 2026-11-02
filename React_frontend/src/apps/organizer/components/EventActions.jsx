export function OrganizerRowActions({
  onViewRequestDetail,
  onNavigate,
  onViewWorkflowRequestDrawer,
  request,
}) {
  const s = request.status || 'submitted';
  const drawerHook = () => {
    if (typeof onViewWorkflowRequestDrawer === 'function') onViewWorkflowRequestDrawer(request.id);
  };
  let actionBtn = '';
  if (['submitted', 'pending'].includes(s)) {
    actionBtn = (
      <button
        className="btn btn-primary btn-xs"
        onClick={() => {
          onViewRequestDetail(request.id);
          drawerHook();
        }}
        style={{
          whiteSpace: 'nowrap',
        }}
      >
        Review Request
      </button>
    );
  } else if (['under_review', 'in_review', 'info_requested'].includes(s)) {
    actionBtn = (
      <button
        className="btn btn-primary btn-xs"
        onClick={() => {
          onViewRequestDetail(request.id);
          drawerHook();
        }}
        style={{
          whiteSpace: 'nowrap',
        }}
      >
        Continue Review
      </button>
    );
  } else if (['proposal_sent', 'awaiting_client'].includes(s)) {
    actionBtn = (
      <button
        className="btn btn-primary btn-xs"
        onClick={() => {
          onViewRequestDetail(request.id);
          drawerHook();
        }}
        style={{
          whiteSpace: 'nowrap',
        }}
      >
        View Proposal Status
      </button>
    );
  } else if (
    ['changes_requested', 'counteroffer_received', 'plan_revision_requested'].includes(s)
  ) {
    actionBtn = (
      <button
        className="btn btn-primary btn-xs"
        onClick={() => {
          onViewRequestDetail(request.id);
          drawerHook();
        }}
        style={{
          whiteSpace: 'nowrap',
        }}
      >
        Review Changes
      </button>
    );
  } else if (['confirmed', 'approved'].includes(s)) {
    actionBtn = (
      <button
        className="btn btn-primary btn-xs"
        onClick={() => onNavigate('my-events')}
        style={{
          whiteSpace: 'nowrap',
        }}
      >
        Manage Event
      </button>
    );
  }
  const viewDetailsBtn = (
    <button
      className="btn btn-ghost btn-xs"
      onClick={() => onViewWorkflowRequestDrawer(request.id)}
      style={{
        whiteSpace: 'nowrap',
      }}
    >
      View Details
    </button>
  );
  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {viewDetailsBtn}
      {actionBtn}
    </div>
  );
}
export function OrganizerEventActions({
  organizerEventRequest,
  onOpenEditEventModal,
  registrations: allRegistrations,
  payments,
  eventWorkflowPayments,
  onHandleOrganizerDeleteEvent,
  onOpenOrganizerEventCancellationModal,
  organizerEventCardStatus,
  ownsOrganizerEvent,
  event,
  request = organizerEventRequest(event),
  onViewWorkflowEventDetails,
  onOpenViewEventDrawer,
}) {
  const eventId = event?.eventId || event?.id;
  const requestId = request?.requestId || request?.id || event?.requestId || '';
  const status = organizerEventCardStatus(event);
  const booked = Boolean(request || event?.clientId || event?.backendClientId);
  const details =
    booked || status === 'cancelled'
      ? () => onViewWorkflowEventDetails(eventId)
      : () => onOpenViewEventDrawer(eventId);
  const requestClosed =
    request?.cancellation ||
    ['completed', 'cancelled', 'withdrawn', 'rejected', 'expired'].includes(
      String(request?.status || '').toLowerCase()
    );
  const canManage =
    ownsOrganizerEvent(event, request) &&
    !['completed', 'cancelled'].includes(status) &&
    !requestClosed;
  const eventIds = new Set([event?.id, eventId].filter(id => id != null).map(String));
  const registrations = (allRegistrations || []).filter(
    registration => registration.eventId != null && eventIds.has(String(registration.eventId))
  );
  const registrationIds = new Set(
    registrations
      .flatMap(registration => [registration.registrationId, registration.id])
      .filter(id => id != null)
      .map(String)
  );
  const hasPayments = (payments || [])
    .concat(eventWorkflowPayments || [])
    .some(
      payment =>
        (payment.eventId != null && eventIds.has(String(payment.eventId))) ||
        (payment.registrationId != null && registrationIds.has(String(payment.registrationId)))
    );
  const deletableDraft =
    status === 'draft' &&
    !booked &&
    !Number(event.registered || 0) &&
    !registrations.length &&
    !hasPayments;
  return (
    <div className="organizer-event-actions">
      <button type="button" className="btn btn-ghost btn-xs" onClick={details}>
        {status === 'cancelled' ? 'View Cancellation History' : 'View Details'}
      </button>
      {canManage && !booked && (
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => onOpenEditEventModal(event.id || eventId)}
        >
          Edit
        </button>
      )}
      {canManage && deletableDraft ? (
        <button
          type="button"
          className="btn btn-danger btn-xs"
          onClick={() => onHandleOrganizerDeleteEvent(eventId)}
        >
          Delete Draft
        </button>
      ) : (
        canManage &&
        (!request ||
          ['confirmed', 'approved'].includes(String(request.status || '').toLowerCase())) && (
          <button
            type="button"
            className="btn btn-danger btn-xs"
            onClick={() => onOpenOrganizerEventCancellationModal(eventId, requestId)}
          >
            Cancel Event
          </button>
        )
      )}
    </div>
  );
}
