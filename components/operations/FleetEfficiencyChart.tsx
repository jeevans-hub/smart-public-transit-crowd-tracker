import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FleetEfficiencyData as FleetEfficiencyDataType } from '@/types/operations';

interface FleetEfficiencyChartProps {
  data: FleetEfficiencyDataType[];
  loading?: boolean;
}

export const FleetEfficiencyChart: React.FC<FleetEfficiencyChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    efficiency: item.efficiency,
    utilization: item.utilization,
    onTimeRate: item.onTimeRate,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Efficiency Trend</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
          />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="efficiency" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Efficiency"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="utilization" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Utilization"
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="onTimeRate" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="On-Time Rate"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};