import React from 'react';
import { VehicleHealthData as VehicleHealthDataType } from '@/types/operations';

interface VehicleHealthTableProps {
  vehicles: VehicleHealthDataType[];
  loading?: boolean;
}

export const VehicleHealthTable: React.FC<VehicleHealthTableProps> = ({ vehicles, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Health Status</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Vehicle</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Route</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Health Score</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Risk Level</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Utilization</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Operating Hours</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.slice(0, 15).map((vehicle) => (
              <tr key={vehicle.vehicleId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="text-sm font-medium text-gray-900">{vehicle.vehicleNumber}</p>
                  <p className="text-xs text-gray-500">{vehicle.vehicleType}</p>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{vehicle.route}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vehicle.status === 'MOVING' ? 'bg-green-100 text-green-700' :
                    vehicle.status === 'STOPPED' ? 'bg-yellow-100 text-yellow-700' :
                    vehicle.status === 'DELAYED' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getHealthColor(vehicle.healthScore)}`}>
                    {vehicle.healthScore}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(vehicle.maintenanceRisk)}`}>
                    {vehicle.maintenanceRisk}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{vehicle.utilizationRate}%</td>
                <td className="py-3 px-4 text-sm text-gray-700">{vehicle.operatingHours}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};