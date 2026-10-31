import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function attendeeRuntimeDefinitions() {
/* ATTENDEE_RUNTIME_START */    function normalizeAttendeeEvent(event) {
      const existing = DB.events.find(e => String(e.eventId || e.id) === String(event.eventId || event.id));
      const registered = Number(event.registered ?? existing?.registered ?? 0);
      const remaining = event.remainingCapacity !== undefined
        ? Number(event.remainingCapacity)
        : Math.max(0, Number(event.capacity || 0) - registered);
      const start = event.date ? new Date(`${event.date}T${event.time || '00:00'}`) : null;
      const end = event.endDate
        ? new Date(`${event.endDate}T${event.endTime || '23:59:59'}`)
        : event.date ? new Date(`${event.date}T${event.endTime || '23:59:59'}`) : null;
      const now = new Date();
      const calendarStatus = start && !Number.isNaN(start.getTime())
        ? now < start ? 'upcoming' : end && now > end ? 'completed' : 'ongoing'
        : event.status === 'published' ? 'upcoming' : event.status;
      const normalized = {
        ...(existing || {}),
        ...event,
        id: event.eventId || event.id,
        eventId: event.eventId || event.id,
        title: event.title || event.name,
        emoji: event.emoji || existing?.emoji || '📅',
        venue: event.venue || event.location,
        price: Number(event.price ?? event.ticketPrice ?? 0),
        registered,
        remainingCapacity: remaining,
        visibility: event.visibility === 'private' ? 'private' : 'public',
        status: ['cancelled', 'draft'].includes(event.status) ? event.status : calendarStatus === 'completed' ? 'completed' : remaining === 0 && Number(event.capacity) > 0 ? 'full' : calendarStatus,
      };
      const index = DB.events.findIndex(e => String(e.id) === String(normalized.id));
      if (index >= 0) DB.events[index] = normalized;
      else DB.events.push(normalized);
      return normalized;
    }
    function getRegisteredEventIdSet() {
      const set = new Set();
      (attendeeRegistrationCatalog || [])
        .filter(r => r.status !== 'cancelled')
        .forEach(r => {
          if (r.eventId) set.add(String(r.eventId));
          if (r.event?.id) set.add(String(r.event.id));
          if (r.event?.eventId) set.add(String(r.event.eventId));
        });
      (DB.registrations || [])
        .filter(r => r.status !== 'cancelled' && (String(r.attendeeId) === String(CU?.id) || String(r.attendeeId) === String(CU?.userId)))
        .forEach(r => {
          if (r.eventId) set.add(String(r.eventId));
        });
      return set;
    }

    function newestBrowseEventFirst(a, b) {
      const createdA = Date.parse(a.createdAt || a.created || a.updatedAt || '') || 0;
      const createdB = Date.parse(b.createdAt || b.created || b.updatedAt || '') || 0;
      return createdB - createdA || String(b.eventId || b.id || '').localeCompare(String(a.eventId || a.id || ''));
    }

    function pageBrowseEvents() {
      const now = new Date();
      const registeredIds = getRegisteredEventIdSet();
      const avail = attendeeEventCatalog.filter(e =>
        e.status !== 'completed' &&
        e.status !== 'cancelled' &&
        new Date(`${e.date}T23:59:59`) >= now &&
        !registeredIds.has(String(e.id)) &&
        !registeredIds.has(String(e.eventId))
      ).sort(newestBrowseEventFirst);
      return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Browse Events</div><div class="page-sub">Discover and register for new upcoming events.</div></div>
  </div>
  <div class="filter-row">
    <div class="search-box input-group"><span class="input-icon">🔍</span><input class="form-control" id="be-q" placeholder="Search events…" oninput="refreshBrowse()"></div>
    <select class="form-control filter-select" id="be-cat" onchange="refreshBrowse()">
      <option value="">All Categories</option>${[...new Set(avail.map(e => e.category).filter(Boolean))].sort().map(category => `<option>${escapeHtml(category)}</option>`).join('')}
    </select>
    <select class="form-control filter-select" id="be-price" onchange="refreshBrowse()">
      <option value="">Any Price</option><option value="free">Free Only</option><option value="paid">Paid Only</option>
    </select>
    <select class="form-control filter-select" id="be-city" onchange="refreshBrowse()">
      <option value="">Any City</option>
      ${[...new Set(avail.map(e => e.city).filter(Boolean))].map(c => `<option>${escapeHtml(c)}</option>`).join('')}
    </select>
  </div>
  <div class="events-grid" id="browse-grid">${avail.length ? avail.map(e => evCard(e, 'attendee')).join('') : `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📅</div><div class="empty-title">No new upcoming events</div><p class="empty-desc">Your registrations are in My Tickets. Check back soon for new events.</p></div>`}</div>`;
    }
    function refreshBrowse() {
      const q = (g('be-q') || {}).value?.toLowerCase() || '';
      const cat = (g('be-cat') || {}).value || '';
      const price = (g('be-price') || {}).value || '';
      const city = (g('be-city') || {}).value || '';
      const registeredIds = getRegisteredEventIdSet();
      const list = attendeeEventCatalog.filter(e => {
        if (e.status === 'completed' || e.status === 'cancelled' || new Date(`${e.date}T23:59:59`) < new Date()) return false;
        if (registeredIds.has(String(e.id)) || registeredIds.has(String(e.eventId))) return false;
        return (!q || e.title.toLowerCase().includes(q))
          && (!cat || e.category === cat)
          && (!price || (price === 'free' && e.price === 0) || (price === 'paid' && e.price > 0))
          && (!city || e.city === city);
      }).sort(newestBrowseEventFirst);
      g('browse-grid').innerHTML = list.map(e => evCard(e, 'attendee')).join('') || `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No events match</div><p class="empty-desc">Try adjusting your filters.</p></div>`;
    }
/* ATTENDEE_RUNTIME_END */
}

export default function BrowseEventsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
