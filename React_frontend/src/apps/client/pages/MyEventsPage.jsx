import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageWorkflowEvents() {
    if (!['upcoming', 'ongoing', 'completed'].includes(_workflowEventTab)) {
      _workflowEventTab = 'upcoming';
    }
    const data = getClientWorkflowEvents();
    const upcomingCount = data.upcoming.length;
    const ongoingCount = data.ongoing.length;
    const completedCount = data.completed.length;

    let activeList = [];
    let emptyIcon = '📅';
    let emptyTitle = 'No upcoming events';
    let emptyDesc = 'Confirmed future bookings will appear here once finalized and scheduled.';

    if (_workflowEventTab === 'upcoming') {
      activeList = data.upcoming;
      emptyIcon = '📅';
      emptyTitle = 'No upcoming events';
      emptyDesc =
        'Confirmed bookings whose scheduled start time is in the future will appear here.';
    } else if (_workflowEventTab === 'ongoing') {
      activeList = data.ongoing;
      emptyIcon = '⏱️';
      emptyTitle = 'No ongoing events';
      emptyDesc =
        'Events in planning and confirmed events currently taking place will appear here.';
    } else {
      activeList = data.completed;
      emptyIcon = '✅';
      emptyTitle = 'No completed events';
      emptyDesc = 'Events whose completion has been recorded and finalized will appear here.';
    }

    return `
      <div class="page-hd">
        <div class="page-hd-left">
          <div class="page-title">My Events</div>
          <div class="page-sub">Track your upcoming, ongoing, and completed events and reports.</div>
        </div>
      </div>
      <div class="grid-3" style="gap:16px;margin-bottom:24px">
        <div class="stat-card" style="cursor:pointer;border-left:3px solid var(--accent)" onclick="setWorkflowEventTab('upcoming')">
          <div class="stat-icon">📅</div>
          <div class="stat-value" style="color:var(--accent)">${upcomingCount}</div>
          <div class="stat-label">Upcoming Events</div>
          <div class="stat-sub neutral">Future confirmed bookings</div>
        </div>
        <div class="stat-card" style="cursor:pointer;border-left:3px solid var(--blue)" onclick="setWorkflowEventTab('ongoing')">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value" style="color:var(--blue)">${ongoingCount}</div>
          <div class="stat-label">Ongoing Events</div>
          <div class="stat-sub neutral">Planning and events in progress</div>
        </div>
        <div class="stat-card" style="cursor:pointer;border-left:3px solid var(--green)" onclick="setWorkflowEventTab('completed')">
          <div class="stat-icon">✅</div>
          <div class="stat-value" style="color:var(--green)">${completedCount}</div>
          <div class="stat-label">Completed Events</div>
          <div class="stat-sub neutral">Recorded event reports</div>
        </div>
      </div>
      <nav aria-label="Event subpages" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px">
        <button type="button" class="btn ${
          _workflowEventTab === 'upcoming' ? 'btn-primary' : 'btn-ghost'
        }" aria-pressed="${
      _workflowEventTab === 'upcoming'
    }" onclick="setWorkflowEventTab('upcoming')">📅 Upcoming Events <span style="background:rgba(255,255,255,.18);padding:1px 7px;border-radius:10px;font-size:11px;margin-left:4px">${upcomingCount}</span></button>
        <button type="button" class="btn ${
          _workflowEventTab === 'ongoing' ? 'btn-primary' : 'btn-ghost'
        }" aria-pressed="${
      _workflowEventTab === 'ongoing'
    }" onclick="setWorkflowEventTab('ongoing')">⏱️ Ongoing Events <span style="background:rgba(255,255,255,.18);padding:1px 7px;border-radius:10px;font-size:11px;margin-left:4px">${ongoingCount}</span></button>
        <button type="button" class="btn ${
          _workflowEventTab === 'completed' ? 'btn-primary' : 'btn-ghost'
        }" aria-pressed="${
      _workflowEventTab === 'completed'
    }" onclick="setWorkflowEventTab('completed')">✅ Completed Events <span style="background:rgba(255,255,255,.18);padding:1px 7px;border-radius:10px;font-size:11px;margin-left:4px">${completedCount}</span></button>
      </nav>
      <section aria-label="${
        _workflowEventTab === 'upcoming'
          ? 'Upcoming Events'
          : _workflowEventTab === 'ongoing'
          ? 'Ongoing Events'
          : 'Completed Events'
      }">
        <div class="events-grid">
          ${
            activeList.length === 0
              ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">${emptyIcon}</div><div class="empty-title">${emptyTitle}</div><div class="empty-desc">${emptyDesc}</div></div>`
              : activeList.map(item => renderWorkflowEventCard(item, _workflowEventTab)).join('')
          }
        </div>
      </section>`;
  }
  /* PORTAL_RUNTIME_END */
}

export default function MyEventsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
