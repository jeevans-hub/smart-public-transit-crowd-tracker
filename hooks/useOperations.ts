import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  OperationsFilters,
  OperationsOverview,
  FleetHealthMetrics,
  MaintenancePrediction,
  VehicleHealthData,
  RouteOptimizationAnalysis,
  DelayPrediction,
  CostAnalysis,
  OperationsRecommendation,
  OperationalInsights,
  FleetEfficiencyData,
  MaintenanceSchedule,
} from '@/types/operations';

const defaultFilters: OperationsFilters = {
  dateRange: {
    range: 'LAST_7_DAYS',
  },
};

export function useOperations(initialFilters?: Partial<OperationsFilters>) {
  const [filters, setFilters] = useState<OperationsFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [data, setData] = useState<OperationsOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFilters = useCallback((newFilters: Partial<OperationsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch operations data');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const fleetHealth = useMemo(() => data?.fleetHealth || null, [data]);
  const maintenancePredictions = useMemo(() => data?.maintenancePredictions || [], [data]);
  const vehicleHealth = useMemo(() => data?.vehicleHealth || [], [data]);
  const routeOptimizations = useMemo(() => data?.routeOptimizations || [], [data]);
  const delayPredictions = useMemo(() => data?.delayPredictions || [], [data]);
  const costAnalysis = useMemo(() => data?.costAnalysis || [], [data]);
  const recommendations = useMemo(() => data?.recommendations || [], [data]);
  const insights = useMemo(() => data?.insights || null, [data]);
  const fleetEfficiency = useMemo(() => data?.fleetEfficiency || [], [data]);
  const maintenanceSchedule = useMemo(() => data?.maintenanceSchedule || [], [data]);

  return {
    filters,
    updateFilters,
    resetFilters,
    data,
    fleetHealth,
    maintenancePredictions,
    vehicleHealth,
    routeOptimizations,
    delayPredictions,
    costAnalysis,
    recommendations,
    insights,
    fleetEfficiency,
    maintenanceSchedule,
    loading,
    error,
    refetch: fetchOperations,
  };
}

export function useFleetHealth() {
  const [data, setData] = useState<FleetHealthMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/operations/fleet-health');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching fleet health');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

export function useMaintenancePredictions(vehicleId?: string) {
  const [data, setData] = useState<MaintenancePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = vehicleId 
          ? `/api/operations/maintenance/${vehicleId}`
          : '/api/operations/maintenance';
        const response = await fetch(url);
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching maintenance predictions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vehicleId]);

  return { data, loading, error };
}

export function useRouteOptimizations() {
  const [data, setData] = useState<RouteOptimizationAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/operations/route-optimizations');
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching route optimizations');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

export function useDelayPredictions() {
  const [data, setData] = useState<DelayPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/operations/delay-predictions');
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching delay predictions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

export function useCostAnalysis() {
  const [data, setData] = useState<CostAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/operations/cost-analysis');
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching cost analysis');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

export function useOperationsRecommendations() {
  const [data, setData] = useState<OperationsRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/operations/recommendations');
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching recommendations');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

export function useOperationalInsights() {
  const [data, setData] = useState<OperationalInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/operations/insights');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching insights');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

export function useFleetEfficiency() {
  const [data, setData] = useState<FleetEfficiencyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/operations/fleet-efficiency');
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching fleet efficiency');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}

export function useMaintenanceSchedule() {
  const [data, setData] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/operations/maintenance-schedule');
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching maintenance schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, loading, error };
}