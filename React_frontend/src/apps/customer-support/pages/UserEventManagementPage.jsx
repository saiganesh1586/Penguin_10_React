import FilterInput from '../../../app/FilterInput.jsx';
import { useSupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
import PortalSelect from '../../../app/PortalSelect.jsx';
import { listOrEmpty } from '../../../app/view-utils.js';
export default function UserEventManagementPage() {
  const portalContext = useSupportExecutiveContext();
  const portalActions = portalContext.actions;
  const {
    CU: currentUser,
    DB: workspaceData,
    eventOpsStatusBadge,
    formatEventStatus,
  } = portalContext;
  const activeTab = sessionStorage.getItem('uem_active_tab') || 'users';
  const users = window.EventFlowAccountPolicy.visibleAccounts(
    currentUser,
    workspaceData.users || []
  );
  const events = workspaceData.events || [];
  const regs = workspaceData.registrations || [];

  // Tab 1: Users data filtering
  const userQ = (sessionStorage.getItem('uem_user_q') || '').toLowerCase();
  const userRole = sessionStorage.getItem('uem_user_role') || '';
  const userSt = sessionStorage.getItem('uem_user_st') || '';
  const filteredUsers = users.filter(user => {
    const matchesQuery =
      !userQ ||
      `${user.name} ${user.email} ${user.phone} ${user.role} ${user.id}`
        .toLowerCase()
        .includes(userQ);
    const matchesRole = !userRole || user.role === userRole;
    const isDeactivated = user.status === 'deactivated' || user.status === 'inactive';
    const matchesStatus = !userSt || (userSt === 'active' ? !isDeactivated : isDeactivated);
    return matchesQuery && matchesRole && matchesStatus;
  });

  // Tab 2: Events & Registrations filtering
  const eventQ = (sessionStorage.getItem('uem_event_q') || '').toLowerCase();
  const eventSt = sessionStorage.getItem('uem_event_st') || '';
  const eventCat = sessionStorage.getItem('uem_event_cat') || '';
  const filteredEvents = events.filter(event => {
    const matchesQuery =
      !eventQ ||
      `${event.id} ${event.title || event.name} ${event.category} ${event.venue} ${event.city}`
        .toLowerCase()
        .includes(eventQ);
    const currentSt = formatEventStatus(event.status);
    const matchesStatus = !eventSt || currentSt === eventSt;
    const matchesCat = !eventCat || event.category === eventCat;
    return matchesQuery && matchesStatus && matchesCat;
  });
  const regQ = (sessionStorage.getItem('uem_reg_q') || '').toLowerCase();
  const regSt = sessionStorage.getItem('uem_reg_st') || '';
  const filteredRegs = regs.filter(registration => {
    const attendee = users.find(user => String(user.id) === String(registration.attendeeId)) || {
      name: '',
      email: '',
    };
    const event = events.find(
      currentEvent => String(currentEvent.id) === String(registration.eventId)
    ) || {
      title: '',
    };
    const searchStr = `${registration.id} ${registration.ticketId || ''} ${attendee.name} ${
      attendee.email
    } ${event.title}`.toLowerCase();
    const matchesQuery = !regQ || searchStr.includes(regQ);
    const currentRegSt =
      registration.verificationStatus ||
      (registration.status === 'confirmed' ? 'Verified' : 'Pending Review');
    let matchesStatus = true;
    if (regSt) {
      if (regSt === 'Pending Review') {
        matchesStatus = currentRegSt === 'Pending Review' || currentRegSt === 'Pending';
      } else if (regSt === 'Verified' || regSt === 'Confirmed') {
        matchesStatus = currentRegSt === 'Verified';
      } else if (regSt === 'Flagged') {
        matchesStatus = currentRegSt === 'Flagged';
      } else if (regSt === 'Rejected') {
        matchesStatus = currentRegSt === 'Rejected' || registration.status === 'rejected';
      } else if (regSt === 'Cancelled') {
        matchesStatus = registration.status === 'cancelled';
      }
    }
    return matchesQuery && matchesStatus;
  });
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">User &amp; Event Management</div>
          <div className="page-sub">
            Authorized account administration, event review &amp; status management, and
            registration verification.
          </div>
        </div>
      </div>
      <div
        className="tabs-nav flex gap-8 mb-20"
        style={{
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
        }}
      >
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => portalActions.onSetUemTab('users')}
        >
          👥 Users ({users.length})
        </button>
        <button
          className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => portalActions.onSetUemTab('events')}
        >
          🗓️ Events &amp; Registrations ({events.length} Events · {regs.length} Regs)
        </button>
      </div>
      {activeTab === 'users' ? (
        <>
          <div className="filter-row">
            <div className="search-box input-group">
              <span className="input-icon">🔍</span>
              <FilterInput
                className="form-control"
                id="uem-user-q"
                placeholder="Search users by name, email, phone, role..."
                value={userQ}
                onInput={() => portalActions.onRefreshUemUsers()}
              />
            </div>
            <PortalSelect
              className="form-control filter-select"
              id="uem-user-role"
              onChange={() => portalActions.onRefreshUemUsers()}
              value={userRole}
            >
              <option value="">All Roles</option>
              <option value="attendee">Attendee</option>
              <option value="client">Client</option>
              <option value="organizer">Organizer</option>
              {window.EventFlowAccountPolicy.isSupportExecutiveAccount(currentUser) ? (
                ''
              ) : (
                <option value="employee">Employees</option>
              )}
            </PortalSelect>
            <PortalSelect
              className="form-control filter-select"
              id="uem-user-st"
              onChange={() => portalActions.onRefreshUemUsers()}
              value={userSt}
            >
              <option value="">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated / Inactive</option>
            </PortalSelect>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User ID &amp; Name</th>
                    <th>Contact Info</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listOrEmpty(
                    filteredUsers.map((u, index) => {
                      const isDeactivated = u.status === 'deactivated' || u.status === 'inactive';
                      return (
                        <tr key={u?.id ?? u?.name ?? u?.email ?? index}>
                          <td>
                            <div className="flex items-center gap-10">
                              <div className="av av-xs">{u.avatar || u.name[0]}</div>
                              <div>
                                <div
                                  style={{
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    color: 'var(--text)',
                                  }}
                                >
                                  {u.name}
                                </div>
                                <div className="small muted">ID: {u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>{u.email}</div>
                            <div className="small muted">📞 {u.phone || '—'}</div>
                          </td>
                          <td>
                            <span className="badge badge-purple">{u.role}</span>
                          </td>
                          <td>
                            <span className={`badge badge-${isDeactivated ? 'red' : 'green'}`}>
                              {isDeactivated ? 'Deactivated' : 'Active'}
                            </span>
                          </td>
                          <td>
                            {window.EventFlowAccountPolicy.canManageAccount(currentUser, u) ? (
                              <div className="flex items-center gap-6">
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => portalActions.onOpenEditUserModal(u.id)}
                                  title="Edit User"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  className={`btn btn-xs ${
                                    isDeactivated ? 'btn-success' : 'btn-danger'
                                  }`}
                                  onClick={() => portalActions.onToggleUserStatus(u.id)}
                                  title="Toggle Account Status"
                                >
                                  {isDeactivated ? 'Activate' : 'Deactivate'}
                                </button>
                              </div>
                            ) : (
                              <span className="small muted">Admin managed</span>
                            )}
                          </td>
                        </tr>
                      );
                    }),
                    <tr>
                      <td colSpan="5" className="text-center py-20">
                        No matching user accounts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-24">
            <div className="flex justify-between items-center mb-12">
              <div>
                <div className="h4">Event Management</div>
                <div className="small muted">
                  Manage event publication, venue capacity, dates, and approval workflow.
                </div>
              </div>
            </div>
            <div className="filter-row">
              <div className="search-box input-group">
                <span className="input-icon">🔍</span>
                <FilterInput
                  className="form-control"
                  id="uem-event-q"
                  placeholder="Search events by title, venue, city..."
                  value={eventQ}
                  onInput={() => portalActions.onRefreshUemEvents()}
                />
              </div>
              <PortalSelect
                className="form-control filter-select"
                id="uem-event-st"
                onChange={() => portalActions.onRefreshUemEvents()}
                value={eventSt}
              >
                <option value="">All Event Statuses</option>
                <option value="Pending">Pending Approval</option>
                <option value="Active">Active / Published</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </PortalSelect>
              <PortalSelect
                className="form-control filter-select"
                id="uem-event-cat"
                onChange={() => portalActions.onRefreshUemEvents()}
                value={eventCat}
              >
                <option value="">All Categories</option>
                {[...new Set(events.map((event, index) => event.category).filter(Boolean))].map(
                  (cat, index) => (
                    <option
                      value={cat}
                      key={
                        cat?.id ??
                        cat?.requestId ??
                        cat?.eventId ??
                        cat?.registrationId ??
                        cat?.reportId ??
                        cat?.label ??
                        (typeof cat === 'string' || typeof cat === 'number' ? cat : index)
                      }
                    >
                      {cat}
                    </option>
                  )
                )}
              </PortalSelect>
            </div>
            <div className="card mb-20">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Event Title &amp; ID</th>
                      <th>Category</th>
                      <th>Date &amp; Venue</th>
                      <th>Capacity &amp; Regs</th>
                      <th>Status</th>
                      <th>Update Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listOrEmpty(
                      filteredEvents.map((event, index) => {
                        const currentStatus = formatEventStatus(event.status);
                        const isPending = currentStatus === 'Pending';
                        const isFull = (event.registered || 0) >= (event.capacity || 100);
                        return (
                          <tr
                            key={event?.id ?? event?.date ?? event?.name ?? event?.title ?? index}
                          >
                            <td>
                              <div
                                style={{
                                  fontWeight: '700',
                                  fontSize: '14px',
                                  color: 'var(--text)',
                                }}
                              >
                                {event.title || event.name}
                              </div>
                              <div className="small muted">ID: {event.id}</div>
                            </td>
                            <td>
                              <span className="badge badge-purple">
                                {event.category || 'General'}
                              </span>
                            </td>
                            <td>
                              <div>📅 {event.date || 'TBD'}</div>
                              <div className="small muted">
                                📍 {event.venue || event.location || 'TBD'} ({event.city || 'India'}
                                )
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong>{event.registered || 0}</strong> / {event.capacity || 100}
                              </div>
                              <div className="small muted">
                                {isFull ? (
                                  <span
                                    style={{
                                      color: 'var(--yellow)',
                                      fontWeight: '600',
                                    }}
                                  >
                                    Full
                                  </span>
                                ) : event.price ? (
                                  '₹' + event.price
                                ) : (
                                  'Free'
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`badge badge-${eventOpsStatusBadge(event.status)}`}>
                                {currentStatus}
                              </span>
                            </td>
                            <td>
                              <PortalSelect
                                className="form-control form-control-sm"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                }}
                                onChange={domEvent =>
                                  portalActions.onSetEventOpsStatus(
                                    event.id,
                                    domEvent.currentTarget.value
                                  )
                                }
                                value={currentStatus}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </PortalSelect>
                            </td>
                            <td>
                              <div className="flex items-center gap-6">
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => portalActions.onOpenViewEventDrawer(event.id)}
                                  title="View Details"
                                >
                                  👁️
                                </button>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => portalActions.onOpenEditEventModal(event.id)}
                                  title="Edit Event"
                                >
                                  ✏️
                                </button>
                                {isPending ? (
                                  <>
                                    <button
                                      className="btn btn-success btn-xs"
                                      onClick={() =>
                                        portalActions.onApproveEventOpsDirect(event.id)
                                      }
                                      title="Approve"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      className="btn btn-danger btn-xs"
                                      onClick={() => portalActions.onRejectEventOpsDirect(event.id)}
                                      title="Reject"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  ''
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }),
                      <tr>
                        <td colSpan="7" className="text-center py-20">
                          No matching events found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-12">
              <div>
                <div className="h4">Registrations &amp; Verification</div>
                <div className="small muted">
                  Review online ticket bookings, payment status, verification documents, and approve
                  or reject with reasons.
                </div>
              </div>
            </div>
            <div className="filter-row">
              <div className="search-box input-group">
                <span className="input-icon">🔍</span>
                <FilterInput
                  className="form-control"
                  id="uem-reg-q"
                  placeholder="Search by Ticket ID, Attendee, or Event..."
                  value={regQ}
                  onInput={() => portalActions.onRefreshUemRegistrations()}
                />
              </div>
              <PortalSelect
                className="form-control filter-select"
                id="uem-reg-st"
                onChange={() => portalActions.onRefreshUemRegistrations()}
                value={regSt}
              >
                <option value="">All Registration Statuses</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Verified">Verified / Confirmed</option>
                <option value="Flagged">Flagged</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </PortalSelect>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ticket / Reg ID</th>
                      <th>Attendee</th>
                      <th>Event</th>
                      <th>Document</th>
                      <th>Payment Status</th>
                      <th>Verification Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listOrEmpty(
                      filteredRegs.map((registration, index) => {
                        const attendee = users.find(
                          user => String(user.id) === String(registration.attendeeId)
                        ) || {
                          name: 'Attendee',
                          email: '—',
                        };
                        const event = events.find(
                          currentEvent => String(currentEvent.id) === String(registration.eventId)
                        ) || {
                          title: 'Event',
                        };
                        const isPending =
                          !registration.reviewStatus &&
                          !['rejected', 'cancelled', 'attended', 'no-show'].includes(
                            registration.status
                          ) &&
                          (registration.status === 'pending' ||
                            registration.verificationStatus === 'Pending Review');
                        const paymentStatus =
                          registration.payment === 'paid'
                            ? 'Paid'
                            : registration.amount === 0
                            ? 'Free'
                            : registration.payment || 'Pending Payment';
                        const regStatus =
                          registration.verificationStatus ||
                          (registration.status === 'confirmed' ? 'Verified' : 'Pending Review');
                        return (
                          <tr
                            key={
                              registration?.id ??
                              registration?.eventId ??
                              registration?.ticketId ??
                              registration?.date ??
                              index
                            }
                          >
                            <td className="mono">
                              <strong>{registration.ticketId || registration.id}</strong>
                            </td>
                            <td>
                              <div
                                style={{
                                  fontWeight: '700',
                                  fontSize: '13.5px',
                                  color: 'var(--text)',
                                }}
                              >
                                {attendee.name}
                              </div>
                              <div className="small muted">{attendee.email}</div>
                            </td>
                            <td>
                              <div>{event.title}</div>
                              <div className="small muted">{registration.date || 'Today'}</div>
                            </td>
                            <td>
                              <div className="small">
                                <strong>{registration.docType || 'Govt ID'}</strong>
                              </div>
                              <div className="small muted mono">
                                {registration.docRef || 'REF-' + registration.id}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`badge badge-${
                                  paymentStatus === 'Paid'
                                    ? 'green'
                                    : paymentStatus === 'Free'
                                    ? 'blue'
                                    : 'yellow'
                                }`}
                              >
                                {paymentStatus}{' '}
                                {registration.amount ? '(₹' + registration.amount + ')' : ''}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge badge-${
                                  regStatus === 'Verified'
                                    ? 'green'
                                    : regStatus === 'Flagged'
                                    ? 'yellow'
                                    : regStatus === 'Rejected'
                                    ? 'red'
                                    : 'purple'
                                }`}
                              >
                                {regStatus}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-6">
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() =>
                                    portalActions.onOpenReviewRegistrationModal(registration.id)
                                  }
                                >
                                  Review
                                </button>
                                {isPending ? (
                                  <>
                                    <button
                                      className="btn btn-success btn-xs"
                                      onClick={() =>
                                        portalActions.onApproveRegistrationDirect(registration.id)
                                      }
                                      title="Approve"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      className="btn btn-danger btn-xs"
                                      onClick={() =>
                                        portalActions.onOpenRejectRegistrationWithReasonModal(
                                          registration.id
                                        )
                                      }
                                      title="Reject with Reason"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  ''
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }),
                      <tr>
                        <td colSpan="7" className="text-center py-20">
                          No matching registrations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
