import ImageWithFallback from '../../../app/ImageWithFallback.jsx';
import { useAdminContext } from '../context/AdminContext.jsx';
import { EmployeeProfile } from '../components/EmployeeProfile.jsx';
export default function ProfilePage() {
  const portalContext = useAdminContext();
  const portalActions = portalContext.actions;
  const {
    CU: currentUser,
    DB: workspaceData,
    ROLE_COLORS,
    ROLE_LABELS,
    isDepartmentEmployee,
  } = portalContext;
  if (isDepartmentEmployee())
    return (
      <EmployeeProfile
        registrations={portalContext.DB.registrations}
        supportRequests={portalContext.DB.supportRequests}
        financeTransactions={portalContext.DB.financeTransactions}
        events={portalContext.DB.events}
        eventOperationsTasks={portalContext.DB.eventOperationsTasks}
        financeRefunds={portalContext.DB.financeRefunds}
        eventRequests={portalContext.DB.eventRequests}
        onNavigate={portalContext.actions.onNavigate}
        user={portalContext.CU}
        EMPLOYEE_TYPE_LABELS={portalContext.EMPLOYEE_TYPE_LABELS}
      />
    );
  const regs =
    currentUser.role === 'attendee'
      ? workspaceData.registrations.filter(
          registration => registration.attendeeId === currentUser.id
        )
      : [];
  const myEvs =
    currentUser.role === 'organizer'
      ? workspaceData.events.filter(event => event.organizer === currentUser.id)
      : [];
  const isSF = currentUser.role === 'employee' && currentUser.employeeType === 'SUPPORT_FINANCE';
  const sfSupportHandled = (workspaceData.supportRequests || []).length;
  const sfResolved = (workspaceData.supportRequests || []).filter(
    r => r.status === 'Resolved' || r.status === 'Closed'
  ).length;
  const sfTxnsReviewed = (workspaceData.financeTransactions || []).length;
  const sfReportsSubmitted = (workspaceData.operationalReports || []).filter(
    r => r.status === 'Submitted' || r.status === 'Reviewed'
  ).length;
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">My Profile</div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-ghost" onClick={() => portalActions.onNavigate('settings')}>
            ✏️ Edit Profile
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
          <div className="profile-role-tag">
            {isSF ? 'Customer Support &amp; Finance Executive' : ROLE_LABELS[currentUser.role]}
          </div>
          {currentUser.company ? <div className="small mt-4">{currentUser.company}</div> : ''}
          {currentUser.specialization ? (
            <div className="small mt-4">Specialization: {currentUser.specialization}</div>
          ) : (
            ''
          )}
          {currentUser.service ? (
            <div className="small mt-4">Service: {currentUser.service}</div>
          ) : (
            ''
          )}
          <span className="badge badge-green mt-8">Active Account</span>
        </div>
      </div>
      <div
        className="grid-2"
        style={{
          alignItems: 'start',
          gap: '20px',
        }}
      >
        <div className="card">
          <div className="h4 mb-14">Contact Information</div>
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{currentUser.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone</span>
            <span className="info-value">{currentUser.phone || 'Not set'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Member Since</span>
            <span className="info-value">{currentUser.joined || '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Role</span>
            <span className="info-value">
              <span className={`badge badge-${ROLE_COLORS[currentUser.role]}`}>
                {isSF ? 'Customer Support &amp; Finance Executive' : currentUser.role}
              </span>
            </span>
          </div>
          {currentUser.bio ? (
            <div className="mt-14">
              <div className="label mb-8">Bio</div>
              <p
                style={{
                  fontSize: '13.5px',
                  color: 'var(--text2)',
                  lineHeight: '1.7',
                }}
              >
                {currentUser.bio}
              </p>
            </div>
          ) : (
            ''
          )}
        </div>
        <div>
          {isSF ? (
            <div className="card mb-16">
              <div className="h4 mb-14">Work Summary</div>
              <div className="info-row">
                <span className="info-label">Support Requests Handled</span>
                <span
                  className="info-value"
                  style={{
                    color: 'var(--accent)',
                    fontWeight: '700',
                  }}
                >
                  {sfSupportHandled}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Issues Resolved</span>
                <span
                  className="info-value"
                  style={{
                    color: 'var(--green)',
                    fontWeight: '700',
                  }}
                >
                  {sfResolved}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Transactions Reviewed</span>
                <span
                  className="info-value"
                  style={{
                    color: 'var(--blue)',
                    fontWeight: '700',
                  }}
                >
                  {sfTxnsReviewed}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Reports Submitted</span>
                <span
                  className="info-value"
                  style={{
                    color: 'var(--purple)',
                    fontWeight: '700',
                  }}
                >
                  {sfReportsSubmitted}
                </span>
              </div>
            </div>
          ) : currentUser.role === 'attendee' ? (
            <div className="card mb-16">
              <div className="h4 mb-14">Activity Summary</div>
              <div className="info-row">
                <span className="info-label">Events Registered</span>
                <span className="info-value">{regs.length}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Upcoming Events</span>
                <span
                  className="info-value"
                  style={{
                    color: 'var(--accent)',
                  }}
                >
                  {
                    regs.filter(registration => {
                      const event = workspaceData.events.find(
                        currentEvent => currentEvent.id === registration.eventId
                      );
                      return event && event.status === 'upcoming';
                    }).length
                  }
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Events Attended</span>
                <span
                  className="info-value"
                  style={{
                    color: 'var(--green)',
                  }}
                >
                  {regs.filter(registration => registration.checkedIn).length}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Total Spent</span>
                <span
                  className="info-value"
                  style={{
                    color: 'var(--green)',
                    fontWeight: '700',
                  }}
                >
                  ₹{regs.reduce((total, registration) => total + registration.amount, 0)}
                </span>
              </div>
            </div>
          ) : currentUser.role === 'organizer' ? (
            <div className="card mb-16">
              <div className="h4 mb-14">Event Summary</div>
              <div className="info-row">
                <span className="info-label">Total Events</span>
                <span className="info-value">{myEvs.length}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Upcoming</span>
                <span
                  className="info-value"
                  style={{
                    color: 'var(--accent)',
                  }}
                >
                  {myEvs.filter(e => e.status === 'upcoming').length}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Completed</span>
                <span
                  className="info-value"
                  style={{
                    color: 'var(--green)',
                  }}
                >
                  {myEvs.filter(e => e.status === 'completed').length}
                </span>
              </div>
            </div>
          ) : (
            ''
          )}
          <div className="card">
            <div className="h4 mb-14">Quick Actions</div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <button
                className="btn btn-ghost w-full"
                onClick={() => portalActions.onNavigate('settings')}
              >
                ⚙️ Account Settings
              </button>
              <button className="btn btn-danger w-full" onClick={() => portalActions.onSignOut()}>
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════
