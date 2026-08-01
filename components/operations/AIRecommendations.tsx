import React from 'react';
import { OperationsRecommendation as OperationsRecommendationType } from '@/types/operations';

interface AIRecommendationsProps {
  recommendations: OperationsRecommendationType[];
  loading?: boolean;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ recommendations, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DISPATCH': return '🚀';
      case 'MAINTENANCE': return '🔧';
      case 'REDISTRIBUTION': return '🔄';
      case 'FREQUENCY': return '⏰';
      case 'ROUTE_CHANGE': return '🛣️';
      case 'OPTIMIZATION': return '⚡';
      default: return '📋';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Recommendations</h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recommendations.slice(0, 15).map((rec) => (
          <div key={rec.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTypeIcon(rec.type)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                  <p className="text-xs text-gray-500">{rec.targetName || 'Fleet-wide'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityTextColor(rec.priority)} bg-opacity-10`}>
                  {rec.priority}
                </span>
                <span className="text-xs text-gray-500">{rec.confidence}%</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
            
            <div className="flex items-center justify-between text-xs">
              <p className="text-gray-500">
                <span className="font-medium">Reason:</span> {rec.reason}
              </p>
              <p className="text-green-600 font-medium">
                {rec.expectedBenefit}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};