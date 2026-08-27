import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtime } from '@/contexts/RealtimeProvider';
import { IPredictionResponse, IPredictionMetrics, PredictionWindow } from '@/types/prediction';
import { SERVER_EVENTS } from '@/utils/eventNames';

interface UsePredictionRealtimeOptions {
  stationId?: string;
  window?: PredictionWindow;
  autoSync?: boolean;
  onPredictionGenerated?: (prediction: IPredictionResponse) => void;
  onPredictionUpdated?: (prediction: IPredictionResponse) => void;
  onPredictionDeleted?: (data: {	id: string; stationId: string }) => void;
  onTrendChanged?: (data: { stationId: string; stationName: string; trend: string; confidence: number }) => void;
  onConfidenceChanged?: (data: { stationId: string; stationName: string; confidence: number; risk: string }) => void;
  onAnomalyDetected?: (data: { stationId: string; stationName: string; anomaly: any }) => void;
  onAlert?: (data: { stationId: string; stationName: string; type: string; message: string; severity: string }) => void;
  onInsight?: (data: { stationId: string; stationName: string; insight: any }) => void;
  onDashboardUpdate?: (data: any) => void;
  onTimelineUpdate?: (event: any) => void;
}

interface UsePredictionRealtimeReturn {
  predictions: IPredictionResponse[];
  metrics: IPredictionMetrics | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  refresh: () => Promise<void>;
  generatePrediction: (stationId: string, stationName: string, window: PredictionWindow) => Promise<void>;
  deletePrediction: (id: string) => Promise<void>;
}

