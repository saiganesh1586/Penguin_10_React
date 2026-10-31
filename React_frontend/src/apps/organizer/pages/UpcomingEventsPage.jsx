import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageUpcomingEvents() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = DB.events.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= today && e.status === 'upcoming' && !isCancelledWorkflowEvent(e);
      }).sort((a, b) => new Date(a.date) - new Date(b.date));

      return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Upcoming Events</div>
      <div class="page-sub">Events happening soon that you might be interested in</div>
    </div>
  </div>
  <div class="events-grid">${upcoming.length === 0 ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📅</div><div class="empty-title">No upcoming events</div></div>` : upcoming.map(e => evCard(e, CU.role === 'client' ? 'client' : 'attendee')).join('')}</div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function UpcomingEventsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
