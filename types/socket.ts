import { Socket } from 'socket.io-client';

export type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED' | 'ERROR';

export interface SocketMetrics {
  connectedClients: number;
  serverStartTime: Date;
  messagesSent: number;
  messagesReceived: number;
  averageLatency: number;
  connectionDuration: number;
  lastPing: Date;
}

export interface QueuedEvent {
  event: string;
  data: any;
  timestamp: Date;
}

export interface SocketConfig {
  url?: string;
  path?: string;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  autoConnect?: boolean;
  debug?: boolean;
}

export interface SocketStats {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  connectionState: ConnectionState;
  latency: number;
  connectionDuration: number;
  reconnectAttempts: number;
  queuedEvents: number;
}

export interface ServerInfo {
  startTime: Date;
  uptime: number;
  connectedClients: number;
  messagesSent: number;
  messagesReceived: number;
  averageLatency: number;
}

export interface HeartbeatData {
  timestamp: number;
  clientId: string;
}

export interface AuthenticatedSocket {
  id: string;
  userId?: string;
  username?: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback?: Function) => void;
  rooms: Set<string>;
  disconnect: () => void;
}
