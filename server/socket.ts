import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Socket as SocketIOSocket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SERVER_EVENTS, CLIENT_EVENTS } from '../utils/eventNames';
import { env } from '@/lib/env';

type ExtendedSocket = SocketIOSocket & {
  userId?: string;
  username?: string;
};

/**
 * Socket.IO Server Configuration
 * 
 * This module initializes and manages the Socket.IO server.
 * It handles authentication, connection tracking, and basic metrics.
 */

interface SocketServerConfig {
  cors?: {
    origin: string | string[];
    credentials?: boolean;
  };
  path?: string;
}

interface ServerMetrics {
  connectedClients: number;
  serverStartTime: Date;
  messagesSent: number;
  messagesReceived: number;
  totalConnections: number;
  totalDisconnections: number;
  connectionDuration: number;
}

class SocketServer {
  private static instance: SocketServer;
  private io: SocketIOServer | null = null;
  private metrics: ServerMetrics;
  private isInitialized = false;
  private debugMode = process.env.NODE_ENV === 'development';

  private constructor() {
    this.metrics = {
      connectedClients: 0,
      serverStartTime: new Date(),
      messagesSent: 0,
      messagesReceived: 0,
      totalConnections: 0,
      totalDisconnections: 0,
      connectionDuration: 0,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SocketServer {
    if (!SocketServer.instance) {
      SocketServer.instance = new SocketServer();
    }
    return SocketServer.instance;
  }

  /**
   * Initialize Socket.IO server
   */
  public initialize(httpServer: HTTPServer, config: SocketServerConfig = {}): void {
    if (this.isInitialized) {
      this.log('Socket server already initialized');
      return;
    }

    const defaultConfig: SocketServerConfig = {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      path: '/socket.io',
      ...config,
    };

    this.io = new SocketIOServer(httpServer, defaultConfig);
    this.setupMiddleware();
    this.setupEventHandlers();
    this.isInitialized = true;
    
    this.log('Socket server initialized successfully');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket: ExtendedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        console.log('[Socket Server] Connection attempt, token present:', !!token);
        console.log('[Socket Server] Socket ID:', socket.id);
        console.log('[Socket Server] Handshake auth:', socket.handshake.auth);
        
        if (!token) {
          this.log('Connection rejected: No token provided');
          console.log('[Socket Server] Calling next() with error: No token');
          return next(new Error('Authentication failed: No token provided'));
        }

        // Verify JWT token using existing JWT secret
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        
        console.log('[Socket Server] Token decoded:', decoded);
        
        // Attach user info to socket
        socket.userId = decoded.userId;
        socket.username = decoded.username || `User-${decoded.userId?.substring(0, 8)}`;
        
        this.log(`User authenticated: ${socket.username} (${socket.userId})`);
        console.log('[Socket Server] Calling next() to proceed with connection');
        next();
      } catch (error) {
        console.error('[Socket Server] Authentication error:', error);
        this.log('Connection rejected: Invalid token');
        console.log('[Socket Server] Calling next() with error: Invalid token');
        next(new Error('Authentication failed: Invalid token'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    console.log('[Socket Server] Setting up event handlers');
    
    this.io.on('connection', (socket: ExtendedSocket) => {
      this.handleConnection(socket);
    });
    
    this.io.engine.on('connection_error', (err) => {
      console.error('[Socket Server] Engine connection error:', err);
    });
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: ExtendedSocket): void {
    console.log('[Socket Server] handleConnection called for socket:', socket.id);
    this.metrics.connectedClients++;
    this.metrics.totalConnections++;
    
    this.log(`Client connected: ${socket.id} (User: ${socket.username})`);
    this.log(`Total connected clients: ${this.metrics.connectedClients}`);

    // Send server info to client
    socket.emit(SERVER_EVENTS.SYSTEM_STATUS, {
      serverStartTime: this.metrics.serverStartTime,
      connectedClients: this.metrics.connectedClients,
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived,
    });
    console.log('[Socket Server] System status sent to client');

    // Handle client events
    socket.on(CLIENT_EVENTS.PING, (data: any) => this.handlePing(socket, data));
    socket.on(CLIENT_EVENTS.AUTHENTICATE, (data: any) => this.handleAuthenticate(socket, data));
    socket.on(CLIENT_EVENTS.JOIN_ROOM, (room: string) => this.handleJoinRoom(socket, room));
    socket.on(CLIENT_EVENTS.LEAVE_ROOM, (room: string) => this.handleLeaveRoom(socket, room));
    socket.on('disconnect', (reason) => this.handleDisconnect(socket, reason));
    socket.on('error', (error) => this.handleError(socket, error));

    // Notify other clients
    this.io?.emit(SERVER_EVENTS.CLIENT_CONNECTED, {
      clientId: socket.id,
      username: socket.username,
      connectedClients: this.metrics.connectedClients,
    });
  }

  /**
   * Handle ping/pong for latency measurement
   */
  private handlePing(socket: ExtendedSocket, data: any): void {
    this.metrics.messagesReceived++;
    
    const pongData = {
      timestamp: Date.now(),
      clientId: socket.id,
      ...data,
    };
    
    socket.emit(SERVER_EVENTS.PONG, pongData);
    this.metrics.messagesSent++;
    
    if (this.debugMode) {
      this.log(`Ping from ${socket.id}`);
    }
  }

  /**
   * Handle re-authentication
   */
  private handleAuthenticate(socket: ExtendedSocket, data: any): void {
    this.metrics.messagesReceived++;
    
    // Token already verified in middleware, just confirm
    socket.emit(SERVER_EVENTS.SYSTEM_STATUS, {
      authenticated: true,
      userId: socket.userId,
      username: socket.username,
    });
    
    this.metrics.messagesSent++;
    this.log(`Re-authenticated: ${socket.username}`);
  }

  /**
   * Handle room join
   */
  private handleJoinRoom(socket: ExtendedSocket, room: string): void {
    this.metrics.messagesReceived++;
    
    socket.join(room);
    this.log(`Client ${socket.id} joined room: ${room}`);
    
    socket.emit(SERVER_EVENTS.SYSTEM_STATUS, {
      joined: room,
      rooms: socket.rooms,
    });
    
    this.metrics.messagesSent++;
  }

  /**
   * Handle room leave
   */
  private handleLeaveRoom(socket: ExtendedSocket, room: string): void {
    this.metrics.messagesReceived++;
    
    socket.leave(room);
    this.log(`Client ${socket.id} left room: ${room}`);
    
    socket.emit(SERVER_EVENTS.SYSTEM_STATUS, {
      left: room,
      rooms: socket.rooms,
    });
    
    this.metrics.messagesSent++;
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(socket: ExtendedSocket, reason: string): void {
    this.metrics.connectedClients--;
    this.metrics.totalDisconnections++;
    
    this.log(`Client disconnected: ${socket.id} (Reason: ${reason})`);
    this.log(`Total connected clients: ${this.metrics.connectedClients}`);

    // Notify other clients
    this.io?.emit(SERVER_EVENTS.CLIENT_DISCONNECTED, {
      clientId: socket.id,
      username: socket.username,
      connectedClients: this.metrics.connectedClients,
      reason,
    });
  }

  /**
   * Handle errors
   */
  private handleError(socket: ExtendedSocket, error: Error): void {
    this.log(`Socket error for ${socket.id}: ${error.message}`);
  }

  /**
   * Get server metrics
   */
  public getMetrics(): ServerMetrics {
    return {
      ...this.metrics,
      connectionDuration: Date.now() - this.metrics.serverStartTime.getTime(),
    };
  }

  /**
   * Get IO instance
   */
  public getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Check if server is initialized
   */
  public isActive(): boolean {
    return this.isInitialized && this.io !== null;
  }

  /**
   * Broadcast to all clients
   */
  public broadcast(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
      this.metrics.messagesSent++;
    }
  }

  /**
   * Send to specific room
   */
  public toRoom(room: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(room).emit(event, data);
      this.metrics.messagesSent++;
    }
  }

  /**
   * Send to specific client
   */
  public toClient(socketId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(socketId).emit(event, data);
      this.metrics.messagesSent++;
    }
  }

  /**
   * Debug logging
   */
  private log(message: string): void {
    if (this.debugMode) {
      console.log(`[Socket Server] ${message}`);
    }
  }

  /**
   * Reset metrics (for testing)
   */
  public resetMetrics(): void {
    this.metrics = {
      connectedClients: 0,
      serverStartTime: new Date(),
      messagesSent: 0,
      messagesReceived: 0,
      totalConnections: 0,
      totalDisconnections: 0,
      connectionDuration: 0,
    };
  }

  /**
   * Vehicle event broadcasts
   */
  public broadcastVehicleCreated(vehicle: any): void {
    this.broadcast(SERVER_EVENTS.VEHICLE_CREATED, vehicle);
    this.log(`Vehicle created: ${vehicle.vehicleNumber || vehicle._id}`);
  }

  public broadcastVehicleUpdated(vehicle: any): void {
    this.broadcast(SERVER_EVENTS.VEHICLE_UPDATED, vehicle);
    this.log(`Vehicle updated: ${vehicle.vehicleNumber || vehicle._id}`);
  }

  public broadcastVehicleDeleted(vehicleId: string): void {
    this.broadcast(SERVER_EVENTS.VEHICLE_DELETED, { id: vehicleId });
    this.log(`Vehicle deleted: ${vehicleId}`);
  }

  public broadcastVehicleMoved(vehicle: any): void {
    this.broadcast(SERVER_EVENTS.VEHICLE_MOVED, vehicle);
    if (this.debugMode) {
      this.log(`Vehicle moved: ${vehicle.vehicleNumber} to [${vehicle.latitude}, ${vehicle.longitude}]`);
    }
  }

  public broadcastVehicleStatus(vehicle: any): void {
    this.broadcast(SERVER_EVENTS.VEHICLE_STATUS, vehicle);
    this.log(`Vehicle status changed: ${vehicle.vehicleNumber} -> ${vehicle.status}`);
  }

  public broadcastVehicleLocation(vehicle: any): void {
    this.broadcast(SERVER_EVENTS.VEHICLE_LOCATION, vehicle);
    if (this.debugMode) {
      this.log(`Vehicle location: ${vehicle.vehicleNumber} at [${vehicle.latitude}, ${vehicle.longitude}]`);
    }
  }

  /**
   * Prediction event broadcasts
   */
  public broadcastPredictionGenerated(prediction: any): void {
    this.broadcast(SERVER_EVENTS.PREDICTION_GENERATED, prediction);
    this.broadcast(SERVER_EVENTS.PREDICTION_UPDATED, prediction);
    this.broadcast(SERVER_EVENTS.DASHBOARD_UPDATE, { type: 'prediction', data: prediction });
    this.log(`Prediction generated: ${prediction.stationName} - ${prediction.predictedCrowd}%`);
  }

  public broadcastPredictionUpdated(prediction: any): void {
    this.broadcast(SERVER_EVENTS.PREDICTION_UPDATED, prediction);
    this.broadcast(SERVER_EVENTS.DASHBOARD_UPDATE, { type: 'prediction', data: prediction });
    this.log(`Prediction updated: ${prediction.stationName}`);
  }

  public broadcastPredictionDeleted(predictionId: string, stationId: string): void {
    this.broadcast(SERVER_EVENTS.PREDICTION_DELETED, { id: predictionId, stationId });
    this.broadcast(SERVER_EVENTS.DASHBOARD_UPDATE, { type: 'prediction_deleted', data: { id: predictionId, stationId } });
    this.log(`Prediction deleted: ${predictionId}`);
  }

  public broadcastPredictionTrend(stationId: string, stationName: string, trend: string, confidence: number): void {
    this.broadcast(SERVER_EVENTS.PREDICTION_TREND, {
      stationId,
      stationName,
      trend,
      confidence,
      timestamp: new Date(),
    });
    this.log(`Prediction trend: ${stationName} - ${trend}`);
  }

  public broadcastPredictionConfidence(stationId: string, stationName: string, confidence: number, risk: string): void {
    this.broadcast(SERVER_EVENTS.PREDICTION_CONFIDENCE, {
      stationId,
      stationName,
      confidence,
      risk,
      timestamp: new Date(),
    });
    this.log(`Prediction confidence: ${stationName} - ${confidence}% (${risk})`);
  }

  public broadcastPredictionAnomaly(stationId: string, stationName: string, anomaly: any): void {
    this.broadcast(SERVER_EVENTS.PREDICTION_ANOMALY, {
      stationId,
      stationName,
      anomaly,
      timestamp: new Date(),
    });
    this.broadcast(SERVER_EVENTS.PREDICTION_ALERT, {
      stationId,
      stationName,
      type: 'ANOMALY_DETECTED',
      message: anomaly.message,
      severity: anomaly.severity,
      timestamp: new Date(),
    });
    this.broadcast(SERVER_EVENTS.ALERT_NEW, {
      type: anomaly.severity,
      stationId,
      stationName,
      message: anomaly.message,
      timestamp: new Date(),
    });
    this.log(`Prediction anomaly: ${stationName} - ${anomaly.message}`);
  }

  public broadcastPredictionAlert(stationId: string, stationName: string, alert: any): void {
    this.broadcast(SERVER_EVENTS.PREDICTION_ALERT, {
      stationId,
      stationName,
      ...alert,
    });
    this.broadcast(SERVER_EVENTS.ALERT_NEW, {
      type: alert.severity,
      stationId,
      stationName,
      message: alert.message,
      timestamp: new Date(),
    });
    this.log(`Prediction alert: ${stationName} - ${alert.message}`);
  }

  public broadcastPredictionInsight(stationId: string, stationName: string, insight: any): void {
    this.broadcast(SERVER_EVENTS.PREDICTION_INSIGHT, {
      stationId,
      stationName,
      insight,
      timestamp: new Date(),
    });
    this.log(`Prediction insight: ${stationName} - ${insight.insight}`);
  }

  public broadcastTimelineEvent(event: any): void {
    this.broadcast(SERVER_EVENTS.TIMELINE_UPDATE, event);
    if (this.debugMode) {
      this.log(`Timeline event: ${event.type}`);
    }
  }
}

// Export singleton instance
export const socketServer = SocketServer.getInstance();

// Export class for testing
export { SocketServer };
