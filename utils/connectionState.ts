import { ConnectionState } from '@/types/socket';

// Re-export ConnectionState for convenience
export type { ConnectionState } from '@/types/socket';

/**
 * Connection State Utilities
 * 
 * Helper functions for managing and validating connection states.
 */

export const CONNECTION_STATES: ConnectionState[] = [
  'CONNECTING',
  'CONNECTED',
  'RECONNECTING',
  'DISCONNECTED',
  'ERROR',
] as const;

/**
 * Check if a connection state is considered "connected"
 */
export function isConnected(state: ConnectionState): boolean {
  return state === 'CONNECTED';
}

/**
 * Check if a connection state is considered "connecting"
 */
export function isConnecting(state: ConnectionState): boolean {
  return state === 'CONNECTING' || state === 'RECONNECTING';
}

/**
 * Check if a connection state is considered "disconnected"
 */
export function isDisconnected(state: ConnectionState): boolean {
  return state === 'DISCONNECTED' || state === 'ERROR';
}

/**
 * Check if a connection state is considered "healthy"
 */
export function isHealthy(state: ConnectionState): boolean {
  return state === 'CONNECTED';
}

/**
 * Check if a connection state is considered "unhealthy"
 */
export function isUnhealthy(state: ConnectionState): boolean {
  return state === 'ERROR' || state === 'DISCONNECTED';
}

/**
 * Get connection state color for UI
 */
export function getConnectionStateColor(state: ConnectionState): string {
  switch (state) {
    case 'CONNECTED':
      return 'green';
    case 'CONNECTING':
      return 'yellow';
    case 'RECONNECTING':
      return 'orange';
    case 'DISCONNECTED':
      return 'red';
    case 'ERROR':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get connection state label for UI
 */
export function getConnectionStateLabel(state: ConnectionState): string {
  switch (state) {
    case 'CONNECTED':
      return 'Connected';
    case 'CONNECTING':
      return 'Connecting';
    case 'RECONNECTING':
      return 'Reconnecting';
    case 'DISCONNECTED':
      return 'Disconnected';
    case 'ERROR':
      return 'Error';
    default:
      return 'Unknown';
  }
}

/**
 * Validate connection state
 */
export function isValidConnectionState(state: string): state is ConnectionState {
  return CONNECTION_STATES.includes(state as ConnectionState);
}

/**
 * Get next expected state based on current state
 */
export function getNextExpectedState(current: ConnectionState, event: 'connect' | 'disconnect' | 'error'): ConnectionState {
  switch (current) {
    case 'DISCONNECTED':
      if (event === 'connect') return 'CONNECTING';
      return current;
    case 'CONNECTING':
      if (event === 'connect') return 'CONNECTED';
      if (event === 'error') return 'ERROR';
      if (event === 'disconnect') return 'DISCONNECTED';
      return current;
    case 'CONNECTED':
      if (event === 'disconnect') return 'DISCONNECTED';
      if (event === 'error') return 'ERROR';
      return current;
    case 'RECONNECTING':
      if (event === 'connect') return 'CONNECTED';
      if (event === 'error') return 'ERROR';
      if (event === 'disconnect') return 'DISCONNECTED';
      return current;
    case 'ERROR':
      if (event === 'connect') return 'RECONNECTING';
      return current;
    default:
      return 'DISCONNECTED';
  }
}

/**
 * Calculate reconnection delay with exponential backoff
 */
export function calculateReconnectionDelay(attempt: number): number {
  const delays = [1000, 2000, 5000, 10000, 20000, 30000]; // milliseconds
  const maxDelay = delays[delays.length - 1];
  
  if (attempt < delays.length) {
    return delays[attempt];
  }
  
  return maxDelay;
}

/**
 * Format connection duration
 */
export function formatConnectionDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format latency
 */
export function formatLatency(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }
  return `${(milliseconds / 1000).toFixed(1)}s`;
}
