import { useEffect, useState, useCallback, useRef } from 'react';
import { useRealtime } from '@/contexts/RealtimeProvider';
import { SERVER_EVENTS } from '@/utils/eventNames';
import { ICrowdReportResponse, ICrowdStatistics } from '@/types/crowd';

export interface TimelineEvent {
  type: string;
  data: any;
  timestamp: Date;
}

export interface AlertData {
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'RESOLVED';
  message: string;
  stationId?: string;
  vehicleId?: string;
  occupancyPercentage?: number;
  timestamp: Date;
}

interface UseCrowdRealtimeOptions {
  autoSync?: boolean;
  onCrowdCreated?: (report: ICrowdReportResponse) => void;
  onCrowdUpdated?: (report: ICrowdReportResponse) => void;
  onCrowdDeleted?: (id: string) => void;
  onDashboardUpdate?: (stats: ICrowdStatistics) => void;
  onTimelineUpdate?: (event: TimelineEvent) => void;
  onAlertNew?: (alert: AlertData) => void;
}

export function useCrowdRealtime(options: UseCrowdRealtimeOptions = {}) {
  const {
    autoSync = true,
    onCrowdCreated,
    onCrowdUpdated,
    onCrowdDeleted,
    onDashboardUpdate,
    onTimelineUpdate,
    onAlertNew,
  } = options;

  const { subscribe, unsubscribe, isConnected, connectionState } = useRealtime();
  const [crowdReports, setCrowdReports] = useState<ICrowdReportResponse[]>([]);
  const [statistics, setStatistics] = useState<ICrowdStatistics | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [syncing, setSyncing] = useState(false);
  
  const subscriptionsRef = useRef<(() => void)[]>([]);
  const syncInProgressRef = useRef(false);

  // Fetch initial data after reconnect
  const syncData = useCallback(async () => {
    if (syncInProgressRef.current) return;
    
    syncInProgressRef.current = true;
    setSyncing(true);

    try {
      const [reportsRes, statsRes] = await Promise.all([
        fetch('/api/crowd?limit=50'),
        fetch('/api/crowd?stats=true'),
      ]);

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        if (reportsData.success) {
          setCrowdReports(reportsData.data || []);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStatistics(statsData.data);
        }
      }
    } catch (error) {
      console.error('Failed to sync crowd data:', error);
    } finally {
      setSyncing(false);
      syncInProgressRef.current = false;
    }
  }, []);

  // Handle crowd:created event
  const handleCrowdCreated = useCallback((report: ICrowdReportResponse) => {
    setCrowdReports((prev) => [report, ...prev]);
    onCrowdCreated?.(report);
  }, [onCrowdCreated]);

  // Handle crowd:updated event
  const handleCrowdUpdated = useCallback((report: ICrowdReportResponse) => {
    setCrowdReports((prev) =>
      prev.map((r) => (r._id === report._id ? report : r))
    );
    onCrowdUpdated?.(report);
  }, [onCrowdUpdated]);

  // Handle crowd:deleted event
  const handleCrowdDeleted = useCallback((data: { id: string }) => {
    setCrowdReports((prev) => prev.filter((r) => r._id !== data.id));
    onCrowdDeleted?.(data.id);
  }, [onCrowdDeleted]);

  // Handle dashboard:update event
  const handleDashboardUpdate = useCallback((stats: ICrowdStatistics) => {
    setStatistics(stats);
    onDashboardUpdate?.(stats);
  }, [onDashboardUpdate]);

  // Handle timeline:update event
  const handleTimelineUpdate = useCallback((event: TimelineEvent) => {
    setTimeline((prev) => {
      const newTimeline = [event, ...prev];
      // Keep only last 100 entries
      return newTimeline.slice(0, 100);
    });
    onTimelineUpdate?.(event);
  }, [onTimelineUpdate]);

  // Handle alert:new event
  const handleAlertNew = useCallback((alert: AlertData) => {
    setAlerts((prev) => [alert, ...prev]);
    onAlertNew?.(alert);
  }, [onAlertNew]);

  // Setup socket subscriptions
  useEffect(() => {
    if (!isConnected) {
      // Clear subscriptions when disconnected
      subscriptionsRef.current.forEach((unsub) => unsub());
      subscriptionsRef.current = [];
      return;
    }

    const subscriptions: (() => void)[] = [];

    // Subscribe to crowd events
    subscriptions.push(subscribe(SERVER_EVENTS.CROWD_CREATED, handleCrowdCreated));
    subscriptions.push(subscribe(SERVER_EVENTS.CROWD_UPDATED, handleCrowdUpdated));
    subscriptions.push(subscribe(SERVER_EVENTS.CROWD_DELETED, handleCrowdDeleted));
    subscriptions.push(subscribe(SERVER_EVENTS.DASHBOARD_UPDATE, handleDashboardUpdate));
    subscriptions.push(subscribe(SERVER_EVENTS.TIMELINE_UPDATE, handleTimelineUpdate));
    subscriptions.push(subscribe(SERVER_EVENTS.ALERT_NEW, handleAlertNew));

    subscriptionsRef.current = subscriptions;

    // Sync data on initial connection
    if (autoSync) {
      syncData();
    }

    return () => {
      subscriptions.forEach((unsub) => unsub());
      subscriptionsRef.current = [];
    };
  }, [isConnected, subscribe, handleCrowdCreated, handleCrowdUpdated, handleCrowdDeleted, handleDashboardUpdate, handleTimelineUpdate, handleAlertNew, autoSync, syncData]);

  // Sync data when connection state changes from disconnected to connected
  useEffect(() => {
    if (connectionState === 'CONNECTED' && autoSync) {
      syncData();
    }
  }, [connectionState, autoSync, syncData]);

  return {
    // Data
    crowdReports,
    statistics,
    timeline,
    alerts,
    
    // State
    isConnected,
    syncing,
    connectionState,
    
    // Actions
    syncData,
    
    // Helpers
    hasCrowdReports: crowdReports.length > 0,
    hasAlerts: alerts.length > 0,
    criticalAlerts: alerts.filter((a) => a.type === 'CRITICAL'),
  };
}
