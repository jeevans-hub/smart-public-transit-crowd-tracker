import React from 'react';
import { KPIMetrics } from '@/types/analytics';

interface KPIBoardProps {
  kpi: KPIMetrics | null;
  loading?: boolean;
}

export const KPIBoard: React.FC<KPIBoardProps> = ({ kpi, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!kpi) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">KPI Dashboard</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const kpiItems = [
    { label: 'Total Stations', value: kpi.totalStations, change: '+2.5%', positive: true },
    { label: 'Total Vehicles', value: kpi.totalVehicles, change: '+1.2%', positive: true },
    { label: 'Passengers Today', value: kpi.passengersToday.toLocaleString(), change: '+5.3%', positive: true },
    { label: 'Passengers This Week', value: kpi.passengersThisWeek.toLocaleString(), change: '+4.1%', positive: true },
    { label: 'Passengers This Month', value: kpi.passengersThisMonth.toLocaleString(), change: '+3.8%', positive: true },
    { label: 'Average Crowd', value: `${kpi.averageCrowd.toFixed(1)}%`, change: '-1.2%', positive: false },
    { label: 'Prediction Accuracy', value: `${kpi.averagePredictionAccuracy.toFixed(1)}%`, change: '+0.8%', positive: true },
    { label: 'Critical Alerts', value: kpi.criticalAlerts, change: '-12%', positive: true },
    { label: 'Avg Vehicle Speed', value: `${kpi.averageVehicleSpeed.toFixed(1)} km/h`, change: '+2.1%', positive: true },
    { label: 'Average Occupancy', value: `${kpi.averageOccupancy.toFixed(1)}%`, change: '+0.5%', positive: true },
    { label: 'Average Delay', value: `${kpi.averageDelay.toFixed(1)} min`, change: '-8.3%', positive: true },
    { label: 'System Availability', value: `${kpi.systemAvailability.toFixed(1)}%`, change: '+0.2%', positive: true },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">KPI Dashboard</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpiItems.map((item, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{item.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{item.value}</p>
            <p className={`text-sm mt-1 ${item.positive ? 'text-green-600' : 'text-red-600'}`}>
              {item.change}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
