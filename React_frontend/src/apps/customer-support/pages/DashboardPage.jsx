import { useSupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
import { listOrEmpty } from '../../../app/view-utils.js';
export default function DashboardPage() {
  const portalContext = useSupportExecutiveContext();
  const portalActions = portalContext.actions;
  const { CU: currentUser, DB: workspaceData } = portalContext;
  const d = portalContext.dashboardData;
  const users = window.EventFlowAccountPolicy.visibleAccounts(
    currentUser,
    workspaceData.users || []
  );
  const events = workspaceData.events || [];
  const regs = workspaceData.registrations || [];
  const tasks = workspaceData.eventOperationsTasks || [];
  const queries = workspaceData.userQueries || [];
  const supportReqs = workspaceData.supportRequests || [];
  const totalUsers = users.length;
  const totalEvents = events.length;
  const pendingRegs = regs.filter(registration => {
    const st = (registration.status || '').toLowerCase();
    const vst = (registration.verificationStatus || '').toLowerCase();
    return (
      !registration.reviewStatus &&
      !registration.verified &&
      !['rejected', 'cancelled', 'attended', 'no-show'].includes(st) &&
      (st === 'pending' || st === 'registered' || vst === 'pending review' || vst === 'pending')
    );
  }).length;
  const openTickets =
    supportReqs.filter(request => request.status !== 'Resolved' && request.status !== 'Closed')
      .length + queries.filter(q => q.status !== 'Resolved').length;
  const operationalIssues = tasks.filter(task => task.status !== 'Resolved').length;
  const activeEventsCount = events.filter(event =>
    ['published', 'active', 'ongoing', 'upcoming'].includes((event.status || '').toLowerCase())
  ).length;

  // Pending actions list
  const pendingActionsList = [];
  regs
    .filter(registration => {
      const st = (registration.status || '').toLowerCase();
      const vst = (registration.verificationStatus || '').toLowerCase();
      return (
        !registration.reviewStatus &&
        !registration.verified &&
        !['rejected', 'cancelled', 'attended', 'no-show'].includes(st) &&
        (st === 'pending' || st === 'registered' || vst === 'pending review' || vst === 'pending')
      );
    })
    .slice(0, 3)
    .forEach(registration => {
      const eventRegistration = users.find(
        user => String(user.id) === String(registration.attendeeId)
      ) || {
        name: 'Attendee',
      };
      const e = events.find(event => String(event.id) === String(registration.eventId)) || {
        title: 'Event',
      };
      pendingActionsList.push({
        type: 'Registration Review',
        title: `${eventRegistration.name} · ${e.title}`,
        badge: 'Pending Review',
        badgeCls: 'yellow',
        actionLbl: 'Review',
        actionFn: () => portalActions.onOpenReviewRegistrationModal(registration.id),
        icon: '📝',
      });
    });
  supportReqs
    .filter(request => request.status !== 'Resolved' && request.status !== 'Closed')
    .slice(0, 2)
    .forEach(request => {
      pendingActionsList.push({
        type: 'Customer Support',
        title: `${request.subject}`,
        badge: request.status || 'Pending',
        badgeCls: request.status === 'In Progress' ? 'purple' : 'yellow',
        actionLbl: 'Manage',
        actionFn: () => portalActions.onOpenSupportTicketModal(request.id),
        icon: '🎧',
      });
    });
  tasks
    .filter(task => task.status !== 'Resolved')
    .slice(0, 2)
    .forEach(task => {
      pendingActionsList.push({
        type: 'Operational Issue',
        title: `${task.eventTitle} · ${task.type}`,
        badge: task.status || 'Pending',
        badgeCls: task.status === 'In Progress' ? 'purple' : 'yellow',
        actionLbl: 'Update',
        actionFn: () => portalActions.onOpenSupportExecutiveRequest(task.id),
        icon: '⚙️',
      });
    });

  // Recent Activity
  const recentActivities = [
    ...regs.slice(0, 2).map((registration, index) => {
      const eventRegistration = users.find(
        user => String(user.id) === String(registration.attendeeId)
      ) || {
        name: 'Attendee',
      };
      const e = events.find(event => String(event.id) === String(registration.eventId)) || {
        title: 'Event',
      };
      return {
        icon: '📝',
        title: `Registration: ${eventRegistration.name}`,
        detail: `${e.title} · Status: ${
          registration.verificationStatus || registration.status || 'Verified'
        }`,
        time: registration.date || 'Today',
      };
    }),
    ...tasks.slice(0, 2).map((task, index) => ({
      icon: '⚙️',
      title: `Operational Task: ${task.type}`,
      detail: `${task.eventTitle} · Status: ${task.status}`,
      time: task.updated || 'Recently',
    })),
    ...queries.slice(0, 2).map((q, index) => ({
      icon: '🎧',
      title: `Support Ticket: ${q.subject}`,
      detail: `${q.userName} · Status: ${q.status}`,
      time: q.date || 'Recently',
    })),
  ];

  // Async backend stats sync

  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Support Executive Dashboard</div>
          <div className="page-sub">
            Welcome back, {currentUser.name}. Overview of users, events, registrations awaiting
            review, customer support, and operational issues.
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div
          className="stat-card"
          style={{
            cursor: 'pointer',
          }}
          onClick={() => portalActions.onSwitchTabAndNav('user-event-mgmt', 'users')}
          title="Click to view Users"
        >
          <div
            className="stat-icon"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
            }}
          >
            👥
          </div>
          <div
            className="stat-value"
            id="se-stat-users"
            style={{
              color: 'var(--accent)',
            }}
          >
            {d && d.totalUsers !== undefined ? d.totalUsers : totalUsers}
          </div>
          <div className="stat-label">Total Users</div>
          <div className="stat-sub neutral">Click to manage users →</div>
        </div>
        <div
          className="stat-card"
          style={{
            cursor: 'pointer',
          }}
          onClick={() => portalActions.onSwitchTabAndNav('user-event-mgmt', 'events')}
          title="Click to view Events"
        >
          <div
            className="stat-icon"
            style={{
              background: 'var(--green-dim)',
              color: 'var(--green)',
            }}
          >
            🗓️
          </div>
          <div
            className="stat-value"
            id="se-stat-events"
            style={{
              color: 'var(--green)',
            }}
          >
            {d && d.totalEvents !== undefined ? d.totalEvents : totalEvents}
          </div>
          <div className="stat-label">Total Events</div>
          <div className="stat-sub neutral">{activeEventsCount} active · Click to view →</div>
        </div>
        <div
          className="stat-card"
          style={{
            cursor: 'pointer',
          }}
          onClick={() =>
            portalActions.onSwitchTabAndNav('user-event-mgmt', 'events', 'pending_regs')
          }
          title="Click to review Registrations"
        >
          <div
            className="stat-icon"
            style={{
              background: 'var(--yellow-dim)',
              color: 'var(--yellow)',
            }}
          >
            ⏳
          </div>
          <div
            className="stat-value"
            id="se-stat-regs"
            style={{
              color: 'var(--yellow)',
            }}
          >
            {d && d.registrationsAwaitingReview !== undefined
              ? d.registrationsAwaitingReview
              : pendingRegs}
          </div>
          <div className="stat-label">Registrations Awaiting Review</div>
          <div className="stat-sub up">Needs verification →</div>
        </div>
        <div
          className="stat-card"
          style={{
            cursor: 'pointer',
          }}
          onClick={() => portalActions.onSwitchTabAndNav('support-issue-mgmt', 'support')}
          title="Click to view Support Tickets"
        >
          <div
            className="stat-icon"
            style={{
              background: 'var(--purple-dim)',
              color: 'var(--purple)',
            }}
          >
            🎧
          </div>
          <div
            className="stat-value"
            id="se-stat-tickets"
            style={{
              color: 'var(--purple)',
            }}
          >
            {d && d.openSupportTickets !== undefined ? d.openSupportTickets : openTickets}
          </div>
          <div className="stat-label">Open Support Tickets</div>
          <div className="stat-sub up">Customer inquiries →</div>
        </div>
        <div
          className="stat-card"
          style={{
            cursor: 'pointer',
          }}
          onClick={() => portalActions.onSwitchTabAndNav('support-issue-mgmt', 'operations')}
          title="Click to view Operational Issues"
        >
          <div
            className="stat-icon"
            style={{
              background: 'var(--red-dim)',
              color: 'var(--red)',
            }}
          >
            ⚙️
          </div>
          <div
            className="stat-value"
            id="se-stat-issues"
            style={{
              color: 'var(--red)',
            }}
          >
            {d && d.operationalIssues !== undefined ? d.operationalIssues : operationalIssues}
          </div>
          <div className="stat-label">Operational Issues</div>
          <div className="stat-sub up">Logistics &amp; tasks →</div>
        </div>
      </div>
      <div className="mb-20">
        <div className="card">
          <div className="h4 mb-14">Pending Actions &amp; Urgent Items</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '380px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {listOrEmpty(
              pendingActionsList.map((item, index) => (
                <div
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface2)',
                  }}
                  className="flex justify-between items-center gap-10"
                  key={item?.title ?? index}
                >
                  <div
                    className="flex items-center gap-10"
                    style={{
                      flex: '1',
                      minWidth: '0',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '18px',
                      }}
                    >
                      {item.icon}
                    </span>
                    <div
                      style={{
                        flex: '1',
                        minWidth: '0',
                      }}
                    >
                      <div className="flex items-center gap-6 mb-2">
                        <span
                          style={{
                            fontWeight: '700',
                            fontSize: '13px',
                            color: 'var(--text)',
                          }}
                          className="truncate"
                        >
                          {item.title}
                        </span>
                        <span
                          className={`badge badge-${item.badgeCls}`}
                          style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <div className="small muted truncate">{item.type}</div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-xs" onClick={item.actionFn}>
                    {item.actionLbl}
                  </button>
                </div>
              )),
              <div className="empty">✓ No pending actions requiring immediate attention!</div>
            )}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="h4 mb-14">Recent Platform Activity</div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {listOrEmpty(
            recentActivities.map((act, index) => (
              <div
                className="flex items-center gap-10"
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                }}
                key={act?.title ?? index}
              >
                <span
                  style={{
                    fontSize: '20px',
                  }}
                >
                  {act.icon}
                </span>
                <div
                  style={{
                    flex: '1',
                  }}
                >
                  <div
                    style={{
                      fontWeight: '600',
                      fontSize: '13px',
                    }}
                  >
                    {act.title}
                  </div>
                  <div className="small muted">{act.detail}</div>
                </div>
                <span
                  className="small muted"
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                >
                  {act.time}
                </span>
              </div>
            )),
            <div className="empty">No recent activity recorded</div>
          )}
        </div>
      </div>
    </>
  );
}
