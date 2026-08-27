'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAnalytics, usePeakHourAnalysis, useDemandForecast, useAIRecommendations } from '@/hooks/useAnalytics';
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
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [stations, setStations] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  
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

  const { data: peakHourData, loading: peakHourLoading } = usePeakHourAnalysis(filters);
  const { data: demandForecastData, loading: demandForecastLoading } = useDemandForecast(filters, 7);
  const { 
    data: aiRecommendations, 
    loading: aiRecommendationsLoading,
    dismissRecommendation,
    implementRecommendation 
  } = useAIRecommendations(filters);

  const handleDateRangeChange = (range: DateRange) => {
    setSelectedDateRange(range);
    updateFilters({ dateRange: { range } });
  };

  // Fetch stations and routes for filters
  useEffect(() => {
    const fetchEntities = async () => {
      setLoadingEntities(true);
      try {
        const [stationsRes, routesRes] = await Promise.all([
          fetch('/api/stations'),
          fetch('/api/routes'),
        ]);

        if (stationsRes.ok) {
          const stationsData = await stationsRes.json();
          setStations(stationsData.data || []);
        } else {
          // Use mock data if API fails
          setStations(getMockStations());
        }

        if (routesRes.ok) {
          const routesData = await routesRes.json();
          setRoutes(routesData.data || []);
        } else {
          // Use mock data if API fails
          setRoutes(getMockRoutes());
        }
      } catch (error) {
        console.error('Error fetching entities:', error);
        // Use mock data on error
        setStations(getMockStations());
        setRoutes(getMockRoutes());
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, []);

  // Mock data for Bengaluru stations
  const getMockStations = () => [
    { _id: '1', stationName: 'Majestic', stationCode: 'BLR-MET-001', zone: 'Central', active: true },
    { _id: '2', stationName: 'Indiranagar', stationCode: 'BLR-MET-002', zone: 'East', active: true },
    { _id: '3', stationName: 'Vidhana Soudha', stationCode: 'BLR-MET-003', zone: 'Central', active: true },
    { _id: '4', stationName: 'MG Road', stationCode: 'BLR-MET-005', zone: 'Central', active: true },
    { _id: '5', stationName: 'Electronic City Bus Station', stationCode: 'BLR-BUS-003', zone: 'South', active: true },
    { _id: '6', stationName: 'Whitefield Bus Station', stationCode: 'BLR-BUS-004', zone: 'East', active: true },
    { _id: '7', stationName: 'Bangalore City Junction', stationCode: 'SBC', zone: 'Central', active: true },
    { _id: '8', stationName: 'Yeshwanthpur Junction', stationCode: 'YPR', zone: 'West', active: true },
  ];

  // Mock data for Bengaluru routes
  const getMockRoutes = () => [
    { _id: '1', routeName: 'Purple Line - Majestic to Baiyappanahalli', routeNumber: 'MG-1', transportType: 'METRO', active: true },
    { _id: '2', routeName: 'Green Line - Majestic to Nagasandra', routeNumber: 'GW-1', transportType: 'METRO', active: true },
    { _id: '3', routeName: 'Vajra - Electronic City to Majestic', routeNumber: 'BMTC-500', transportType: 'BUS', active: true },
    { _id: '4', routeName: 'Big 10 - Shivajinagar to Whitefield', routeNumber: 'BMTC-201', transportType: 'BUS', active: true },
    { _id: '5', routeName: 'Chennai Express - Bangalore to Chennai', routeNumber: 'SBC-MAS', transportType: 'TRAIN', active: true },
    { _id: '6', routeName: 'Mysore Express - Bangalore to Mysore', routeNumber: 'SBC-MYS', transportType: 'TRAIN', active: true },
  ];

  const handleExport = async (options: ExportOptions) => {
    try {
      // Call the analytics API to generate the report
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters, options }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Create a download link
        const blob = new Blob([result.data], { 
          type: result.contentType || 'text/csv' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `analytics-report-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setShowExport(false);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const handleDismissRecommendation = async (id: string) => {
    await dismissRecommendation(id);
  };

  const handleImplementRecommendation = async (id: string) => {
    await implementRecommendation(id);
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

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Station</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.stationId || ''}
                    onChange={(e) => updateFilters({ stationId: e.target.value || undefined })}
                    disabled={loadingEntities}
                  >
                    <option value="">{loadingEntities ? 'Loading...' : 'All Stations'}</option>
                    {stations
                      .filter(s => s.active)
                      .map((station) => (
                        <option key={station._id} value={station._id}>
                          {station.stationName} ({station.stationCode})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.routeId || ''}
                    onChange={(e) => updateFilters({ routeId: e.target.value || undefined })}
                    disabled={loadingEntities}
                  >
                    <option value="">{loadingEntities ? 'Loading...' : 'All Routes'}</option>
                    {routes
                      .filter(r => r.active)
                      .map((route) => (
                        <option key={route._id} value={route._id}>
                          {route.routeName} ({route.routeNumber})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.vehicleType || ''}
                    onChange={(e) => updateFilters({ vehicleType: (e.target.value as 'BUS' | 'METRO' | 'TRAIN') || undefined })}
                  >
                    <option value="">All Types</option>
                    <option value="BUS">Bus</option>
                    <option value="METRO">Metro</option>
                    <option value="TRAIN">Train</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={filters.zone || ''}
                    onChange={(e) => updateFilters({ zone: e.target.value || undefined })}
                  >
                    <option value="">All Zones</option>
                    {Array.from(new Set(stations.map(s => s.zone).filter(Boolean))).map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Bengaluru Data:</span> {stations.length} stations, {routes.length} routes loaded
                </p>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

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
            <PeakHourAnalysis data={peakHourData} loading={peakHourLoading} />
          </div>

          {/* Demand Forecast */}
          <div className="mb-6">
            <DemandForecast data={demandForecastData} loading={demandForecastLoading} />
          </div>

          {/* AI Recommendations */}
          <div className="mb-6">
            <AIRecommendationPanel
              recommendations={aiRecommendations}
              loading={aiRecommendationsLoading}
              onDismiss={handleDismissRecommendation}
              onImplement={handleImplementRecommendation}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
