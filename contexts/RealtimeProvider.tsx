'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { socketService } from '@/services/socketService';
import { SocketStats, ServerInfo, ConnectionState } from '@/types/socket';
import { useAuth } from '@/hooks/useAuth';
import { SERVER_EVENTS } from '@/utils/eventNames';

interface RealtimeContextType {
  socket: any;
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  latency: number;
  connectionDuration: number;
  reconnectAttempts: number;
  queuedEvents: number;
  serverInfo: ServerInfo | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  subscribe: (event: string, callback: (...args: any[]) => void) => () => void;
  unsubscribe: (event: string, callback?: (...args: any[]) => void) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export function RealtimeProvider({ children, autoConnect = true }: RealtimeProviderProps) {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<SocketStats>(socketService.getStats());
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [mounted, setMounted] = useState(false);

  // Update stats periodically
  const updateStats = useCallback(() => {
    setStats(socketService.getStats());
  }, []);

  // Connect to socket server
  const connect = useCallback(async () => {
    if (currentUser) {
      try {
        const response = await fetch('/api/auth/token');
        const data = await response.json();
        if (data.success && data.token) {
          socketService.connect(data.token);
          return Promise.resolve();
        } else {
          return Promise.reject(new Error('Failed to get token'));
        }
      } catch (error) {
        return Promise.reject(error);
      }
    } else {
      return Promise.resolve();
    }
  }, [currentUser]);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  // Emit event
  const emit = useCallback((event: string, data: any) => {
    socketService.emit(event, data);
  }, []);

  // Subscribe to event
  const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
    return socketService.subscribe(event, callback);
  }, []);

  // Unsubscribe from event
  const unsubscribe = useCallback((event: string, callback?: (...args: any[]) => void) => {
    socketService.unsubscribe(event, callback);
  }, []);

  // Join room
  const joinRoom = useCallback((room: string) => {
    socketService.joinRoom(room);
  }, []);

  // Leave room
  const leaveRoom = useCallback((room: string) => {
    socketService.leaveRoom(room);
  }, []);

  // Set up system status listener
  useEffect(() => {
    const unsubscribe = socketService.subscribe(SERVER_EVENTS.SYSTEM_STATUS, (data: ServerInfo) => {
      setServerInfo(data);
    });

    return () => unsubscribe();
  }, []);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }
    
    if (autoConnect && currentUser) {
      connect();
    } else if (!currentUser) {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [currentUser, autoConnect, connect, disconnect, mounted]);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(updateStats, 2000); // Reduced to every 2 seconds

    return () => clearInterval(interval);
  }, [updateStats]);

  const value: RealtimeContextType = {
    socket: socketService.getSocket(),
    connectionState: stats.connectionState,
    isConnected: stats.isConnected,
    isConnecting: stats.isConnecting,
    latency: stats.latency,
    connectionDuration: stats.connectionDuration,
    reconnectAttempts: stats.reconnectAttempts,
    queuedEvents: stats.queuedEvents,
    serverInfo,
    connect,
    disconnect,
    emit,
    subscribe,
    unsubscribe,
    joinRoom,
    leaveRoom,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextType {
  const context = useContext(RealtimeContext);
  
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  
  return context;
}
