'use client';

import React from 'react';
import { Notification } from '@/types/notification';
import { Bell, X, Check, Trash2, AlertTriangle, Info, CheckCircle, AlertCircle, Brain } from 'lucide-react';

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadCount,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ALERT': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'WARNING': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'INFO': return <Info className="w-5 h-5 text-blue-500" />;
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'PREDICTION': return <Brain className="w-5 h-5 text-purple-500" />;
      case 'SYSTEM': return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'border-l-red-500';
      case 'HIGH': return 'border-l-orange-500';
      case 'MEDIUM': return 'border-l-yellow-500';
      case 'LOW': return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-20 right-6 w-96 bg-white rounded-xl shadow-2xl z-50 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
          <button
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Bell className="w-12 h-12 mb-2 text-gray-300" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                      {notification.actionUrl && (
                        <a
                          href={notification.actionUrl}
                          className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700"
                          onClick={onClose}
                        >
                          View details →
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    {!notification.read && (
                      <button
                        onClick={() => onMarkAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(notification.id)}
                      className="text-xs text-red-600 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Close panel
          </button>
        </div>
      </div>
    </>
  );
};
