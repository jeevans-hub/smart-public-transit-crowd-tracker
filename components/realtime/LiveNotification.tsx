'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type NotificationType = 'information' | 'success' | 'warning' | 'critical';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
}

interface LiveNotificationProps {
  notification: NotificationData;
  onClose: (id: string) => void;
}

const notificationStyles: Record<NotificationType, { bg: string; border: string; icon: any; iconColor: string }> = {
  information: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
};

export function LiveNotification({ notification, onClose }: LiveNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const style = notificationStyles[notification.type];
  const Icon = style.icon;
  const duration = notification.duration || 5000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [notification.id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  return (
    <div
      className={`
        ${style.bg} ${style.border}
        border rounded-lg shadow-lg p-4 mb-2
        transition-all duration-300 ease-in-out
        transform
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-700 break-words">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface LiveNotificationContainerProps {
  notifications: NotificationData[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function LiveNotificationContainer({
  notifications,
  onClose,
  position = 'top-right',
}: LiveNotificationContainerProps) {
  const positionStyles: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (notifications.length === 0) return null;

  return (
    <div
      className={`
        fixed z-50 w-full max-w-md
        ${positionStyles[position]}
        space-y-2
      `}
    >
      {notifications.map((notification) => (
        <LiveNotification
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

// Hook to manage notifications
export function useLiveNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    duration?: number
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification: NotificationData = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      duration,
    };

    setNotifications((prev) => [notification, ...prev]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
}
