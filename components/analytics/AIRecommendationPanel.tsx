'use client';

import React, { useState } from 'react';
import { AIRecommendation as AIRecommendationType } from '@/types/analytics';

interface AIRecommendationPanelProps {
  recommendations: AIRecommendationType[];
  loading?: boolean;
  onDismiss?: (id: string) => void;
  onImplement?: (id: string) => void;
}

export const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
  recommendations,
  loading,
  onDismiss,
  onImplement,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmImplementId, setConfirmImplementId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
        <div className="h-96 flex items-center justify-center text-gray-500">
          No recommendations available
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DISPATCH': return '🚌';
      case 'FREQUENCY': return '⏰';
      case 'REDUCE_SERVICE': return '📉';
      case 'CONGESTION': return '🚨';
      case 'OPTIMIZATION': return '⚡';
      default: return '💡';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-100 text-blue-800';
      case 'IMPLEMENTED': return 'bg-green-100 text-green-800';
      case 'DISMISSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`border rounded-lg p-4 transition-all ${
              expandedId === rec.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{getTypeIcon(rec.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(rec.status)}`}>
                      {rec.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                  {expandedId === rec.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      {rec.targetName && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Target:</span> {rec.targetName}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Expected Impact:</span> {rec.expectedImpact}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Confidence:</span> {rec.confidence}%
                      </p>
                      <p className="text-xs text-gray-500">
                        Generated: {rec.generatedAt.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  {expandedId === rec.id ? '▲' : '▼'}
                </button>
                {rec.status === 'PENDING' && (
                  <>
                    {confirmImplementId === rec.id ? (
                      <>
                        <button
                          onClick={() => {
                            onImplement?.(rec.id);
                            setConfirmImplementId(null);
                          }}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmImplementId(null)}
                          className="px-3 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmImplementId(rec.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Implement
                        </button>
                        <button
                          onClick={() => onDismiss?.(rec.id)}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
