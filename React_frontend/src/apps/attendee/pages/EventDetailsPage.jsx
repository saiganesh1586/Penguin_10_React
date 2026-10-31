import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function attendeeRuntimeDefinitions() {
/* ATTENDEE_RUNTIME_START */function openViewEventDrawer(id, registrationId = null) {
      const e = DB.events.find(ev => String(ev.id) === String(id)); if (!e) return;
      const regs = DB.registrations.filter(r => String(r.eventId) === String(id));

      const bannerHTML = e.image ? `
        <div style="height:140px;border-radius:12px;overflow:hidden;margin-bottom:16px;position:relative;background:${e.color || 'var(--accent)'}18">
          <img src="${e.image}" alt="${e.title || 'Event'}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='<div style=\'font-size:52px;text-align:center;padding:30px 0\'>${e.emoji || '📅'}</div>'">
        </div>
      ` : `<div style="font-size:52px;text-align:center;margin-bottom:16px">${e.emoji || '📅'}</div>`;
      openDrawer(e.title, `
    ${bannerHTML}
    <span class="badge badge-${evStatBadge(e.status)} mb-16">${e.status}</span>
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:20px">
      <div class="info-row"><span class="info-label">Category</span><span class="info-value">${escapeHtml(e.category)}</span></div>
      <div class="info-row"><span class="info-label">Date & Time</span><span class="info-value">${escapeHtml(e.date)} · ${escapeHtml(e.time)}</span></div>
      <div class="info-row"><span class="info-label">Venue</span><span class="info-value" style="max-width:200px;text-align:right">${escapeHtml(e.venue)}</span></div>
      <div class="info-row"><span class="info-label">City</span><span class="info-value">${escapeHtml(e.city || '—')}</span></div>
      <div class="info-row"><span class="info-label">Capacity</span><span class="info-value">${e.registered} / ${e.capacity}</span></div>
      <div class="info-row"><span class="info-label">Price</span><span class="info-value" style="color:var(--green)">${e.price === 0 ? 'Free' : '₹' + e.price}</span></div>
      <div class="info-row"><span class="info-label">Registrations</span><span class="info-value">${regs.length}</span></div>

    </div>
    ${e.description ? `<div class="label mb-8">Description</div><p class="muted" style="font-size:13px;line-height:1.7">${e.description}</p>` : ''}
    ${(e.tags || []).length ? `<div class="label mt-16 mb-8">Tags</div><div class="tag-list">${e.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
    ${CU?.role === 'organizer' ? `<div class="flex gap-8 mt-20"><button class="btn btn-primary w-full" onclick="closeDrawer();openEditEventModal('${id}')">✏️ Edit Event</button></div>` : ''}
  `);
    }

/* ATTENDEE_RUNTIME_END */
}

export default function EventDetailsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
