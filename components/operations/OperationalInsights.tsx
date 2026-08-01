import React from 'react';
import { OperationalInsights as OperationalInsightsType } from '@/types/operations';

interface OperationalInsightsProps {
  insights: OperationalInsightsType | null;
  loading?: boolean;
}

export const OperationalInsights: React.FC<OperationalInsightsProps> = ({ insights, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Insights</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Insights</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Total Recommendations</p>
          <p className="text-2xl font-bold text-blue-600">{insights.totalRecommendations}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600 mb-1">Urgent Actions</p>
          <p className="text-2xl font-bold text-red-600">{insights.urgentActions}</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <p className="text-xs text-orange-600 mb-1">Scheduled Maintenance</p>
          <p className="text-2xl font-bold text-orange-600">{insights.scheduledMaintenance}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 mb-1">Fleet Efficiency</p>
          <p className="text-2xl font-bold text-green-600">{insights.fleetEfficiency}%</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-600 mb-1">On-Time Performance</p>
          <p className="text-2xl font-bold text-purple-600">{insights.onTimePerformance}%</p>
        </div>
        <div className="p-4 bg-indigo-50 rounded-lg">
          <p className="text-xs text-indigo-600 mb-1">Cost Efficiency</p>
          <p className="text-2xl font-bold text-indigo-600">{insights.costEfficiency}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Peak Hours</h4>
          <div className="space-y-2">
            {insights.peakHours.slice(0, 5).map((peak, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{peak.hour}:00</span>
                <span className="text-sm font-medium text-gray-900">{peak.averageOccupancy.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottlenecks */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Identified Bottlenecks</h4>
          <div className="space-y-2">
            {insights.bottlenecks.length > 0 ? (
              insights.bottlenecks.map((bottleneck, index) => (
                <div key={index} className="p-2 bg-red-50 rounded text-sm text-red-700">
                  {bottleneck}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded">No bottlenecks detected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};