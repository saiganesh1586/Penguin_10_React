import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageCompletedEvents(embedded = false) {
    const completed = DB.events
      .filter(event => event.status === 'completed')
      .sort((leftEvent, rightEvent) => new Date(rightEvent.date) - new Date(leftEvent.date));
    return `${
      embedded
        ? ''
        : `
  <div class="page-hd">
    <div class="page-hd-left">
      <div class="page-title">Completed Events</div>
      <div class="page-sub">Events that have been successfully completed</div>
    </div>
  </div>`
    }
  <div class="events-grid">${
    completed.length === 0
      ? `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">✅</div><div class="empty-title">No completed events</div></div>`
      : completed
          .map(event => {
            const bannerContent = event.image
              ? `
          <img src="${event.image}" alt="${
                  event.title || 'Event'
                }" class="ev-banner-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="ev-banner-fallback" style="display:none;align-items:center;justify-content:center;font-size:52px;width:100%;height:100%">${
            event.emoji || '📅'
          }</div>
          <div class="ev-banner-overlay"></div>
        `
              : `<span style="font-size:52px">${event.emoji || '📅'}</span>`;
            return `<div class="ev-card">
    <div class="ev-banner" style="background:${event.color || 'var(--accent)'}18">
      ${bannerContent}
      <div class="ev-banner-tag"><span class="badge badge-green">✓ Completed</span></div>
      <div class="ev-banner-price">${event.price === 0 ? 'Free' : '₹' + event.price}</div>
    </div>
    <div class="ev-body">
      <div class="ev-title">${event.title}</div>
      <div class="ev-meta">
        <div class="ev-meta-row"><span>📅</span>${event.date} · ${event.time}</div>
        <div class="ev-meta-row"><span>📍</span>${event.venue}</div>
        <div class="ev-meta-row"><span>🏷️</span>${event.category}</div>
      </div>
      <div style="margin-bottom:12px">
        <div class="flex justify-between ev-cap mb-4"><span>${event.registered}/${
              event.capacity
            } attended</span></div>
        <div style="font-size:12px;color:var(--green);margin-top:8px">✓ Event Successfully Completed</div>
      </div>
      <div class="ev-footer">
        <div class="flex gap-6" style="width:100%;justify-content:space-between">
          <button class="btn btn-ghost btn-xs w-full" onclick="viewWorkflowEventDetails('${
            event.id
          }')" title="View event details">👁️ View Details</button>
          <button class="btn btn-primary btn-xs" onclick="viewWorkflowEventReport('${
            event.id
          }')" title="View completion report">📊 View Report</button>
        </div>
        <div class="tag-list" style="flex:1;justify-content:flex-end">${(event.tags || [])
          .slice(0, 2)
          .map(tag => `<span class="tag">${tag}</span>`)
          .join('')}</div>
      </div>
    </div>
  </div>`;
          })
          .join('')
  }</div>`;
  }
  /* PORTAL_RUNTIME_END */
}
export default function CompletedEventsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
