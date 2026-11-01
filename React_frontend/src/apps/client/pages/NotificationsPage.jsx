import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function portalRuntimeDefinitions() {
/* PORTAL_RUNTIME_START */function pageNotifications() {
      const notifications = visibleNotifications();
      const unread = notifications.filter(n => !n.read).length;
      return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Notifications</div><div class="page-sub">${unread} unread notification${unread !== 1 ? 's' : ''}</div></div>
    <div class="page-hd-right"><button class="btn btn-ghost btn-sm" onclick="markAllRead()">✓ Mark All Read</button></div>
  </div>
  <div class="card p-0 notif-panel">
    ${notifications.length === 0 ? `<div class="empty"><div class="empty-icon">🔔</div><div class="empty-title">All caught up!</div></div>` : `
    ${notifications.map(n => `
      <div class="notif-item${n.read ? '' : ' unread'}" onclick="markNotifRead('${n.id}')">
        <div class="notif-icon" style="background:${n.type === 'success' ? 'var(--green-dim)' : n.type === 'warning' ? 'var(--yellow-dim)' : n.type === 'error' ? 'var(--red-dim)' : 'var(--accent-dim)'}">${n.icon || '🔔'}</div>
        <div class="notif-content">
          <div class="notif-title" style="${n.read ? '' : 'font-weight:600'}">${escapeHtml(n.title || 'Notification')}</div>
          <div class="notif-msg">${escapeHtml(n.msg || n.message || '')}</div>
          <div class="notif-time">${escapeHtml(n.time || '')}</div>
          ${['event_cancelled', 'booking_cancelled', 'request_cancelled'].includes(n.notificationType || n.type) && (n.requestId || n.eventId) ? `<button type="button" class="btn btn-ghost btn-sm mt-8" onclick="event.stopPropagation();openClientCancellationNotification('${escapeHtml(String(n.id))}')">View Cancellation Details</button>` : ''}
        </div>
        ${!n.read ? `<div class="unread-dot"></div>` : ''}
      </div>`).join('')}`}
  </div>`;
    }/* PORTAL_RUNTIME_END */
}

export default function NotificationsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
