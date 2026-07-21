'use client';

import { useEffect, useState } from 'react';
import { Route } from '@/types/route';
import RouteCard from '@/components/cards/RouteCard';
import PageHeader from '@/components/dashboard/PageHeader';
import SearchBar from '@/components/dashboard/SearchBar';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import EmptyState from '@/components/dashboard/EmptyState';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import { Route as RouteIcon, Plus } from 'lucide-react';

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; route: Route | null }>({
    isOpen: false,
    route: null,
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = routes.filter(
        (route) =>
          route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.originStation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.destinationStation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRoutes(filtered);
    } else {
      setFilteredRoutes(routes);
    }
  }, [searchTerm, routes]);

  async function fetchRoutes() {
    try {
      const res = await fetch('/api/routes');
      const data = await res.json();
      if (data.success) {
        setRoutes(data.data);
        setFilteredRoutes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(route: Route) {
    setDeleteDialog({ isOpen: true, route });
  }

  async function confirmDelete() {
    if (!deleteDialog.route) return;

    try {
      const res = await fetch(`/api/routes/${deleteDialog.route._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRoutes(routes.filter((r) => r._id !== deleteDialog.route?._id));
        setDeleteDialog({ isOpen: false, route: null });
      }
    } catch (error) {
      console.error('Failed to delete route:', error);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="Routes"
        subtitle="Manage transit routes"
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            <span>Add Route</span>
          </button>
        }
      />

      <div className="mb-6">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search routes..." />
      </div>

      {filteredRoutes.length === 0 ? (
        <EmptyState
          icon={RouteIcon}
          title={searchTerm ? 'No routes found' : 'No routes yet'}
          description={
            searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first transit route'
          }
          action={
            !searchTerm
              ? {
                  label: 'Add Route',
                  onClick: () => {},
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => (
            <RouteCard
              key={route._id}
              route={route}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Route"
        message={`Are you sure you want to delete ${deleteDialog.route?.routeName}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, route: null })}
        isDestructive
      />
    </div>
  );
}
