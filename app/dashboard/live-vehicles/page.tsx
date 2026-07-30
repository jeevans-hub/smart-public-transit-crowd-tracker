'use client';

import { useState, useCallback, useRef } from 'react';
import { useVehicleTracking } from '@/hooks/useVehicleTracking';
import VehicleMap from '@/components/vehicles/VehicleMap';
import VehicleInfoCard from '@/components/vehicles/VehicleInfoCard';
import VehicleFilters from '@/components/vehicles/VehicleFilters';
import VehicleLegend from '@/components/vehicles/VehicleLegend';
import PageHeader from '@/components/dashboard/PageHeader';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import EmptyState from '@/components/dashboard/EmptyState';
import { ILiveVehicleResponse, LiveVehicleStatus } from '@/types/vehicle';
import { Map, RefreshCw, Radio, Play, Pause } from 'lucide-react';

export default function LiveVehiclesPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<ILiveVehicleResponse | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    vehicles,
    statistics,
    loading,
    error,
    filters,
    setFilters,
    sort,
    setSort,
    refresh,
    simulateMovement,
  } = useVehicleTracking({ pollInterval: 10000, autoPoll: autoRefresh });

  const handleVehicleClick = useCallback((vehicle: ILiveVehicleResponse) => {
    setSelectedVehicle(vehicle);
  }, []);

  const handleSimulate = useCallback(async () => {
    await simulateMovement();
  }, [simulateMovement]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => !prev);
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Live Vehicle Tracking"
          subtitle="Real-time transit vehicle monitoring with GPS tracking"
        />
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Vehicles</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading && vehicles.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Live Vehicle Tracking"
        subtitle="Real-time transit vehicle monitoring with GPS tracking"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulate}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-sm"
            >
              <Play size={18} />
              <span>Simulate Movement</span>
            </button>
          </div>
        }
      />

      {/* Auto-Refresh Control */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {autoRefresh && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  autoRefresh ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
              ></span>
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {autoRefresh ? 'Live Tracking Active' : 'Auto-Refresh Paused'}
            </span>
          </div>
          <span className="text-xs text-gray-500 hidden sm:inline border-l border-gray-200 pl-3">
            Refreshing every 10 seconds
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            Auto-refresh (10s)
          </label>

          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Total Vehicles</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalVehicles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Moving</p>
            <p className="text-2xl font-bold text-green-600">{statistics.movingVehicles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Stopped</p>
            <p className="text-2xl font-bold text-yellow-600">{statistics.stoppedVehicles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Delayed</p>
            <p className="text-2xl font-bold text-orange-600">{statistics.delayedVehicles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Offline</p>
            <p className="text-2xl font-bold text-gray-600">{statistics.offlineVehicles}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Avg Speed</p>
            <p className="text-2xl font-bold text-blue-600">{statistics.averageSpeed.toFixed(1)} km/h</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Avg Occupancy</p>
            <p className="text-2xl font-bold text-purple-600">{statistics.averageOccupancy.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Main Content: Map and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="h-[600px]">
              {vehicles.length === 0 ? (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <EmptyState
                    icon={Map}
                    title="No vehicles tracked"
                    description="Add vehicles to start live tracking"
                  />
                </div>
              ) : (
                <VehicleMap
                  vehicles={vehicles}
                  onVehicleClick={handleVehicleClick}
                  selectedVehicle={selectedVehicle}
                  loading={loading}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <VehicleFilters
            search={filters.search || ''}
            onSearchChange={(value) => setFilters({ ...filters, search: value })}
            status={filters.status || ''}
            onStatusChange={(value) => setFilters({ ...filters, status: value || undefined })}
            route={filters.route || ''}
            onRouteChange={(value) => setFilters({ ...filters, route: value })}
            vehicleType={filters.vehicleType || ''}
            onVehicleTypeChange={(value) => setFilters({ ...filters, vehicleType: value })}
            sortField={sort.field}
            onSortFieldChange={(value) => setSort({ ...sort, field: value })}
            sortOrder={sort.order}
            onSortOrderChange={(value) => setSort({ ...sort, order: value })}
          />

          <VehicleLegend />

          {selectedVehicle && (
            <VehicleInfoCard
              vehicle={selectedVehicle}
              onClose={() => setSelectedVehicle(null)}
            />
          )}

          {/* Vehicle List */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 max-h-[300px] overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Vehicles ({vehicles.length})</h3>
            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle._id}
                  onClick={() => handleVehicleClick(vehicle)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedVehicle?._id === vehicle._id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{vehicle.vehicleNumber}</p>
                      <p className="text-xs text-gray-500">{vehicle.route}</p>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: vehicle.status === 'MOVING' ? '#22c55e' : vehicle.status === 'STOPPED' ? '#eab308' : vehicle.status === 'DELAYED' ? '#f97316' : '#6b7280' }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
