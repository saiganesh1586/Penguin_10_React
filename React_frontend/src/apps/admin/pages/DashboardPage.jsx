import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function dashAdmin() {
      const totalUsers = DB.users.length, totalEvents = DB.events.length, totalRegs = DB.registrations.length;
      const revenue = (DB.financeTransactions || []).filter(payment => payment.status === 'Successful').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const pendingReqs = DB.eventRequests.filter(r => ['pending', 'submitted', 'planning', 'changes_requested', 'counteroffered', 'plan_submitted', 'plan_revision_requested'].includes(r.status)).length;
      const roleCounts = {
        employee: DB.users.filter(u => u.role === 'employee').length,
        superuser: DB.users.filter(u => u.role === 'superuser').length,
        organizer: DB.users.filter(u => u.role === 'organizer').length,
        client: DB.users.filter(u => u.role === 'client').length,
        attendee: DB.users.filter(u => u.role === 'attendee').length,
      };
      const eventStatusCounts = {
        upcoming: DB.events.filter(e => e.status === 'upcoming' || e.status === 'published').length,
        ongoing: DB.events.filter(e => e.status === 'ongoing').length,
        completed: DB.events.filter(e => e.status === 'completed').length,
        draft: DB.events.filter(e => e.status === 'draft').length,
      };
      const requestStatusCounts = {
        pending: DB.eventRequests.filter(r => ['pending', 'submitted', 'planning', 'changes_requested', 'counteroffered', 'plan_submitted', 'plan_revision_requested'].includes(r.status)).length,
        approved: DB.eventRequests.filter(r => ['approved', 'confirmed', 'completed'].includes(r.status)).length,
        rejected: DB.eventRequests.filter(r => r.status === 'rejected').length,
      };

      const activeEvents = eventStatusCounts.upcoming + eventStatusCounts.ongoing;
      const paidRegistrations = DB.registrations.filter(r => Number(r.amount) > 0).length;
      const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - (5 - index));
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const records = DB.registrations.filter(r => String(r.date || r.createdAt || '').slice(0, 7) === key);
        return { label: date.toLocaleString('en-IN', { month: 'short' }), registrations: records.length, revenue: records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) };
      });

      // Refresh the overview as one set so headline figures and breakdowns agree.
      apiGetDashboard().then(function (resp) {
        const d = resp && resp.data ? resp.data : resp;
        if (!d || !d.users || !d.events || !d.registrations) return;
        const patch = [
          ['adm-stat-users', d.users.total],
          ['adm-stat-events', d.events.total],
          ['adm-stat-regs', d.registrations.total],
          ['adm-stat-rev', '₹' + ((d.payments?.totalRevenue || 0) / 1000).toFixed(1) + 'K'],
          ['adm-users-detail', `${d.users.byRole?.attendee || 0} attendees · ${d.users.byRole?.event_organizer || 0} organizers`],
          ['adm-events-detail', `${(d.events.published || 0) + (d.events.ongoing || 0)} published or ongoing`],
          ['adm-regs-detail', 'Total registration records'],
          ['adm-snapshot-events', (d.events.published || 0) + (d.events.ongoing || 0)],
          ['adm-snapshot-requests', d.eventRequests?.pending || 0],
          ['adm-request-total', `${d.eventRequests?.total || 0} event requests`],
        ];
        patch.forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.textContent = val; });
        const pending = document.getElementById('adm-stat-pending');
        if (pending) pending.textContent = (d.eventRequests?.pending || 0) + ' requests pending';
        const roleChart = document.getElementById('adm-role-chart');
        if (roleChart) roleChart.innerHTML = buildAnalyticsBars([{ label: 'Admins', value: d.users.byRole?.super_admin || 0 }, { label: 'Organizers', value: d.users.byRole?.event_organizer || 0 }, { label: 'Clients', value: d.users.byRole?.client || 0 }, { label: 'Employees', value: d.users.byRole?.employee || 0 }, { label: 'Attendees', value: d.users.byRole?.attendee || 0 }], 175);
        const requestsChart = document.getElementById('adm-requests-chart');
        if (requestsChart) requestsChart.innerHTML = buildAnalyticsProgress([{ label: 'Pending', value: d.eventRequests?.pending || 0, color: 'var(--yellow)' }, { label: 'Approved', value: d.eventRequests?.approved || 0, color: 'var(--green)' }, { label: 'Rejected', value: d.eventRequests?.rejected || 0, color: 'var(--red)' }]);
        const eventChart = document.getElementById('adm-events-chart');
        if (eventChart) eventChart.innerHTML = buildAnalyticsBars([{ label: 'Published', value: d.events.published || 0 }, { label: 'Ongoing', value: d.events.ongoing || 0 }, { label: 'Completed', value: d.events.completed || 0 }, { label: 'Draft', value: d.events.draft || 0 }], 175);
      }).catch(function () { /* silently keep local stats */ });

      return `
  <div class="admin-overview">
    <div class="page-hd admin-overview-head">
      <div class="page-hd-left"><div class="admin-eyebrow">EVENTFLOW / CONTROL CENTER</div><div class="page-title">Platform overview</div><div class="page-sub">Welcome back, ${adminChartText(CU.name)}. A clear view of activity across your platform.</div></div>
      <div class="page-hd-right"><button class="btn btn-ghost" onclick="goNav('user-reports')">View user reports</button><button class="btn btn-primary" onclick="goNav('revenue-reports')">Open reports ↗</button></div>
    </div>
    <div class="admin-overview-kpis">
      <div class="card admin-kpi"><div class="admin-kpi-top"><span class="admin-kpi-icon">👥</span><span class="admin-kpi-tag">AUDIENCE</span></div><div class="admin-kpi-label">Total users</div><div class="admin-kpi-value" id="adm-stat-users">${totalUsers}</div><div class="admin-kpi-foot" id="adm-users-detail">${roleCounts.attendee} attendees · ${roleCounts.organizer} organizers</div></div>
      <div class="card admin-kpi"><div class="admin-kpi-top"><span class="admin-kpi-icon admin-kpi-icon--green">▣</span><span class="admin-kpi-tag">EVENTS</span></div><div class="admin-kpi-label">Total events</div><div class="admin-kpi-value" id="adm-stat-events">${totalEvents}</div><div class="admin-kpi-foot" id="adm-events-detail">${activeEvents} published or ongoing</div></div>
      <div class="card admin-kpi"><div class="admin-kpi-top"><span class="admin-kpi-icon admin-kpi-icon--amber">◎</span><span class="admin-kpi-tag">ACTIVITY</span></div><div class="admin-kpi-label">Registrations</div><div class="admin-kpi-value" id="adm-stat-regs">${totalRegs}</div><div class="admin-kpi-foot" id="adm-regs-detail">${paidRegistrations} with recorded amount</div></div>
      <div class="card admin-kpi"><div class="admin-kpi-top"><span class="admin-kpi-icon admin-kpi-icon--violet">₹</span><span class="admin-kpi-tag">REVENUE</span></div><div class="admin-kpi-label">Recorded revenue</div><div class="admin-kpi-value" id="adm-stat-rev">₹${(revenue / 1000).toFixed(1)}K</div><div class="admin-kpi-foot" id="adm-stat-pending">${pendingReqs} request${pendingReqs === 1 ? '' : 's'} pending</div></div>
    </div>
    <div class="admin-overview-main">
      <div class="card admin-overview-trend"><div class="admin-panel-head"><div><div class="h4">Registration trend</div><div class="small">Recorded registrations in the last six months</div></div><span class="admin-panel-chip">6 months</span></div>${buildAnalyticsLine(months.map(row => ({ label: row.label, value: row.registrations })), 280, { label: 'Registrations' })}</div>
      <div class="card admin-overview-snapshot"><div class="admin-panel-head"><div><div class="h4">Platform snapshot</div><div class="small">Current records</div></div></div><div class="admin-snapshot-row"><span class="admin-snapshot-mark">▣</span><span>Active events<small>Published and ongoing</small></span><strong id="adm-snapshot-events">${activeEvents}</strong></div><div class="admin-snapshot-row"><span class="admin-snapshot-mark admin-snapshot-mark--amber">◷</span><span>Pending requests<small>Awaiting review</small></span><strong id="adm-snapshot-requests">${requestStatusCounts.pending}</strong></div><button class="admin-panel-link" onclick="goNav('event-reports')">Explore event reports <span>→</span></button></div>
    </div>
    <div class="admin-overview-lower">
      <div class="card"><div class="admin-panel-head"><div><div class="h4">User mix</div><div class="small">Accounts by platform role</div></div><button class="admin-panel-link" onclick="goNav('user-reports')">View details →</button></div><div id="adm-role-chart">${buildAnalyticsBars([{ label: 'Admins', value: roleCounts.superuser }, { label: 'Organizers', value: roleCounts.organizer }, { label: 'Clients', value: roleCounts.client }, { label: 'Employees', value: roleCounts.employee }, { label: 'Attendees', value: roleCounts.attendee }], 175)}</div></div>
      <div class="card"><div class="admin-panel-head"><div><div class="h4">Request pipeline</div><div class="small" id="adm-request-total">${requestStatusCounts.pending + requestStatusCounts.approved + requestStatusCounts.rejected} event requests</div></div></div><div id="adm-requests-chart">${buildAnalyticsProgress([{ label: 'Pending', value: requestStatusCounts.pending, color: 'var(--yellow)' }, { label: 'Approved', value: requestStatusCounts.approved, color: 'var(--green)' }, { label: 'Rejected', value: requestStatusCounts.rejected, color: 'var(--red)' }])}</div></div>
      <div class="card"><div class="admin-panel-head"><div><div class="h4">Event coverage</div><div class="small">Events by current status</div></div></div><div id="adm-events-chart">${buildAnalyticsBars([{ label: 'Published', value: eventStatusCounts.upcoming }, { label: 'Ongoing', value: eventStatusCounts.ongoing }, { label: 'Completed', value: eventStatusCounts.completed }, { label: 'Draft', value: eventStatusCounts.draft }], 175)}</div></div>
    </div>
  </div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function DashboardPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
