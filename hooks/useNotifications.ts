import { useState, useEffect, useCallback, useRef } from 'react';
import { Notification, NotificationType, NotificationPriority } from '@/types/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const idCounter = useRef(0);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${idCounter.current++}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Toggle notification panel
  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close panel
  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Simulate receiving notifications from Socket.IO
  useEffect(() => {
    // This would normally connect to Socket.IO events
    // For now, we'll add some demo notifications
    const demoNotifications: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [
      {
        type: 'ALERT',
        priority: 'HIGH',
        title: 'High Crowd Alert',
        message: 'Station Central is experiencing high crowd levels (85% occupancy)',
        actionUrl: '/dashboard/live',
      },
      {
        type: 'PREDICTION',
        priority: 'MEDIUM',
        title: 'Prediction Update',
        message: 'New crowd predictions available for Route 101',
        actionUrl: '/dashboard/predictions',
      },
      {
        type: 'INFO',
        priority: 'LOW',
        title: 'System Update',
        message: 'Analytics dashboard is now available',
        actionUrl: '/dashboard/analytics',
      },
    ];

    // Add demo notifications on mount
    demoNotifications.forEach((notif, index) => {
      setTimeout(() => {
        addNotification(notif);
      }, index * 1000);
    });
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    isOpen,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    togglePanel,
    closePanel,
  };
}
