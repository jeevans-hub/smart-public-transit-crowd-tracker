export type NotificationType = 'ALERT' | 'WARNING' | 'INFO' | 'SUCCESS' | 'PREDICTION' | 'SYSTEM';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
}
