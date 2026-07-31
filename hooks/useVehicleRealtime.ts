import { useEffect, useState, useCallback, useRef } from 'react';
import { useRealtime } from '@/contexts/RealtimeProvider';
import { SERVER_EVENTS } from '@/utils/eventNames';
import { ILiveVehicleResponse, ILiveVehicleStatistics, LiveVehicleStatus } from '@/types/vehicle';

interface TimelineEvent {
  type: string;
  data: any;
  timestamp: Date;
}

interface AlertData {
  type: 'critical' | 'high' | 'medium' | 'low' | 'resolved';
  message: string;
  vehicleId?: string;
  vehicleNumber?: string;
  timestamp: Date;
}

interface UseVehicleRealtimeOptions {
  autoSync?: boolean;
  onVehicleCreated?: (vehicle: ILiveVehicleResponse) => void;
  onVehicleUpdated?: (vehicle: ILiveVehicleResponse) => void;
  onVehicleDeleted?: (id: string) => void;
  onVehicleMoved?: (vehicle: ILiveVehicleResponse) => void;
  onVehicleStatus?: (vehicle: ILiveVehicleResponse) => void;
  onVehicleLocation?: (vehicle: ILiveVehicleResponse) => void;
  onDashboardUpdate?: (stats: ILiveVehicleStatistics) => void;
  onTimelineUpdate?: (event: TimelineEvent) => void;
  onAlertNew?: (alert: AlertData) => void;
}

