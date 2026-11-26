import PageHeader from '../components/PageHeader.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../../app/components/PageFeedback.jsx';

const backgrounds = {
  success: 'var(--green-dim)',
  warning: 'var(--yellow-dim)',
  error: 'var(--red-dim)',
};

export default function NotificationsPage({
  notifications = [],
  loading = false,
  error = '',
  onRetry,
  onMarkAllRead,
  onMarkNotificationRead,
}) {
  if (loading) return <LoadingState icon="🔔" title="Loading notifications…" />;
  if (error)
    return (
      <ErrorState icon="⚠️" title="Notifications could not be loaded" message={error} onRetry={onRetry} />
    );

  const unread = notifications.filter(item => !item.read).length;
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread notification${unread !== 1 ? 's' : ''}`}
        action={
          <button className="btn btn-ghost btn-sm" onClick={onMarkAllRead}>
            ✓ Mark All Read
          </button>
        }
      />
      <div className="card p-0 notif-panel">
        {notifications.length ? (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`notif-item${notification.read ? '' : ' unread'}`}
              onClick={() => onMarkNotificationRead?.(notification.id)}
            >
              <div
                className="notif-icon"
                style={{ background: backgrounds[notification.type] || 'var(--accent-dim)' }}
              >
                {notification.icon || '🔔'}
              </div>
              <div className="notif-content">
                <div
                  className="notif-title"
                  style={notification.read ? undefined : { fontWeight: 600 }}
                >
                  {notification.title || ''}
                </div>
                <div
                  className="notif-msg"
                  style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                  {notification.msg || ''}
                </div>
                <div className="notif-time">{notification.time}</div>
              </div>
              {!notification.read && <div className="unread-dot" />}
            </div>
          ))
        ) : (
          <EmptyState icon="🔔" title="All caught up!" />
        )}
      </div>
    </>
  );
}
