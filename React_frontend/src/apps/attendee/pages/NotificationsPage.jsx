import React from 'react';
import NotificationCard from '../components/NotificationCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/PageFeedback.jsx';

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
      <ErrorState title="Notifications could not be loaded" message={error} onRetry={onRetry} />
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
          notifications.map(item => (
            <NotificationCard key={item.id} notification={item} onRead={onMarkNotificationRead} />
          ))
        ) : (
          <EmptyState icon="🔔" title="All caught up!" />
        )}
      </div>
    </>
  );
}
