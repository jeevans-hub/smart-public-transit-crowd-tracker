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
import { Calendar, Filter, Download, RefreshCw, Search } from 'lucide-react';

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
    // In production, this would filter the displayed data
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
                  placeholder="Search vehicles, routes..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
            <MaintenanceRiskCard predictions={maintenancePredictions} loading={loading} />
            <DelayPredictionCard predictions={delayPredictions} loading={loading} />
          </div>

          {/* Route Optimization and Cost Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RouteOptimizationCard optimizations={routeOptimizations} loading={loading} />
            <CostAnalysisCard costAnalysis={costAnalysis} loading={loading} />
          </div>

          {/* Vehicle Health Table */}
          <div className="mb-6">
            <VehicleHealthTable vehicles={vehicleHealth} loading={loading} />
          </div>

          {/* AI Recommendations */}
          <div className="mb-6">
            <AIRecommendations recommendations={recommendations} loading={loading} />
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