import React from 'react';
import { DelayPrediction as DelayPredictionType } from '@/types/operations';

interface DelayPredictionCardProps {
  predictions: DelayPredictionType[];
  loading?: boolean;
}

export const DelayPredictionCard: React.FC<DelayPredictionCardProps> = ({ predictions, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const getDelayRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDelayRiskTextColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'text-red-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const highRiskCount = predictions.filter(p => p.delayRisk === 'HIGH').length;
  const mediumRiskCount = predictions.filter(p => p.delayRisk === 'MEDIUM').length;
  const lowRiskCount = predictions.filter(p => p.delayRisk === 'LOW').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Delay Predictions</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <p className="text-3xl font-bold text-red-600">{highRiskCount}</p>
          <p className="text-sm text-red-600 mt-1">High Risk</p>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-3xl font-bold text-yellow-600">{mediumRiskCount}</p>
          <p className="text-sm text-yellow-600 mt-1">Medium Risk</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">{lowRiskCount}</p>
          <p className="text-sm text-green-600 mt-1">Low Risk</p>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {predictions.slice(0, 10).map((prediction) => (
          <div key={prediction.vehicleId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 ${getDelayRiskColor(prediction.delayRisk)} rounded-full`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{prediction.vehicleNumber}</p>
                <p className="text-xs text-gray-500">{prediction.route}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${getDelayRiskTextColor(prediction.delayRisk)}`}>
                +{prediction.predictedDelay} min
              </p>
              <p className="text-xs text-gray-500">{prediction.delayProbability}% prob</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};