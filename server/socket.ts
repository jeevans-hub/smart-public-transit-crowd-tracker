import { Server as HTTPServer } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Server as SocketIOServer, Socket } from 'socket.io';

import { env } from '@/lib/env';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@/utils/eventNames';

type ExtendedSocket = Socket & {
  userId?: string;
  username?: string;
  connectedAt?: number;
};

interface SocketServerConfig {
  cors?: { origin: string | string[]; credentials?: boolean };
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

function getIdentity(decoded: string | JwtPayload): { userId?: string; username?: string } {
  if (typeof decoded === 'string') return {};
  return {
    userId: typeof decoded.userId === 'string' ? decoded.userId : undefined,
    username: typeof decoded.username === 'string' ? decoded.username : undefined,
  };
}

class SocketServer {
  private static instance: SocketServer;
  private io: SocketIOServer | null = null;
  private initialized = false;
  private metrics: ServerMetrics = this.createMetrics();

  private createMetrics(): ServerMetrics {
    return {
      connectedClients: 0,
      serverStartTime: new Date(),
      messagesSent: 0,
      messagesReceived: 0,
      totalConnections: 0,
      totalDisconnections: 0,
      connectionDuration: 0,
    };
  }

  static getInstance(): SocketServer {
    if (!SocketServer.instance) SocketServer.instance = new SocketServer();
    return SocketServer.instance;
  }

  initialize(httpServer: HTTPServer, config: SocketServerConfig = {}): void {
    if (this.initialized) return;
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      path: '/socket.io',
      ...config,
    });

    this.io.use((socket: ExtendedSocket, next) => {
      try {
        const suppliedToken = socket.handshake.auth.token;
        const token = typeof suppliedToken === 'string'
          ? suppliedToken
          : socket.handshake.headers.authorization?.replace('Bearer ', '');
        if (!token) return next(new Error('Authentication failed: No token provided'));

        const identity = getIdentity(jwt.verify(token, env.JWT_SECRET));
        if (!identity.userId) return next(new Error('Authentication failed: Invalid token'));
        socket.userId = identity.userId;
        socket.username = identity.username || `User-${identity.userId.slice(0, 8)}`;
        next();
      } catch {
        next(new Error('Authentication failed: Invalid token'));
      }
    });

    this.io.on('connection', (socket: ExtendedSocket) => this.handleConnection(socket));
    this.initialized = true;
  }

  private handleConnection(socket: ExtendedSocket): void {
    socket.connectedAt = Date.now();
    this.metrics.connectedClients += 1;
    this.metrics.totalConnections += 1;

    socket.emit(SERVER_EVENTS.SYSTEM_STATUS, this.getMetrics());
    this.io?.emit(SERVER_EVENTS.CLIENT_CONNECTED, {
      clientId: socket.id,
      username: socket.username,
      connectedClients: this.metrics.connectedClients,
    });

    socket.on(CLIENT_EVENTS.PING, (data: unknown) => {
      this.metrics.messagesReceived += 1;
      socket.emit(SERVER_EVENTS.PONG, { received: data, timestamp: Date.now() });
      this.metrics.messagesSent += 1;
    });
    socket.on(CLIENT_EVENTS.AUTHENTICATE, () => {
      socket.emit(SERVER_EVENTS.SYSTEM_STATUS, this.getMetrics());
    });
    socket.on(CLIENT_EVENTS.JOIN_ROOM, (room: string) => {
      if (typeof room === 'string' && room.length <= 100) socket.join(room);
    });
    socket.on(CLIENT_EVENTS.LEAVE_ROOM, (room: string) => {
      if (typeof room === 'string') socket.leave(room);
    });
    socket.on('disconnect', () => {
      this.metrics.connectedClients = Math.max(0, this.metrics.connectedClients - 1);
      this.metrics.totalDisconnections += 1;
      if (socket.connectedAt) this.metrics.connectionDuration += Date.now() - socket.connectedAt;
      this.io?.emit(SERVER_EVENTS.CLIENT_DISCONNECTED, {
        clientId: socket.id,
        connectedClients: this.metrics.connectedClients,
      });
    });
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }

  isActive(): boolean {
    return this.initialized && this.io !== null;
  }

  getMetrics(): ServerMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    const connectedClients = this.metrics.connectedClients;
    this.metrics = this.createMetrics();
    this.metrics.connectedClients = connectedClients;
  }

  broadcast(event: string, data: unknown): void {
    if (!this.io) return;
    this.io.emit(event, data);
    this.metrics.messagesSent += 1;
  }

  toRoom(room: string, event: string, data: unknown): void {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
    this.metrics.messagesSent += 1;
  }

  toClient(clientId: string, event: string, data: unknown): void {
    this.toRoom(clientId, event, data);
  }

  broadcastBmtcCrowdUpdate(data: unknown): void {
    this.broadcast(SERVER_EVENTS.BMTC_CROWD_UPDATE, data);
  }

  broadcastBmtcRecommendationUpdate(data: unknown): void {
    this.broadcast(SERVER_EVENTS.BMTC_RECOMMENDATION_UPDATE, data);
  }

  broadcastBmtcRushUpdate(data: unknown): void {
    this.broadcast(SERVER_EVENTS.BMTC_RUSH_UPDATE, data);
  }

  broadcastBmtcAlert(data: unknown): void {
    this.broadcast(SERVER_EVENTS.BMTC_ALERT, data);
  }

  broadcastBmtcProviderStatus(data: unknown): void {
    this.broadcast(SERVER_EVENTS.BMTC_PROVIDER_STATUS, data);
  }
}

export const socketServer = SocketServer.getInstance();
export { SocketServer };
