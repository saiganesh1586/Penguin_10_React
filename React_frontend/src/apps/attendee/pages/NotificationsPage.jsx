import React from 'react';
import LegacyPageMarkup from '../../../app/LegacyPageMarkup.jsx';

function attendeeRuntimeDefinitions() {
/* ATTENDEE_RUNTIME_START */    function notificationTitle(type) {
      return ({ registration_confirmed: 'Registration Confirmed', registration_approved: 'Registration Approved', registration_rejected: 'Registration Declined', pending_approval: 'Approval Requested', registration_requested: 'New Registration Request', pending_payment: 'Payment Required', refund_completed: 'Refund Completed', event_changed: 'Event Updated', event_cancelled: 'Event Cancelled' })[type] || 'EventFlow Update';
    }
    function notificationTone(type) {
      if (['registration_confirmed', 'registration_approved', 'payment_confirmed', 'refund_completed'].includes(type)) return 'success';
      if (['pending_payment', 'event_changed'].includes(type)) return 'warning';
      if (['event_cancelled', 'registration_rejected'].includes(type)) return 'error';
      return 'info';
    }
    function visibleNotifications() {
      if (CU?.role === 'attendee') return attendeeNotificationCatalog;
      return CU?.role === 'employee' && CU.employeeType === 'SUPPORT_FINANCE'
        ? DB.notifications.filter(notification => notification.employeeType === 'SUPPORT_FINANCE')
        : DB.notifications;
    }
    function pageNotifications() {
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
          <div class="notif-title" style="${n.read ? '' : 'font-weight:600'}">${escapeHtml(n.title || '')}</div>
          <div class="notif-msg" style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(n.msg || '')}</div>
          <div class="notif-time">${n.time}</div>
        </div>
        ${!n.read ? `<div class="unread-dot"></div>` : ''}
      </div>`).join('')}`}
  </div>`;
    }
    function markNotifRead(id) {
      if (CU.role === 'attendee') {
        apiMarkNotificationRead(id)
          .then(function () { const n = attendeeNotificationCatalog.find(item => item.id === id); if (n) n.read = true; renderPage('notifications'); })
          .catch(function (error) { toast(error.message || 'Notification could not be updated.', 'error'); });
        return;
      }
      const n = DB.notifications.find(n => n.id == id);
      if (!n) return;
      n.read = true;
      saveDB();
      updateNotifDot();
      if (isDepartmentEmployee()) buildEmployeeNav(CU.employeeType); else buildNav(CU.role);

      renderPage('notifications');
    }
    function markAllRead() {
      if (CU.role === 'attendee') {
        apiMarkAllNotificationsRead()
          .then(function () { attendeeNotificationCatalog.forEach(n => n.read = true); renderPage('notifications'); toast('All notifications marked as read', 'success'); })
          .catch(function (error) { toast(error.message || 'Notifications could not be updated.', 'error'); });
        return;
      }
      visibleNotifications().forEach(n => n.read = true);
      renderPage('notifications'); updateNotifDot(); if (isDepartmentEmployee()) buildEmployeeNav(CU.employeeType); else buildNav(CU.role); toast('All notifications marked as read', 'success');
    }

    // ════════════════════════════════════════════════
    //  PROFILE
    // ════════════════════════════════════════════════
/* ATTENDEE_RUNTIME_END */
}

export default function NotificationsPage({ html }) {
  return <LegacyPageMarkup html={html} />;
}
