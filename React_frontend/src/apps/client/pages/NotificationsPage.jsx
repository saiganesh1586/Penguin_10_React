import { useClientContext } from '../context/ClientContext.jsx';
export default function NotificationsPage() {
  const portalContext = useClientContext();
  const portalActions = portalContext.actions;
  const { visibleNotifications } = portalContext;
  const notifications = visibleNotifications();
  const unread = notifications.filter(notification => !notification.read).length;
  return (
    <>
      <div className="page-hd">
        <div className="page-hd-left">
          <div className="page-title">Notifications</div>
          <div className="page-sub">
            {unread} unread notification{unread !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="page-hd-right">
          <button className="btn btn-ghost btn-sm" onClick={() => portalActions.onMarkAllRead()}>
            ✓ Mark All Read
          </button>
        </div>
      </div>
      <div className="card p-0 notif-panel">
        {notifications.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔔</div>
            <div className="empty-title">All caught up!</div>
          </div>
        ) : (
          notifications.map((notification, index) => (
            <div
              className={`notif-item${notification.read ? '' : ' unread'}`}
              onClick={() => portalActions.onMarkNotifRead(notification.id)}
              key={
                notification?.id ??
                notification?.requestId ??
                notification?.eventId ??
                notification?.title ??
                index
              }
            >
              <div
                className="notif-icon"
                style={{
                  background:
                    notification.type === 'success'
                      ? 'var(--green-dim)'
                      : notification.type === 'warning'
                      ? 'var(--yellow-dim)'
                      : notification.type === 'error'
                      ? 'var(--red-dim)'
                      : 'var(--accent-dim)',
                }}
              >
                {notification.icon || '🔔'}
              </div>
              <div className="notif-content">
                <div
                  className="notif-title"
                  style={
                    notification.read
                      ? {}
                      : {
                          fontWeight: '600',
                        }
                  }
                >
                  {notification.title || 'Notification'}
                </div>
                <div className="notif-msg">{notification.msg || notification.message || ''}</div>
                <div className="notif-time">{notification.time || ''}</div>
                {['event_cancelled', 'booking_cancelled', 'request_cancelled'].includes(
                  notification.notificationType || notification.type
                ) &&
                (notification.requestId || notification.eventId) ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm mt-8"
                    onClick={event => {
                      event.stopPropagation();
                      portalActions.onOpenClientCancellationNotification(String(notification.id));
                    }}
                  >
                    View Cancellation Details
                  </button>
                ) : (
                  ''
                )}
              </div>
              {!notification.read ? <div className="unread-dot"></div> : ''}
            </div>
          ))
        )}
      </div>
    </>
  );
}
