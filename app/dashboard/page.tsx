'use client';

import { useEffect, useState } from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { Building2, MapPin, Route, Car } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    agencies: 0,
    stations: 0,
    routes: 0,
    vehicles: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [agenciesRes, stationsRes, routesRes, vehiclesRes] = await Promise.all([
          fetch('/api/agencies'),
          fetch('/api/stations'),
          fetch('/api/routes'),
          fetch('/api/vehicles'),
        ]);

        const agencies = agenciesRes.ok ? await agenciesRes.json() : { data: [] };
        const stations = stationsRes.ok ? await stationsRes.json() : { data: [] };
        const routes = routesRes.ok ? await routesRes.json() : { data: [] };
        const vehicles = vehiclesRes.ok ? await vehiclesRes.json() : { data: [] };

        setStats({
          agencies: agencies.data?.length || 0,
          stations: stations.data?.length || 0,
          routes: routes.data?.length || 0,
          vehicles: vehicles.data?.length || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Agencies',
      value: stats.agencies,
      icon: Building2,
      color: 'blue' as const,
    },
    {
      title: 'Total Stations',
      value: stats.stations,
      icon: MapPin,
      color: 'green' as const,
    },
    {
      title: 'Total Routes',
      value: stats.routes,
      icon: Route,
      color: 'purple' as const,
    },
    {
      title: 'Total Vehicles',
      value: stats.vehicles,
      icon: Car,
      color: 'orange' as const,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <DashboardStats stats={statCards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Welcome to Transit Tracker</h2>
          <p className="text-gray-600">
            Manage your public transit system efficiently. Track agencies, stations, routes, and vehicles 
            all in one place. Use the navigation to explore different sections.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/dashboard/agencies"
              className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Manage Agencies</p>
              <p className="text-sm text-gray-600">Add and edit transit agencies</p>
            </a>
            <a
              href="/dashboard/stations"
              className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Manage Stations</p>
              <p className="text-sm text-gray-600">Configure transit stations</p>
            </a>
            <a
              href="/dashboard/routes"
              className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Manage Routes</p>
              <p className="text-sm text-gray-600">Define transit routes</p>
            </a>
            <a
              href="/dashboard/vehicles"
              className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Manage Vehicles</p>
              <p className="text-sm text-gray-600">Track fleet vehicles</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
