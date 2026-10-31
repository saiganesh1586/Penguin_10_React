import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function dashSupportExecutive() {
      const users = window.EventFlowAccountPolicy.visibleAccounts(CU, DB.users || []);
      const events = DB.events || [];
      const regs = DB.registrations || [];
      const tasks = DB.eventOperationsTasks || [];
      const queries = DB.userQueries || [];
      const supportReqs = DB.supportRequests || [];

      const totalUsers = users.length;
      const totalEvents = events.length;

      const pendingRegs = regs.filter(r => {
        const st = (r.status || '').toLowerCase();
        const vst = (r.verificationStatus || '').toLowerCase();
        return !r.reviewStatus && !r.verified && !['rejected', 'cancelled', 'attended', 'no-show'].includes(st)
          && (st === 'pending' || st === 'registered' || vst === 'pending review' || vst === 'pending');
      }).length;

      const openTickets = supportReqs.filter(s => s.status !== 'Resolved' && s.status !== 'Closed').length +
        queries.filter(q => q.status !== 'Resolved').length;

      const operationalIssues = tasks.filter(t => t.status !== 'Resolved').length;
      const activeEventsCount = events.filter(e => ['published', 'active', 'ongoing', 'upcoming'].includes((e.status || '').toLowerCase())).length;

      // Pending actions list
      const pendingActionsList = [];
      regs.filter(r => {
        const st = (r.status || '').toLowerCase();
        const vst = (r.verificationStatus || '').toLowerCase();
        return !r.reviewStatus && !r.verified && !['rejected', 'cancelled', 'attended', 'no-show'].includes(st)
          && (st === 'pending' || st === 'registered' || vst === 'pending review' || vst === 'pending');
      }).slice(0, 3).forEach(r => {
        const u = users.find(user => String(user.id) === String(r.attendeeId)) || { name: 'Attendee' };
        const e = events.find(ev => String(ev.id) === String(r.eventId)) || { title: 'Event' };
        pendingActionsList.push({
          type: 'Registration Review',
          title: `${u.name} · ${e.title}`,
          badge: 'Pending Review',
          badgeCls: 'yellow',
          actionLbl: 'Review',
          actionFn: `openReviewRegistrationModal('${r.id}')`,
          icon: '📝'
        });
      });

      supportReqs.filter(s => s.status !== 'Resolved' && s.status !== 'Closed').slice(0, 2).forEach(s => {
        pendingActionsList.push({
          type: 'Customer Support',
          title: `${s.subject}`,
          badge: s.status || 'Pending',
          badgeCls: s.status === 'In Progress' ? 'purple' : 'yellow',
          actionLbl: 'Manage',
          actionFn: `openSupportTicketModal('${s.id}')`,
          icon: '🎧'
        });
      });

      tasks.filter(t => t.status !== 'Resolved').slice(0, 2).forEach(t => {
        pendingActionsList.push({
          type: 'Operational Issue',
          title: `${t.eventTitle} · ${t.type}`,
          badge: t.status || 'Pending',
          badgeCls: t.status === 'In Progress' ? 'purple' : 'yellow',
          actionLbl: 'Update',
          actionFn: `openSupportExecutiveRequest('${t.id}')`,
          icon: '⚙️'
        });
      });

      // Recent Activity
      const recentActivities = [
        ...regs.slice(0, 2).map(r => {
          const u = users.find(user => String(user.id) === String(r.attendeeId)) || { name: 'Attendee' };
          const e = events.find(ev => String(ev.id) === String(r.eventId)) || { title: 'Event' };
          return {
            icon: '📝',
            title: `Registration: ${u.name}`,
            detail: `${e.title} · Status: ${r.verificationStatus || r.status || 'Verified'}`,
            time: r.date || 'Today'
          };
        }),
        ...tasks.slice(0, 2).map(t => ({
          icon: '⚙️',
          title: `Operational Task: ${t.type}`,
          detail: `${t.eventTitle} · Status: ${t.status}`,
          time: t.updated || 'Recently'
        })),
        ...queries.slice(0, 2).map(q => ({
          icon: '🎧',
          title: `Support Ticket: ${q.subject}`,
          detail: `${q.userName} · Status: ${q.status}`,
          time: q.date || 'Recently'
        }))
      ];

      // Async backend stats sync
      if (typeof apiGetEmployeeDashboard === 'function') {
        apiGetEmployeeDashboard().then(res => {
          const d = (res && res.data) ? res.data : res;
          if (d) {
            if (d.totalUsers !== undefined) {
              const el = document.getElementById('se-stat-users');
              if (el) el.textContent = d.totalUsers;
            }
            if (d.totalEvents !== undefined) {
              const el = document.getElementById('se-stat-events');
              if (el) el.textContent = d.totalEvents;
            }
            if (d.registrationsAwaitingReview !== undefined) {
              const el = document.getElementById('se-stat-regs');
              if (el) el.textContent = d.registrationsAwaitingReview;
            }
            if (d.openSupportTickets !== undefined) {
              const el = document.getElementById('se-stat-tickets');
              if (el) el.textContent = d.openSupportTickets;
            }
            if (d.operationalIssues !== undefined) {
              const el = document.getElementById('se-stat-issues');
              if (el) el.textContent = d.operationalIssues;
            }
          }
        }).catch(() => {});
      }

      return `
        <div class="page-hd">
          <div class="page-hd-left">
            <div class="page-title">Support Executive Dashboard</div>
            <div class="page-sub">Welcome back, ${CU.name}. Overview of users, events, registrations awaiting review, customer support, and operational issues.</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:20px">
          <div class="stat-card" style="cursor:pointer" onclick="switchTabAndNav('user-event-mgmt', 'users')" title="Click to view Users">
            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)">👥</div>
            <div class="stat-value" id="se-stat-users" style="color:var(--accent)">${totalUsers}</div>
            <div class="stat-label">Total Users</div>
            <div class="stat-sub neutral">Click to manage users →</div>
          </div>
          <div class="stat-card" style="cursor:pointer" onclick="switchTabAndNav('user-event-mgmt', 'events')" title="Click to view Events">
            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)">🗓️</div>
            <div class="stat-value" id="se-stat-events" style="color:var(--green)">${totalEvents}</div>
            <div class="stat-label">Total Events</div>
            <div class="stat-sub neutral">${activeEventsCount} active · Click to view →</div>
          </div>
          <div class="stat-card" style="cursor:pointer" onclick="switchTabAndNav('user-event-mgmt', 'events', 'pending_regs')" title="Click to review Registrations">
            <div class="stat-icon" style="background:var(--yellow-dim);color:var(--yellow)">⏳</div>
            <div class="stat-value" id="se-stat-regs" style="color:var(--yellow)">${pendingRegs}</div>
            <div class="stat-label">Registrations Awaiting Review</div>
            <div class="stat-sub up">Needs verification →</div>
          </div>
          <div class="stat-card" style="cursor:pointer" onclick="switchTabAndNav('support-issue-mgmt', 'support')" title="Click to view Support Tickets">
            <div class="stat-icon" style="background:var(--purple-dim);color:var(--purple)">🎧</div>
            <div class="stat-value" id="se-stat-tickets" style="color:var(--purple)">${openTickets}</div>
            <div class="stat-label">Open Support Tickets</div>
            <div class="stat-sub up">Customer inquiries →</div>
          </div>
          <div class="stat-card" style="cursor:pointer" onclick="switchTabAndNav('support-issue-mgmt', 'operations')" title="Click to view Operational Issues">
            <div class="stat-icon" style="background:var(--red-dim);color:var(--red)">⚙️</div>
            <div class="stat-value" id="se-stat-issues" style="color:var(--red)">${operationalIssues}</div>
            <div class="stat-label">Operational Issues</div>
            <div class="stat-sub up">Logistics &amp; tasks →</div>
          </div>
        </div>

        <div class="mb-20">
          <div class="card">
            <div class="h4 mb-14">Pending Actions &amp; Urgent Items</div>
            <div style="display:flex;flex-direction:column;gap:10px;max-height:380px;overflow-y:auto;padding-right:4px">
              ${pendingActionsList.map(item => `
                <div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface2)" class="flex justify-between items-center gap-10">
                  <div class="flex items-center gap-10" style="flex:1;min-width:0">
                    <span style="font-size:18px">${item.icon}</span>
                    <div style="flex:1;min-width:0">
                      <div class="flex items-center gap-6 mb-2">
                        <span style="font-weight:700;font-size:13px;color:var(--text)" class="truncate">${item.title}</span>
                        <span class="badge badge-${item.badgeCls}" style="font-size:10px;padding:1px 6px">${item.badge}</span>
                      </div>
                      <div class="small muted truncate">${item.type}</div>
                    </div>
                  </div>
                  <button class="btn btn-ghost btn-xs" onclick="${item.actionFn}">${item.actionLbl}</button>
                </div>
              `).join('') || '<div class="empty">✓ No pending actions requiring immediate attention!</div>'}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="h4 mb-14">Recent Platform Activity</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${recentActivities.map(act => `
              <div class="flex items-center gap-10" style="padding:8px 0;border-bottom:1px solid var(--border)">
                <span style="font-size:20px">${act.icon}</span>
                <div style="flex:1">
                  <div style="font-weight:600;font-size:13px">${act.title}</div>
                  <div class="small muted">${act.detail}</div>
                </div>
                <span class="small muted" style="white-space:nowrap">${act.time}</span>
              </div>
            `).join('') || '<div class="empty">No recent activity recorded</div>'}
          </div>
        </div>
      `;
    }/* PORTAL_RUNTIME_END */
}

export default function DashboardPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
