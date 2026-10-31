import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function dashOrganizer() {
      const esc = (typeof escapeHtml === 'function' ? escapeHtml : (typeof workflowHtml === 'function' ? workflowHtml : String));
      if (typeof organizerDashboardData !== 'undefined' && organizerDashboardData) {
        const d = organizerDashboardData;
        const counts = d.eventStatusCounts || {};
        const attentionCount = d.eventsNeedingAttention !== undefined ? d.eventsNeedingAttention : (d.attentionEventIds?.length ?? 0);
        const actions = Array.isArray(d.priorityActions) ? d.priorityActions : [];
        const upcomingList = Array.isArray(d.upcomingSchedule) ? d.upcomingSchedule : [];

        return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Organizer Dashboard</div><div class="page-sub">Hello ${(CU && CU.name) || 'Organizer'}, manage your events.</div></div>
    <div class="page-hd-right"><button class="btn btn-primary" onclick="openAddEventModal()">+ Create Event</button></div>
  </div>
  <div class="grid-4 mb-20">
    <div class="stat-card" onclick="openOrganizerEvents('all')" style="cursor:pointer">
      <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🗓️</div>
      <div class="stat-value" style="color:var(--accent)">${d.totalEvents ?? (DB.events || []).length}</div>
      <div class="stat-label">My Events</div>
      <div class="stat-sub neutral" style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px;margin-top:4px">
        <span>Upcoming <strong>${counts.upcoming ?? 0}</strong></span>
        <span>In Progress <strong>${counts.inProgress ?? 0}</strong></span>
        <span>Completed <strong>${counts.completed ?? 0}</strong></span>
        <span>Cancelled <strong>${counts.cancelled ?? 0}</strong></span>
        <span>Needs Attention <strong>${counts.needsAttention ?? 0}</strong></span>
      </div>
    </div>
    <div class="stat-card" onclick="openOrganizerRequests()" style="cursor:pointer">
      <div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📋</div>
      <div class="stat-value" style="color:var(--blue)">${d.pendingRequests ?? 0}</div>
      <div class="stat-label">Pending Event Requests</div>
      <div class="stat-sub neutral">Review client proposals</div>
    </div>
    <div class="stat-card" onclick="pageOrganizerFinancialRecords()" style="cursor:pointer">
      <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">💰</div>
      <div class="stat-value" style="color:var(--green)">₹${Number(d.totalRevenue ?? 0).toLocaleString()}</div>
      <div class="stat-label">Event Revenue</div>
      <div class="stat-sub neutral">Gross: ₹${Number(d.grossRevenue ?? d.totalRevenue ?? 0).toLocaleString()}${d.refundedAmount ? ` (Refunded: ₹${Number(d.refundedAmount).toLocaleString()})` : ''}</div>
    </div>
    <div class="stat-card" onclick="openOrganizerEvents('attention')" style="cursor:pointer">
      <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⚠️</div>
      <div class="stat-value" style="color:var(--yellow)">${attentionCount}</div>
      <div class="stat-label">Events Needing Attention</div>
      <div class="stat-sub neutral">Requires immediate action</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
    <div class="card">
      <div style="font-size:16px;font-weight:700;margin-bottom:12px">Priority Actions</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${actions.length === 0 ? '<div class="small text-muted">No pending priority actions.</div>' : actions.map(act => `
          <div style="padding:10px;background:var(--surface2);border-radius:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="${act.type === 'preparation' ? `organizerEventSection('${act.eventId || act.id}','preparation')` : act.type === 'request' ? `viewWorkflowRequestDrawer('${act.id}')` : `openOrganizerIssue('${act.id}')`}">
            <div>
              <div style="font-weight:600;font-size:13.5px">${esc(act.title)}</div>
              <div class="small text-muted">${esc(act.detail || '')}</div>
            </div>
            <span class="badge badge-${act.type === 'preparation' ? 'yellow' : act.type === 'request' ? 'blue' : 'red'}">${act.type}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <div style="font-size:16px;font-weight:700;margin-bottom:12px">Upcoming Schedule</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${upcomingList.length === 0 ? '<div class="small text-muted">No upcoming events scheduled.</div>' : upcomingList.map(ev => `
          <div style="padding:10px;background:var(--surface2);border-radius:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="openViewEventDrawer('${ev.eventId || ev.id}')">
            <div>
              <div style="font-weight:600;font-size:13.5px">${esc(ev.title)}</div>
              <div class="small text-muted">📅 ${esc(ev.date || '')} ${esc(ev.time || '')} · 📍 ${esc(ev.location || '')}</div>
            </div>
            <span class="badge badge-green">${esc(ev.status || 'published')}</span>
          </div>
        `).join('')}
      </div>
    </div>
  </div>`;
      }

      const myEventsList = (DB && DB.events) || [];
      const myEv = myEventsList.filter(e => String(e.organizer) === String(CU.id));
      const activeEvents = myEv.filter(e => !isCancelledWorkflowEvent(e));
      const upcoming = activeEvents.filter(e => workflowEventPhase(e) === 'upcoming');
      const allRegs = (DB && DB.registrations) || [];
      const totalAttendees = allRegs.filter(r => myEv.some(e => String(e.id) === String(r.eventId))).length;
      const allReqs = (DB && DB.eventRequests) || [];
      const inReviewCount = allReqs.filter(r => String(r.organizer) === String(CU.id) && r.status === 'plan_submitted' &&
        (DB.eventPlans || []).some(plan => String(plan.eventPlanId) === String(r.activeEventPlanId) && plan.approvalStatus === 'pending')).length;
      const weeklyAttendees = allRegs.filter(r => myEv.some(e => String(e.id) === String(r.eventId)) &&
        new Date(r.registrationDate || r.createdAt || r.date).getTime() >= Date.now() - 7 * 86400000).length;

      const searchQuery = (sessionStorage.getItem('org_events_search') || '').toLowerCase();
      const statusFilter = sessionStorage.getItem('org_events_status') || '';
      const categoryFilter = sessionStorage.getItem('org_events_category') || '';
      const filteredEvents = filterOrganizerDashboardEvents(activeEvents, searchQuery, statusFilter, categoryFilter);
      return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Organizer Dashboard</div><div class="page-sub">Hello ${(CU && CU.name) || 'Organizer'}, manage your events.</div></div>
    <div class="page-hd-right"><button class="btn btn-primary" onclick="openAddEventModal()">+ Create Event</button></div>
  </div>
  <div class="grid-4 mb-20">
    <div class="stat-card"><div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">🗓️</div><div class="stat-value" style="color:var(--accent)">${myEv.length}</div><div class="stat-label">My Events</div><div class="stat-sub neutral">${upcoming.length} upcoming</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--green-dim);color:var(--green)">👥</div><div class="stat-value" style="color:var(--green)">${totalAttendees}</div><div class="stat-label">Total Attendees</div><div class="stat-sub up">↑ ${weeklyAttendees} this week</div></div>
    <div class="stat-card"><div class="stat-icon" style="background:var(--blue-dim);color:var(--blue)">📋</div><div class="stat-value" style="color:var(--blue)">${inReviewCount}</div><div class="stat-label">Plans in Review</div><div class="stat-sub neutral">With clients</div></div>
  </div>
  <div class="mb-16">
    <div class="mb-12 flex justify-between items-center"><span class="h4">My Events</span><button class="btn btn-ghost btn-sm" onclick="openOrganizerEvents('cancelled')">Cancelled Events</button></div>
    <div class="search-box input-group" style="margin-bottom:16px"><span class="input-icon">🔍</span><input class="form-control" id="org-events-search" placeholder="Search by event name or city..." value="${searchQuery}" oninput="searchOrganizerEvents(this.value)"></div>
    <div class="filter-row" style="margin-bottom:16px">
      <select class="form-control filter-select" id="org-events-status" onchange="filterOrganizerDashboardEventsFromControls()">
        <option value="" ${statusFilter === '' ? 'selected' : ''}>All Status</option>
        <option value="upcoming" ${statusFilter === 'upcoming' ? 'selected' : ''}>Upcoming</option>
        <option value="ongoing" ${statusFilter === 'ongoing' ? 'selected' : ''}>Ongoing</option>
        <option value="full" ${statusFilter === 'full' ? 'selected' : ''}>Full</option>
        <option value="completed" ${statusFilter === 'completed' ? 'selected' : ''}>Completed</option>
      </select>
      <select class="form-control filter-select" id="org-events-category" onchange="filterOrganizerDashboardEventsFromControls()">
        <option value="" ${categoryFilter === '' ? 'selected' : ''}>All Categories</option>
        ${[...new Set(myEv.map(e => e.category).filter(Boolean))].sort().map(category => `<option value="${esc(category)}" ${categoryFilter === category ? 'selected' : ''}>${esc(category)}</option>`).join('')}
      </select>
    </div>
    <div class="events-grid" id="org-events-grid">${filteredEvents.length > 0 ? filteredEvents.map(e => evCard(e, 'organizer')).join('') : activeEvents.length > 0 ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No events match</div><p>Try adjusting your filters</p></div>` : myEv.length > 0 ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📁</div><div class="empty-title">No active events</div><button class="btn btn-ghost mt-16" onclick="openOrganizerEvents('cancelled')">View Cancelled Events</button></div>` : `<div class="ev-card" style="display:flex;align-items:center;justify-content:center;min-height:240px;border-style:dashed;cursor:pointer" onclick="openAddEventModal()"><div class="text-center" style="color:var(--text3)"><div style="font-size:32px;margin-bottom:8px">➕</div><div style="font-size:13px">Create Your First Event</div></div></div>`}
      ${myEv.length > 0 ? `<div class="ev-card" style="display:flex;align-items:center;justify-content:center;min-height:240px;border-style:dashed;cursor:pointer" onclick="openAddEventModal()"><div class="text-center" style="color:var(--text3)"><div style="font-size:32px;margin-bottom:8px">➕</div><div style="font-size:13px">Create New Event</div></div></div>` : ''}
    </div>
  </div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function DashboardPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
