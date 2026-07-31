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
      // Get JWT token from API endpoint (cookie is httpOnly, so we need server to return it)
      try {
        console.log('[RealtimeProvider] Attempting to get token for socket connection...');
        const response = await fetch('/api/auth/token');
        const data = await response.json();
        console.log('[RealtimeProvider] Token response:', data);
        if (data.success && data.token) {
          console.log('[RealtimeProvider] Token received, connecting to socket...');
          socketService.connect(data.token);
        } else {
          console.error('[RealtimeProvider] Failed to get token:', data);
        }
      } catch (error) {
        console.error('[RealtimeProvider] Failed to get token for socket connection:', error);
      }
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

    console.log('[RealtimeProvider] Auto-connect check - autoConnect:', autoConnect, 'currentUser:', !!currentUser);
    
    if (autoConnect && currentUser) {
      console.log('[RealtimeProvider] Calling connect()...');
      connect();
    } else if (!currentUser) {
      console.log('[RealtimeProvider] No user, disconnecting...');
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [currentUser, autoConnect, connect, disconnect, mounted]);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(updateStats, 1000); // Update every second

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
