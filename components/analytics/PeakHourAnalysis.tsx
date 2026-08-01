import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PeakHourAnalysis as PeakHourAnalysisType } from '@/types/analytics';

interface PeakHourAnalysisProps {
  data: PeakHourAnalysisType[];
  loading?: boolean;
}

export const PeakHourAnalysis: React.FC<PeakHourAnalysisProps> = ({ data, loading }) => {
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hour Analysis</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const chartData = data.map(item => ({
    hour: `${item.hour}:00`,
    occupancy: item.averageOccupancy,
    passengers: item.passengerCount,
    vehicles: item.vehicleCount,
  }));

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'CRITICAL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hour Analysis</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="occupancy" fill="#8884d8" name="Avg Occupancy %" />
          <Bar dataKey="passengers" fill="#82ca9d" name="Passengers" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.slice(0, 4).map((item, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-3 h-3 rounded-full ${getCongestionColor(item.congestionLevel)}`} />
              <span className="text-sm font-medium text-gray-700">{item.hour}:00</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{item.averageOccupancy.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">{item.congestionLevel}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
