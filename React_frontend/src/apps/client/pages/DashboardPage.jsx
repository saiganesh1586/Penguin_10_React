import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function dashClient() {
      const myReqs = DB.eventRequests.filter(r => String(r.clientId) === String(CU.id));
      return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Client Dashboard</div><div class="page-sub">Track your event requests and upcoming events.</div></div>
    <div class="page-hd-right"><button class="btn btn-primary" onclick="goNav('find-organizers')">+ New Request</button></div>
  </div>
  <div class="grid-3 mb-20">
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">📋</div><div class="stat-value" style="color:var(--accent)">${myReqs.length}</div><div class="stat-label">Total Requests</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div><div class="stat-value" style="color:var(--green)">${myReqs.filter(r => r.status === 'approved').length}</div><div class="stat-label">Approved</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div><div class="stat-value" style="color:var(--yellow)">${myReqs.filter(r => r.status === 'pending' || r.status === 'in_review').length}</div><div class="stat-label">In Progress</div></div>
  </div>
  ${myReqs.filter(r => r.status === 'proposal_sent').length > 0 ? `
  <div style="background:rgba(99,102,241,0.12);border:1px solid var(--accent);border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-weight:700;font-size:15px;color:var(--text)">📝 Proposal Received!</div>
      <div style="font-size:13px;color:var(--text2)">You have ${myReqs.filter(r => r.status === 'proposal_sent').length} event proposal(s) awaiting your review.</div>
    </div>
    <button class="btn btn-primary" onclick="goNav('request-status')">Review Proposals</button>
  </div>` : ''}
  <div class="card" id="client-upcoming-events" aria-live="polite" style="margin-bottom:20px">
    <div class="h4 mb-12">Upcoming Events</div>
    <div class="small" style="color:var(--text3)">Loading your upcoming events…</div>
  </div>
  <div class="card" id="client-recent-activity" aria-live="polite">
    <div class="h4 mb-12">Recent Activity</div>
    <div class="small" style="color:var(--text3)">Loading your recent activity…</div>
  </div>
  `;
    }/* PORTAL_RUNTIME_END */
}

export default function DashboardPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
