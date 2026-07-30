'use client';

import { AlertTriangle, Clock, MapPin, X } from 'lucide-react';
import { AlertData } from '@/data/dashboard';

interface AlertPanelProps {
  alerts: AlertData[];
}

const priorityConfig = {
  critical: {
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  high: {
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  medium: {
    borderColor: 'border-l-yellow-500',
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
  },
  low: {
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
};

export default function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Live Alerts</h3>
        <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
          {alerts.length} Active
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = priorityConfig[alert.priority];
          
          return (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${config.borderColor} ${config.bgColor} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={`w-4 h-4 ${config.iconColor}`} />
                    <span className="font-medium text-gray-900">{alert.type}</span>
                    <span className="text-xs text-gray-500 capitalize">• {alert.priority}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{alert.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                </div>
                <button className="p-1 hover:bg-white rounded transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
