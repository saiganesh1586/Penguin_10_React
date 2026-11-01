import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

// App.jsx extracts the marked functions into the browser runtime.
// The React component below mounts the HTML returned by those functions.
function portalRuntimeDefinitions() {
  /* PORTAL_RUNTIME_START */
  function pageNotifications() {
    const notifications = visibleNotifications();
    const unread = notifications.filter(notification => !notification.read).length;
    return `
  <div class="page-hd">
    <div class="page-hd-left"><div class="page-title">Notifications</div><div class="page-sub">${unread} unread notification${
      unread !== 1 ? 's' : ''
    }</div></div>
    <div class="page-hd-right"><button class="btn btn-ghost btn-sm" onclick="markAllRead()">✓ Mark All Read</button></div>
  </div>
  <div class="card p-0 notif-panel">
    ${
      notifications.length === 0
        ? `<div class="empty"><div class="empty-icon">🔔</div><div class="empty-title">All caught up!</div></div>`
        : `
    ${notifications
      .map(
        notification => `
      <div class="notif-item${notification.read ? '' : ' unread'}" onclick="markNotifRead('${
          notification.id
        }')">
        <div class="notif-icon" style="background:${
          notification.type === 'success'
            ? 'var(--green-dim)'
            : notification.type === 'warning'
            ? 'var(--yellow-dim)'
            : notification.type === 'error'
            ? 'var(--red-dim)'
            : 'var(--accent-dim)'
        }">${notification.icon || '🔔'}</div>
        <div class="notif-content">
          <div class="notif-title" style="${
            notification.read ? '' : 'font-weight:600'
          }">${escapeHtml(notification.title || 'Notification')}</div>
          <div class="notif-msg">${escapeHtml(notification.msg || notification.message || '')}</div>
          <div class="notif-time">${escapeHtml(notification.time || '')}</div>
          ${
            ['event_cancelled', 'booking_cancelled', 'request_cancelled'].includes(
              notification.notificationType || notification.type
            ) &&
            (notification.requestId || notification.eventId)
              ? `<button type="button" class="btn btn-ghost btn-sm mt-8" onclick="event.stopPropagation();openClientCancellationNotification('${escapeHtml(
                  String(notification.id)
                )}')">View Cancellation Details</button>`
              : ''
          }
        </div>
        ${!notification.read ? `<div class="unread-dot"></div>` : ''}
      </div>`
      )
      .join('')}`
    }
  </div>`;
  }
  /* PORTAL_RUNTIME_END */
}

export default function NotificationsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
