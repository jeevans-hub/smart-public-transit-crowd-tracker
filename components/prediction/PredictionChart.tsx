import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { IPredictionResponse } from '@/types/prediction';

interface PredictionChartProps {
  predictions: IPredictionResponse[];
  showHistorical?: boolean;
}

export default function PredictionChart({ predictions, showHistorical = false }: PredictionChartProps) {
  // Transform predictions into chart data
  const chartData = predictions.map((prediction) => ({
    time: new Date(prediction.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    current: prediction.currentCrowd,
    predicted: prediction.predictedCrowd,
    confidence: prediction.confidence,
    station: prediction.stationName,
  })).reverse(); // Show oldest to newest

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          No prediction data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Crowd Prediction Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            label={{ value: 'Crowd %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="current"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
            name="Current Crowd"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
            name="Predicted Crowd"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PredictionLineChart({ predictions }: { predictions: IPredictionResponse[] }) {
  const chartData = predictions.map((prediction) => ({
    time: new Date(prediction.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    current: prediction.currentCrowd,
    predicted: prediction.predictedCrowd,
    confidence: prediction.confidence,
  })).reverse();

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          No prediction data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Prediction Accuracy</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Current"
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#10b981"
            strokeWidth={2}
            name="Predicted"
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Confidence"
            strokeDasharray="5 5"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConfidenceTrendChart({ predictions }: { predictions: IPredictionResponse[] }) {
  const chartData = predictions.map((prediction) => ({
    time: new Date(prediction.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    confidence: prediction.confidence,
  })).reverse();

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          No confidence data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            label={{ value: 'Confidence %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Confidence"
            dot={{ r: 4 }}
            fill="#8b5cf6"
            fillOpacity={0.3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
