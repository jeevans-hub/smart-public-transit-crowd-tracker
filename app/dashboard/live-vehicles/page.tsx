'use client';

import { useState, useCallback, useMemo } from 'react';
import { useVehicleRealtime } from '@/hooks/useVehicleRealtime';
import { useLiveNotifications, LiveNotificationContainer } from '@/components/realtime/LiveNotification';
import VehicleMap from '@/components/vehicles/VehicleMap';
import VehicleInfoCard from '@/components/vehicles/VehicleInfoCard';
import VehicleFilters from '@/components/vehicles/VehicleFilters';
import VehicleLegend from '@/components/vehicles/VehicleLegend';
import PageHeader from '@/components/dashboard/PageHeader';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import EmptyState from '@/components/dashboard/EmptyState';
import { ILiveVehicleResponse, LiveVehicleStatus } from '@/types/vehicle';
import { Map, RefreshCw, Radio, Play } from 'lucide-react';

export default function LiveVehiclesPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<ILiveVehicleResponse | null>(null);
  const [filters, setFilters] = useState<{
    search?: string;
    status?: LiveVehicleStatus;
    route?: string;
    vehicleType?: string;
  }>({});

  // Use live notifications first (needed for callbacks)
  const { notifications, addNotification, removeNotification } = useLiveNotifications();

  const {
    vehicles,
    statistics,
    timeline,
    alerts,
    isConnected,
    syncing,
    connectionState,
    syncData,
  } = useVehicleRealtime({
    autoSync: true,
    onVehicleStatus: (vehicle) => {
      if (vehicle.status === 'OFFLINE') {
        addNotification('warning', 'Vehicle Offline', `${vehicle.vehicleNumber} is now offline`, 5000);
      } else if (vehicle.status === 'MOVING') {
        addNotification('success', 'Vehicle Moving', `${vehicle.vehicleNumber} is back in service`, 4000);
      }
    },
    onAlertNew: (alert) => {
      addNotification(
        alert.type === 'critical' ? 'critical' : alert.type === 'high' ? 'warning' : 'information',
        'Vehicle Alert',
        alert.message,
        6000
      );
    },
  });

  const handleVehicleClick = useCallback((vehicle: ILiveVehicleResponse) => {
    setSelectedVehicle(vehicle);
  }, []);

  const handleSimulate = useCallback(async () => {
    try {
      const res = await fetch('/api/live-vehicles?simulate=true');
      const data = await res.json();
      if (data.success) {
        addNotification('success', 'Movement Simulated', 'Vehicle positions updated', 3000);
      }
    } catch (error) {
      console.error('Failed to simulate movement:', error);
      addNotification('critical', 'Simulation Failed', 'Could not simulate vehicle movement', 3000);
    }
  }, [addNotification]);

  // Filter vehicles based on current filters
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (v) =>
          v.vehicleNumber.toLowerCase().includes(query) ||
          v.route.toLowerCase().includes(query) ||
          v.driverName?.toLowerCase().includes(query)
      );
    }

    if (filters.status) {
      result = result.filter((v) => v.status === filters.status);
    }

    if (filters.route) {
      result = result.filter((v) => v.route === filters.route);
    }

    if (filters.vehicleType) {
      result = result.filter((v) => v.vehicleType === filters.vehicleType);
    }

    return result;
  }, [vehicles, filters]);

  if (syncing && vehicles.length === 0) {
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

      {/* Realtime Connection Status Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isConnected ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
              ></span>
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {isConnected ? 'Realtime Connected' : 'Realtime Disconnected'}
            </span>
            {syncing && (
              <span className="text-xs text-blue-600 ml-2">Syncing...</span>
            )}
          </div>

          <span className="text-xs text-gray-500 hidden sm:inline border-l border-gray-200 pl-3">
            Status: {connectionState}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500">
            {isConnected ? 'Live updates enabled' : 'Reconnecting...'}
          </div>
          <button
            onClick={syncData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            <span>Sync</span>
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
                  vehicles={filteredVehicles}
                  onVehicleClick={handleVehicleClick}
                  selectedVehicle={selectedVehicle}
                  loading={syncing}
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
            <h3 className="font-semibold text-gray-900 mb-3">Vehicles ({filteredVehicles.length})</h3>
            <div className="space-y-2">
              {filteredVehicles.map((vehicle) => (
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

      {/* Activity Timeline */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
            <p className="text-sm text-gray-500 mt-1">Recent vehicle events</p>
          </div>
          <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
            {timeline.slice(0, 10).map((event, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {event.type.replace(/:/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {JSON.stringify(event.data)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Live Alerts</h3>
            <p className="text-sm text-gray-500 mt-1">Active vehicle alerts</p>
          </div>
          <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
            {alerts.slice(0, 10).map((alert, index) => (
              <div
                key={index}
                className={`p-4 ${
                  alert.type === 'critical'
                    ? 'bg-red-50'
                    : alert.type === 'high'
                    ? 'bg-orange-50'
                    : alert.type === 'medium'
                    ? 'bg-yellow-50'
                    : 'bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                      alert.type === 'critical'
                        ? 'bg-red-500'
                        : alert.type === 'high'
                        ? 'bg-orange-500'
                        : alert.type === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    {alert.vehicleNumber && (
                      <p className="text-xs text-gray-500 mt-1">Vehicle: {alert.vehicleNumber}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Notification Container */}
      <LiveNotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
    </div>
  );
}
