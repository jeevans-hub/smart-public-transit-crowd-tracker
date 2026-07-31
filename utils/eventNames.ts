/**
 * Socket.IO Event Names
 * 
 * Centralized event name constants for type safety and consistency.
 * These events will be used in future phases for real-time updates.
 */

// Server to Client Events
export const SERVER_EVENTS = {
  // Crowd monitoring events
  CROWD_CREATED: 'crowd:created',
  CROWD_UPDATED: 'crowd:updated',
  CROWD_DELETED: 'crowd:deleted',
  CROWD_UPDATE: 'crowd:update',
  CROWD_ALERT: 'crowd:alert',
  
  // Vehicle tracking events
  VEHICLE_CREATED: 'vehicle:created',
  VEHICLE_UPDATED: 'vehicle:updated',
  VEHICLE_DELETED: 'vehicle:deleted',
  VEHICLE_MOVED: 'vehicle:moved',
  VEHICLE_STATUS: 'vehicle:status',
  VEHICLE_LOCATION: 'vehicle:location',
  
  // Prediction events
  PREDICTION_GENERATED: 'prediction:generated',
  PREDICTION_UPDATED: 'prediction:updated',
  PREDICTION_DELETED: 'prediction:deleted',
  PREDICTION_TREND: 'prediction:trend',
  PREDICTION_CONFIDENCE: 'prediction:confidence',
  PREDICTION_ANOMALY: 'prediction:anomaly',
  PREDICTION_ALERT: 'prediction:alert',
  PREDICTION_INSIGHT: 'prediction:insight',
  
  // Alert events
  ALERT_NEW: 'alert:new',
  ALERT_DISMISS: 'alert:dismiss',
  
  // Dashboard events
  DASHBOARD_UPDATE: 'dashboard:update',
  DASHBOARD_STATS: 'dashboard:stats',
  
  // Timeline events
  TIMELINE_UPDATE: 'timeline:update',
  
  // System events
  SYSTEM_STATUS: 'system:status',
  SYSTEM_ANNOUNCEMENT: 'system:announcement',
  
  // Connection events
  CLIENT_CONNECTED: 'client:connected',
  CLIENT_DISCONNECTED: 'client:disconnected',
  
  // Heartbeat
  HEARTBEAT: 'heartbeat',
  PONG: 'pong',
} as const;

// Client to Server Events
export const CLIENT_EVENTS = {
  // Authentication
  AUTHENTICATE: 'authenticate',
  
  // Subscriptions
  SUBSCRIBE_CROWD: 'subscribe:crowd',
  UNSUBSCRIBE_CROWD: 'unsubscribe:crowd',
  SUBSCRIBE_VEHICLE: 'subscribe:vehicle',
  UNSUBSCRIBE_VEHICLE: 'unsubscribe:vehicle',
  SUBSCRIBE_PREDICTION: 'subscribe:prediction',
  UNSUBSCRIBE_PREDICTION: 'unsubscribe:prediction',
  SUBSCRIBE_DASHBOARD: 'subscribe:dashboard',
  UNSUBSCRIBE_DASHBOARD: 'unsubscribe:dashboard',
  
  // Heartbeat
  PING: 'ping',
  
  // Connection
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
} as const;

// Room Names
export const ROOMS = {
  CROWD_UPDATES: 'crowd:updates',
  VEHICLE_UPDATES: 'vehicle:updates',
  PREDICTION_UPDATES: 'prediction:updates',
  DASHBOARD_UPDATES: 'dashboard:updates',
  ALERTS: 'alerts',
  ADMIN: 'admin',
} as const;

// Error Events
export const ERROR_EVENTS = {
  AUTHENTICATION_FAILED: 'error:authentication',
  CONNECTION_ERROR: 'error:connection',
  SUBSCRIPTION_ERROR: 'error:subscription',
  ROOM_ERROR: 'error:room',
} as const;

// Type-safe event names union
export type ServerEventName = typeof SERVER_EVENTS[keyof typeof SERVER_EVENTS];
export type ClientEventName = typeof CLIENT_EVENTS[keyof typeof CLIENT_EVENTS];
export type RoomName = typeof ROOMS[keyof typeof ROOMS];
export type ErrorEventName = typeof ERROR_EVENTS[keyof typeof ERROR_EVENTS];
