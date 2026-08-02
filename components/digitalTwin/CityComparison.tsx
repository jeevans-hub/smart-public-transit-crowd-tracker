'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/DashboardCard';
import { useDigitalTwin } from '@/hooks/useDigitalTwin';
import { CityComparisonData } from '@/types/digitalTwin';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function CityComparison() {
  const { getCityComparison } = useDigitalTwin();
  const [comparison, setComparison] = useState<CityComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<keyof CityComparisonData>('healthScore');

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    setLoading(true);
    const data = await getCityComparison();
    if (data) {
      setComparison(data);
    }
    setLoading(false);
  };

  const metrics: { key: keyof CityComparisonData; label: string; color: string }[] = [
    { key: 'healthScore', label: 'Health Score', color: '#3b82f6' },
    { key: 'passengerVolume', label: 'Passenger Volume', color: '#10b981' },
    { key: 'fleetSize', label: 'Fleet Size', color: '#f59e0b' },
    { key: 'averageOccupancy', label: 'Avg Occupancy', color: '#ef4444' },
    { key: 'predictionAccuracy', label: 'Prediction Accuracy', color: '#8b5cf6' },
    { key: 'operationalEfficiency', label: 'Operational Efficiency', color: '#06b6d4' },
  ];

  const chartData = comparison.map(city => ({
    name: city.cityName,
    value: city[selectedMetric] as number,
  }));

  const getTrendIcon = (value: number, threshold: number = 50) => {
    if (value > threshold) return <TrendingUp size={16} className="text-green-600" />;
    if (value < threshold) return <TrendingDown size={16} className="text-red-600" />;
    return <Minus size={16} className="text-gray-600" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>City Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (comparison.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>City Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-center py-8">No comparison data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>City Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {metrics.map(metric => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === metric.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={metrics.find(m => m.key === selectedMetric)?.color || '#3b82f6'} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">City</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Health</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Passengers</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Fleet</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Occupancy</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(city => (
                  <tr key={city.cityId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{city.cityName}</td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getTrendIcon(city.healthScore)}
                        {city.healthScore.toFixed(0)}%
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">{city.passengerVolume.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">{city.fleetSize}</td>
                    <td className="py-2 px-3 text-right">{city.averageOccupancy.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right">{city.operationalEfficiency.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