export function usePredictionRealtime(
  options: UsePredictionRealtimeOptions = {}
): UsePredictionRealtimeReturn {
  const {
    stationId,
    window,
    autoSync = true,
    onPredictionGenerated,
    onPredictionUpdated,
    onPredictionDeleted,
    onTrendChanged,
    onConfidenceChanged,
    onAnomalyDetected,
    onAlert,
    onInsight,
    onDashboardUpdate,
    onTimelineUpdate,
  } = options;

  const { isConnected, subscribe } = useRealtime();
  const [predictions, setPredictions] = useState<IPredictionResponse[]>([]);
  const [metrics, setMetrics] = useState<IPredictionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const isMountedRef = useRef(true);
  const callbacksRef = useRef({
    onPredictionGenerated,
    onPredictionUpdated,
    onPredictionDeleted,
    onTrendChanged,
    onConfidenceChanged,
    onAnomalyDetected,
    onAlert,
    onInsight,
    onDashboardUpdate,
    onTimelineUpdate,
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onPredictionGenerated,
      onPredictionUpdated,
      onPredictionDeleted,
      onTrendChanged,
      onConfidenceChanged,
      onAnomalyDetected,
      onAlert,
      onInsight,
      onDashboardUpdate,
      onTimelineUpdate,
    };
  }, [
    onPredictionGenerated,
    onPredictionUpdated,
    onPredictionDeleted,
    onTrendChanged,
    onConfidenceChanged,
    onAnomalyDetected,
    onAlert,
    onInsight,
    onDashboardUpdate,
    onTimelineUpdate,
  ]);

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (stationId) params.append('station', stationId);
      if (window) params.append('window', window);
      
      const response = await fetch(`/api/predictions?${params.toString()}`);
      const result = await response.json();
      
      if (result.success && isMountedRef.current) {
        setPredictions(result.data.predictions || []);
        setMetrics(result.data.metrics || null);
      } else if (isMountedRef.current) {
        setError(result.error || 'Failed to fetch predictions');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [stationId, window]);

  const generatePrediction = useCallback(async (
    predictionStationId: string,
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
          stationId: predictionStationId,
          stationName,
          window: predictionWindow,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || 'Failed to generate prediction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePrediction = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/predictions/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || 'Failed to delete prediction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchPredictions();
  }, [fetchPredictions]);

  // Handle prediction generated event
  const handlePredictionGenerated = useCallback((prediction: IPredictionResponse) => {
    if (isMountedRef.current) {
      setPredictions((prev) => {
        const exists = prev.some((p) => p._id === prediction._id);
        if (exists) {
          return prev.map((p) => (p._id === prediction._id ? prediction : p));
        }
        return [prediction, ...prev];
      });
      
      if (callbacksRef.current.onPredictionGenerated) {
        callbacksRef.current.onPredictionGenerated(prediction);
      }
    }
  }, []);

  // Handle prediction updated event
  const handlePredictionUpdated = useCallback((prediction: IPredictionResponse) => {
    if (isMountedRef.current) {
      setPredictions((prev) =>
        prev.map((p) => (p._id === prediction._id ? prediction : p))
      );
      
      if (callbacksRef.current.onPredictionUpdated) {
        callbacksRef.current.onPredictionUpdated(prediction);
      }
    }
  }, []);

  // Handle prediction deleted event
  const handlePredictionDeleted = useCallback((data: { id: string; stationId: string }) => {
    if (isMountedRef.current) {
      setPredictions((prev) => prev.filter((p) => p._id !== data.id));
      
      if (callbacksRef.current.onPredictionDeleted) {
        callbacksRef.current.onPredictionDeleted(data);
      }
    }
  }, []);

  // Handle trend changed event
  const handleTrendChanged = useCallback((data: {
    stationId: string;
    stationName: string;
    trend: string;
    confidence: number;
  }) => {
    if (isMountedRef.current) {
      setPredictions((prev) =>
        prev.map((p) =>
          p.stationId === data.stationId
            ? { ...p, trend: data.trend as any, confidence: data.confidence }
            : p
        )
      );
      
      if (callbacksRef.current.onTrendChanged) {
        callbacksRef.current.onTrendChanged(data);
      }
    }
  }, []);

  // Handle confidence changed event
  const handleConfidenceChanged = useCallback((data: {
    stationId: string;
    stationName: string;
    confidence: number;
    risk: string;
  }) => {
    if (isMountedRef.current) {
      setPredictions((prev) =>
        prev.map((p) =>
          p.stationId === data.stationId
            ? { ...p, confidence: data.confidence, risk: data.risk as any }
            : p
        )
      );
      
      if (callbacksRef.current.onConfidenceChanged) {
        callbacksRef.current.onConfidenceChanged(data);
      }
    }
  }, []);

  // Handle anomaly detected event
  const handleAnomalyDetected = useCallback((data: {
    stationId: string;
    stationName: string;
    anomaly: any;
  }) => {
    if (callbacksRef.current.onAnomalyDetected) {
      callbacksRef.current.onAnomalyDetected(data);
    }
  }, []);

  // Handle alert event
  const handleAlert = useCallback((data: {
    stationId: string;
    stationName: string;
    type: string;
    message: string;
    severity: string;
  }) => {
    if (callbacksRef.current.onAlert) {
      callbacksRef.current.onAlert(data);
    }
  }, []);

  // Handle insight event
  const handleInsight = useCallback((data: {
    stationId: string;
    stationName: string;
    insight: any;
  }) => {
    if (callbacksRef.current.onInsight) {
      callbacksRef.current.onInsight(data);
    }
  }, []);

  // Handle dashboard update event
  const handleDashboardUpdate = useCallback((data: any) => {
    if (callbacksRef.current.onDashboardUpdate) {
      callbacksRef.current.onDashboardUpdate(data);
    }
  }, []);

  // Handle timeline update event
  const handleTimelineUpdate = useCallback((event: any) => {
    if (callbacksRef.current.onTimelineUpdate) {
      callbacksRef.current.onTimelineUpdate(event);
    }
  }, []);

  // Set up socket subscriptions
  useEffect(() => {
    if (!autoSync) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to prediction events
    unsubscribers.push(subscribe(SERVER_EVENTS.PREDICTION_GENERATED, handlePredictionGenerated));
    unsubscribers.push(subscribe(SERVER_EVENTS.PREDICTION_UPDATED, handlePredictionUpdated));
    unsubscribers.push(subscribe(SERVER_EVENTS.PREDICTION_DELETED, handlePredictionDeleted));
    unsubscribers.push(subscribe(SERVER_EVENTS.PREDICTION_TREND, handleTrendChanged));
    unsubscribers.push(subscribe(SERVER_EVENTS.PREDICTION_CONFIDENCE, handleConfidenceChanged));
    unsubscribers.push(subscribe(SERVER_EVENTS.PREDICTION_ANOMALY, handleAnomalyDetected));
    unsubscribers.push(subscribe(SERVER_EVENTS.PREDICTION_ALERT, handleAlert));
    unsubscribers.push(subscribe(SERVER_EVENTS.PREDICTION_INSIGHT, handleInsight));
    unsubscribers.push(subscribe(SERVER_EVENTS.DASHBOARD_UPDATE, handleDashboardUpdate));
    unsubscribers.push(subscribe(SERVER_EVENTS.TIMELINE_UPDATE, handleTimelineUpdate));

    unsubscribersRef.current = unsubscribers;

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [autoSync, subscribe]);

  // Initial fetch
  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Re-sync after reconnect
  useEffect(() => {
    if (isConnected) {
      fetchPredictions();
    }
  }, [isConnected, fetchPredictions]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      unsubscribersRef.current.forEach((unsub) => unsub());
    };
  }, []);

  return {
    predictions,
    metrics,
    loading,
    error,
    isConnected,
    refresh,
    generatePrediction,
    deletePrediction,
  };
}
