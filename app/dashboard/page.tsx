'use client';

import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import StatisticCard from '@/components/dashboard/StatisticCard';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import CrowdGauge from '@/components/dashboard/CrowdGauge';
import LiveTable from '@/components/dashboard/LiveTable';
import AlertPanel from '@/components/dashboard/AlertPanel';
import MapPlaceholder from '@/components/dashboard/MapPlaceholder';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import {
  statCardsData,
  passengerCountData,
  vehicleOccupancyData,
  peakHoursData,
  crowdDistributionData,
  stationUtilizationData,
  liveCrowdData,
  liveAlertsData,
  activityTimelineData,
  mapMarkersData,
  crowdGaugeValues,
} from '@/data/dashboard';

export default function DashboardPage() {
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
            {statCardsData.map((stat, index) => (
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
              {crowdGaugeValues.map((value, index) => (
                <CrowdGauge key={index} value={value} />
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AnalyticsCharts
              passengerData={passengerCountData}
              occupancyData={vehicleOccupancyData}
              peakHoursData={peakHoursData}
              distributionData={crowdDistributionData}
              utilizationData={stationUtilizationData}
            />
            <div className="space-y-6">
              <AlertPanel alerts={liveAlertsData} />
              <ActivityTimeline activities={activityTimelineData} />
            </div>
          </div>

          {/* Live Table and Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <LiveTable data={liveCrowdData} />
            <MapPlaceholder markers={mapMarkersData} />
          </div>

          {/* Station Utilization Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Station Utilization</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {stationUtilizationData.map((station, index) => (
                <div key={index} className="text-center">
                  <CrowdGauge value={station.value} label={station.name} size={100} />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
