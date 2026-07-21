'use client';

import { useEffect, useState } from 'react';
import { Agency } from '@/types/agency';
import AgencyCard from '@/components/cards/AgencyCard';
import PageHeader from '@/components/dashboard/PageHeader';
import SearchBar from '@/components/dashboard/SearchBar';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import EmptyState from '@/components/dashboard/EmptyState';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import { Building2, Plus } from 'lucide-react';

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; agency: Agency | null }>({
    isOpen: false,
    agency: null,
  });

  useEffect(() => {
    fetchAgencies();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = agencies.filter(
        (agency) =>
          agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agency.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agency.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAgencies(filtered);
    } else {
      setFilteredAgencies(agencies);
    }
  }, [searchTerm, agencies]);

  async function fetchAgencies() {
    try {
      const res = await fetch('/api/agencies');
      const data = await res.json();
      if (data.success) {
        setAgencies(data.data);
        setFilteredAgencies(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch agencies:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(agency: Agency) {
    setDeleteDialog({ isOpen: true, agency });
  }

  async function confirmDelete() {
    if (!deleteDialog.agency) return;

    try {
      const res = await fetch(`/api/agencies/${deleteDialog.agency._id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAgencies(agencies.filter((a) => a._id !== deleteDialog.agency?._id));
        setDeleteDialog({ isOpen: false, agency: null });
      }
    } catch (error) {
      console.error('Failed to delete agency:', error);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <PageHeader
        title="Agencies"
        subtitle="Manage transit agencies"
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            <span>Add Agency</span>
          </button>
        }
      />

      <div className="mb-6">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search agencies..." />
      </div>

      {filteredAgencies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchTerm ? 'No agencies found' : 'No agencies yet'}
          description={
            searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first transit agency'
          }
          action={
            !searchTerm
              ? {
                  label: 'Add Agency',
                  onClick: () => {},
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgencies.map((agency) => (
            <AgencyCard
              key={agency._id}
              agency={agency}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Agency"
        message={`Are you sure you want to delete ${deleteDialog.agency?.name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, agency: null })}
        isDestructive
      />
    </div>
  );
}
