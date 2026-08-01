import React from 'react';
import { CostAnalysis as CostAnalysisType } from '@/types/operations';

interface CostAnalysisCardProps {
  costAnalysis: CostAnalysisType[];
  loading?: boolean;
}

export const CostAnalysisCard: React.FC<CostAnalysisCardProps> = ({ costAnalysis, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const totalCost = costAnalysis.reduce((sum, analysis) => sum + analysis.totalCost, 0);
  const totalPassengers = costAnalysis.reduce((sum, analysis) => sum + analysis.passengerCount, 0);
  const avgCostPerPassenger = totalPassengers > 0 ? totalCost / totalPassengers : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-blue-600">
            ${totalCost.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 mb-1">Total Passengers</p>
          <p className="text-2xl font-bold text-green-600">
            {totalPassengers.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-600 mb-1">Avg Cost/Passenger</p>
          <p className="text-2xl font-bold text-purple-600">
            ${avgCostPerPassenger.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <p className="text-xs text-orange-600 mb-1">Operating Efficiency</p>
          <p className="text-2xl font-bold text-orange-600">
            {(costAnalysis.reduce((sum, a) => sum + a.operatingEfficiency, 0) / costAnalysis.length || 0).toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {costAnalysis.map((analysis) => (
          <div key={analysis.routeId} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900">{analysis.routeName}</p>
              <p className="text-sm font-semibold text-gray-900">
                ${analysis.totalCost.toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Cost/Passenger</p>
                <p className="font-medium text-gray-900">${analysis.costPerPassenger.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Idle Cost</p>
                <p className="font-medium text-gray-900">${analysis.idleCost}</p>
              </div>
              <div>
                <p className="text-gray-500">Efficiency</p>
                <p className="font-medium text-gray-900">{analysis.operatingEfficiency}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};