import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageOngoingEvents(embedded = false) {
      if (!['client', 'organizer'].includes(CU.role)) {
        const publicOngoing = DB.events.filter(event => event.status === 'ongoing');
        return `<div class="page-hd"><div class="page-hd-left"><div class="page-title">Ongoing Events</div><div class="page-sub">Events currently happening right now</div></div></div><div class="events-grid">${publicOngoing.length ? publicOngoing.map(event => evCard(event, 'attendee')).join('') : '<div class="empty" style="grid-column:1/-1"><div class="empty-icon">⏱️</div><div class="empty-title">No ongoing events</div></div>'}</div>`;
      }
      const ongoing = DB.events.filter(event =>
        event.status === 'ongoing' &&
        DB.eventRequests.some(request => String(request.eventId) === String(event.eventId || event.id)),
      );

      return `${embedded ? '' : `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Ongoing Events</div>
      <div class="page-sub">Track your approved client–organizer events, payment, and completion reports</div>
    </div>
  </div>`}
  <div class="events-grid">${ongoing.length === 0 ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">⏱️</div><div class="empty-title">No ongoing events</div></div>` : ongoing.map(event => {
        const request = DB.eventRequests.find(item => String(item.eventId) === String(event.eventId || event.id));
        const paid = request?.paymentStatus === 'fully_paid';
        return `<div class="card">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${workflowHtml(event.name || event.title)}</strong><span class="badge badge-blue">Ongoing</span></div>
          <div style="margin-top:10px;color:var(--text2);font-size:13px">📅 ${workflowHtml(event.date)} · 📍 ${workflowHtml(event.location || event.venue || '—')}</div>
          <div style="margin-top:10px;font-size:13px">Payment: <strong style="color:${paid ? 'var(--green)' : 'var(--yellow)'}">${paid ? 'Paid' : 'Unpaid'}</strong></div>
          <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="viewWorkflowEventDetails('${workflowHtml(event.eventId || event.id)}')">View Details</button>
          ${CU.role === 'client' ? `<button class="btn btn-danger btn-sm" style="margin-top:12px" onclick="openWorkflowCancellation('${workflowHtml(event.eventId || event.id)}')">Cancel Event</button>` : ''}
        </div>`;
      }).join('')}</div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function OngoingEventsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
