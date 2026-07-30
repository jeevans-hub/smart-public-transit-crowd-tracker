import React from 'react';
import { IPredictionResponse } from '@/types/prediction';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

interface PredictionCardProps {
  prediction: IPredictionResponse;
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const getTrendIcon = () => {
    switch (prediction.trend) {
      case 'INCREASING':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'DECREASING':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'RAPID_GROWTH':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'RAPID_DECLINE':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRiskColor = () => {
    switch (prediction.risk) {
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

  const getConfidenceColor = () => {
    if (prediction.confidence >= 80) return 'text-green-600';
    if (prediction.confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const crowdChange = prediction.predictedCrowd - prediction.currentCrowd;
  const crowdChangeColor = crowdChange > 0 ? 'text-green-600' : crowdChange < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{prediction.stationName}</h3>
          <p className="text-sm text-gray-500">ID: {prediction.stationId}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor()}`}>
          {prediction.risk}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Current Crowd</p>
          <p className="text-2xl font-bold text-gray-900">{prediction.currentCrowd}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Predicted Crowd</p>
          <p className="text-2xl font-bold text-gray-900">{prediction.predictedCrowd}%</p>
          <p className={`text-sm ${crowdChangeColor}`}>
            {crowdChange > 0 ? '+' : ''}{crowdChange.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {getTrendIcon()}
        <span className="text-sm text-gray-600 capitalize">
          {prediction.trend.replace('_', ' ').toLowerCase()}
        </span>
        <span className="text-sm text-gray-400">•</span>
        <span className="text-sm text-gray-600">
          {prediction.predictionWindow} min window
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">Confidence</span>
          <span className={`text-sm font-semibold ${getConfidenceColor()}`}>
            {prediction.confidence}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              prediction.confidence >= 80 ? 'bg-green-600' :
              prediction.confidence >= 60 ? 'bg-yellow-600' : 'bg-red-600'
            }`}
            style={{ width: `${prediction.confidence}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        <p>Algorithm: {prediction.algorithm.replace('_', ' ')}</p>
        <p>History used: {prediction.historyUsed} reports</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-700 line-clamp-2">{prediction.recommendation}</p>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Generated: {new Date(prediction.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
