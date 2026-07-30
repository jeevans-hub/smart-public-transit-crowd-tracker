import { useRealtime as useRealtimeContext } from '@/contexts/RealtimeProvider';
import { formatConnectionDuration, formatLatency } from '@/utils/connectionState';

/**
 * Realtime Hook
 * 
 * Convenience hook for accessing socket functionality.
 * Wraps the RealtimeProvider context and adds formatted utilities.
 */
export function useRealtime() {
  const context = useRealtimeContext();

  return {
    ...context,
    // Convenience getters
    connected: context.isConnected,
    connecting: context.isConnecting,
    reconnecting: context.connectionState === 'RECONNECTING',
    // Formatted values
    formattedLatency: formatLatency(context.latency),
    formattedDuration: formatConnectionDuration(context.connectionDuration),
    // Connection state helpers
    isHealthy: context.connectionState === 'CONNECTED',
    isUnhealthy: context.connectionState === 'ERROR' || context.connectionState === 'DISCONNECTED',
  };
}

/**
 * Connection State Hook
 * 
 * Simplified hook that only returns connection state information.
 */
export function useConnectionState() {
  const { connectionState, isConnected, isConnecting, latency, connectionDuration, reconnectAttempts } = useRealtimeContext();

  return {
    state: connectionState,
    connected: isConnected,
    connecting: isConnecting,
    latency,
    connectionDuration,
    reconnectAttempts,
    formattedLatency: formatLatency(latency),
    formattedDuration: formatConnectionDuration(connectionDuration),
  };
}

/**
 * Socket Actions Hook
 * 
 * Hook that only returns socket action methods.
 */
export function useSocketActions() {
  const { emit, subscribe, unsubscribe, joinRoom, leaveRoom, connect, disconnect } = useRealtimeContext();

  return {
    emit,
    subscribe: subscribe as (event: string, callback: (...args: any[]) => void) => () => void,
    unsubscribe: unsubscribe as (event: string, callback?: (...args: any[]) => void) => void,
    joinRoom,
    leaveRoom,
    connect,
    disconnect,
  };
}

/**
 * Server Info Hook
 * 
 * Hook that only returns server information.
 */
export function useServerInfo() {
  const { serverInfo, isConnected } = useRealtimeContext();

  return {
    serverInfo,
    connected: isConnected,
    hasServerInfo: serverInfo !== null,
  };
}
