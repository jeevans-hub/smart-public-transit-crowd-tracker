import React from 'react';
import { IPredictionResponse } from '@/types/prediction';
import { TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react';

interface PredictionTableProps {
  predictions: IPredictionResponse[];
  onDelete?: (id: string) => void;
}

export default function PredictionTable({ predictions, onDelete }: PredictionTableProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
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

  const getRiskBadge = (risk: string) => {
    const styles = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return styles[risk as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (predictions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          No predictions available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Station
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Predicted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Window
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Generated
              </th>
              {onDelete && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {predictions.map((prediction) => (
              <tr key={prediction._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{prediction.stationName}</div>
                  <div className="text-sm text-gray-500">{prediction.stationId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{prediction.currentCrowd}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{prediction.predictedCrowd}%</div>
                  <div className={`text-xs ${prediction.predictedCrowd > prediction.currentCrowd ? 'text-green-600' : prediction.predictedCrowd < prediction.currentCrowd ? 'text-red-600' : 'text-gray-500'}`}>
                    {prediction.predictedCrowd > prediction.currentCrowd ? '+' : ''}{(prediction.predictedCrowd - prediction.currentCrowd).toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(prediction.trend)}
                    <span className="text-sm text-gray-900 capitalize">
                      {prediction.trend.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                    {prediction.confidence}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskBadge(prediction.risk)}`}>
                    {prediction.risk}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {prediction.predictionWindow} min
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(prediction.generatedAt).toLocaleString()}
                </td>
                {onDelete && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onDelete(prediction._id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete prediction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
