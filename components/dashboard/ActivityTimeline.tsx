'use client';

import { Clock, CheckCircle, Car, MapPin, AlertTriangle, Wrench, Calendar } from 'lucide-react';
import { ActivityData } from '@/data/dashboard';

interface ActivityTimelineProps {
  activities: ActivityData[];
}

const iconMap = {
  'Passenger count updated': { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  'Vehicle departed': { icon: Car, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'Station status changed': { icon: MapPin, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'Crowd alert generated': { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
  'Maintenance completed': { icon: Wrench, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'Vehicle added': { icon: Car, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'Route updated': { icon: Calendar, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  'Alert resolved': { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
};

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const config = iconMap[activity.action as keyof typeof iconMap] || {
            icon: Clock,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
          };
          const Icon = config.icon;

          return (
            <div key={activity.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full ${config.bgColor} ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {index !== activities.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-2" />
                )}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {activity.timestamp}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
