import React from 'react';
import { HeatmapData } from '@/types/analytics';

interface HeatmapChartProps {
  data: HeatmapData[];
  loading?: boolean;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Heatmap</h3>
        <div className="h-96 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-200';
    }
  };

  const getOccupancyForCell = (day: number, hour: number) => {
    const cellData = data.find(d => d.dayOfWeek === day && d.hour === hour);
    return cellData || { occupancy: 0, color: 'gray' };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Occupancy Heatmap</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-500 rounded" /> Low</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-yellow-500 rounded" /> Medium</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-orange-500 rounded" /> High</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-500 rounded" /> Critical</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-25 gap-1">
            <div className="col-span-1"></div>
            {hours.map(hour => (
              <div key={hour} className="text-xs text-gray-600 text-center py-2">
                {hour}
              </div>
            ))}
            {days.map((day, dayIndex) => (
              <React.Fragment key={day}>
                <div className="text-xs text-gray-600 font-medium py-2 flex items-center">
                  {day}
                </div>
                {hours.map(hour => {
                  const cellData = getOccupancyForCell(dayIndex, hour);
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`aspect-square rounded ${getColorClass(cellData.color)} hover:opacity-80 transition-opacity cursor-pointer`}
                      title={`${day} ${hour}:00 - ${cellData.occupancy.toFixed(0)}%`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
