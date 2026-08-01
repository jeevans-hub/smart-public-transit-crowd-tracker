import React from 'react';
import { MaintenanceSchedule as MaintenanceScheduleType } from '@/types/operations';

interface MaintenanceScheduleProps {
  schedule: MaintenanceScheduleType[];
  loading?: boolean;
}

export const MaintenanceSchedule: React.FC<MaintenanceScheduleProps> = ({ schedule, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return 'bg-red-100 text-red-700';
      case 'URGENT': return 'bg-orange-100 text-orange-700';
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-700';
      case 'ROUTINE': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const upcomingSchedule = schedule
    .filter(item => new Date(item.scheduledDate) >= new Date())
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 10);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Schedule</h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {upcomingSchedule.length > 0 ? (
          upcomingSchedule.map((item) => (
            <div key={`${item.vehicleId}-${item.scheduledDate}`} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.vehicleNumber}</p>
                  <p className="text-xs text-gray-500">{item.maintenanceType}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-gray-500">Scheduled Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(item.scheduledDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">{item.estimatedDuration}h</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium text-gray-900">{item.status}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No scheduled maintenance</p>
          </div>
        )}
      </div>
    </div>
  );
};