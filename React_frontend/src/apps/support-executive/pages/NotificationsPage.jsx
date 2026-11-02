import { useSupportExecutiveContext } from '../context/SupportExecutiveContext.jsx';
export default function NotificationsPage() {
  const portalContext = useSupportExecutiveContext();
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
              key={notification?.id ?? notification?.title ?? index}
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
                  {notification.title}
                </div>
                <div className="notif-msg">{notification.msg}</div>
                <div className="notif-time">{notification.time}</div>
              </div>
              {!notification.read ? <div className="unread-dot"></div> : ''}
            </div>
          ))
        )}
      </div>
    </>
  );
}
