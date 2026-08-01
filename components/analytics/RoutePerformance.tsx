import React from 'react';
import { RouteAnalytics } from '@/types/analytics';

interface RoutePerformanceProps {
  data: RouteAnalytics[];
  loading?: boolean;
}

export const RoutePerformance: React.FC<RoutePerformanceProps> = ({ data, loading }) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Performance</h3>
        <div className="h-96 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const topRoutes = data.slice(0, 10);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Performance Rankings</h3>
      <div className="space-y-3">
        {topRoutes.map((route, index) => (
          <div
            key={route.routeId}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                index === 0 ? 'bg-green-500' : index === data.length - 1 ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                {route.rank}
              </div>
              <div>
                <p className="font-medium text-gray-900">{route.routeName}</p>
                <p className="text-sm text-gray-500">{route.routeId}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="font-semibold text-gray-900">{route.efficiency.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Efficiency</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{route.averageOccupancy.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Occupancy</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{route.averageSpeed.toFixed(1)} km/h</p>
                <p className="text-sm text-gray-500">Speed</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
