import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageAttendees() {
      const myEvents = CU.role === 'organizer' ? organizerRegistrationEvents : DB.events.filter(e => e.organizer === CU.id);
      const savedEventId = sessionStorage.getItem('org_attendees_event');
      const selectedEvent = myEvents.find(event => String(event.id) === savedEventId)
        || myEvents.find(event => DB.registrations.some(registration => String(registration.eventId) === String(event.id) && canReviewOrganizerRegistration(registration, event)))
        || myEvents[0];
      const selectedEventId = selectedEvent?.id;
      if (selectedEventId) sessionStorage.setItem('org_attendees_event', String(selectedEventId));
      const isPrivateEvent = selectedEvent?.visibility === 'private';

      const regs = CU.role === 'organizer' ?
        DB.registrations.filter(r => r.organizerManaged && selectedEventId && String(r.eventId) === String(selectedEventId)) :
        (CU.role === 'superuser' ? DB.registrations : DB.registrations.filter(r => { const e = DB.events.find(ev => ev.id === r.eventId); return e && e.organizer === CU.id; }));
      if (CU.role === 'organizer' && !myEvents.length) return '<div class="org-attendees card"><div class="empty"><div class="empty-icon">📅</div><div class="empty-title">No events to manage</div><p class="empty-desc">Create an event to start managing attendee registrations.</p><button class="btn btn-primary mt-16" onclick="openAddEventModal()">Create Event</button></div></div>';

      if (CU.role === 'organizer' && myEvents.length > 0) {
        const approvedCount = regs.filter(r => ['Approved', 'No Approval Required', 'Attended'].includes(organizerRegistrationStatus(r))).length;
        const pendingCount = regs.filter(r => ['Pending', 'Payment Pending'].includes(organizerRegistrationStatus(r))).length;
        const rejectedCount = regs.filter(r => organizerRegistrationStatus(r) === 'Declined').length;
        const eventStatus = selectedEvent.status === 'published' ? 'Published' : selectedEvent.status === 'draft' ? 'Draft' : (selectedEvent.status || 'Event');
        return `
    <div class="org-attendees">
    <div class="page-hd org-attendees-heading">
      <div class="page-hd-left"><div class="page-title">Attendee Management</div><div class="page-sub">${regs.length} attendees · ${approvedCount} approved · ${pendingCount} pending</div></div>
    </div>
    <div class="card org-attendee-event-card">
      <div><div class="label mb-8">SELECT EVENT</div><div class="small">Choose an event to view its registrations</div></div>
      <details class="org-event-picker">
        <summary><span><strong>${escapeHtml(selectedEvent.title)}</strong><small>${escapeHtml(eventStatus)} · ${Number(selectedEvent.registered) || 0} registered</small></span><span aria-hidden="true">⌄</span></summary>
        <div class="org-event-options"><div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" aria-label="Search your events" placeholder="Search events…" oninput="filterOrganizerEventOptions(this.value)"></div>
          <div class="org-event-option-list" role="listbox" aria-label="Your events">${myEvents.map(e => `<button type="button" role="option" aria-selected="${String(e.id) === String(selectedEventId)}" data-event-name="${escapeHtml(e.title)}" onclick="switchOrganizerEvent('${escapeHtml(e.id)}')"><span><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.status === 'published' ? 'Published' : e.status || 'Event')}</small></span><span class="org-event-option-count">${Number(e.registered) || 0} registered</span></button>`).join('')}</div>
          <div class="org-event-no-match" hidden>No matching events</div>
        </div>
      </details>
      ${isPrivateEvent ? `<span class="badge badge-blue">🔒 Private Event</span>` : ''}
    </div>
    <div class="org-attendee-stats">
      <div class="card"><span>Total Attendees</span><strong>${regs.length}</strong><small>For this event</small></div>
      <div class="card"><span>Approved</span><strong>${approvedCount}</strong><small>Confirmed or attended</small></div>
      <div class="card"><span>Pending</span><strong>${pendingCount}</strong><small>Awaiting review or payment</small></div>
      <div class="card"><span>Rejected</span><strong>${rejectedCount}</strong><small>Declined registrations</small></div>
    </div>
    <div class="card org-attendee-list-card">
    <div class="org-attendee-list-heading"><div><div class="h4">Attendees</div><div class="small">${escapeHtml(selectedEvent.title)} · ${regs.length} registrations</div></div></div>
    <div class="filter-row org-attendee-filters">
      <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="at-q" aria-label="Search attendees" placeholder="Search name, email or ticket ID…" oninput="refreshAttendees()"></div>
      <select class="form-control filter-select" id="at-status" aria-label="Filter attendee status" onchange="refreshAttendees()">
        <option value="">All Status</option>
        ${selectedEvent?.visibility === 'public' ? '<option value="no approval required">No Approval Required</option><option value="payment pending">Payment Pending</option>' : '<option value="approved">Approved</option><option value="pending">Pending Review</option>'}
        <option value="rejected">Declined</option>
        <option value="cancelled">Cancelled</option>
        <option value="attended">Attended</option>
      </select>
    </div>
    <div id="attendees-tbl">${buildOrganizerAttendeesTbl(regs, selectedEvent, isPrivateEvent)}</div>
    </div></div>
    `;
      }

      const checkedIn2 = regs.filter(r => r.checkedIn).length;
      return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Attendee Management</div><div class="page-sub">${regs.length} total · ${checkedIn2} checked in</div></div>
    <div class="page-hd-right">
      <button class="btn btn-ghost" onclick="toast('Exported to CSV','success')">📥 Export CSV</button>
    </div>
  </div>
  <div class="filter-row">
    <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="at-q" placeholder="Search attendees…" oninput="refreshAttendees()"></div>
    <select class="form-control filter-select" id="at-ev" onchange="refreshAttendees()">
      <option value="">All Events</option>
      ${DB.events.map(e => `<option value="${e.id}">${e.title}</option>`).join('')}
    </select>
    <select class="form-control filter-select" id="at-ci" onchange="refreshAttendees()">
      <option value="">All</option><option value="in">Checked In</option><option value="out">Not Checked In</option>
    </select>
  </div>
  <div id="attendees-tbl">${buildAttendeesTbl(regs)}</div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function AttendeesPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
