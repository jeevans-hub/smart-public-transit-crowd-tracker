import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DemandForecast as DemandForecastType } from '@/types/analytics';

interface DemandForecastProps {
  data: DemandForecastType[];
  loading?: boolean;
}

export const DemandForecast: React.FC<DemandForecastProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Forecast</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const chartData = data.map(item => ({
    date: item.date.toLocaleDateString(),
    demand: item.predictedDemand,
    confidence: item.confidence,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Demand Forecast</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="demand" stroke="#8884d8" strokeWidth={2} name="Predicted Demand" />
          <Line type="monotone" dataKey="confidence" stroke="#82ca9d" strokeWidth={2} name="Confidence %" />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.slice(0, 3).map((forecast, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{forecast.date.toLocaleDateString()}</span>
              <span className="text-sm text-gray-500">{forecast.confidence}% confidence</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{forecast.predictedDemand.toLocaleString()} passengers</p>
            {forecast.recommendedActions.length > 0 && (
              <div className="mt-2 space-y-1">
                {forecast.recommendedActions.map((action, i) => (
                  <p key={i} className="text-xs text-blue-600">• {action}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
