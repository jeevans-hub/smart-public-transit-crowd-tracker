import { useState, useEffect, useCallback } from 'react';
import { IPredictionResponse, IPredictionMetrics, PredictionWindow } from '@/types/prediction';

interface UseCrowdPredictionOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  stationId?: string;
  window?: PredictionWindow;
}

interface UseCrowdPredictionReturn {
  predictions: IPredictionResponse[];
  metrics: IPredictionMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  generatePrediction: (stationId: string, stationName: string, window: PredictionWindow) => Promise<void>;
  deletePrediction: (id: string) => Promise<void>;
}

export function useCrowdPrediction(options: UseCrowdPredictionOptions = {}): UseCrowdPredictionReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds default
    stationId,
    window,
  } = options;

  const [predictions, setPredictions] = useState<IPredictionResponse[]>([]);
  const [metrics, setMetrics] = useState<IPredictionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (stationId) params.append('station', stationId);
      if (window) params.append('window', window);
      
      const response = await fetch(`/api/predictions?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setPredictions(result.data.predictions || []);
        setMetrics(result.data.metrics || null);
      } else {
        setError(result.error || 'Failed to fetch predictions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [stationId, window]);

  const generatePrediction = useCallback(async (
    stationId: string,
    stationName: string,
    predictionWindow: PredictionWindow
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stationId,
          stationName,
          window: predictionWindow,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh predictions after generating a new one
        await fetchPredictions();
      } else {
        setError(result.error || 'Failed to generate prediction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchPredictions]);

  const deletePrediction = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/predictions/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh predictions after deletion
        await fetchPredictions();
      } else {
        setError(result.error || 'Failed to delete prediction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchPredictions]);

  const refresh = useCallback(async () => {
    await fetchPredictions();
  }, [fetchPredictions]);

  useEffect(() => {
    fetchPredictions();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPredictions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPredictions, autoRefresh, refreshInterval]);

  return {
    predictions,
    metrics,
    loading,
    error,
    refresh,
    generatePrediction,
    deletePrediction,
  };
}

export function usePredictionById(id: string) {
  const [prediction, setPrediction] = useState<IPredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/predictions/${id}`);
      const result = await response.json();
      
      if (result.success) {
        setPrediction(result.data);
      } else {
        setError(result.error || 'Failed to fetch prediction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchPrediction();
    }
  }, [id, fetchPrediction]);

  return { prediction, loading, error, refresh: fetchPrediction };
}

export function useCriticalPredictions() {
  const [predictions, setPredictions] = useState<IPredictionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCriticalPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/predictions/critical');
      const result = await response.json();
      
      if (result.success) {
        setPredictions(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch critical predictions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCriticalPredictions();
    
    const interval = setInterval(fetchCriticalPredictions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchCriticalPredictions]);

  return { predictions, loading, error, refresh: fetchCriticalPredictions };
}