export function useVehicleRealtime(options: UseVehicleRealtimeOptions = {}) {
  const {
    autoSync = true,
    onVehicleCreated,
    onVehicleUpdated,
    onVehicleDeleted,
    onVehicleMoved,
    onVehicleStatus,
    onVehicleLocation,
    onDashboardUpdate,
    onTimelineUpdate,
    onAlertNew,
  } = options;

  const { subscribe, unsubscribe, isConnected, connectionState } = useRealtime();
  const [vehicles, setVehicles] = useState<ILiveVehicleResponse[]>([]);
  const [statistics, setStatistics] = useState<ILiveVehicleStatistics | null>(null);
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
      const [vehiclesRes, statsRes] = await Promise.all([
        fetch('/api/live-vehicles?limit=50'),
        fetch('/api/live-vehicles?stats=true'),
      ]);

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        if (vehiclesData.success) {
          setVehicles(vehiclesData.data || []);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStatistics(statsData.data);
        }
      }
    } catch (error) {
      console.error('Failed to sync vehicle data:', error);
    } finally {
      setSyncing(false);
      syncInProgressRef.current = false;
    }
  }, []);

  // Handle vehicle:created event
  const handleVehicleCreated = useCallback((vehicle: ILiveVehicleResponse) => {
    setVehicles((prev) => [vehicle, ...prev]);
    onVehicleCreated?.(vehicle);
    
    // Add timeline event
    const timelineEvent: TimelineEvent = {
      type: 'vehicle:created',
      data: { vehicleNumber: vehicle.vehicleNumber, route: vehicle.route },
      timestamp: new Date(),
    };
    setTimeline((prev) => {
      const newTimeline = [timelineEvent, ...prev];
      return newTimeline.slice(0, 100);
    });
    onTimelineUpdate?.(timelineEvent);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Vehicle Realtime] Vehicle created:', vehicle);
    }
  }, [onVehicleCreated, onTimelineUpdate]);

  // Handle vehicle:updated event
  const handleVehicleUpdated = useCallback((vehicle: ILiveVehicleResponse) => {
    setVehicles((prev) =>
      prev.map((v) => (v._id === vehicle._id ? vehicle : v))
    );
    onVehicleUpdated?.(vehicle);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Vehicle Realtime] Vehicle updated:', vehicle);
    }
  }, [onVehicleUpdated]);

  // Handle vehicle:deleted event
  const handleVehicleDeleted = useCallback((data: { id: string }) => {
    setVehicles((prev) => prev.filter((v) => v._id !== data.id));
    onVehicleDeleted?.(data.id);
    
    // Add timeline event
    const timelineEvent: TimelineEvent = {
      type: 'vehicle:deleted',
      data: { vehicleId: data.id },
      timestamp: new Date(),
    };
    setTimeline((prev) => {
      const newTimeline = [timelineEvent, ...prev];
      return newTimeline.slice(0, 100);
    });
    onTimelineUpdate?.(timelineEvent);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Vehicle Realtime] Vehicle deleted:', data.id);
    }
  }, [onVehicleDeleted, onTimelineUpdate]);

  // Handle vehicle:moved event
  const handleVehicleMoved = useCallback((vehicle: ILiveVehicleResponse) => {
    setVehicles((prev) =>
      prev.map((v) => (v._id === vehicle._id ? vehicle : v))
    );
    onVehicleMoved?.(vehicle);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Vehicle Realtime] Vehicle moved:', vehicle);
    }
  }, [onVehicleMoved]);

  // Handle vehicle:status event
  const handleVehicleStatus = useCallback((vehicle: ILiveVehicleResponse) => {
    setVehicles((prev) =>
      prev.map((v) => (v._id === vehicle._id ? vehicle : v))
    );
    onVehicleStatus?.(vehicle);
    
    // Add timeline event for status changes
    const timelineEvent: TimelineEvent = {
      type: 'vehicle:status',
      data: { vehicleNumber: vehicle.vehicleNumber, status: vehicle.status },
      timestamp: new Date(),
    };
    setTimeline((prev) => {
      const newTimeline = [timelineEvent, ...prev];
      return newTimeline.slice(0, 100);
    });
    onTimelineUpdate?.(timelineEvent);
    
    // Generate alert for offline status
    if (vehicle.status === 'OFFLINE') {
      const alert: AlertData = {
        type: 'high',
        message: `Vehicle ${vehicle.vehicleNumber} is now offline`,
        vehicleId: vehicle.vehicleId,
        vehicleNumber: vehicle.vehicleNumber,
        timestamp: new Date(),
      };
      setAlerts((prev) => [alert, ...prev]);
      onAlertNew?.(alert);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Vehicle Realtime] Vehicle status changed:', vehicle);
    }
  }, [onVehicleStatus, onTimelineUpdate, onAlertNew]);

  // Handle vehicle:location event
  const handleVehicleLocation = useCallback((vehicle: ILiveVehicleResponse) => {
    setVehicles((prev) =>
      prev.map((v) => (v._id === vehicle._id ? vehicle : v))
    );
    onVehicleLocation?.(vehicle);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Vehicle Realtime] Vehicle location updated:', vehicle);
    }
  }, [onVehicleLocation]);

  // Handle dashboard:update event
  const handleDashboardUpdate = useCallback((stats: ILiveVehicleStatistics) => {
    setStatistics(stats);
    onDashboardUpdate?.(stats);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Vehicle Realtime] Dashboard updated:', stats);
    }
  }, [onDashboardUpdate]);

  // Handle alert:new event
  const handleAlertNew = useCallback((alert: AlertData) => {
    setAlerts((prev) => [alert, ...prev]);
    onAlertNew?.(alert);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Vehicle Realtime] New alert:', alert);
    }
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

    // Subscribe to vehicle events
    subscriptions.push(subscribe(SERVER_EVENTS.VEHICLE_CREATED, handleVehicleCreated));
    subscriptions.push(subscribe(SERVER_EVENTS.VEHICLE_UPDATED, handleVehicleUpdated));
    subscriptions.push(subscribe(SERVER_EVENTS.VEHICLE_DELETED, handleVehicleDeleted));
    subscriptions.push(subscribe(SERVER_EVENTS.VEHICLE_MOVED, handleVehicleMoved));
    subscriptions.push(subscribe(SERVER_EVENTS.VEHICLE_STATUS, handleVehicleStatus));
    subscriptions.push(subscribe(SERVER_EVENTS.VEHICLE_LOCATION, handleVehicleLocation));
    subscriptions.push(subscribe(SERVER_EVENTS.DASHBOARD_UPDATE, handleDashboardUpdate));
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
  }, [isConnected, subscribe, handleVehicleCreated, handleVehicleUpdated, handleVehicleDeleted, handleVehicleMoved, handleVehicleStatus, handleVehicleLocation, handleDashboardUpdate, handleAlertNew, autoSync, syncData]);

  // Sync data when connection state changes from disconnected to connected
  useEffect(() => {
    if (connectionState === 'CONNECTED' && autoSync) {
      syncData();
    }
  }, [connectionState, autoSync, syncData]);

  return {
    // Data
    vehicles,
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
    hasVehicles: vehicles.length > 0,
    hasAlerts: alerts.length > 0,
    hasTimeline: timeline.length > 0,
    criticalAlerts: alerts.filter((a) => a.type === 'critical'),
    highAlerts: alerts.filter((a) => a.type === 'high'),
    mediumAlerts: alerts.filter((a) => a.type === 'medium'),
    lowAlerts: alerts.filter((a) => a.type === 'low'),
    movingVehicles: vehicles.filter((v) => v.status === 'MOVING'),
    stoppedVehicles: vehicles.filter((v) => v.status === 'STOPPED'),
    delayedVehicles: vehicles.filter((v) => v.status === 'DELAYED'),
    offlineVehicles: vehicles.filter((v) => v.status === 'OFFLINE'),
  };
}
