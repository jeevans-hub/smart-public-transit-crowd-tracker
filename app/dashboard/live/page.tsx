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
import { AUTO_REFRESH_INTERVAL, CROWD_LEVELS, REPORT_SOURCES } from '@/utils/constants';
import { Plus, RefreshCw, Radio, Filter, SlidersHorizontal } from 'lucide-react';

export default function LiveDashboardPage() {
  const [reports, setReports] = useState<ICrowdReportResponse[]>([]);
  const [filteredReports, setFilteredReports] = useState<ICrowdReportResponse[]>([]);
  const [stats, setStats] = useState<ICrowdStatistics | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; reportId: string | null }>({
    isOpen: false,
    reportId: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const [reportsRes, statsRes] = await Promise.all([
        fetch('/api/crowd?limit=50'),
        fetch('/api/crowd?stats=true'),
      ]);

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        if (reportsData.success) {
          setReports(reportsData.data || []);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Failed to fetch live crowd data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-refresh interval
  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchData();
      }, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, fetchData]);

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
        setReports((prev) => prev.filter((r) => r._id !== deleteDialog.reportId));
        setDeleteDialog({ isOpen: false, reportId: null });
        fetchData();
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

      {/* Auto-Refresh Bar & Control */}
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
              {autoRefresh ? 'Live Monitoring Active' : 'Auto-Refresh Paused'}
            </span>
          </div>

          <span className="text-xs text-gray-500 hidden sm:inline border-l border-gray-200 pl-3">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            Auto-refresh (30s)
          </label>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Live Statistics Overview Cards */}
      <LiveStatsOverview stats={stats} />

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
        onSuccess={() => fetchData()}
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
    </div>
  );
}
