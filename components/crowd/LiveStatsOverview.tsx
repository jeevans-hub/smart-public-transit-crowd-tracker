import React from 'react';
import { ICrowdStatistics } from '@/types/crowd';
import { Car, FileText, Activity, AlertTriangle, Route, MapPin } from 'lucide-react';

interface LiveStatsOverviewProps {
  stats: ICrowdStatistics | null;
  loading?: boolean;
}

export default function LiveStatsOverview({ stats, loading }: LiveStatsOverviewProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: 'Vehicles Online Today',
      value: stats.vehiclesOnline,
      icon: Car,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: "Today's Crowd Reports",
      value: stats.reportsToday,
      icon: FileText,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Average Occupancy',
      value: `${stats.averageOccupancy}%`,
      icon: Activity,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Highest Crowd Status',
      value: stats.mostCrowdedVehicle
        ? `${stats.mostCrowdedVehicle.occupancyPercentage}%`
        : 'N/A',
      subtitle: stats.mostCrowdedVehicle
        ? `Vehicle: ${stats.mostCrowdedVehicle.vehicleId}`
        : 'No peak data',
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4"
            >
              <div className={`p-3 rounded-lg ${item.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {item.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                {item.subtitle && (
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(stats.mostCrowdedRoute || stats.mostCrowdedStation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.mostCrowdedRoute && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Route size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Most Crowded Route</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Route ID: {stats.mostCrowdedRoute.routeId}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 rounded-full">
                {stats.mostCrowdedRoute.occupancyPercentage}% Occupancy
              </span>
            </div>
          )}

          {stats.mostCrowdedStation && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Most Crowded Station</p>
                  <p className="text-sm font-semibold text-gray-900">
                    Station ID: {stats.mostCrowdedStation.stationId}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full">
                {stats.mostCrowdedStation.occupancyPercentage}% Occupancy
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
