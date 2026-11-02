export function OrganizerAttendeeTable({
  users,
  onViewOrganizerAttendeeProfile,
  onOrganiserApproveAttendee,
  onOrganiserRejectAttendee,
  canReviewOrganizerRegistration,
  organizerRegistrationStatus,
  registrations,
  event,
  filters = {},
}) {
  const q = (filters.query || '').toLowerCase();
  const status = filters.status || '';
  const filtered = registrations.filter(registration => {
    const eventRegistration = users.find(
      user => String(user.id) === String(registration.attendeeId)
    ) || {
      name: '',
      email: '',
    };
    const matchesSearch =
      !q ||
      (eventRegistration.name + eventRegistration.email + registration.ticketId)
        .toLowerCase()
        .includes(q);
    const matchesStatus =
      !status ||
      organizerRegistrationStatus(registration).toLowerCase() ===
        (status === 'rejected' ? 'declined' : status);
    return matchesSearch && matchesStatus;
  });
  if (!filtered.length)
    return (
      <div className="empty org-attendee-empty">
        <div className="empty-icon">👥</div>
        <div className="empty-title">
          {registrations.length ? 'No attendees match your filters' : 'No registrations yet'}
        </div>
        <p className="empty-desc">
          {registrations.length
            ? 'Try a different name, ticket ID or status.'
            : 'Attendees will appear here when they register for this event.'}
        </p>
      </div>
    );
  return (
    <div className="table-wrap org-attendee-table">
      <table>
        <thead>
          <tr>
            <th>Attendee</th>
            <th>Email</th>
            <th>Ticket ID</th>
            <th>Amount</th>
            <th>Review Status / Reason</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, index) => {
            const u = users.find(user => String(user.id) === String(r.attendeeId)) || {
              name: 'Unknown',
              email: '',
              avatar: '?',
              phone: '',
            };
            const status = organizerRegistrationStatus(r);
            return (
              <tr key={r?.id ?? r?.ticketId ?? index}>
                <td>
                  <div className="flex items-center gap-8">
                    <div className="av av-xs">{u.avatar || u.name?.[0] || '?'}</div>
                    <div>
                      <div className="org-attendee-name">{u.name}</div>
                      <div className="small">{u.phone || '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="small">{u.email}</td>
                <td>
                  <code className="mono org-attendee-ticket">{r.ticketId}</code>
                </td>
                <td
                  style={{
                    color: 'var(--green)',
                    fontWeight: '600',
                  }}
                >
                  {r.amount === 0
                    ? Number(r.event?.ticketPrice || 0) > 0
                      ? 'Not paid'
                      : 'Free'
                    : '₹' + r.amount}
                </td>
                <td>
                  <span
                    className={`badge badge-${
                      ['Approved', 'No Approval Required', 'Attended'].includes(status)
                        ? 'green'
                        : ['Declined', 'Cancelled'].includes(status)
                        ? 'red'
                        : 'yellow'
                    }`}
                  >
                    {status}
                  </span>
                  <div className="small">
                    {r.status === 'pending_approval'
                      ? 'Access approval pending'
                      : r.status === 'pending_payment'
                      ? 'Registration awaiting payment'
                      : r.status === 'registered'
                      ? 'Registration confirmed'
                      : r.status === 'waitlisted'
                      ? 'Waitlisted'
                      : ''}
                    {r.payment === 'completed'
                      ? ' · Payment completed'
                      : r.payment === 'free'
                      ? ' · Free ticket'
                      : ''}
                  </div>
                  {r.rejectionReason ? (
                    <div
                      className="small mt-8"
                      style={{
                        maxWidth: '280px',
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      <strong>Reason:</strong> {r.rejectionReason}
                    </div>
                  ) : (
                    ''
                  )}
                </td>
                <td>
                  <div className="actions org-attendee-actions">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => onViewOrganizerAttendeeProfile(r.id)}
                    >
                      View Profile
                    </button>
                    {canReviewOrganizerRegistration(r, event) ? (
                      <>
                        <button
                          className="btn btn-success btn-xs"
                          onClick={() => onOrganiserApproveAttendee(r.id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => onOrganiserRejectAttendee(r.id)}
                        >
                          ✕ Decline
                        </button>
                      </>
                    ) : (
                      ''
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
export function AttendeeTable({ users, events, onScanQR, onCancelReg, registrations }) {
  if (!registrations.length)
    return (
      <div className="empty">
        <div className="empty-icon">👥</div>
        <div className="empty-title">No registrations found</div>
      </div>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Attendee</th>
            <th>Event</th>
            <th>Ticket ID</th>
            <th>Seat</th>
            <th>Amount</th>
            <th>Check-In</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((registration, index) => {
            const eventRegistration = users.find(user => user.id === registration.attendeeId) || {
              name: 'Unknown',
              email: '',
              avatar: '?',
            };
            const e = events.find(event => event.id === registration.eventId) || {
              title: '—',
            };
            return (
              <tr
                key={registration?.id ?? registration?.eventId ?? registration?.ticketId ?? index}
              >
                <td>
                  <div className="flex items-center gap-8">
                    <div className="av av-xs">
                      {eventRegistration.avatar || eventRegistration.name[0]}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: '500',
                        }}
                      >
                        {eventRegistration.name}
                      </div>
                      <div className="small">{eventRegistration.email}</div>
                    </div>
                  </div>
                </td>
                <td
                  className="truncate"
                  style={{
                    maxWidth: '160px',
                    fontSize: '13px',
                  }}
                >
                  {e.title}
                </td>
                <td>
                  <code
                    className="mono"
                    style={{
                      background: 'var(--surface3)',
                      padding: '2px 6px',
                      borderRadius: '5px',
                    }}
                  >
                    {registration.ticketId}
                  </code>
                </td>
                <td className="muted">{registration.seat || 'GA'}</td>
                <td
                  style={{
                    color: 'var(--green)',
                    fontWeight: '600',
                  }}
                >
                  {registration.amount === 0 ? 'Free' : '₹' + registration.amount}
                </td>
                <td>
                  <span className={`badge badge-${registration.checkedIn ? 'green' : 'gray'}`}>
                    {registration.checkedIn ? '✓ In' : 'Pending'}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    {!registration.checkedIn ? (
                      <button
                        className="btn btn-success btn-xs"
                        onClick={() => onScanQR(registration.id, registration.ticketId)}
                      >
                        📱 Scan QR
                      </button>
                    ) : (
                      <span
                        className="small"
                        style={{
                          color: 'var(--text3)',
                        }}
                      >
                        Verified
                      </span>
                    )}
                    <button
                      className="btn btn-xs btn-danger"
                      onClick={() => onCancelReg(registration.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
