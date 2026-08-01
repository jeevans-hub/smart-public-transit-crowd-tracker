import React from 'react';
import { MaintenancePrediction as MaintenancePredictionType } from '@/types/operations';

interface MaintenanceRiskCardProps {
  predictions: MaintenancePredictionType[];
  loading?: boolean;
}

export const MaintenanceRiskCard: React.FC<MaintenanceRiskCardProps> = ({ predictions, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const criticalCount = predictions.filter(p => p.riskLevel === 'CRITICAL').length;
  const highCount = predictions.filter(p => p.riskLevel === 'HIGH').length;
  const mediumCount = predictions.filter(p => p.riskLevel === 'MEDIUM').length;
  const lowCount = predictions.filter(p => p.riskLevel === 'LOW').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Risk Distribution</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
          <p className="text-sm text-red-600 mt-1">Critical</p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-3xl font-bold text-orange-600">{highCount}</p>
          <p className="text-sm text-orange-600 mt-1">High</p>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-3xl font-bold text-yellow-600">{mediumCount}</p>
          <p className="text-sm text-yellow-600 mt-1">Medium</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">{lowCount}</p>
          <p className="text-sm text-green-600 mt-1">Low</p>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {predictions.slice(0, 10).map((prediction) => (
          <div key={prediction.vehicleId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 ${getRiskColor(prediction.riskLevel)} rounded-full`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{prediction.vehicleNumber}</p>
                <p className="text-xs text-gray-500">{prediction.vehicleType}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${getRiskTextColor(prediction.riskLevel)}`}>
                {prediction.riskPercentage}%
              </p>
              <p className="text-xs text-gray-500">{prediction.estimatedDaysRemaining} days</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};