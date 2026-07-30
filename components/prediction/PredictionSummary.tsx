import React from 'react';
import { IPredictionResponse, IPredictionMetrics } from '@/types/prediction';
import { TrendingUp, Users, Activity, Target, Clock, AlertTriangle } from 'lucide-react';

interface PredictionSummaryProps {
  predictions: IPredictionResponse[];
  metrics?: IPredictionMetrics | null;
}

export default function PredictionSummary({ predictions, metrics }: PredictionSummaryProps) {
  const totalPredictions = predictions.length;
  const averagePredictedCrowd = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.predictedCrowd, 0) / predictions.length
    : 0;
  const highRiskCount = predictions.filter(p => p.risk === 'HIGH' || p.risk === 'CRITICAL').length;
  const criticalCount = predictions.filter(p => p.risk === 'CRITICAL').length;
  const averageConfidence = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    : 0;

  const summaryCards = [
    {
      title: 'Total Predictions',
      value: totalPredictions,
      icon: <Activity className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200',
      valueColor: 'text-blue-700',
    },
    {
      title: 'Avg Predicted Crowd',
      value: `${averagePredictedCrowd.toFixed(1)}%`,
      icon: <Users className="w-5 h-5 text-green-600" />,
      color: 'bg-green-50 border-green-200',
      valueColor: 'text-green-700',
    },
    {
      title: 'High Risk Alerts',
      value: highRiskCount,
      icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
      color: 'bg-orange-50 border-orange-200',
      valueColor: 'text-orange-700',
    },
    {
      title: 'Critical Risks',
      value: criticalCount,
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      color: 'bg-red-50 border-red-200',
      valueColor: 'text-red-700',
    },
    {
      title: 'Avg Confidence',
      value: `${averageConfidence.toFixed(1)}%`,
      icon: <Target className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200',
      valueColor: 'text-purple-700',
    },
  ];

  if (metrics) {
    summaryCards.push(
      {
        title: 'Prediction Accuracy',
        value: `${metrics.predictionAccuracy.toFixed(1)}%`,
        icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
        color: 'bg-indigo-50 border-indigo-200',
        valueColor: 'text-indigo-700',
      },
      {
        title: 'Success Rate',
        value: `${metrics.predictionSuccessRate.toFixed(1)}%`,
        icon: <Clock className="w-5 h-5 text-teal-600" />,
        color: 'bg-teal-50 border-teal-200',
        valueColor: 'text-teal-700',
      }
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {summaryCards.map((card, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg shadow-sm border p-4 ${card.color}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex-shrink-0">{card.icon}</div>
            <span className="text-xs text-gray-500">{card.title}</span>
          </div>
          <div className={`text-2xl font-bold ${card.valueColor}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
