import DashboardUpcomingEvents from '../components/DashboardUpcomingEvents.jsx';
import DashboardActivity from '../components/DashboardActivity.jsx';
import { useClientContext } from '../context/ClientContext.jsx';
import useClientActivity from '../context/useClientActivity.js';
import { compareNewestFirst } from '../../../app/record-order.js';
export default function DashboardPage() {
  const portalContext = useClientContext();
  const portalActions = portalContext.actions;
  const { CU: currentUser, DB: workspaceData } = portalContext;
  const activity = useClientActivity(portalContext);
  const upcomingEvents = workspaceData.events
    .filter(
      event =>
        event.backendStatus === 'published' &&
        event.visibility !== 'private' &&
        !event.backendClientId &&
        !event.clientId &&
        new Date(`${event.date}T23:59:59`).getTime() >= Date.now()
    )
    .sort(compareNewestFirst);
  const clientRequests = workspaceData.eventRequests.filter(
    request => String(request.clientId) === String(currentUser.id)
  );
  const approvedCount = clientRequests.filter(request => request.status === 'approved').length;
  const inProgressCount = clientRequests.filter(request =>
    ['pending', 'in_review'].includes(request.status)
  ).length;
  const proposalCount = clientRequests.filter(request => request.status === 'proposal_sent').length;
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Client Dashboard</div>
          <div className="page-sub">Track your event requests and upcoming events.</div>
        </div>
        <div className="page-hd-right">
          <button
            className="btn btn-primary"
            onClick={() => portalActions.onNavigate('find-organizers')}
          >
            + New Request
          </button>
        </div>
      </div>
      <div className="grid-3 mb-20">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
            }}
          >
            📋
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--accent)',
            }}
          >
            {clientRequests.length}
          </div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: 'var(--green-dim)',
              color: 'var(--green)',
            }}
          >
            ✅
          </div>
          <div
            className="stat-value"
            style={{
              color: 'var(--green)',
            }}
          >
            {approvedCount}
          </div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
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
            style={{
              color: 'var(--yellow)',
            }}
          >
            {inProgressCount}
          </div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>
      {proposalCount > 0 ? (
        <div
          style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid var(--accent)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontWeight: '700',
                fontSize: '15px',
                color: 'var(--text)',
              }}
            >
              📝 Proposal Received!
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text2)',
              }}
            >
              You have {proposalCount} event proposal(s) awaiting your review.
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => portalActions.onNavigate('request-status')}
          >
            Review Proposals
          </button>
        </div>
      ) : (
        ''
      )}
      <div
        className="card"
        id="client-upcoming-events"
        aria-live="polite"
        style={{
          marginBottom: '20px',
        }}
      >
        <DashboardUpcomingEvents
          events={upcomingEvents}
          onViewEvent={portalActions.onViewClientPublishedEvent}
          clientUpcomingEventDate={portalContext.clientUpcomingEventDate}
        />
      </div>
      <div className="card" id="client-recent-activity" aria-live="polite">
        <DashboardActivity
          rows={activity.rows}
          loading={activity.loading}
          error={activity.error}
          onRetry={activity.retry}
          onViewRequest={requestId =>
            requestId
              ? portalActions.onOpenClientRequestFromActivity(requestId)
              : portalActions.onNavigate('request-status')
          }
          clientActivityLabel={portalContext.clientActivityLabel}
          clientActivityIcon={portalContext.clientActivityIcon}
          clientActivityTime={portalContext.clientActivityTime}
          reqBadge={portalContext.reqBadge}
        />
      </div>
    </>
  );
}
