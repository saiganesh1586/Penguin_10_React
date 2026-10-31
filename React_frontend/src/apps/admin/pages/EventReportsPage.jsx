import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageEventReports() {
      const selectedStage = sessionStorage.getItem('admin_event_reports_stage') || 'all';
      const allEvents = DB.events;

      const ongoingEvents = allEvents.filter(e => e.status === 'ongoing');
      const upcomingEvents = allEvents.filter(e => e.status === 'upcoming' || e.status === 'published' || e.status === 'full');
      const completedEvents = allEvents.filter(e => e.status === 'completed');
      const draftEvents = allEvents.filter(e => ['draft', 'pending'].includes(e.status));

      let eventsToAnalyze = allEvents;
      if (selectedStage === 'ongoing') eventsToAnalyze = ongoingEvents;
      else if (selectedStage === 'upcoming') eventsToAnalyze = upcomingEvents;
      else if (selectedStage === 'completed') eventsToAnalyze = completedEvents;
      const totalEvents = eventsToAnalyze.length;

      // 1. Lifecycle Stage Bar Graph
      const lifecycleBars = [
        { label: 'Ongoing (Now)', value: ongoingEvents.length, color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' },
        { label: 'About to Happen', value: upcomingEvents.length, color: 'linear-gradient(180deg, #22c55e, #15803d)' },
        { label: 'Completed', value: completedEvents.length, color: 'linear-gradient(180deg, #8b5cf6, #7c3aed)' },
        { label: 'Draft / Planning', value: draftEvents.length, color: 'linear-gradient(180deg, #64748b, #475569)' },
      ];

      // 2. Monthly Timeline Bar Graph
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyBuckets = {};
      const now = new Date();
      for (let i = -2; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyBuckets[key] = { label: monthNames[d.getMonth()], count: 0, isPast: i < 0, isCurrent: i === 0 };
      }

      eventsToAnalyze.forEach(e => {
        const dateStr = (e.date || '').toString();
        const match = dateStr.match(/(\d{4}-\d{2})/);
        if (match && monthlyBuckets[match[1]]) {
          monthlyBuckets[match[1]].count++;
        }
      });

      const monthlyBars = Object.values(monthlyBuckets).map(m => ({
        label: m.label + (m.isCurrent ? ' (Now)' : ''),
        value: m.count,
        color: m.isCurrent ? 'linear-gradient(180deg, #3b82f6, #1d4ed8)' : m.isPast ? 'linear-gradient(180deg, #8b5cf6, #7c3aed)' : 'linear-gradient(180deg, #22c55e, #15803d)'
      }));

      // 3. Category Distribution Bar Graph
      const catCounts = {};
      eventsToAnalyze.forEach(e => {
        const c = e.category || 'Other';
        catCounts[c] = (catCounts[c] || 0) + 1;
      });
      const catBars = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value], i) => ({
        label, value,
        color: ['linear-gradient(180deg, #3b82f6, #1d4ed8)', 'linear-gradient(180deg, #22c55e, #15803d)', 'linear-gradient(180deg, #f59e0b, #d97706)', 'linear-gradient(180deg, #8b5cf6, #7c3aed)', 'linear-gradient(180deg, #ec4899, #be185d)', 'linear-gradient(180deg, #14b8a6, #0f766e)'][i % 6],
      }));

      // 4. Grouped Capacity vs Registered Bar Graph by Event Stage
      const capacityOccupancyGroups = [
        {
          label: 'Ongoing',
          bars: [
            { label: 'Registered', value: ongoingEvents.reduce((s, e) => s + (e.registered || 0), 0), color: 'linear-gradient(180deg, #22c55e, #15803d)' },
            { label: 'Capacity', value: ongoingEvents.reduce((s, e) => s + (e.capacity || 0), 0), color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' }
          ]
        },
        {
          label: 'About to Happen',
          bars: [
            { label: 'Registered', value: upcomingEvents.reduce((s, e) => s + (e.registered || 0), 0), color: 'linear-gradient(180deg, #22c55e, #15803d)' },
            { label: 'Capacity', value: upcomingEvents.reduce((s, e) => s + (e.capacity || 0), 0), color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' }
          ]
        },
        {
          label: 'Completed',
          bars: [
            { label: 'Registered', value: completedEvents.reduce((s, e) => s + (e.registered || 0), 0), color: 'linear-gradient(180deg, #22c55e, #15803d)' },
            { label: 'Capacity', value: completedEvents.reduce((s, e) => s + (e.capacity || 0), 0), color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' }
          ]
        }
      ];

      return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Event Reports & Analytics</div>
      <div class="page-sub">Event activity, category breakdowns, and registration trends.</div>
    </div>
    <div class="page-hd-right">
      <div style="display:flex;gap:6px;background:var(--surface2);padding:4px;border-radius:10px;border:1px solid var(--border)">
        <button class="btn btn-xs ${selectedStage === 'all' ? 'btn-primary' : 'btn-ghost'}" onclick="filterEventReportsStage('all')">All Stages</button>
        <button class="btn btn-xs ${selectedStage === 'ongoing' ? 'btn-primary' : 'btn-ghost'}" onclick="filterEventReportsStage('ongoing')">▶️ Ongoing</button>
        <button class="btn btn-xs ${selectedStage === 'upcoming' ? 'btn-primary' : 'btn-ghost'}" onclick="filterEventReportsStage('upcoming')">⏳ About to Happen</button>
        <button class="btn btn-xs ${selectedStage === 'completed' ? 'btn-primary' : 'btn-ghost'}" onclick="filterEventReportsStage('completed')">✅ Completed</button>
      </div>
    </div>
  </div>

  <!-- 3 Event Stage Highlight Cards -->
  <div class="grid-3 mb-20" style="gap:16px">
    <div class="stat-card" style="border-left:4px solid var(--blue)">
      <div class="glow" style="background:var(--blue)"></div>
      <div class="flex justify-between items-center mb-6">
        <span style="font-size:12px;font-weight:700;color:var(--blue);text-transform:uppercase">▶️ Ongoing Events</span>
        <span class="badge badge-blue">Happening Now</span>
      </div>
      <div class="stat-value" style="color:var(--blue);font-size:32px">${ongoingEvents.length}</div>
      <div class="stat-label">Currently in Progress</div>
      <div class="stat-sub neutral" style="margin-top:6px">${ongoingEvents.reduce((s, e) => s + (e.registered || 0), 0)} live attendees participating</div>
    </div>

    <div class="stat-card" style="border-left:4px solid var(--green)">
      <div class="glow" style="background:var(--green)"></div>
      <div class="flex justify-between items-center mb-6">
        <span style="font-size:12px;font-weight:700;color:var(--green);text-transform:uppercase">⏳ About to Happen</span>
        <span class="badge badge-green">Scheduled</span>
      </div>
      <div class="stat-value" style="color:var(--green);font-size:32px">${upcomingEvents.length}</div>
      <div class="stat-label">Upcoming & Scheduled</div>
      <div class="stat-sub up" style="margin-top:6px">${upcomingEvents.reduce((s, e) => s + (e.registered || 0), 0)} reservations confirmed</div>
    </div>

    <div class="stat-card" style="border-left:4px solid var(--purple)">
      <div class="glow" style="background:var(--purple)"></div>
      <div class="flex justify-between items-center mb-6">
        <span style="font-size:12px;font-weight:700;color:var(--purple);text-transform:uppercase">✅ Completed Events</span>
        <span class="badge badge-purple">Finished</span>
      </div>
      <div class="stat-value" style="color:var(--purple);font-size:32px">${completedEvents.length}</div>
      <div class="stat-label">Concluded Events</div>
      <div class="stat-sub neutral" style="margin-top:6px">${completedEvents.reduce((s, e) => s + (e.registered || 0), 0)} past attendees reached</div>
    </div>
  </div>

  <!-- Bar Graphs Row 1: Lifecycle Stages Comparison & Category Breakdown -->
  <div class="grid-2 mb-20" style="gap:20px">
    <div class="card">
      <div class="h4 mb-12">Event Lifecycle</div>
      ${buildAnalyticsBars(lifecycleBars, 215)}
    </div>
    <div class="card">
      <div class="h4 mb-12">Event Categories</div>
      ${buildAnalyticsBars(catBars.length ? catBars : [{ label: 'No Events', value: 0, color: 'linear-gradient(180deg, #64748b, #475569)' }], 215)}
    </div>
  </div>

  <!-- Bar Graphs Row 2: Monthly Timeline & Grouped Capacity vs Registrations -->
  <div class="grid-2" style="gap:20px">
    <div class="card">
      <div class="h4 mb-12">Monthly Event Timeline</div>
      ${buildAnalyticsLine(monthlyBars, 215, { label: 'Events' })}
    </div>
    <div class="card">
      <div class="h4 mb-12">Booked Seats & Capacity</div>
      ${buildGroupedAnalyticsBars(capacityOccupancyGroups, 215, [
        { label: 'Booked Seats', color: 'linear-gradient(180deg, #22c55e, #15803d)' },
        { label: 'Total Capacity', color: 'linear-gradient(180deg, #3b82f6, #1d4ed8)' }
      ])}
    </div>
  </div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function EventReportsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
