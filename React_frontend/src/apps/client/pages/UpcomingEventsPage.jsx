import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageUpcomingEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = DB.events
      .filter(event => {
        const eDate = new Date(event.date);
        return eDate >= today && event.status === 'upcoming';
      })
      .sort((leftEvent, rightEvent) => new Date(leftEvent.date) - new Date(rightEvent.date));
    return `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Upcoming Events</div>
      <div class="page-sub">Events happening soon that you might be interested in</div>
    </div>
  </div>
  <div class="events-grid">${
    upcoming.length === 0
      ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📅</div><div class="empty-title">No upcoming events</div></div>`
      : upcoming.map(event => evCard(event, CU.role === 'client' ? 'client' : 'attendee')).join('')
  }</div>`;
  }
  /* PORTAL_RUNTIME_END */
}
export default function UpcomingEventsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
