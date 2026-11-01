import React from 'react';

const backgrounds = {
  success: 'var(--green-dim)',
  warning: 'var(--yellow-dim)',
  error: 'var(--red-dim)',
};

export default function NotificationCard({ notification, onRead }) {
  return (
    <div
      className={`notif-item${notification.read ? '' : ' unread'}`}
      onClick={() => onRead?.(notification.id)}
    >
      <div
        className="notif-icon"
        style={{ background: backgrounds[notification.type] || 'var(--accent-dim)' }}
      >
        {notification.icon || '🔔'}
      </div>
      <div className="notif-content">
        <div className="notif-title" style={notification.read ? undefined : { fontWeight: 600 }}>
          {notification.title || ''}
        </div>
        <div className="notif-msg" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {notification.msg || ''}
        </div>
        <div className="notif-time">{notification.time}</div>
      </div>
      {!notification.read && <div className="unread-dot" />}
    </div>
  );
}
