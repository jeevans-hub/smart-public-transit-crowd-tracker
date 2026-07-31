'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import SearchBar from '@/components/dashboard/SearchBar';
import LoadingSpinner from '@/components/dashboard/LoadingSpinner';
import EmptyState from '@/components/dashboard/EmptyState';
import ConfirmDialog from '@/components/dashboard/ConfirmDialog';
import LiveStatsOverview from '@/components/crowd/LiveStatsOverview';
import LiveReportCard from '@/components/crowd/LiveReportCard';
import CrowdReportModal from '@/components/crowd/CrowdReportModal';
import { ICrowdReportResponse, ICrowdStatistics, CrowdLevel, ReportSource } from '@/types/crowd';
import { CROWD_LEVELS, REPORT_SOURCES } from '@/utils/constants';
import { Plus, RefreshCw, Radio, Filter, SlidersHorizontal } from 'lucide-react';
import { useCrowdRealtime } from '@/hooks/useCrowdRealtime';
import { useLiveNotifications, LiveNotificationContainer } from '@/components/realtime/LiveNotification';

export default function LiveDashboardPage() {
  const [filteredReports, setFilteredReports] = useState<ICrowdReportResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; reportId: string | null }>({
    isOpen: false,
    reportId: null,
  });

  // Use realtime hook for crowd data
  const {
    crowdReports,
    statistics,
    isConnected,
    syncing,
    connectionState,
  } = useCrowdRealtime({
    autoSync: true,
    onCrowdCreated: (report) => {
      // Trigger notification
      if (report.occupancyPercentage >= 80) {
        addNotification(
          report.occupancyPercentage >= 90 ? 'critical' : 'warning',
          'High Crowd Alert',
          `${report.stationId} reached ${report.occupancyPercentage}% capacity`,
          6000
        );
      }
    },
    onCrowdDeleted: () => {
      addNotification('information', 'Report Deleted', 'Crowd report has been removed', 4000);
    },
  });

  // Use live notifications
  const { notifications, addNotification, removeNotification } = useLiveNotifications();

  // Update reports from realtime
  const [reports, setReports] = useState<ICrowdReportResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setReports(crowdReports);
    setLoading(false);
  }, [crowdReports]);

  // Apply Search & Filter
  useEffect(() => {
    let result = [...reports];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.vehicleId.toLowerCase().includes(query) ||
          r.routeId.toLowerCase().includes(query) ||
          r.stationId.toLowerCase().includes(query) ||
          r.reportedBy.toLowerCase().includes(query)
      );
    }

    if (selectedLevel !== 'ALL') {
      result = result.filter((r) => r.crowdLevel === selectedLevel);
    }

    if (selectedSource !== 'ALL') {
      result = result.filter((r) => r.reportSource === selectedSource);
    }

    setFilteredReports(result);
  }, [searchTerm, selectedLevel, selectedSource, reports]);

  const handleDeleteRequest = (reportId: string) => {
    setDeleteDialog({ isOpen: true, reportId });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.reportId) return;

    try {
      const res = await fetch(`/api/crowd/${deleteDialog.reportId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteDialog({ isOpen: false, reportId: null });
        // Realtime hook will handle the update via socket event
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Live Crowd Tracker"
        subtitle="Real-time transit crowd updates and vehicle occupancy monitoring"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Submit Report</span>
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
        </div>
      </div>

      {/* Live Statistics Overview Cards */}
      <LiveStatsOverview stats={statistics} />

      {/* Controls: Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by Vehicle, Route, Station, or Reporter..."
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Level:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Levels</option>
                {Object.keys(CROWD_LEVELS).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-gray-500" />
              <span className="text-xs font-medium text-gray-700">Source:</span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Sources</option>
                {Object.keys(REPORT_SOURCES).map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon={Radio}
          title={searchTerm || selectedLevel !== 'ALL' || selectedSource !== 'ALL' ? 'No reports found' : 'No live reports yet'}
          description={
            searchTerm || selectedLevel !== 'ALL' || selectedSource !== 'ALL'
              ? 'Try resetting filters or search terms'
              : 'Submit your first real-time transit crowd report'
          }
          action={
            searchTerm || selectedLevel !== 'ALL' || selectedSource !== 'ALL'
              ? {
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearchTerm('');
                    setSelectedLevel('ALL');
                    setSelectedSource('ALL');
                  },
                }
              : {
                  label: 'Submit Report',
                  onClick: () => setIsModalOpen(true),
                }
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <LiveReportCard
              key={report._id}
              report={report}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Submit Crowd Report Modal */}
      <CrowdReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Realtime hook will handle the update via socket event
          addNotification('success', 'Report Submitted', 'Crowd report created successfully', 4000);
        }}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Crowd Report"
        message="Are you sure you want to delete this crowd report? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, reportId: null })}
        isDestructive
      />

      {/* Live Notifications */}
      <LiveNotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        position="top-right"
      />
    </div>
  );
}
