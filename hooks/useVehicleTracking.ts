'use client';

import { useState, useEffect, useCallback } from 'react';
import { ILiveVehicleResponse, ILiveVehicleStatistics, ILiveVehicleFilters, ILiveVehicleSort } from '@/types/vehicle';

interface UseVehicleTrackingOptions {
  pollInterval?: number;
  autoPoll?: boolean;
  filters?: ILiveVehicleFilters;
  sort?: ILiveVehicleSort;
}

export function useVehicleTracking(options: UseVehicleTrackingOptions = {}) {
  const {
    pollInterval = 10000, // 10 seconds default
    autoPoll = true,
    filters: initialFilters = {},
    sort: initialSort = { field: 'lastUpdated', order: 'desc' },
  } = options;

  const [vehicles, setVehicles] = useState<ILiveVehicleResponse[]>([]);
  const [statistics, setStatistics] = useState<ILiveVehicleStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ILiveVehicleFilters>(initialFilters);
  const [sort, setSort] = useState<ILiveVehicleSort>(initialSort);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.route) params.append('route', filters.route);
      if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
      if (filters.search) params.append('search', filters.search);
      params.append('sort', sort.field);
      params.append('order', sort.order);

      const response = await fetch(`/api/live-vehicles?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vehicles');
      }

      setVehicles(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch('/api/live-vehicles?stats=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      setStatistics(data.data || null);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, []);

  const simulateMovement = useCallback(async () => {
    try {
      const response = await fetch('/api/live-vehicles?simulate=true', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to simulate movement');
      }

      setVehicles(data.data || []);
    } catch (err) {
      console.error('Error simulating movement:', err);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchVehicles();
    fetchStatistics();
  }, [fetchVehicles, fetchStatistics]);

  useEffect(() => {
    fetchVehicles();
    fetchStatistics();

    if (autoPoll) {
      const interval = setInterval(() => {
        fetchVehicles();
        fetchStatistics();
      }, pollInterval);

      return () => clearInterval(interval);
    }
  }, [fetchVehicles, fetchStatistics, autoPoll, pollInterval]);

  return {
    vehicles,
    statistics,
    loading,
    error,
    filters,
    setFilters,
    sort,
    setSort,
    refresh,
    simulateMovement,
  };
}
