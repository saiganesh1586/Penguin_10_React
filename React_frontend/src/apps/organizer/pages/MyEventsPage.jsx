import { useOrganizerContext } from '../context/OrganizerContext.jsx';
import { CancelledEvents } from '../components/EventCards.jsx';
import CompletedEventsPage from '../pages/CompletedEventsPage.jsx';
import OngoingEventsPage from '../pages/OngoingEventsPage.jsx';
export default function MyEventsPage() {
  const portalContext = useOrganizerContext();
  const portalActions = portalContext.actions;
  const {
    DB: workspaceData,
    _workflowEventTab,
    getOngoingWorkflowItems,
    pageCompletedEvents,
    pageOngoingEvents,
    workflowEventPhase,
  } = portalContext;
  const myEvents = (workspaceData && workspaceData.events) || [];
  const upcomingCount = myEvents.filter(event => workflowEventPhase(event) === 'upcoming').length;
  const inProgressCount = myEvents.filter(event => workflowEventPhase(event) === 'ongoing').length;
  const completedCount = myEvents.filter(event => workflowEventPhase(event) === 'completed').length;
  const cancelledCount = myEvents.filter(
    event => (event.backendStatus || event.status) === 'cancelled' || Boolean(event.cancellation)
  ).length;
  const attentionCount = myEvents.filter(event => event.needsAttention === true).length;
  const allCount = myEvents.length;
  const ongoingCount =
    typeof getOngoingWorkflowItems === 'function'
      ? getOngoingWorkflowItems().length
      : inProgressCount;
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Events</div>
          <div className="page-sub">
            Track your ongoing events and review completed events and reports.
          </div>
        </div>
      </div>
      <nav
        aria-label="Event subpages"
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <button
          type="button"
          className={`btn ${_workflowEventTab === 'ongoing' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={_workflowEventTab === 'ongoing'}
          onClick={() => portalActions.onSetWorkflowEventTab('ongoing')}
        >
          Ongoing Events ({ongoingCount})
        </button>
        <button
          type="button"
          className={`btn ${_workflowEventTab === 'completed' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={_workflowEventTab === 'completed'}
          onClick={() => portalActions.onSetWorkflowEventTab('completed')}
        >
          Completed Events ({completedCount})
        </button>
        <button
          type="button"
          className={`btn ${_workflowEventTab === 'cancelled' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={_workflowEventTab === 'cancelled'}
          onClick={() => portalActions.onSetWorkflowEventTab('cancelled')}
        >
          Cancelled Events ({cancelledCount})
        </button>
      </nav>
      <div
        className="filter-bar"
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          fontSize: '12px',
          alignItems: 'center',
        }}
      >
        <span>All Events ({allCount})</span>
        <span>Upcoming ({upcomingCount})</span>
        <span>In Progress ({inProgressCount})</span>
        <span>Completed ({completedCount})</span>
        <span>Cancelled ({cancelledCount})</span>
        <span>Needs Attention ({attentionCount})</span>
        <span>Newest first</span>
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => portalActions.onSetOrganizerEventFilter('clear')}
        >
          Clear filters
        </button>
      </div>
      <section
        aria-label={
          _workflowEventTab === 'cancelled'
            ? 'Cancelled Events'
            : _workflowEventTab === 'completed'
            ? 'Completed Events'
            : 'Ongoing Events'
        }
      >
        {_workflowEventTab === 'cancelled' ? (
          <CancelledEvents
            events={portalContext.DB.events}
            onOpenViewEventDrawer={portalContext.actions.onOpenViewEventDrawer}
            onViewWorkflowEventDetails={portalContext.actions.onViewWorkflowEventDetails}
            isCancelledWorkflowEvent={portalContext.isCancelledWorkflowEvent}
            embedded={true}
          />
        ) : _workflowEventTab === 'completed' ? (
          typeof pageCompletedEvents === 'function' ? (
            <CompletedEventsPage embedded={true} />
          ) : (
            ''
          )
        ) : typeof pageOngoingEvents === 'function' ? (
          <OngoingEventsPage embedded={true} />
        ) : (
          ''
        )}
      </section>
    </>
  );
}
