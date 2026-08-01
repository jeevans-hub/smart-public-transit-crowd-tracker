import React from 'react';
import { VehicleAnalytics } from '@/types/analytics';

interface VehicleUtilizationProps {
  data: VehicleAnalytics[];
  loading?: boolean;
}

export const VehicleUtilization: React.FC<VehicleUtilizationProps> = ({ data, loading }) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Utilization</h3>
        <div className="h-96 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const topVehicles = data.slice(0, 10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MOVING': return 'bg-green-500';
      case 'STOPPED': return 'bg-yellow-500';
      case 'DELAYED': return 'bg-orange-500';
      case 'OFFLINE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Utilization Rankings</h3>
      <div className="space-y-3">
        {topVehicles.map((vehicle, index) => (
          <div
            key={vehicle.vehicleId}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                index === 0 ? 'bg-green-500' : index === data.length - 1 ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                {vehicle.rank}
              </div>
              <div>
                <p className="font-medium text-gray-900">{vehicle.vehicleNumber}</p>
                <p className="text-sm text-gray-500">{vehicle.vehicleId}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="font-semibold text-gray-900">{vehicle.utilizationRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Utilization</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{vehicle.averageOccupancy.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Avg Occupancy</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{vehicle.operatingHours.toFixed(1)}h</p>
                <p className="text-sm text-gray-500">Operating</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
                <span className="text-sm text-gray-600">{vehicle.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
