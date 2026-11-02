import ImageWithFallback from '../../../app/ImageWithFallback.jsx';
export // ════════════════════════════════════════════════
//  PROFILE
// ════════════════════════════════════════════════
function EmployeeProfile({
  registrations: allRegistrations,
  supportRequests: allSupportRequests,
  financeTransactions,
  events: allEvents,
  eventOperationsTasks,
  financeRefunds,
  eventRequests,
  onNavigate,
  user: currentUser,
  EMPLOYEE_TYPE_LABELS,
}) {
  const type = currentUser.employeeType;
  const profile = {
    REGISTRATION_VERIFICATION: {
      title: 'User Executive',
      purpose:
        'Protect event access by reviewing registrations, validating attendee documents, and resolving account verification issues.',
      focus: [
        'Review pending registrations and identity documents',
        'Verify attendee eligibility and ticket details',
        'Resolve account access and registration queries',
      ],
      primaryAction: () => onNavigate('registrations'),
      primaryLabel: 'Open Registrations',
      secondaryAction: () => onNavigate('attendees'),
      secondaryLabel: 'Manage Attendees',
    },
    EVENT_OPERATIONS: {
      title: 'Event Executive',
      purpose:
        'Coordinate event readiness and live delivery, from event information and operational plans to post-event reporting.',
      focus: [
        'Maintain event schedules, venues, and operational details',
        'Prepare and track event-operation tasks',
        'Coordinate changes with organizers and clients',
      ],
      primaryAction: () => onNavigate('events'),
      primaryLabel: 'Manage Events',
      secondaryAction: () => onNavigate('event-requests'),
      secondaryLabel: 'Open Operations',
    },
    SUPPORT_FINANCE: {
      title: 'Customer Support & Finance Executive',
      purpose:
        'Resolve customer requests and maintain accurate payment, refund, and service-operation records.',
      focus: [
        'Respond to customer support requests',
        'Review transactions and refund cases',
        'Maintain service and finance operational reports',
      ],
      primaryAction: () => onNavigate('support-center'),
      primaryLabel: 'Open Support Center',
      secondaryAction: () => onNavigate('finance'),
      secondaryLabel: 'Open Finance',
    },
  }[type];
  if (!profile) return '';
  const registrations = allRegistrations || [];
  const supportRequests = allSupportRequests || [];
  const transactions = financeTransactions || [];
  const events = allEvents || [];
  const verificationPending = registrations.filter(
    registration =>
      !registration.verified ||
      ['Pending Review', 'Flagged', 'pending'].includes(
        registration.verificationStatus || registration.status
      )
  ).length;
  const verified = registrations.filter(
    registration => registration.verified || registration.verificationStatus === 'Verified'
  ).length;
  const activeEvents = events.filter(event =>
    ['upcoming', 'ongoing'].includes(event.status)
  ).length;
  const operationalTasks = (eventOperationsTasks || []).filter(
    task => !task.status || !['completed', 'done'].includes(String(task.status).toLowerCase())
  ).length;
  const openSupport = supportRequests.filter(
    request => !['Resolved', 'Closed'].includes(request.status)
  ).length;
  const refundsToReview = (financeRefunds || []).filter(
    r => !['Approved', 'Completed', 'Rejected'].includes(r.status)
  ).length;
  const metrics =
    type === 'REGISTRATION_VERIFICATION'
      ? [
          ['Pending reviews', verificationPending, 'var(--yellow)'],
          ['Verified attendees', verified, 'var(--green)'],
          ['Registration records', registrations.length, 'var(--accent)'],
        ]
      : type === 'EVENT_OPERATIONS'
      ? [
          ['Active events', activeEvents, 'var(--accent)'],
          ['Open operations tasks', operationalTasks, 'var(--yellow)'],
          ['Event requests', (eventRequests || []).length, 'var(--green)'],
        ]
      : [
          ['Open support requests', openSupport, 'var(--yellow)'],
          ['Transactions reviewed', transactions.length, 'var(--blue)'],
          ['Refunds awaiting review', refundsToReview, 'var(--red)'],
        ];
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">My Employee Profile</div>
          <div className="page-sub">Your department responsibilities and work overview.</div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-ghost" onClick={() => onNavigate('settings')}>
            Edit Profile
          </button>
        </div>
      </div>
      <div className="profile-banner">
        {currentUser.avatarImage ? (
          <div className="av av-xl">
            <ImageWithFallback
              src={currentUser.avatarImage}
              alt={currentUser.name}
              fallbackTag="span"
              fallbackProps={{
                style: {
                  display: 'block',
                },
              }}
            >
              {currentUser.avatar || currentUser.name[0]}
            </ImageWithFallback>
          </div>
        ) : (
          <div className="av av-xl">{currentUser.avatar || currentUser.name[0]}</div>
        )}
        <div className="profile-info">
          <div className="profile-name">{currentUser.name}</div>
          <div className="profile-role-tag">{profile.title}</div>
          <div className="small mt-4">{currentUser.service || EMPLOYEE_TYPE_LABELS[type]}</div>
          <span className="badge badge-green mt-8">Active employee account</span>
        </div>
      </div>
      <div className="grid-3 mb-20">
        {metrics.map(([label, value, color]) => (
          <div className="card" key={label}>
            <div className="label">{label}</div>
            <div
              className="stat-value"
              style={{
                color: color,
                marginTop: '10px',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
      <div
        className="grid-2"
        style={{
          alignItems: 'start',
          gap: '20px',
        }}
      >
        <div className="card">
          <div className="h4 mb-14">Role &amp; Responsibilities</div>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text2)',
              lineHeight: '1.7',
              marginBottom: '16px',
            }}
          >
            {profile.purpose}
          </p>
          <div className="label mb-8">Core responsibilities</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {profile.focus.map((item, index) => (
              <div
                style={{
                  display: 'flex',
                  gap: '9px',
                  alignItems: 'flex-start',
                  color: 'var(--text2)',
                }}
                key={
                  item?.id ??
                  item?.requestId ??
                  item?.eventId ??
                  item?.registrationId ??
                  item?.reportId ??
                  item?.label ??
                  (typeof item === 'string' || typeof item === 'number' ? item : index)
                }
              >
                <span
                  style={{
                    color: 'var(--green)',
                    fontWeight: '700',
                  }}
                >
                  ✓
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div className="card">
            <div className="h4 mb-14">Employee Details</div>
            <div className="info-row">
              <span className="info-label">Department</span>
              <span className="info-value">{EMPLOYEE_TYPE_LABELS[type]}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{currentUser.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone</span>
              <span className="info-value">{currentUser.phone || 'Not set'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Location</span>
              <span className="info-value">{currentUser.city || 'Not set'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Member since</span>
              <span className="info-value">{currentUser.joined || 'Not set'}</span>
            </div>
          </div>
          <div className="card">
            <div className="h4 mb-14">Work Tools</div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <button className="btn btn-primary w-full" onClick={profile.primaryAction}>
                {profile.primaryLabel}
              </button>
              <button className="btn btn-ghost w-full" onClick={profile.secondaryAction}>
                {profile.secondaryLabel}
              </button>
              <button className="btn btn-ghost w-full" onClick={() => onNavigate('reports')}>
                View Department Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
