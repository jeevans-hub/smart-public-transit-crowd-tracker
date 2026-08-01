'use client';

import { useState } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsCards } from '@/components/analytics/AnalyticsCards';
import { TrendChart } from '@/components/analytics/TrendChart';
import { HeatmapChart } from '@/components/analytics/HeatmapChart';
import { StationRanking } from '@/components/analytics/StationRanking';
import { RoutePerformance } from '@/components/analytics/RoutePerformance';
import { VehicleUtilization } from '@/components/analytics/VehicleUtilization';
import { PeakHourAnalysis } from '@/components/analytics/PeakHourAnalysis';
import { DemandForecast } from '@/components/analytics/DemandForecast';
import { KPIBoard } from '@/components/analytics/KPIBoard';
import { AIRecommendationPanel } from '@/components/analytics/AIRecommendationPanel';
import { ExportReport } from '@/components/analytics/ExportReport';
import { DateRange, AnalyticsFilters, ExportOptions } from '@/types/analytics';
import { Calendar, Filter, Download, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('LAST_7_DAYS');
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  const {
    filters,
    updateFilters,
    resetFilters,
    data,
    kpi,
    passengerTrend,
    occupancyTrend,
    vehicleTrend,
    predictionTrend,
    alertTrend,
    topStations,
    topRoutes,
    topVehicles,
    recommendations,
    loading,
    error,
    refetch,
  } = useAnalytics();

  const handleDateRangeChange = (range: DateRange) => {
    setSelectedDateRange(range);
    updateFilters({ dateRange: { range } });
  };

  const handleExport = (options: ExportOptions) => {
    console.log('Exporting report with options:', options);
    // In production, this would generate and download the report
    setShowExport(false);
  };

  const handleDismissRecommendation = (id: string) => {
    console.log('Dismissing recommendation:', id);
  };

  const handleImplementRecommendation = (id: string) => {
    console.log('Implementing recommendation:', id);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:ml-72">
          <Navbar />
          <main className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Analytics</h2>
              <p className="text-red-700">{error}</p>
              <button
                onClick={refetch}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-72">
        <Navbar />
        <main className="p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Historical analytics and decision intelligence</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={() => setShowExport(!showExport)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={refetch}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => handleDateRangeChange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDateRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Export Panel */}
          {showExport && (
            <div className="mb-6">
              <ExportReport filters={filters} onExport={handleExport} />
            </div>
          )}

          {/* KPI Cards */}
          <div className="mb-6">
            <AnalyticsCards kpi={kpi} loading={loading} />
          </div>

          {/* KPI Board */}
          <div className="mb-6">
            <KPIBoard kpi={kpi} loading={loading} />
          </div>

          {/* Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <TrendChart data={passengerTrend} type="passenger" title="Passenger Trend" loading={loading} />
            <TrendChart data={occupancyTrend} type="occupancy" title="Occupancy Trend" loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <TrendChart data={vehicleTrend} type="vehicle" title="Vehicle Trend" loading={loading} />
            <TrendChart data={predictionTrend} type="prediction" title="Prediction Trend" loading={loading} />
          </div>

          <div className="mb-6">
            <TrendChart data={alertTrend} type="alert" title="Alert Trend" loading={loading} />
          </div>

          {/* Heatmap */}
          <div className="mb-6">
            <HeatmapChart data={[]} loading={loading} />
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <StationRanking data={topStations} loading={loading} />
            <RoutePerformance data={topRoutes} loading={loading} />
          </div>

          <div className="mb-6">
            <VehicleUtilization data={topVehicles} loading={loading} />
          </div>

          {/* Peak Hour Analysis */}
          <div className="mb-6">
            <PeakHourAnalysis data={[]} loading={loading} />
          </div>

          {/* Demand Forecast */}
          <div className="mb-6">
            <DemandForecast data={[]} loading={loading} />
          </div>

          {/* AI Recommendations */}
          <div className="mb-6">
            <AIRecommendationPanel
              recommendations={recommendations}
              loading={loading}
              onDismiss={handleDismissRecommendation}
              onImplement={handleImplementRecommendation}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
