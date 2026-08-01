import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PassengerTrend, OccupancyTrend, VehicleTrend, PredictionTrend, AlertTrend } from '@/types/analytics';

interface TrendChartProps {
  data: PassengerTrend[] | OccupancyTrend[] | VehicleTrend[] | PredictionTrend[] | AlertTrend[];
  type: 'passenger' | 'occupancy' | 'vehicle' | 'prediction' | 'alert';
  title: string;
  loading?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, type, title, loading }) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const chartData = data.map((item: any) => ({
    time: item.timestamp instanceof Date ? item.timestamp.toLocaleTimeString() : item.date.toLocaleDateString(),
    value: item.count || item.occupancy || item.activeVehicles || item.accuracy || item.value,
    ...(type === 'vehicle' && { speed: item.averageSpeed, occupancy: item.averageOccupancy }),
    ...(type === 'prediction' && { confidence: item.confidence }),
  }));

  const renderChart = () => {
    switch (type) {
      case 'passenger':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Passengers" />
          </AreaChart>
        );
      case 'occupancy':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} name="Occupancy %" />
          </LineChart>
        );
      case 'vehicle':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#ffc658" strokeWidth={2} name="Active Vehicles" />
            <Line type="monotone" dataKey="speed" stroke="#ff7300" strokeWidth={2} name="Avg Speed" />
            <Line type="monotone" dataKey="occupancy" stroke="#0088fe" strokeWidth={2} name="Avg Occupancy %" />
          </LineChart>
        );
      case 'prediction':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} name="Accuracy %" />
            <Line type="monotone" dataKey="confidence" stroke="#82ca9d" strokeWidth={2} name="Confidence %" />
          </LineChart>
        );
      case 'alert':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} name="Alerts" />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={320}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
