import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageWorkflowEvents() {
    const myEvents = (DB && DB.events) || [];
    const upcomingCount = myEvents.filter(event => workflowEventPhase(event) === 'upcoming').length;
    const inProgressCount = myEvents.filter(
      event => workflowEventPhase(event) === 'ongoing'
    ).length;
    const completedCount = myEvents.filter(
      event => workflowEventPhase(event) === 'completed'
    ).length;
    const cancelledCount = myEvents.filter(
      event => (event.backendStatus || event.status) === 'cancelled' || Boolean(event.cancellation)
    ).length;
    const attentionCount = myEvents.filter(event => event.needsAttention === true).length;
    const allCount = myEvents.length;

    const ongoingCount =
      typeof getOngoingWorkflowItems === 'function'
        ? getOngoingWorkflowItems().length
        : inProgressCount;

    return `<div class="page-hd"><div class="page-hd-left"><div class="page-title">Events</div><div class="page-sub">Track your ongoing events and review completed events and reports.</div></div></div>
        <nav aria-label="Event subpages" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
          <button type="button" class="btn ${
            _workflowEventTab === 'ongoing' ? 'btn-primary' : 'btn-ghost'
          }" aria-pressed="${
      _workflowEventTab === 'ongoing'
    }" onclick="setWorkflowEventTab('ongoing')">Ongoing Events (${ongoingCount})</button>
          <button type="button" class="btn ${
            _workflowEventTab === 'completed' ? 'btn-primary' : 'btn-ghost'
          }" aria-pressed="${
      _workflowEventTab === 'completed'
    }" onclick="setWorkflowEventTab('completed')">Completed Events (${completedCount})</button>
          <button type="button" class="btn ${
            _workflowEventTab === 'cancelled' ? 'btn-primary' : 'btn-ghost'
          }" aria-pressed="${
      _workflowEventTab === 'cancelled'
    }" onclick="setWorkflowEventTab('cancelled')">Cancelled Events (${cancelledCount})</button>
        </nav>
        <div class="filter-bar" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;font-size:12px;align-items:center">
          <span>All Events (${allCount})</span>
          <span>Upcoming (${upcomingCount})</span>
          <span>In Progress (${inProgressCount})</span>
          <span>Completed (${completedCount})</span>
          <span>Cancelled (${cancelledCount})</span>
          <span>Needs Attention (${attentionCount})</span>
          <span>Soonest first</span>
          <button class="btn btn-ghost btn-xs" onclick="setOrganizerEventFilter('clear')">Clear filters</button>
        </div>
        <section aria-label="${
          _workflowEventTab === 'cancelled'
            ? 'Cancelled Events'
            : _workflowEventTab === 'completed'
            ? 'Completed Events'
            : 'Ongoing Events'
        }">${
      _workflowEventTab === 'cancelled'
        ? pageCancelledEvents(true)
        : _workflowEventTab === 'completed'
        ? typeof pageCompletedEvents === 'function'
          ? pageCompletedEvents(true)
          : ''
        : typeof pageOngoingEvents === 'function'
        ? pageOngoingEvents(true)
        : ''
    }</section>`;
  }
  /* PORTAL_RUNTIME_END */
}

export default function MyEventsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
