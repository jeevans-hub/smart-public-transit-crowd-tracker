import React from 'react';
import { KPIMetrics } from '@/types/analytics';

interface AnalyticsCardsProps {
  kpi: KPIMetrics | null;
  loading: boolean;
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ kpi, loading }) => {
  const cards = [
    { title: 'Total Stations', value: kpi?.totalStations || 0, icon: '🏢', color: 'blue' },
    { title: 'Total Vehicles', value: kpi?.totalVehicles || 0, icon: '🚌', color: 'green' },
    { title: 'Passengers Today', value: kpi?.passengersToday || 0, icon: '👥', color: 'purple' },
    { title: 'Passengers This Week', value: kpi?.passengersThisWeek || 0, icon: '📅', color: 'indigo' },
    { title: 'Passengers This Month', value: kpi?.passengersThisMonth || 0, icon: '📊', color: 'pink' },
    { title: 'Average Crowd', value: `${kpi?.averageCrowd.toFixed(1) || 0}%`, icon: '📈', color: 'orange' },
    { title: 'Prediction Accuracy', value: `${kpi?.averagePredictionAccuracy.toFixed(1) || 0}%`, icon: '🎯', color: 'cyan' },
    { title: 'Critical Alerts', value: kpi?.criticalAlerts || 0, icon: '⚠️', color: 'red' },
    { title: 'Avg Vehicle Speed', value: `${kpi?.averageVehicleSpeed.toFixed(1) || 0} km/h`, icon: '🚀', color: 'teal' },
    { title: 'Average Occupancy', value: `${kpi?.averageOccupancy.toFixed(1) || 0}%`, icon: '🪑', color: 'amber' },
    { title: 'Average Delay', value: `${kpi?.averageDelay.toFixed(1) || 0} min`, icon: '⏱️', color: 'rose' },
    { title: 'System Availability', value: `${kpi?.systemAvailability.toFixed(1) || 0}%`, icon: '✅', color: 'emerald' },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    orange: 'from-orange-500 to-orange-600',
    cyan: 'from-cyan-500 to-cyan-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    emerald: 'from-emerald-500 to-emerald-600',
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[card.color]} flex items-center justify-center text-2xl`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
