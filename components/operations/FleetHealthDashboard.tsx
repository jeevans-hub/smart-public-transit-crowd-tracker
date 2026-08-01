import React from 'react';
import { FleetHealthMetrics as FleetHealthMetricsType } from '@/types/operations';

interface FleetHealthDashboardProps {
  fleetHealth: FleetHealthMetricsType | null;
  loading?: boolean;
}

export const FleetHealthDashboard: React.FC<FleetHealthDashboardProps> = ({ fleetHealth, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!fleetHealth) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Health Overview</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Health Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Overall Health Score */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <p className="text-sm font-medium text-blue-600 mb-2">Fleet Health Score</p>
          <div className="flex items-end gap-2">
            <p className={`text-4xl font-bold ${getHealthColor(fleetHealth.fleetHealthScore)}`}>
              {fleetHealth.fleetHealthScore}
            </p>
            <p className="text-lg text-gray-600 mb-1">/100</p>
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getHealthBgColor(fleetHealth.fleetHealthScore).replace('bg-', 'bg-')} transition-all duration-500`}
              style={{ width: `${fleetHealth.fleetHealthScore}%` }}
            />
          </div>
        </div>

        {/* Vehicle Status Counts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-700">Healthy Vehicles</span>
            </div>
            <span className="text-lg font-semibold text-green-600">{fleetHealth.healthyVehicles}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-sm text-gray-700">Maintenance Required</span>
            </div>
            <span className="text-lg font-semibold text-yellow-600">{fleetHealth.maintenanceRequired}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-sm text-gray-700">Critical Vehicles</span>
            </div>
            <span className="text-lg font-semibold text-red-600">{fleetHealth.criticalVehicles}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gray-500 rounded-full" />
              <span className="text-sm text-gray-700">Offline Vehicles</span>
            </div>
            <span className="text-lg font-semibold text-gray-600">{fleetHealth.offlineVehicles}</span>
          </div>
        </div>

        {/* Operational Availability */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <p className="text-sm font-medium text-purple-600 mb-2">Operational Availability</p>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-purple-600">
              {fleetHealth.operationalAvailability.toFixed(1)}
            </p>
            <p className="text-lg text-gray-600 mb-1">%</p>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {fleetHealth.totalVehicles - fleetHealth.offlineVehicles} of {fleetHealth.totalVehicles} vehicles operational
          </p>
        </div>
      </div>
    </div>
  );
};