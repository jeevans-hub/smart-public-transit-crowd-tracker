'use client';

import { useEffect, useState } from 'react';
import { Vehicle } from '@/types/vehicle';
import VehicleCard from '@/components/cards/VehicleCard';
import PageHeader from '@/components/dashboard/PageHeader';
import SearchBar from '@/components/dashboard/SearchBar';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import EmptyState from '@/components/dashboard/EmptyState';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import { Car, Plus } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; vehicle: Vehicle | null }>({
    isOpen: false,
    vehicle: null,
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = vehicles.filter(
        (vehicle) =>
          vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [searchTerm, vehicles]);

  async function fetchVehicles() {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      if (data.success) {
        setVehicles(data.data);
        setFilteredVehicles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(vehicle: Vehicle) {
    setDeleteDialog({ isOpen: true, vehicle });
  }

  async function confirmDelete() {
    if (!deleteDialog.vehicle) return;

    try {
      const res = await fetch(`/api/vehicles/${deleteDialog.vehicle._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setVehicles(vehicles.filter((v) => v._id !== deleteDialog.vehicle?._id));
        setDeleteDialog({ isOpen: false, vehicle: null });
      }
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="Vehicles"
        subtitle="Manage fleet vehicles"
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            <span>Add Vehicle</span>
          </button>
        }
      />

      <div className="mb-6">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search vehicles..." />
      </div>

      {filteredVehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title={searchTerm ? 'No vehicles found' : 'No vehicles yet'}
          description={
            searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first vehicle'
          }
          action={
            !searchTerm
              ? {
                  label: 'Add Vehicle',
                  onClick: () => {},
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle ${deleteDialog.vehicle?.vehicleNumber}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, vehicle: null })}
        isDestructive
      />
    </div>
  );
}
