import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageCompletedEvents(embedded = false) {
      const completed = DB.events.filter(e => e.status === 'completed').sort((a, b) => new Date(b.date) - new Date(a.date));

      return `${embedded ? '' : `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Completed Events</div>
      <div class="page-sub">Events that have been successfully completed</div>
    </div>
  </div>`}
  <div class="events-grid">${completed.length === 0 ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">✅</div><div class="empty-title">No completed events</div></div>` : completed.map(e => {
        const bannerContent = e.image ? `
          <img src="${e.image}" alt="${e.title || 'Event'}" class="ev-banner-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="ev-banner-fallback" style="display:none;align-items:center;justify-content:center;font-size:52px;width:100%;height:100%">${e.emoji || '📅'}</div>
          <div class="ev-banner-overlay"></div>
        ` : `<span style="font-size:52px">${e.emoji || '📅'}</span>`;
        return `<div class="ev-card">
    <div class="ev-banner" style="background:${e.color || 'var(--accent)'}18">
      ${bannerContent}
      <div class="ev-banner-tag"><span class="badge badge-green">✓ Completed</span></div>
      <div class="ev-banner-price">${e.price === 0 ? 'Free' : '₹' + e.price}</div>
    </div>
    <div class="ev-body">
      <div class="ev-title">${e.title}</div>
      <div class="ev-meta">
        <div class="ev-meta-row"><span>📅</span>${e.date} · ${e.time}</div>
        <div class="ev-meta-row"><span>📍</span>${e.venue}</div>
        <div class="ev-meta-row"><span>🏷️</span>${e.category}</div>
      </div>
      <div style="margin-bottom:12px">
        <div class="flex justify-between ev-cap mb-4"><span>${e.registered}/${e.capacity} attended</span></div>
        <div style="font-size:12px;color:var(--green);margin-top:8px">✓ Event Successfully Completed</div>
      </div>
      <div class="ev-footer">
        <div class="flex gap-6" style="width:100%;justify-content:space-between">
          <button class="btn btn-ghost btn-xs w-full" onclick="viewWorkflowEventDetails('${e.id}')" title="View event details">👁️ View Details</button>
          <button class="btn btn-primary btn-xs" onclick="viewWorkflowEventReport('${e.id}')" title="View completion report">📊 View Report</button>
        </div>
        <div class="tag-list" style="flex:1;justify-content:flex-end">${(e.tags || []).slice(0, 2).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
    </div>
  </div>`;
      }).join('')}</div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function CompletedEventsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
