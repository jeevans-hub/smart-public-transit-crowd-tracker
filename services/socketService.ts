import { io, Socket } from 'socket.io-client';
import { SocketConfig, QueuedEvent, SocketStats, ServerInfo, HeartbeatData, ConnectionState } from '@/types/socket';
import { isValidConnectionState, getNextExpectedState, calculateReconnectionDelay, formatConnectionDuration, formatLatency } from '@/utils/connectionState';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@/utils/eventNames';

/**
 * Socket.IO Client Service
 * 
 * This service manages the client-side socket connection, including:
 * - Connection management with reconnection logic
 * - Event emission and subscription
 * - Queue management for offline events
 * - Heartbeat monitoring
 * - Authentication
 */

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private config: SocketConfig;
  private connectionState: ConnectionState = 'DISCONNECTED';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 6;
  private eventQueue: QueuedEvent[] = [];
  private eventSubscriptions: Map<string, Set<(...args: any[]) => void>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionStartTime: Date | null = null;
  private lastPingTime: Date | null = null;
  private latencyHistory: number[] = [];
  private readonly maxLatencyHistory = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private debugMode = process.env.NODE_ENV === 'development';

  private constructor(config: SocketConfig = {}) {
    this.config = {
      url: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
      path: '/socket.io',
      reconnectionAttempts: 6,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 10000,
      autoConnect: false,
      debug: process.env.NODE_ENV === 'development',
      ...config,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: SocketConfig): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService(config);
    }
    return SocketService.instance;
  }

  /**
   * Connect to socket server
   */
  public connect(token?: string): void {
    if (this.socket?.connected) {
      this.log('Already connected');
      return;
    }

    this.setConnectionState('CONNECTING');
    this.connectionStartTime = new Date();

    const socketOptions: any = {
      path: this.config.path,
      reconnection: true,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      reconnectionDelayMax: this.config.reconnectionDelayMax,
      timeout: this.config.timeout,
      autoConnect: this.config.autoConnect,
      transports: ['websocket', 'polling'],
    };

    // Add authentication token if provided
    if (token) {
      socketOptions.auth = { token };
    }

    this.socket = io(this.config.url, socketOptions);
    this.setupEventHandlers();
    this.startHeartbeat();

    this.log('Connecting to socket server...');
  }

  /**
   * Disconnect from socket server
   */
  public disconnect(): void {
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.setConnectionState('DISCONNECTED');
    this.reconnectAttempts = 0;
    this.log('Disconnected from socket server');
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => this.handleConnect());
    this.socket.on('disconnect', (reason) => this.handleDisconnect(reason));
    this.socket.on('connect_error', (error) => this.handleConnectError(error));
    this.socket.on('reconnect', (attemptNumber) => this.handleReconnect(attemptNumber));
    this.socket.on('reconnect_attempt', (attemptNumber) => this.handleReconnectAttempt(attemptNumber));
    this.socket.on('reconnect_failed', () => this.handleReconnectFailed());
    this.socket.on('error', (error) => this.handleError(error));

    // Server events
    this.socket.on(SERVER_EVENTS.SYSTEM_STATUS, (data: ServerInfo) => this.handleSystemStatus(data));
    this.socket.on(SERVER_EVENTS.PONG, (data: HeartbeatData) => this.handlePong(data));
    this.socket.on(SERVER_EVENTS.CLIENT_CONNECTED, (data: any) => this.handleClientConnected(data));
    this.socket.on(SERVER_EVENTS.CLIENT_DISCONNECTED, (data: any) => this.handleClientDisconnected(data));
  }

  /**
   * Handle successful connection
   */
  private handleConnect(): void {
    this.setConnectionState('CONNECTED');
    this.reconnectAttempts = 0;
    this.flushEventQueue();
    this.log('Connected to socket server');
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(reason: string): void {
    this.setConnectionState('DISCONNECTED');
    this.log(`Disconnected: ${reason}`);

    // If disconnection was not intentional, attempt to reconnect
    if (reason !== 'io client disconnect') {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectError(error: Error): void {
    this.setConnectionState('ERROR');
    this.log(`Connection error: ${error.message}`);
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(attemptNumber: number): void {
    this.setConnectionState('CONNECTED');
    this.reconnectAttempts = 0;
    this.log(`Reconnected after ${attemptNumber} attempts`);
    this.flushEventQueue();
  }

  /**
   * Handle reconnection attempt
   */
  private handleReconnectAttempt(attemptNumber: number): void {
    this.setConnectionState('RECONNECTING');
    this.reconnectAttempts = attemptNumber;
    const delay = calculateReconnectionDelay(attemptNumber);
    this.log(`Reconnection attempt ${attemptNumber} in ${delay}ms`);
  }

  /**
   * Handle reconnection failure
   */
  private handleReconnectFailed(): void {
    this.setConnectionState('ERROR');
    this.reconnectAttempts = 0;
    this.log('Reconnection failed');
  }

  /**
   * Handle socket error
   */
  private handleError(error: Error): void {
    this.log(`Socket error: ${error.message}`);
  }

  /**
   * Handle system status from server
   */
  private handleSystemStatus(data: ServerInfo): void {
    this.log('System status received', data);
  }

  /**
   * Handle pong response
   */
  private handlePong(data: HeartbeatData): void {
    if (this.lastPingTime) {
      const latency = Date.now() - this.lastPingTime.getTime();
      this.updateLatency(latency);
    }
  }

  /**
   * Handle client connected event
   */
  private handleClientConnected(data: any): void {
    this.log(`Client connected: ${data.clientId}`);
  }

  /**
   * Handle client disconnected event
   */
  private handleClientDisconnected(data: any): void {
    this.log(`Client disconnected: ${data.clientId}`);
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached');
      return;
    }

    const delay = calculateReconnectionDelay(this.reconnectAttempts);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.setConnectionState('RECONNECTING');
      this.socket?.connect();
    }, delay);
  }

  /**
   * Update latency measurement
   */
  private updateLatency(latency: number): void {
    this.latencyHistory.push(latency);
    
    if (this.latencyHistory.length > this.maxLatencyHistory) {
      this.latencyHistory.shift();
    }
  }

  /**
   * Get average latency
   */
  private getAverageLatency(): number {
    if (this.latencyHistory.length === 0) return 0;
    
    const sum = this.latencyHistory.reduce((acc, val) => acc + val, 0);
    return sum / this.latencyHistory.length;
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.lastPingTime = new Date();
        this.socket.emit(CLIENT_EVENTS.PING, {
          timestamp: Date.now(),
        });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Set connection state
   */
  private setConnectionState(state: ConnectionState): void {
    if (isValidConnectionState(state)) {
      this.connectionState = state;
      this.log(`Connection state: ${state}`);
    }
  }

  /**
   * Add event to queue
   */
  private queueEvent(event: string, data: any): void {
    this.eventQueue.push({
      event,
      data,
      timestamp: new Date(),
    });
    this.log(`Event queued: ${event} (Queue size: ${this.eventQueue.length})`);
  }

  /**
   * Flush event queue
   */
  private flushEventQueue(): void {
    if (this.eventQueue.length === 0) return;

    this.log(`Flushing ${this.eventQueue.length} queued events`);
    
    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    eventsToFlush.forEach(({ event, data }) => {
      this.emit(event, data);
    });
  }

  /**
   * Emit event to server
   */
  public emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      this.queueEvent(event, data);
      return;
    }

    this.socket.emit(event, data);
    this.log(`Emitted: ${event}`);
  }

  /**
   * Subscribe to server event
   */
  public subscribe(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.eventSubscriptions.has(event)) {
      this.eventSubscriptions.set(event, new Set());
    }

    this.eventSubscriptions.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    this.log(`Subscribed to: ${event}`);

    // Return unsubscribe function
    return () => this.unsubscribe(event, callback);
  }

  /**
   * Unsubscribe from server event
   */
  public unsubscribe(event: string, callback?: (...args: any[]) => void): void {
    const subscriptions = this.eventSubscriptions.get(event);
    
    if (!subscriptions) return;

    if (callback) {
      subscriptions.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback as (...args: any[]) => void);
      }
    } else {
      subscriptions.forEach((cb) => {
        if (this.socket) {
          this.socket.off(event, cb as (...args: any[]) => void);
        }
      });
      subscriptions.clear();
    }

    if (subscriptions.size === 0) {
      this.eventSubscriptions.delete(event);
    }

    this.log(`Unsubscribed from: ${event}`);
  }

  /**
   * Join room
   */
  public joinRoom(room: string): void {
    this.emit(CLIENT_EVENTS.JOIN_ROOM, room);
  }

  /**
   * Leave room
   */
  public leaveRoom(room: string): void {
    this.emit(CLIENT_EVENTS.LEAVE_ROOM, room);
  }

  /**
   * Get connection stats
   */
  public getStats(): SocketStats {
    const connectionDuration = this.connectionStartTime
      ? Date.now() - this.connectionStartTime.getTime()
      : 0;

    return {
      isConnected: this.connectionState === 'CONNECTED',
      isConnecting: this.connectionState === 'CONNECTING',
      isReconnecting: this.connectionState === 'RECONNECTING',
      connectionState: this.connectionState,
      latency: this.getAverageLatency(),
      connectionDuration,
      reconnectAttempts: this.reconnectAttempts,
      queuedEvents: this.eventQueue.length,
    };
  }

  /**
   * Get socket instance
   */
  public getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionState === 'CONNECTED';
  }

  /**
   * Check if connecting
   */
  public isConnecting(): boolean {
    return this.connectionState === 'CONNECTING' || this.connectionState === 'RECONNECTING';
  }

  /**
   * Get connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Re-authenticate with new token
   */
  public reauthenticate(token: string): void {
    this.emit(CLIENT_EVENTS.AUTHENTICATE, { token });
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (this.debugMode) {
      if (data) {
        console.log(`[Socket Service] ${message}`, data);
      } else {
        console.log(`[Socket Service] ${message}`);
      }
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.disconnect();
    this.eventSubscriptions.clear();
    this.eventQueue = [];
    this.latencyHistory = [];
  }
}

// Export singleton instance
export const socketService = SocketService.getInstance();

// Export class for testing
export { SocketService };
