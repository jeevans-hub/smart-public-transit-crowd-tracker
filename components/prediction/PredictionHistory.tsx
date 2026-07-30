import React, { useState } from 'react';
import { IPredictionResponse } from '@/types/prediction';
import { History, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface PredictionHistoryProps {
  predictions: IPredictionResponse[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function PredictionHistory({ predictions, onLoadMore, hasMore = false }: PredictionHistoryProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredPredictions = predictions.filter((prediction) => {
    if (filter === 'all') return true;
    if (filter === 'high') return prediction.risk === 'HIGH' || prediction.risk === 'CRITICAL';
    if (filter === 'medium') return prediction.risk === 'MEDIUM';
    if (filter === 'low') return prediction.risk === 'LOW';
    return true;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  if (predictions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <History className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No prediction history available</p>
            <p className="text-sm text-gray-400">Generate predictions to see history</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Prediction History</h3>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Risks</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredPredictions.map((prediction) => (
          <div
            key={prediction._id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(prediction._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{prediction.stationName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(prediction.risk)}`}>
                        {prediction.risk}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Predicted: {prediction.predictedCrowd}% • Confidence: {prediction.confidence}%
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(prediction.generatedAt).toLocaleString()}
                  </div>
                  {expandedItem === prediction._id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {expandedItem === prediction._id && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current Crowd</p>
                    <p className="text-sm font-semibold text-gray-900">{prediction.currentCrowd}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Predicted Crowd</p>
                    <p className="text-sm font-semibold text-gray-900">{prediction.predictedCrowd}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trend</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {prediction.trend.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Prediction Window</p>
                    <p className="text-sm font-semibold text-gray-900">{prediction.predictionWindow} minutes</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Algorithm</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {prediction.algorithm.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">History Used</p>
                    <p className="text-sm font-semibold text-gray-900">{prediction.historyUsed} reports</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-1">Recommendation</p>
                  <p className="text-sm text-gray-700">{prediction.recommendation}</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Explanation</p>
                  <p className="text-sm text-gray-600">{prediction.explanation}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="mt-4 text-center">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
