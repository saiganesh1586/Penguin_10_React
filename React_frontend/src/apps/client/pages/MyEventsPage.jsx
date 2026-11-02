import { useState, useEffect, useCallback } from 'react';
import { useClientContext } from '../context/ClientContext.jsx';
import { WorkflowEventCard } from '../components/EventCards.jsx';
export default function MyEventsPage() {
  const portalContext = useClientContext();
  const savedTab = portalContext._workflowEventTab;
  const [activeTab, setActiveTab] = useState(() =>
    ['upcoming', 'ongoing', 'completed'].includes(savedTab) ? savedTab : 'upcoming'
  );
  useEffect(() => {
    setActiveTab(['upcoming', 'ongoing', 'completed'].includes(savedTab) ? savedTab : 'upcoming');
  }, [savedTab]);
  const changeTab = useCallback(
    tab => {
      setActiveTab(tab);
      portalContext.actions.onSetWorkflowEventTab(tab);
    },
    [portalContext.actions]
  );
  const portalActions = portalContext.actions;
  const { getClientWorkflowEvents } = portalContext;
  const data = getClientWorkflowEvents();
  const upcomingCount = data.upcoming.length;
  const ongoingCount = data.ongoing.length;
  const completedCount = data.completed.length;
  let activeList = [];
  let emptyIcon = '📅';
  let emptyTitle = 'No upcoming events';
  let emptyDesc = 'Confirmed future bookings will appear here once finalized and scheduled.';
  if (activeTab === 'upcoming') {
    activeList = data.upcoming;
    emptyIcon = '📅';
    emptyTitle = 'No upcoming events';
    emptyDesc = 'Confirmed bookings whose scheduled start time is in the future will appear here.';
  } else if (activeTab === 'ongoing') {
    activeList = data.ongoing;
    emptyIcon = '⏱️';
    emptyTitle = 'No ongoing events';
    emptyDesc = 'Events in planning and confirmed events currently taking place will appear here.';
  } else {
    activeList = data.completed;
    emptyIcon = '✅';
    emptyTitle = 'No completed events';
    emptyDesc = 'Events whose completion has been recorded and finalized will appear here.';
  }
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">My Events</div>
          <div className="page-sub">
            Track your upcoming, ongoing, and completed events and reports.
          </div>
        </div>
      </div>
      <div
        className="grid-3"
        style={{
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          className="stat-card"
          style={{
            cursor: 'pointer',
            borderLeft: '3px solid var(--accent)',
          }}
          onClick={() => changeTab('upcoming')}
        >
          <div className="stat-icon">📅</div>
          <div
            className="stat-value"
            style={{
              color: 'var(--accent)',
            }}
          >
            {upcomingCount}
          </div>
          <div className="stat-label">Upcoming Events</div>
          <div className="stat-sub neutral">Future confirmed bookings</div>
        </div>
        <div
          className="stat-card"
          style={{
            cursor: 'pointer',
            borderLeft: '3px solid var(--blue)',
          }}
          onClick={() => changeTab('ongoing')}
        >
          <div className="stat-icon">⏱️</div>
          <div
            className="stat-value"
            style={{
              color: 'var(--blue)',
            }}
          >
            {ongoingCount}
          </div>
          <div className="stat-label">Ongoing Events</div>
          <div className="stat-sub neutral">Planning and events in progress</div>
        </div>
        <div
          className="stat-card"
          style={{
            cursor: 'pointer',
            borderLeft: '3px solid var(--green)',
          }}
          onClick={() => changeTab('completed')}
        >
          <div className="stat-icon">✅</div>
          <div
            className="stat-value"
            style={{
              color: 'var(--green)',
            }}
          >
            {completedCount}
          </div>
          <div className="stat-label">Completed Events</div>
          <div className="stat-sub neutral">Recorded event reports</div>
        </div>
      </div>
      <nav
        aria-label="Event subpages"
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
        }}
      >
        <button
          type="button"
          className={`btn ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={activeTab === 'upcoming'}
          onClick={() => changeTab('upcoming')}
        >
          📅 Upcoming Events{' '}
          <span
            style={{
              background: 'rgba(255,255,255,.18)',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '11px',
              marginLeft: '4px',
            }}
          >
            {upcomingCount}
          </span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'ongoing' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={activeTab === 'ongoing'}
          onClick={() => changeTab('ongoing')}
        >
          ⏱️ Ongoing Events{' '}
          <span
            style={{
              background: 'rgba(255,255,255,.18)',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '11px',
              marginLeft: '4px',
            }}
          >
            {ongoingCount}
          </span>
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'completed' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={activeTab === 'completed'}
          onClick={() => changeTab('completed')}
        >
          ✅ Completed Events{' '}
          <span
            style={{
              background: 'rgba(255,255,255,.18)',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '11px',
              marginLeft: '4px',
            }}
          >
            {completedCount}
          </span>
        </button>
      </nav>
      <section
        aria-label={
          activeTab === 'upcoming'
            ? 'Upcoming Events'
            : activeTab === 'ongoing'
            ? 'Ongoing Events'
            : 'Completed Events'
        }
      >
        <div className="events-grid">
          {activeList.length === 0 ? (
            <div
              className="empty"
              style={{
                gridColumn: '1/-1',
              }}
            >
              <div className="empty-icon">{emptyIcon}</div>
              <div className="empty-title">{emptyTitle}</div>
              <div className="empty-desc">{emptyDesc}</div>
            </div>
          ) : (
            activeList.map((item, index) => (
              <WorkflowEventCard
                onViewWorkflowRequestDrawer={portalContext.actions.onViewWorkflowRequestDrawer}
                onOpenClientPlanReview={portalContext.actions.onOpenClientPlanReview}
                onOpenClientPaymentModal={portalContext.actions.onOpenClientPaymentModal}
                onOpenClientCancelRequestModal={
                  portalContext.actions.onOpenClientCancelRequestModal
                }
                onViewWorkflowEventDetails={portalContext.actions.onViewWorkflowEventDetails}
                onViewWorkflowEventReport={portalContext.actions.onViewWorkflowEventReport}
                item={item}
                tab={activeTab}
                key={
                  item?.id ??
                  item?.requestId ??
                  item?.eventId ??
                  item?.registrationId ??
                  item?.reportId ??
                  item?.label ??
                  (typeof item === 'string' || typeof item === 'number' ? item : index)
                }
              />
            ))
          )}
        </div>
      </section>
    </>
  );
}
