'use client';

import { useEffect, useState } from 'react';
import { Vehicle, CreateVehicleDTO } from '@/types/vehicle';
import VehicleCard from '@/components/cards/VehicleCard';
import PageHeader from '@/components/dashboard/PageHeader';
import SearchBar from '@/components/dashboard/SearchBar';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import EmptyState from '@/components/dashboard/EmptyState';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import VehicleForm from '@/components/dashboard/VehicleForm';
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
  const [formDialog, setFormDialog] = useState<{ isOpen: boolean; vehicle: Vehicle | null }>({
    isOpen: false,
    vehicle: null,
  });
  const [agencies, setAgencies] = useState<Array<{ _id: string; name: string }>>([]);
  const [routes, setRoutes] = useState<Array<{ _id: string; name: string }>>([]);

  useEffect(() => {
    fetchVehicles();
    fetchAgencies();
    fetchRoutes();
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

  async function fetchAgencies() {
    try {
      const res = await fetch('/api/agencies');
      const data = await res.json();
      if (data.success) {
        setAgencies(data.data.map((a: any) => ({ _id: a._id, name: a.name })));
      }
    } catch (error) {
      console.error('Failed to fetch agencies:', error);
    }
  }

  async function fetchRoutes() {
    try {
      const res = await fetch('/api/routes');
      const data = await res.json();
      if (data.success) {
        setRoutes(data.data.map((r: any) => ({ _id: r._id, name: r.name })));
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error);
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

  async function handleEdit(vehicle: Vehicle) {
    setFormDialog({ isOpen: true, vehicle });
  }

  async function handleAdd() {
    setFormDialog({ isOpen: true, vehicle: null });
  }

  async function handleFormSubmit(data: CreateVehicleDTO) {
    if (formDialog.vehicle) {
      // Update existing vehicle
      const res = await fetch(`/api/vehicles/${formDialog.vehicle._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setVehicles(vehicles.map((v) => v._id === formDialog.vehicle?._id ? result.data : v));
        }
      }
    } else {
      // Create new vehicle
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setVehicles([...vehicles, result.data]);
        }
      }
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
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                  onClick: handleAdd,
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
              onEdit={handleEdit}
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

      <VehicleForm
        vehicle={formDialog.vehicle || undefined}
        isOpen={formDialog.isOpen}
        onClose={() => setFormDialog({ isOpen: false, vehicle: null })}
        onSubmit={handleFormSubmit}
        agencies={agencies}
        routes={routes}
      />
    </div>
  );
}
