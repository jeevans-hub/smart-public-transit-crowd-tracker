'use client';

import { useState } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import { useOperations } from '@/hooks/useOperations';
import { FleetHealthDashboard } from '@/components/operations/FleetHealthDashboard';
import { MaintenanceRiskCard } from '@/components/operations/MaintenanceRiskCard';
import { VehicleHealthTable } from '@/components/operations/VehicleHealthTable';
import { RouteOptimizationCard } from '@/components/operations/RouteOptimizationCard';
import { AIRecommendations } from '@/components/operations/AIRecommendations';
import { DelayPredictionCard } from '@/components/operations/DelayPredictionCard';
import { OperationalInsights } from '@/components/operations/OperationalInsights';
import { CostAnalysisCard } from '@/components/operations/CostAnalysisCard';
import { FleetEfficiencyChart } from '@/components/operations/FleetEfficiencyChart';
import { MaintenanceSchedule as MaintenanceScheduleComponent } from '@/components/operations/MaintenanceSchedule';
import { DateRange, OperationsFilters as OperationsFiltersType } from '@/types/operations';
import { Calendar, Filter, Download, RefreshCw, Search, X } from 'lucide-react';

export default function OperationsPage() {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('LAST_7_DAYS');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    filters,
    updateFilters,
    resetFilters,
    data,
    fleetHealth,
    maintenancePredictions,
    vehicleHealth,
    routeOptimizations,
    delayPredictions,
    costAnalysis,
    recommendations,
    insights,
    fleetEfficiency,
    maintenanceSchedule,
    loading,
    error,
    refetch,
  } = useOperations();

  const handleDateRangeChange = (range: DateRange) => {
    setSelectedDateRange(range);
    updateFilters({ dateRange: { range } });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter data based on search query
  const filteredVehicleHealth = vehicleHealth.filter(vehicle =>
    vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRouteOptimizations = routeOptimizations.filter(route =>
    route.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.routeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDelayPredictions = delayPredictions.filter(prediction =>
    prediction.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prediction.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMaintenancePredictions = maintenancePredictions.filter(prediction =>
    prediction.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prediction.vehicleType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecommendations = recommendations.filter(rec =>
    rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rec.targetName && rec.targetName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Operations Data</h2>
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
              <h1 className="text-2xl font-bold text-gray-900">Operations Intelligence</h1>
              <p className="text-gray-600 mt-1">AI-powered fleet management and predictive maintenance</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles, routes, recommendations..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-gray-900 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
              </div>
              {searchQuery && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Search className="w-4 h-4" />
                  <span>Searching: "{searchQuery}"</span>
                  <button
                    onClick={() => handleSearch('')}
                    className="hover:text-blue-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
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

          {/* Fleet Health Dashboard */}
          <div className="mb-6">
            <FleetHealthDashboard fleetHealth={fleetHealth} loading={loading} />
          </div>

          {/* Operational Insights */}
          <div className="mb-6">
            <OperationalInsights insights={insights} loading={loading} />
          </div>

          {/* Fleet Efficiency Chart */}
          <div className="mb-6">
            <FleetEfficiencyChart data={fleetEfficiency} loading={loading} />
          </div>

          {/* Risk and Predictions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <MaintenanceRiskCard predictions={filteredMaintenancePredictions} loading={loading} />
            <DelayPredictionCard predictions={filteredDelayPredictions} loading={loading} />
          </div>

          {/* Route Optimization and Cost Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RouteOptimizationCard optimizations={filteredRouteOptimizations} loading={loading} />
            <CostAnalysisCard costAnalysis={costAnalysis} loading={loading} />
          </div>

          {/* Vehicle Health Table */}
          <div className="mb-6">
            <VehicleHealthTable vehicles={filteredVehicleHealth} loading={loading} />
          </div>

          {/* AI Recommendations */}
          <div className="mb-6">
            <AIRecommendations recommendations={filteredRecommendations} loading={loading} />
          </div>

          {/* Maintenance Schedule */}
          <div className="mb-6">
            <MaintenanceScheduleComponent schedule={maintenanceSchedule} loading={loading} />
          </div>
        </main>
      </div>
    </div>
  );
}