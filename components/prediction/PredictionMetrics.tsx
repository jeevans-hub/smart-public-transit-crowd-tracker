import React from 'react';
import { IPredictionMetrics } from '@/types/prediction';
import { Target, TrendingUp, CheckCircle, BarChart3 } from 'lucide-react';

interface PredictionMetricsProps {
  metrics: IPredictionMetrics | null;
}

export default function PredictionMetrics({ metrics }: PredictionMetricsProps) {
  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          No metrics available
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Mean Absolute Error',
      value: metrics.meanAbsoluteError.toFixed(2),
      unit: '%',
      icon: <Target className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50',
      description: 'Average difference between predicted and actual values',
    },
    {
      title: 'Prediction Accuracy',
      value: metrics.predictionAccuracy.toFixed(1),
      unit: '%',
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      color: 'bg-green-50',
      description: 'Overall accuracy of predictions',
    },
    {
      title: 'Average Confidence',
      value: metrics.averageConfidence.toFixed(1),
      unit: '%',
      icon: <CheckCircle className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-50',
      description: 'Average confidence score across all predictions',
    },
    {
      title: 'Success Rate',
      value: metrics.predictionSuccessRate.toFixed(1),
      unit: '%',
      icon: <BarChart3 className="w-5 h-5 text-orange-600" />,
      color: 'bg-orange-50',
      description: 'Percentage of predictions with confidence > 70%',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map((metric, index) => (
          <div key={index} className={`${metric.color} rounded-lg p-4 border`}>
            <div className="flex items-center gap-2 mb-2">
              {metric.icon}
              <span className="text-sm font-medium text-gray-700">{metric.title}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metric.value}
              <span className="text-sm font-normal text-gray-500 ml-1">{metric.unit}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Predictions</p>
            <p className="text-xl font-semibold text-gray-900">{metrics.totalPredictions}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Prediction Error</p>
            <p className="text-xl font-semibold text-gray-900">{metrics.averagePredictionError.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Summary</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Accuracy Rating</span>
            <span className={`text-sm font-semibold ${
              metrics.predictionAccuracy >= 80 ? 'text-green-600' :
              metrics.predictionAccuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.predictionAccuracy >= 80 ? 'Excellent' :
               metrics.predictionAccuracy >= 60 ? 'Good' : 'Needs Improvement'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Confidence Rating</span>
            <span className={`text-sm font-semibold ${
              metrics.averageConfidence >= 80 ? 'text-green-600' :
              metrics.averageConfidence >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.averageConfidence >= 80 ? 'High' :
               metrics.averageConfidence >= 60 ? 'Medium' : 'Low'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Error Margin</span>
            <span className={`text-sm font-semibold ${
              metrics.meanAbsoluteError <= 10 ? 'text-green-600' :
              metrics.meanAbsoluteError <= 20 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {metrics.meanAbsoluteError <= 10 ? 'Low' :
               metrics.meanAbsoluteError <= 20 ? 'Medium' : 'High'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
