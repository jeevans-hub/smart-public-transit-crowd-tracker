'use client';

import { useEffect, useState } from 'react';
import { Station } from '@/types/station';
import StationCard from '@/components/cards/StationCard';
import PageHeader from '@/components/dashboard/PageHeader';
import SearchBar from '@/components/dashboard/SearchBar';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import EmptyState from '@/components/dashboard/EmptyState';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import { MapPin, Plus } from 'lucide-react';

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; station: Station | null }>({
    isOpen: false,
    station: null,
  });

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = stations.filter(
        (station) =>
          station.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.stationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStations(filtered);
    } else {
      setFilteredStations(stations);
    }
  }, [searchTerm, stations]);

  async function fetchStations() {
    try {
      const res = await fetch('/api/stations');
      const data = await res.json();
      if (data.success) {
        setStations(data.data);
        setFilteredStations(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(station: Station) {
    setDeleteDialog({ isOpen: true, station });
  }

  async function confirmDelete() {
    if (!deleteDialog.station) return;

    try {
      const res = await fetch(`/api/stations/${deleteDialog.station._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStations(stations.filter((s) => s._id !== deleteDialog.station?._id));
        setDeleteDialog({ isOpen: false, station: null });
      }
    } catch (error) {
      console.error('Failed to delete station:', error);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="Stations"
        subtitle="Manage transit stations"
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            <span>Add Station</span>
          </button>
        }
      />

      <div className="mb-6">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search stations..." />
      </div>

      {filteredStations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={searchTerm ? 'No stations found' : 'No stations yet'}
          description={
            searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first transit station'
          }
          action={
            !searchTerm
              ? {
                  label: 'Add Station',
                  onClick: () => {},
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((station) => (
            <StationCard
              key={station._id}
              station={station}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Station"
        message={`Are you sure you want to delete ${deleteDialog.station?.stationName}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, station: null })}
        isDestructive
      />
    </div>
  );
}
