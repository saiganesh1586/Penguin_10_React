import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function dashClient() {
    const clientRequests = DB.eventRequests.filter(
      request => String(request.clientId) === String(CU.id)
    );
    const approvedCount = clientRequests.filter(request => request.status === 'approved').length;
    const inProgressCount = clientRequests.filter(request =>
      ['pending', 'in_review'].includes(request.status)
    ).length;
    const proposalCount = clientRequests.filter(
      request => request.status === 'proposal_sent'
    ).length;
    return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Client Dashboard</div><div class="page-sub">Track your event requests and upcoming events.</div></div>
    <div class="page-hd-right"><button class="btn btn-primary" onclick="goNav('find-organizers')">+ New Request</button></div>
  </div>
  <div class="grid-3 mb-20">
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📋</div><div class="stat-value" style="color:var(--accent)">${
      clientRequests.length
    }</div><div class="stat-label">Total Requests</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div><div class="stat-value" style="color:var(--green)">${approvedCount}</div><div class="stat-label">Approved</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div><div class="stat-value" style="color:var(--yellow)">${inProgressCount}</div><div class="stat-label">In Progress</div></div>
  </div>
  ${
    proposalCount > 0
      ? `
  <div style="background:rgba(99,102,241,0.12);border:1px solid var(--accent);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-weight:700;font-size:15px;color:var(--text)">📝 Proposal Received!</div>
      <div style="font-size:13px;color:var(--text2)">You have ${proposalCount} event proposal(s) awaiting your review.</div>
    </div>
    <button class="btn btn-primary" onclick="goNav('request-status')">Review Proposals</button>
  </div>`
      : ''
  }
  <div class="card" id="client-upcoming-events" aria-live="polite" style="margin-bottom:20px">
    <div class="h4 mb-12">Upcoming Events</div>
    <div class="small" style="color:var(--text3)">Loading your upcoming events…</div>
  </div>
  <div class="card" id="client-recent-activity" aria-live="polite">
    <div class="h4 mb-12">Recent Activity</div>
    <div class="small" style="color:var(--text3)">Loading your recent activity…</div>
  </div>
  `;
  }
  /* PORTAL_RUNTIME_END */
}

export default function DashboardPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
