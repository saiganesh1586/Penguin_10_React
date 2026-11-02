import EventPicker from '../components/EventPicker.jsx';
import { useState, useEffect, useCallback } from 'react';
import { useOrganizerContext } from '../context/OrganizerContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import { AttendeeTable, OrganizerAttendeeTable } from '../components/AttendeeTable.jsx';
export default function AttendeesPage() {
  const [selectedId, setSelectedId] = useState(() => sessionStorage.getItem('org_attendees_event'));
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const portalContext = useOrganizerContext();
  const portalActions = portalContext.actions;
  const {
    CU: currentUser,
    DB: workspaceData,
    canReviewOrganizerRegistration,
    organizerRegistrationEvents,
    organizerRegistrationStatus,
  } = portalContext;
  const myEvents =
    currentUser.role === 'organizer'
      ? organizerRegistrationEvents
      : workspaceData.events.filter(event => event.organizer === currentUser.id);
  const savedEventId = selectedId;
  const selectedEvent =
    myEvents.find(event => String(event.id) === savedEventId) ||
    myEvents.find(event =>
      workspaceData.registrations.some(
        registration =>
          String(registration.eventId) === String(event.id) &&
          canReviewOrganizerRegistration(registration, event)
      )
    ) ||
    myEvents[0];
  const selectedEventId = selectedEvent?.id;
  useEffect(() => {
    if (selectedEventId) sessionStorage.setItem('org_attendees_event', String(selectedEventId));
  }, [selectedEventId]);
  const selectEvent = useCallback(
    id => {
      setSelectedId(String(id));
      portalActions.onSwitchOrganizerEvent(id);
    },
    [portalActions]
  );
  const isPrivateEvent = selectedEvent?.visibility === 'private';
  const regs =
    currentUser.role === 'organizer'
      ? workspaceData.registrations.filter(
          registration =>
            registration.organizerManaged &&
            selectedEventId &&
            String(registration.eventId) === String(selectedEventId)
        )
      : currentUser.role === 'superuser'
      ? workspaceData.registrations
      : workspaceData.registrations.filter(registration => {
          const event = workspaceData.events.find(
            currentEvent => currentEvent.id === registration.eventId
          );
          return event && event.organizer === currentUser.id;
        });
  if (currentUser.role === 'organizer' && !myEvents.length)
    return (
      <div className="org-attendees card">
        <div className="empty">
          <div className="empty-icon">📅</div>
          <div className="empty-title">No events to manage</div>
          <p className="empty-desc">Create an event to start managing attendee registrations.</p>
          <button
            className="btn btn-primary mt-16"
            onClick={() => portalActions.onOpenAddEventModal()}
          >
            Create Event
          </button>
        </div>
      </div>
    );
  if (currentUser.role === 'organizer' && myEvents.length > 0) {
    const approvedCount = regs.filter(registration =>
      ['Approved', 'No Approval Required', 'Attended'].includes(
        organizerRegistrationStatus(registration)
      )
    ).length;
    const pendingCount = regs.filter(registration =>
      ['Pending', 'Payment Pending'].includes(organizerRegistrationStatus(registration))
    ).length;
    const rejectedCount = regs.filter(
      registration => organizerRegistrationStatus(registration) === 'Declined'
    ).length;
    const eventStatus =
      selectedEvent.status === 'published'
        ? 'Published'
        : selectedEvent.status === 'draft'
        ? 'Draft'
        : selectedEvent.status || 'Event';
    return (
      <div className="org-attendees">
        <div className="page-hd org-attendees-heading">
          <div className="page-hd-left">
            <div className="page-title">Attendee Management</div>
            <div className="page-sub">
              {regs.length} attendees · {approvedCount} approved · {pendingCount} pending
            </div>
          </div>
        </div>
        <div className="card org-attendee-event-card">
          <div>
            <div className="label mb-8">SELECT EVENT</div>
            <div className="small">Choose an event to view its registrations</div>
          </div>
          <EventPicker events={myEvents} selectedEvent={selectedEvent} onSelect={selectEvent} />
          {isPrivateEvent ? <span className="badge badge-blue">🔒 Private Event</span> : ''}
        </div>
        <div className="org-attendee-stats">
          <div className="card">
            <span>Total Attendees</span>
            <strong>{regs.length}</strong>
            <small>For this event</small>
          </div>
          <div className="card">
            <span>Approved</span>
            <strong>{approvedCount}</strong>
            <small>Confirmed or attended</small>
          </div>
          <div className="card">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
            <small>Awaiting review or payment</small>
          </div>
          <div className="card">
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
            <small>Declined registrations</small>
          </div>
        </div>
        <div className="card org-attendee-list-card">
          <div className="org-attendee-list-heading">
            <div>
              <div className="h4">Attendees</div>
              <div className="small">
                {selectedEvent.title} · {regs.length} registrations
              </div>
            </div>
          </div>
          <div className="filter-row org-attendee-filters">
            <div className="search-box input-group">
              <span className="input-icon">🔍</span>
              <input
                className="form-control"
                id="at-q"
                aria-label="Search attendees"
                placeholder="Search name, email or ticket ID…"
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
            </div>
            <PortalSelect
              className="form-control filter-select"
              id="at-status"
              aria-label="Filter attendee status"
              value={status}
              onChange={event => setStatus(event.target.value)}
            >
              <option value="">All Status</option>
              {selectedEvent?.visibility === 'public' ? (
                <>
                  <option value="no approval required">No Approval Required</option>
                  <option value="payment pending">Payment Pending</option>
                </>
              ) : (
                <>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Review</option>
                </>
              )}
              <option value="rejected">Declined</option>
              <option value="cancelled">Cancelled</option>
              <option value="attended">Attended</option>
            </PortalSelect>
          </div>
          <div id="attendees-tbl">
            <OrganizerAttendeeTable
              users={portalContext.DB.users}
              onViewOrganizerAttendeeProfile={portalContext.actions.onViewOrganizerAttendeeProfile}
              onOrganiserApproveAttendee={portalContext.actions.onOrganiserApproveAttendee}
              onOrganiserRejectAttendee={portalContext.actions.onOrganiserRejectAttendee}
              canReviewOrganizerRegistration={portalContext.canReviewOrganizerRegistration}
              organizerRegistrationStatus={portalContext.organizerRegistrationStatus}
              registrations={regs}
              event={selectedEvent}
              isPrivate={isPrivateEvent}
              filters={{
                query,
                status,
              }}
            />
          </div>
        </div>
      </div>
    );
  }
  const checkedIn2 = regs.filter(registration => registration.checkedIn).length;
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Attendee Management</div>
          <div className="page-sub">
            {regs.length} total · {checkedIn2} checked in
          </div>
        </div>
        <div className="page-hd-right">
          <button
            className="btn btn-ghost"
            onClick={() => portalActions.onToast('Exported to CSV', 'success')}
          >
            📥 Export CSV
          </button>
        </div>
      </div>
      <div className="filter-row">
        <div className="search-box input-group">
          <span className="input-icon">🔍</span>
          <input
            className="form-control"
            id="at-q"
            placeholder="Search attendees…"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </div>
        <PortalSelect
          className="form-control filter-select"
          id="at-ev"
          value={eventFilter}
          onChange={event => setEventFilter(event.target.value)}
        >
          <option value="">All Events</option>
          {workspaceData.events.map((event, index) => (
            <option value={event.id} key={event?.id ?? event?.title ?? index}>
              {event.title}
            </option>
          ))}
        </PortalSelect>
        <PortalSelect
          className="form-control filter-select"
          id="at-ci"
          value={checkIn}
          onChange={event => setCheckIn(event.target.value)}
        >
          <option value="">All</option>
          <option value="in">Checked In</option>
          <option value="out">Not Checked In</option>
        </PortalSelect>
      </div>
      <div id="attendees-tbl">
        <AttendeeTable
          users={portalContext.DB.users}
          events={portalContext.DB.events}
          onScanQR={portalContext.actions.onScanQR}
          onCancelReg={portalContext.actions.onCancelReg}
          registrations={regs}
        />
      </div>
    </>
  );
}
