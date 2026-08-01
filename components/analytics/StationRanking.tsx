import React from 'react';
import { StationAnalytics } from '@/types/analytics';

interface StationRankingProps {
  data: StationAnalytics[];
  loading?: boolean;
}

export const StationRanking: React.FC<StationRankingProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Station Rankings</h3>
        <div className="h-96 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const topStations = data.slice(0, 10);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Busiest Stations</h3>
      <div className="space-y-3">
        {topStations.map((station, index) => (
          <div
            key={station.stationId}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900">{station.stationName}</p>
                <p className="text-sm text-gray-500">{station.stationId}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{station.averageOccupancy.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">{station.totalReports} reports</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
