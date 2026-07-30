import React from 'react';
import { IPredictionResponse } from '@/types/prediction';

interface PredictionConfidenceProps {
  predictions: IPredictionResponse[];
}

export default function PredictionConfidence({ predictions }: PredictionConfidenceProps) {
  const averageConfidence = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    : 0;

  const highConfidenceCount = predictions.filter(p => p.confidence >= 80).length;
  const mediumConfidenceCount = predictions.filter(p => p.confidence >= 60 && p.confidence < 80).length;
  const lowConfidenceCount = predictions.filter(p => p.confidence < 60).length;

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 80) return { label: 'High', color: 'bg-green-500' };
    if (confidence >= 60) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Low', color: 'bg-red-500' };
  };

  const confidenceLevel = getConfidenceLevel(averageConfidence);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Confidence</h3>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Average Confidence</span>
          <span className="text-2xl font-bold text-gray-900">{averageConfidence.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${confidenceLevel.color}`}
            style={{ width: `${averageConfidence}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Confidence Level: <span className="font-semibold">{confidenceLevel.label}</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">{highConfidenceCount}</div>
          <div className="text-sm text-green-600">High (≥80%)</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{mediumConfidenceCount}</div>
          <div className="text-sm text-yellow-600">Medium (60-79%)</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="text-2xl font-bold text-red-700">{lowConfidenceCount}</div>
          <div className="text-sm text-red-600">Low (&lt;60%)</div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Confidence Distribution</h4>
        <div className="space-y-2">
          {predictions.slice(0, 5).map((prediction) => (
            <div key={prediction._id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{prediction.stationName}</span>
                  <span className="text-xs font-medium text-gray-900">{prediction.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      prediction.confidence >= 80 ? 'bg-green-500' :
                      prediction.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
