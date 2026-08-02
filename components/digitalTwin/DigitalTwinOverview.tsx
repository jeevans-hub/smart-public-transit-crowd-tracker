'use client';

import { useState, useEffect } from 'react';
import { useDigitalTwin } from '@/hooks/useDigitalTwin';
import CitySelector from './CitySelector';
import CityHealthCard from './CityHealthCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/DashboardCard';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';

export default function DigitalTwinOverview() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const { state, loading, error, getCityHealth } = useDigitalTwin(selectedCity || undefined);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    if (selectedCity) {
      getCityHealth(selectedCity).then(setHealth);
    }
  }, [selectedCity, getCityHealth]);

  if (loading && !state) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Twin Overview</h1>
          <p className="text-gray-600">Real-time smart city monitoring and analytics</p>
        </div>
        <CitySelector selectedCity={selectedCity} onCitySelect={setSelectedCity} />
      </div>

      {selectedCity ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* City Health */}
          <div className="lg:col-span-1">
            <CityHealthCard health={health} loading={loading} />
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Cities"
                    value={state?.cities.length || 0}
                    icon="🏙️"
                  />
                  <StatCard
                    label="Regions"
                    value={state?.regions.length || 0}
                    icon="🗺️"
                  />
                  <StatCard
                    label="Control Centers"
                    value={state?.controlCenters.length || 0}
                    icon="🏢"
                  />
                  <StatCard
                    label="Network Nodes"
                    value={state?.networkGraph.length || 0}
                    icon="🔗"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fleet Distribution */}
            {state?.fleetDistribution && (
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Vehicles</span>
                      <span className="font-semibold">{state.fleetDistribution.totalVehicles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active</span>
                      <span className="font-semibold text-green-600">{state.fleetDistribution.activeVehicles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">In Maintenance</span>
                      <span className="font-semibold text-yellow-600">{state.fleetDistribution.maintenanceVehicles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Inactive</span>
                      <span className="font-semibold text-red-600">{state.fleetDistribution.inactiveVehicles}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent>
            <div className="py-12 text-center">
              <div className="text-gray-500">
                <p className="text-lg mb-2">Select a city to view digital twin data</p>
                <p className="text-sm">Choose from the dropdown above to get started</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
