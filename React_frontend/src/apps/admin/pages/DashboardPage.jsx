import { useAdminContext } from '../context/AdminContext.jsx';
import { AnalyticsBars, AnalyticsLine, AnalyticsProgress } from '../components/AnalyticsCharts.jsx';
export default function DashboardPage() {
  const portalContext = useAdminContext();
  const portalActions = portalContext.actions;
  const { CU: currentUser, DB: workspaceData } = portalContext;
  const d = portalContext.dashboardData;
  const totalUsers = workspaceData.users.length;
  const totalEvents = workspaceData.events.length;
  const totalRegs = workspaceData.registrations.length;
  const revenue = (workspaceData.financeTransactions || [])
    .filter(payment => payment.status === 'Successful')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingReqs = workspaceData.eventRequests.filter(request =>
    [
      'pending',
      'submitted',
      'planning',
      'changes_requested',
      'counteroffered',
      'plan_submitted',
      'plan_revision_requested',
    ].includes(request.status)
  ).length;
  const roleCounts = {
    employee: workspaceData.users.filter(user => user.role === 'employee').length,
    superuser: workspaceData.users.filter(user => user.role === 'superuser').length,
    organizer: workspaceData.users.filter(user => user.role === 'organizer').length,
    client: workspaceData.users.filter(user => user.role === 'client').length,
    attendee: workspaceData.users.filter(user => user.role === 'attendee').length,
  };
  const eventStatusCounts = {
    upcoming: workspaceData.events.filter(
      event => event.status === 'upcoming' || event.status === 'published'
    ).length,
    ongoing: workspaceData.events.filter(event => event.status === 'ongoing').length,
    completed: workspaceData.events.filter(event => event.status === 'completed').length,
    draft: workspaceData.events.filter(event => event.status === 'draft').length,
  };
  const requestStatusCounts = {
    pending: workspaceData.eventRequests.filter(request =>
      [
        'pending',
        'submitted',
        'planning',
        'changes_requested',
        'counteroffered',
        'plan_submitted',
        'plan_revision_requested',
      ].includes(request.status)
    ).length,
    approved: workspaceData.eventRequests.filter(request =>
      ['approved', 'confirmed', 'completed'].includes(request.status)
    ).length,
    rejected: workspaceData.eventRequests.filter(request => request.status === 'rejected').length,
  };
  const activeEvents = eventStatusCounts.upcoming + eventStatusCounts.ongoing;
  const paidRegistrations = workspaceData.registrations.filter(
    registration => Number(registration.amount) > 0
  ).length;
  const months = Array.from(
    {
      length: 6,
    },
    (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const records = workspaceData.registrations.filter(
        registration =>
          String(registration.date || registration.createdAt || '').slice(0, 7) === key
      );
      return {
        label: date.toLocaleString('en-IN', {
          month: 'short',
        }),
        registrations: records.length,
        revenue: records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
      };
    }
  );

  // Refresh the overview as one set so headline figures and breakdowns agree.

  return (
    <div className="admin-overview">
      <>
        <div className="page-hd admin-overview-head">
          <>
            <div className="page-hd-left">
              <>
                <div className="admin-eyebrow">
                  <>EVENTFLOW / CONTROL CENTER</>
                </div>
                <div className="page-title">
                  <>Platform overview</>
                </div>
                <div className="page-sub">
                  <>
                    Welcome back, {currentUser.name}. A clear view of activity across your platform.
                  </>
                </div>
              </>
            </div>
            <div className="page-hd-right">
              <>
                <button
                  className="btn btn-ghost"
                  onClick={() => portalActions.onNavigate('user-reports')}
                >
                  <>View user reports</>
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => portalActions.onNavigate('revenue-reports')}
                >
                  <>Open reports ↗</>
                </button>
              </>
            </div>
          </>
        </div>
        <div className="admin-overview-kpis">
          <>
            <div className="card admin-kpi">
              <>
                <div className="admin-kpi-top">
                  <>
                    <span className="admin-kpi-icon">
                      <>👥</>
                    </span>
                    <span className="admin-kpi-tag">
                      <>AUDIENCE</>
                    </span>
                  </>
                </div>
                <div className="admin-kpi-label">
                  <>Total users</>
                </div>
                <div className="admin-kpi-value" id="adm-stat-users">
                  {d?.users && d?.events && d?.registrations ? d.users.total : totalUsers}
                </div>
                <div className="admin-kpi-foot" id="adm-users-detail">
                  {d?.users && d?.events && d?.registrations ? (
                    `${d.users.byRole?.attendee || 0} attendees · ${
                      d.users.byRole?.event_organizer || 0
                    } organizers`
                  ) : (
                    <>
                      {roleCounts.attendee} attendees · {roleCounts.organizer} organizers
                    </>
                  )}
                </div>
              </>
            </div>
            <div className="card admin-kpi">
              <>
                <div className="admin-kpi-top">
                  <>
                    <span className="admin-kpi-icon admin-kpi-icon--green">
                      <>▣</>
                    </span>
                    <span className="admin-kpi-tag">
                      <>EVENTS</>
                    </span>
                  </>
                </div>
                <div className="admin-kpi-label">
                  <>Total events</>
                </div>
                <div className="admin-kpi-value" id="adm-stat-events">
                  {d?.users && d?.events && d?.registrations ? d.events.total : totalEvents}
                </div>
                <div className="admin-kpi-foot" id="adm-events-detail">
                  {d?.users && d?.events && d?.registrations ? (
                    `${(d.events.published || 0) + (d.events.ongoing || 0)} published or ongoing`
                  ) : (
                    <>{activeEvents} published or ongoing</>
                  )}
                </div>
              </>
            </div>
            <div className="card admin-kpi">
              <>
                <div className="admin-kpi-top">
                  <>
                    <span className="admin-kpi-icon admin-kpi-icon--amber">
                      <>◎</>
                    </span>
                    <span className="admin-kpi-tag">
                      <>ACTIVITY</>
                    </span>
                  </>
                </div>
                <div className="admin-kpi-label">
                  <>Registrations</>
                </div>
                <div className="admin-kpi-value" id="adm-stat-regs">
                  {d?.users && d?.events && d?.registrations ? d.registrations.total : totalRegs}
                </div>
                <div className="admin-kpi-foot" id="adm-regs-detail">
                  {d?.users && d?.events && d?.registrations ? (
                    'Total registration records'
                  ) : (
                    <>{paidRegistrations} with recorded amount</>
                  )}
                </div>
              </>
            </div>
            <div className="card admin-kpi">
              <>
                <div className="admin-kpi-top">
                  <>
                    <span className="admin-kpi-icon admin-kpi-icon--violet">
                      <>₹</>
                    </span>
                    <span className="admin-kpi-tag">
                      <>REVENUE</>
                    </span>
                  </>
                </div>
                <div className="admin-kpi-label">
                  <>Recorded revenue</>
                </div>
                <div className="admin-kpi-value" id="adm-stat-rev">
                  {d?.users && d?.events && d?.registrations ? (
                    '₹' + ((d.payments?.totalRevenue || 0) / 1000).toFixed(1) + 'K'
                  ) : (
                    <>₹{(revenue / 1000).toFixed(1)}K</>
                  )}
                </div>
                <div className="admin-kpi-foot" id="adm-stat-pending">
                  {d?.users && d?.events && d?.registrations ? (
                    (d.eventRequests?.pending || 0) + ' requests pending'
                  ) : (
                    <>
                      {pendingReqs} request{pendingReqs === 1 ? '' : 's'} pending
                    </>
                  )}
                </div>
              </>
            </div>
          </>
        </div>
        <div className="admin-overview-main">
          <>
            <div className="card admin-overview-trend">
              <>
                <div className="admin-panel-head">
                  <>
                    <div>
                      <>
                        <div className="h4">
                          <>Registration trend</>
                        </div>
                        <div className="small">
                          <>Recorded registrations in the last six months</>
                        </div>
                      </>
                    </div>
                    <span className="admin-panel-chip">
                      <>6 months</>
                    </span>
                  </>
                </div>
                <AnalyticsLine
                  ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
                  adminChartLine={portalContext.adminChartLine}
                  adminChartNumber={portalContext.adminChartNumber}
                  items={months.map((row, index) => ({
                    label: row.label,
                    value: row.registrations,
                  }))}
                  height={280}
                  options={{
                    label: 'Registrations',
                  }}
                />
              </>
            </div>
            <div className="card admin-overview-snapshot">
              <>
                <div className="admin-panel-head">
                  <div>
                    <>
                      <div className="h4">
                        <>Platform snapshot</>
                      </div>
                      <div className="small">
                        <>Current records</>
                      </div>
                    </>
                  </div>
                </div>
                <div className="admin-snapshot-row">
                  <>
                    <span className="admin-snapshot-mark">
                      <>▣</>
                    </span>
                    <span>
                      <>
                        Active events
                        <small>
                          <>Published and ongoing</>
                        </small>
                      </>
                    </span>
                    <strong id="adm-snapshot-events">
                      {d?.users && d?.events && d?.registrations
                        ? (d.events.published || 0) + (d.events.ongoing || 0)
                        : activeEvents}
                    </strong>
                  </>
                </div>
                <div className="admin-snapshot-row">
                  <>
                    <span className="admin-snapshot-mark admin-snapshot-mark--amber">
                      <>◷</>
                    </span>
                    <span>
                      <>
                        Pending requests
                        <small>
                          <>Awaiting review</>
                        </small>
                      </>
                    </span>
                    <strong id="adm-snapshot-requests">
                      {d?.users && d?.events && d?.registrations
                        ? d.eventRequests?.pending || 0
                        : requestStatusCounts.pending}
                    </strong>
                  </>
                </div>
                <button
                  className="admin-panel-link"
                  onClick={() => portalActions.onNavigate('event-reports')}
                >
                  <>
                    Explore event reports{' '}
                    <span>
                      <>→</>
                    </span>
                  </>
                </button>
              </>
            </div>
          </>
        </div>
        <div className="admin-overview-lower">
          <>
            <div className="card">
              <>
                <div className="admin-panel-head">
                  <>
                    <div>
                      <>
                        <div className="h4">
                          <>User mix</>
                        </div>
                        <div className="small">
                          <>Accounts by platform role</>
                        </div>
                      </>
                    </div>
                    <button
                      className="admin-panel-link"
                      onClick={() => portalActions.onNavigate('user-reports')}
                    >
                      <>View details →</>
                    </button>
                  </>
                </div>
                <div id="adm-role-chart">
                  {d?.users && d?.events && d?.registrations ? (
                    <AnalyticsBars
                      ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
                      adminChartLine={portalContext.adminChartLine}
                      adminChartNumber={portalContext.adminChartNumber}
                      items={[
                        {
                          label: 'Admins',
                          value: d.users.byRole?.super_admin || 0,
                        },
                        {
                          label: 'Organizers',
                          value: d.users.byRole?.event_organizer || 0,
                        },
                        {
                          label: 'Clients',
                          value: d.users.byRole?.client || 0,
                        },
                        {
                          label: 'Employees',
                          value: d.users.byRole?.employee || 0,
                        },
                        {
                          label: 'Attendees',
                          value: d.users.byRole?.attendee || 0,
                        },
                      ]}
                      height={175}
                    />
                  ) : (
                    <AnalyticsBars
                      ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
                      adminChartLine={portalContext.adminChartLine}
                      adminChartNumber={portalContext.adminChartNumber}
                      items={[
                        {
                          label: 'Admins',
                          value: roleCounts.superuser,
                        },
                        {
                          label: 'Organizers',
                          value: roleCounts.organizer,
                        },
                        {
                          label: 'Clients',
                          value: roleCounts.client,
                        },
                        {
                          label: 'Employees',
                          value: roleCounts.employee,
                        },
                        {
                          label: 'Attendees',
                          value: roleCounts.attendee,
                        },
                      ]}
                      height={175}
                    />
                  )}
                </div>
              </>
            </div>
            <div className="card">
              <>
                <div className="admin-panel-head">
                  <div>
                    <>
                      <div className="h4">
                        <>Request pipeline</>
                      </div>
                      <div className="small" id="adm-request-total">
                        {d?.users && d?.events && d?.registrations ? (
                          `${d.eventRequests?.total || 0} event requests`
                        ) : (
                          <>
                            {requestStatusCounts.pending +
                              requestStatusCounts.approved +
                              requestStatusCounts.rejected}{' '}
                            event requests
                          </>
                        )}
                      </div>
                    </>
                  </div>
                </div>
                <div id="adm-requests-chart">
                  {d?.users && d?.events && d?.registrations ? (
                    <AnalyticsProgress
                      items={[
                        {
                          label: 'Pending',
                          value: d.eventRequests?.pending || 0,
                          color: 'var(--yellow)',
                        },
                        {
                          label: 'Approved',
                          value: d.eventRequests?.approved || 0,
                          color: 'var(--green)',
                        },
                        {
                          label: 'Rejected',
                          value: d.eventRequests?.rejected || 0,
                          color: 'var(--red)',
                        },
                      ]}
                    />
                  ) : (
                    <AnalyticsProgress
                      items={[
                        {
                          label: 'Pending',
                          value: requestStatusCounts.pending,
                          color: 'var(--yellow)',
                        },
                        {
                          label: 'Approved',
                          value: requestStatusCounts.approved,
                          color: 'var(--green)',
                        },
                        {
                          label: 'Rejected',
                          value: requestStatusCounts.rejected,
                          color: 'var(--red)',
                        },
                      ]}
                    />
                  )}
                </div>
              </>
            </div>
            <div className="card">
              <>
                <div className="admin-panel-head">
                  <div>
                    <>
                      <div className="h4">
                        <>Event coverage</>
                      </div>
                      <div className="small">
                        <>Events by current status</>
                      </div>
                    </>
                  </div>
                </div>
                <div id="adm-events-chart">
                  {d?.users && d?.events && d?.registrations ? (
                    <AnalyticsBars
                      ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
                      adminChartLine={portalContext.adminChartLine}
                      adminChartNumber={portalContext.adminChartNumber}
                      items={[
                        {
                          label: 'Published',
                          value: d.events.published || 0,
                        },
                        {
                          label: 'Ongoing',
                          value: d.events.ongoing || 0,
                        },
                        {
                          label: 'Completed',
                          value: d.events.completed || 0,
                        },
                        {
                          label: 'Draft',
                          value: d.events.draft || 0,
                        },
                      ]}
                      height={175}
                    />
                  ) : (
                    <AnalyticsBars
                      ADMIN_CHART_COLORS={portalContext.ADMIN_CHART_COLORS}
                      adminChartLine={portalContext.adminChartLine}
                      adminChartNumber={portalContext.adminChartNumber}
                      items={[
                        {
                          label: 'Published',
                          value: eventStatusCounts.upcoming,
                        },
                        {
                          label: 'Ongoing',
                          value: eventStatusCounts.ongoing,
                        },
                        {
                          label: 'Completed',
                          value: eventStatusCounts.completed,
                        },
                        {
                          label: 'Draft',
                          value: eventStatusCounts.draft,
                        },
                      ]}
                      height={175}
                    />
                  )}
                </div>
              </>
            </div>
          </>
        </div>
      </>
    </div>
  );
}
