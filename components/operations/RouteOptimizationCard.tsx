import React from 'react';
import { RouteOptimizationAnalysis as RouteOptimizationAnalysisType } from '@/types/operations';

interface RouteOptimizationCardProps {
  optimizations: RouteOptimizationAnalysisType[];
  loading?: boolean;
}

export const RouteOptimizationCard: React.FC<RouteOptimizationCardProps> = ({ optimizations, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCongestionTextColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Optimization Analysis</h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {optimizations.map((route) => (
          <div key={route.routeId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{route.routeName}</p>
                <p className="text-xs text-gray-500">Route ID: {route.routeId}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCongestionTextColor(route.congestionLevel)} bg-opacity-10`}>
                {route.congestionLevel}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-500">Current Vehicles</p>
                <p className="text-sm font-semibold text-gray-900">{route.currentVehicles}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Recommended</p>
                <p className="text-sm font-semibold text-blue-600">{route.recommendedVehicles}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Occupancy</p>
                <p className="text-sm font-semibold text-gray-900">{route.averageOccupancy}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Peak Occupancy</p>
                <p className="text-sm font-semibold text-gray-900">{route.peakOccupancy}%</p>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Recommendation</p>
              <p className="text-sm text-gray-700">{route.recommendation}</p>
              <p className="text-xs text-gray-500 mt-2">Expected: {route.expectedBenefit}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};