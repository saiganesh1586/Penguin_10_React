import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataStore } from '../../common/data-store';
import { UserRole } from '../../common/constants';
@Injectable()
export class NotificationsService {
  private db: DataStore;
  constructor() {
    this.db = DataStore.getInstance();
  }
  findAll(role: UserRole, userId: string): any[] {
    if (!userId) throw new ForbiddenException('x-user-id header is required to view notifications');
    return this.db.notifications
      .filter(notification => notification.userId === userId)
      .sort((notification, b) => {
        const timeA = new Date(notification.dateTime || notification.createdAt || 0).getTime();
        const timeB = new Date(b.dateTime || b.createdAt || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return (b.notificationId || '').localeCompare(notification.notificationId || '');
      });
  }
  markRead(notificationId: string, userId: string): any {
    if (!userId) throw new ForbiddenException('User ID is required');
    const notif = this.db.notifications.find(
      notification =>
        notification.notificationId === notificationId && notification.userId === userId
    );
    if (!notif) throw new NotFoundException('Notification not found');
    notif.read = true;
    return {
      success: true,
      message: 'Notification marked as read',
      data: notif,
    };
  }
  markAllRead(userId: string): any {
    if (!userId) throw new ForbiddenException('User ID is required');
    const notifs = this.db.notifications.filter(notification => notification.userId === userId);
    notifs.forEach(n => (n.read = true));
    return {
      success: true,
      message: `${notifs.length} notifications marked as read`,
    };
  }
  getUnreadCount(userId: string): any {
    if (!userId) throw new ForbiddenException('User ID is required');
    const count = this.db.notifications.filter(
      notification => notification.userId === userId && !notification.read
    ).length;
    return {
      userId,
      unreadCount: count,
    };
  }
}
