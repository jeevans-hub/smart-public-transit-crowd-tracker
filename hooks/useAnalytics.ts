import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AnalyticsFilters,
  KPIMetrics,
  PassengerTrend,
  OccupancyTrend,
  VehicleTrend,
  PredictionTrend,
  AlertTrend,
  HeatmapData,
  StationAnalytics,
  RouteAnalytics,
  VehicleAnalytics,
  RoutePerformance,
  VehicleUtilization,
  PeakHourAnalysis,
  DemandForecast,
  AIRecommendation,
  HistoricalAnalytics,
  AnalyticsOverview,
} from '@/types/analytics';

const defaultFilters: AnalyticsFilters = {
  dateRange: {
    range: 'LAST_7_DAYS',
  },
};

export function useAnalytics(initialFilters?: Partial<AnalyticsFilters>) {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
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
    fetchAnalytics();
  }, [fetchAnalytics]);

  const kpi = useMemo(() => data?.kpi || null, [data]);
  const passengerTrend = useMemo(() => data?.passengerTrend || [], [data]);
  const occupancyTrend = useMemo(() => data?.occupancyTrend || [], [data]);
  const vehicleTrend = useMemo(() => data?.vehicleTrend || [], [data]);
  const predictionTrend = useMemo(() => data?.predictionTrend || [], [data]);
  const alertTrend = useMemo(() => data?.alertTrend || [], [data]);
  const topStations = useMemo(() => data?.topStations || [], [data]);
  const topRoutes = useMemo(() => data?.topRoutes || [], [data]);
  const topVehicles = useMemo(() => data?.topVehicles || [], [data]);
  const recommendations = useMemo(() => data?.recommendations || [], [data]);

  return {
    filters,
    updateFilters,
    resetFilters,
    data,
    kpi,
    passengerTrend,
    occupancyTrend,
    vehicleTrend,
    predictionTrend,
    alertTrend,
    topStations,
    topRoutes,
    topVehicles,
    recommendations,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

export function useKPIMetrics(filters: AnalyticsFilters) {
  const [data, setData] = useState<KPIMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analytics/kpi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching KPI');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  return { data, loading, error };
}

export function useTrends(filters: AnalyticsFilters) {
  const [passengerTrend, setPassengerTrend] = useState<PassengerTrend[]>([]);
  const [occupancyTrend, setOccupancyTrend] = useState<OccupancyTrend[]>([]);
  const [vehicleTrend, setVehicleTrend] = useState<VehicleTrend[]>([]);
  const [predictionTrend, setPredictionTrend] = useState<PredictionTrend[]>([]);
  const [alertTrend, setAlertTrend] = useState<AlertTrend[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analytics/trends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });
        const result = await response.json();
        if (result.success) {
          setPassengerTrend(result.data.passengerTrend || []);
          setOccupancyTrend(result.data.occupancyTrend || []);
          setVehicleTrend(result.data.vehicleTrend || []);
          setPredictionTrend(result.data.predictionTrend || []);
          setAlertTrend(result.data.alertTrend || []);
        }
      } catch (err) {
        console.error('Error fetching trends:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  return { passengerTrend, occupancyTrend, vehicleTrend, predictionTrend, alertTrend, loading };
}

export function useHeatmap(filters: AnalyticsFilters) {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analytics/heatmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching heatmap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  return { data, loading };
}

export function useStationAnalytics(filters: AnalyticsFilters) {
  const [data, setData] = useState<StationAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analytics/stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching station analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  return { data, loading };
}

export function useRouteAnalytics(filters: AnalyticsFilters) {
  const [data, setData] = useState<RouteAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analytics/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching route analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  return { data, loading };
}

export function useVehicleAnalytics(filters: AnalyticsFilters) {
  const [data, setData] = useState<VehicleAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analytics/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching vehicle analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  return { data, loading };
}

export function usePeakHourAnalysis(filters: AnalyticsFilters) {
  const [data, setData] = useState<PeakHourAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analytics/peak-hours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching peak hour analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  return { data, loading };
}

export function useDemandForecast(filters: AnalyticsFilters, daysAhead: number = 7) {
  const [data, setData] = useState<DemandForecast[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analytics/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters, daysAhead }),
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching demand forecast:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters, daysAhead]);

  return { data, loading };
}

export function useAIRecommendations(filters: AnalyticsFilters) {
  const [data, setData] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/analytics/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters }),
        });
        const result = await response.json();
        if (result.success) {
          setData(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching AI recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const dismissRecommendation = useCallback(async (id: string) => {
    try {
      await fetch('/api/analytics/recommendations/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setData(prev => prev.filter(rec => rec.id !== id));
    } catch (err) {
      console.error('Error dismissing recommendation:', err);
    }
  }, []);

  const implementRecommendation = useCallback(async (id: string) => {
    try {
      await fetch('/api/analytics/recommendations/implement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setData(prev => prev.map(rec => 
        rec.id === id ? { ...rec, status: 'IMPLEMENTED' } : rec
      ));
    } catch (err) {
      console.error('Error implementing recommendation:', err);
    }
  }, []);

  return { data, loading, dismissRecommendation, implementRecommendation };
}
