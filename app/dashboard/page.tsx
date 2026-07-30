'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import StatisticCard from '@/components/dashboard/StatisticCard';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import CrowdGauge from '@/components/dashboard/CrowdGauge';
import LiveTable from '@/components/dashboard/LiveTable';
import AlertPanel from '@/components/dashboard/AlertPanel';
import MapPlaceholder from '@/components/dashboard/MapPlaceholder';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import { StatCardData, CrowdData, AlertData, ActivityData, ChartData, MapMarker } from '@/data/dashboard';
import { useCrowdPrediction } from '@/hooks/useCrowdPrediction';
import PredictionSummary from '@/components/prediction/PredictionSummary';
import PredictionAlerts from '@/components/prediction/PredictionAlerts';
import { Brain } from 'lucide-react';
import ConnectionStatus from '@/components/realtime/ConnectionStatus';
import SystemHealthCard from '@/components/realtime/SystemHealthCard';

interface DashboardData {
  statCardsData: StatCardData[];
  passengerData: ChartData[];
  vehicleOccupancyData: ChartData[];
  peakHoursData: ChartData[];
  crowdDistributionData: ChartData[];
  stationUtilizationData: ChartData[];
  liveCrowdData: CrowdData[];
  liveAlertsData: AlertData[];
  activityTimelineData: ActivityData[];
  mapMarkersData: MapMarker[];
  crowdGaugeValues: number[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { predictions: predictionData, loading: predictionsLoading } = useCrowdPrediction({
    autoRefresh: true,
    refreshInterval: 30000,
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchDashboardData, 15000);
    
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:ml-72">
          <Navbar />
          <main className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-red-700">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:ml-72">
          <Navbar />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-72">
        <Navbar />
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Real-time transit crowd monitoring and analytics</p>
          </div>

          {/* Statistic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {data.statCardsData.map((stat, index) => (
              <StatisticCard
                key={index}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
              />
            ))}
          </div>

          {/* Crowd Gauges */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Crowd Levels</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {data.crowdGaugeValues.map((value, index) => (
                <CrowdGauge key={index} value={value} />
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AnalyticsCharts
              passengerData={data.passengerData}
              occupancyData={data.vehicleOccupancyData}
              peakHoursData={data.peakHoursData}
              distributionData={data.crowdDistributionData}
              utilizationData={data.stationUtilizationData}
            />
            <div className="space-y-6">
              <AlertPanel alerts={data.liveAlertsData} />
              <ActivityTimeline activities={data.activityTimelineData} />
            </div>
          </div>

          {/* AI Prediction Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">AI Prediction Insights</h2>
            </div>
            <div className="mb-4">
              <PredictionSummary predictions={predictionData} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PredictionAlerts predictions={predictionData} />
            </div>
          </div>

          {/* Live Table and Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <LiveTable data={data.liveCrowdData} />
            <MapPlaceholder markers={data.mapMarkersData} />
          </div>

          {/* Station Utilization Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Station Utilization</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {data.stationUtilizationData.map((station, index) => (
                <div key={index} className="text-center">
                  <CrowdGauge value={station.value} label={station.name} size={100} />
                </div>
              ))}
            </div>
          </div>

          {/* Socket Infrastructure Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConnectionStatus showDetails={true} />
            <SystemHealthCard compact={true} />
          </div>
        </main>
      </div>
    </div>
  );
}
