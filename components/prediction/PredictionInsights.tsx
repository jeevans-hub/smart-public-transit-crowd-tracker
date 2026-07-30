import React from 'react';
import { IPredictionResponse } from '@/types/prediction';
import { Lightbulb, TrendingUp, AlertCircle, Clock, Activity } from 'lucide-react';

interface PredictionInsightsProps {
  predictions: IPredictionResponse[];
}

export default function PredictionInsights({ predictions }: PredictionInsightsProps) {
  const generateInsights = () => {
    const insights: { icon: React.ReactNode; title: string; description: string; type: 'info' | 'warning' | 'success' }[] = [];

    if (predictions.length === 0) {
      return insights;
    }

    const latestPredictions = predictions.slice(0, 10);
    
    // Critical risk insight
    const criticalPredictions = latestPredictions.filter(p => p.risk === 'CRITICAL');
    if (criticalPredictions.length > 0) {
      insights.push({
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        title: 'Critical Risk Detected',
        description: `${criticalPredictions.length} station(s) require immediate attention due to critical crowd levels`,
        type: 'warning',
      });
    }

    // Rapid growth insight
    const rapidGrowthPredictions = latestPredictions.filter(p => p.trend === 'RAPID_GROWTH');
    if (rapidGrowthPredictions.length > 0) {
      insights.push({
        icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
        title: 'Rapid Growth Pattern',
        description: `${rapidGrowthPredictions.length} station(s) showing rapid passenger increase`,
        type: 'warning',
      });
    }

    // High predictions insight
    const highPredictions = latestPredictions.filter(p => p.predictedCrowd > 85);
    if (highPredictions.length > 0) {
      insights.push({
        icon: <Activity className="w-5 h-5 text-red-600" />,
        title: 'High Crowd Predictions',
        description: `${highPredictions.length} station(s) predicted to exceed 85% occupancy`,
        type: 'warning',
      });
    }

    // Low confidence insight
    const lowConfidencePredictions = latestPredictions.filter(p => p.confidence < 50);
    if (lowConfidencePredictions.length > 0) {
      insights.push({
        icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
        title: 'Low Confidence Alerts',
        description: `${lowConfidencePredictions.length} prediction(s) with low confidence - manual monitoring recommended`,
        type: 'warning',
      });
    }

    // Stable operations insight
    const stablePredictions = latestPredictions.filter(p => p.risk === 'LOW' && p.confidence >= 70);
    if (stablePredictions.length > 0) {
      insights.push({
        icon: <Activity className="w-5 h-5 text-green-600" />,
        title: 'Stable Operations',
        description: `${stablePredictions.length} station(s) operating within normal parameters`,
        type: 'success',
      });
    }

    // Peak hour insight
    const peakHourPredictions = latestPredictions.filter(p => p.algorithm === 'PEAK_HOUR_DETECTION');
    if (peakHourPredictions.length > 0) {
      insights.push({
        icon: <Clock className="w-5 h-5 text-blue-600" />,
        title: 'Peak Hour Patterns',
        description: `${peakHourPredictions.length} prediction(s) adjusted for peak hour patterns`,
        type: 'info',
      });
    }

    // Average trend insight
    const increasingTrends = latestPredictions.filter(p => p.trend === 'INCREASING' || p.trend === 'RAPID_GROWTH');
    const decreasingTrends = latestPredictions.filter(p => p.trend === 'DECREASING' || p.trend === 'RAPID_DECLINE');
    
    if (increasingTrends.length > decreasingTrends.length) {
      insights.push({
        icon: <TrendingUp className="w-5 h-5 text-green-600" />,
        title: 'Overall Increasing Trend',
        description: `More stations showing increasing passenger flow (${increasingTrends.length} vs ${decreasingTrends.length})`,
        type: 'info',
      });
    } else if (decreasingTrends.length > increasingTrends.length) {
      insights.push({
        icon: <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />,
        title: 'Overall Decreasing Trend',
        description: `More stations showing decreasing passenger flow (${decreasingTrends.length} vs ${increasingTrends.length})`,
        type: 'info',
      });
    }

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Lightbulb className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No insights available</p>
            <p className="text-sm text-gray-400">Generate predictions to see AI insights</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 rounded-lg border ${
              insight.type === 'warning' ? 'bg-red-50 border-red-200' :
              insight.type === 'success' ? 'bg-green-50 border-green-200' :
              'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">{insight.icon}</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 text-sm">{insight.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
