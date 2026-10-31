import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageUserReports() {
      const selectedRole = sessionStorage.getItem('admin_user_filter_role') || 'all';
      const allUsers = DB.users;

      const usersToAnalyze = selectedRole === 'all' ? allUsers : allUsers.filter(u => u.role === selectedRole);
      const totalUsers = usersToAnalyze.length;
      const activeUsers = usersToAnalyze.filter(u => u.status === 'active').length;
      const inactiveUsers = totalUsers - activeUsers;
      const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
      const inactiveRate = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0;

      const roles = ['attendee', 'employee', 'client', 'organizer', 'superuser'];
      const roleBreakdown = roles.map(role => {
        const list = allUsers.filter(u => u.role === role);
        const active = list.filter(u => u.status === 'active').length;
        const inactive = list.length - active;
        return {
          role,
          label: ROLE_LABELS[role] || role,
          total: list.length,
          active,
          inactive,
          activePct: list.length > 0 ? Math.round((active / list.length) * 100) : 0,
        };
      });

      // 1. Monthly Joining Trends Bar Graph (Past 6 months)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyBuckets = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyBuckets[key] = { label: monthNames[d.getMonth()], count: 0 };
      }

      usersToAnalyze.forEach(u => {
        const joinedStr = (u.joined || u.createdAt || '').toString();
        const match = joinedStr.match(/(\d{4}-\d{2})/);
        if (match && monthlyBuckets[match[1]]) {
          monthlyBuckets[match[1]].count++;
        }
      });

      const monthBars = Object.values(monthlyBuckets).map((m, idx) => ({
        label: m.label,
        value: m.count,
        color: ['linear-gradient(180deg, #22c55e, #15803d)', 'linear-gradient(180deg, #3b82f6, #1d4ed8)', 'linear-gradient(180deg, #8b5cf6, #7c3aed)', 'linear-gradient(180deg, #f59e0b, #d97706)', 'linear-gradient(180deg, #06b6d4, #0891b2)', 'linear-gradient(180deg, #ec4899, #be185d)'][idx % 6]
      }));

      // 2. Grouped Active vs Inactive Bar Graph by Role
      const activeInactiveGroups = roleBreakdown.map(r => ({
        label: r.label,
        bars: [
          { label: 'Active', value: r.active, color: 'linear-gradient(180deg, #22c55e, #15803d)' },
          { label: 'Inactive', value: r.inactive, color: 'linear-gradient(180deg, #ef4444, #b91c1c)' }
        ]
      }));

      // 3. User Role Distribution Bar Graph
      const roleBars = [
        { label: 'Attendees', value: allUsers.filter(u => u.role === 'attendee').length, color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)' },
        { label: 'Employees', value: allUsers.filter(u => u.role === 'employee').length, color: 'linear-gradient(180deg, #22c55e, #15803d)' },
        { label: 'Clients', value: allUsers.filter(u => u.role === 'client').length, color: 'linear-gradient(180deg, #f59e0b, #d97706)' },
        { label: 'Organizers', value: allUsers.filter(u => u.role === 'organizer').length, color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' },
        { label: 'Admins', value: allUsers.filter(u => u.role === 'superuser').length, color: 'linear-gradient(180deg, #ef4444, #b91c1c)' },
      ];

      // 4. Role Activity Rate % Bar Graph
      const activityRateBars = roleBreakdown.map((r, idx) => ({
        label: r.label,
        value: r.activePct,
        color: ['linear-gradient(180deg, #8b5cf6, #7c3aed)', 'linear-gradient(180deg, #22c55e, #15803d)', 'linear-gradient(180deg, #f59e0b, #d97706)', 'linear-gradient(180deg, #3b82f6, #1d4ed8)', 'linear-gradient(180deg, #ef4444, #b91c1c)'][idx % 5]
      }));

      return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">User Reports & Analytics</div>
      <div class="page-sub">Monthly registrations, account activity, and user role distribution.</div>
    </div>
    <div class="page-hd-right">
      <div style="display:flex;gap:6px;background:var(--surface2);padding:4px;border-radius:10px;border:1px solid var(--border)">
        <button class="btn btn-xs ${selectedRole === 'all' ? 'btn-primary' : 'btn-ghost'}" onclick="filterUserReports('all')">All Roles</button>
        <button class="btn btn-xs ${selectedRole === 'attendee' ? 'btn-primary' : 'btn-ghost'}" onclick="filterUserReports('attendee')">Attendees</button>
        <button class="btn btn-xs ${selectedRole === 'employee' ? 'btn-primary' : 'btn-ghost'}" onclick="filterUserReports('employee')">Employees</button>
        <button class="btn btn-xs ${selectedRole === 'client' ? 'btn-primary' : 'btn-ghost'}" onclick="filterUserReports('client')">Clients</button>
        <button class="btn btn-xs ${selectedRole === 'organizer' ? 'btn-primary' : 'btn-ghost'}" onclick="filterUserReports('organizer')">Organizers</button>
      </div>
    </div>
  </div>

  <!-- Key Metric Summary Cards -->
  <div class="grid-4 mb-20">
    <div class="stat-card">
      <div class="glow" style="background:var(--accent)"></div>
      <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">👥</div>
      <div class="stat-value" style="color:var(--accent)">${totalUsers}</div>
      <div class="stat-label">Total ${selectedRole === 'all' ? 'Users' : ROLE_LABELS[selectedRole]}</div>
      <div class="stat-sub neutral">${selectedRole === 'all' ? 'Across all roles' : 'Filtered role view'}</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--green)"></div>
      <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">✅</div>
      <div class="stat-value" style="color:var(--green)">${activeUsers}</div>
      <div class="stat-label">Active Users</div>
      <div class="stat-sub up">↑ ${activeRate}% active rate</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--red)"></div>
      <div class="stat-icon" style="background:var(--red-dim);color:var(--red)">⏸️</div>
      <div class="stat-value" style="color:var(--red)">${inactiveUsers}</div>
      <div class="stat-label">Inactive Users</div>
      <div class="stat-sub neutral">${inactiveRate}% inactive rate</div>
    </div>
    <div class="stat-card">
      <div class="glow" style="background:var(--yellow)"></div>
      <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">📈</div>
      <div class="stat-value" style="color:var(--yellow)">${monthBars[monthBars.length - 1] ? monthBars[monthBars.length - 1].value : 0}</div>
      <div class="stat-label">New Joins This Month</div>
      <div class="stat-sub neutral">Recent registrations</div>
    </div>
  </div>

  <!-- Bar Graphs Row 1: Monthly Joins & Active vs Inactive Grouped Bar Chart -->
  <div class="grid-2 mb-20" style="gap:20px;align-items:start">
    <div class="card">
      <div class="h4 mb-12">Monthly Registrations</div>
      ${buildAnalyticsLine(monthBars, 180, { label: 'New users' })}
    </div>
    <div class="card">
      <div class="h4 mb-12">Active & Inactive Users</div>
      ${buildGroupedAnalyticsBars(activeInactiveGroups, 145, [
        { label: 'Active Users', color: 'linear-gradient(180deg, #22c55e, #15803d)' },
        { label: 'Inactive Users', color: 'linear-gradient(180deg, #ef4444, #b91c1c)' }
      ])}
    </div>
  </div>

  <!-- Bar Graphs Row 2: Platform Role Breakdown & Activity Rate % -->
  <div class="grid-2" style="gap:20px;align-items:start">
    <div class="card">
      <div class="h4 mb-12">Users by Role</div>
      ${buildAnalyticsBars(roleBars, 145)}
    </div>
    <div class="card">
      <div class="h4 mb-12">Activity Rate by Role</div>
      ${buildAnalyticsRings(activityRateBars)}
      <div style="margin-top:12px;text-align:center;font-size:11.5px;color:var(--text2)">
        Percentage of accounts actively participating in each role category.
      </div>
    </div>
  </div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function UserReportsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
