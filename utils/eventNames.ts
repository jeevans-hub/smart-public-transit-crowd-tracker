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
  
  // Digital Twin events
  CITY_UPDATE: 'city:update',
  DIGITAL_TWIN_UPDATE: 'digitalTwin:update',
  SIMULATION_UPDATE: 'simulation:update',
  RESOURCE_UPDATE: 'resource:update',
  FLEET_UPDATE: 'fleet:update',
  SYSTEM_UPDATE: 'system:update',
  CONTROL_CENTER_UPDATE: 'controlcenter:update',
  CITY_HEALTH_UPDATE: 'cityHealth:update',
  NETWORK_GRAPH_UPDATE: 'networkGraph:update',
  RECOMMENDATION_UPDATE: 'recommendation:update',

  // BMTC provider events
  BMTC_VEHICLE_UPDATE: 'bmtc:vehicle:update',
  BMTC_VEHICLE_MOVED: 'bmtc:vehicle:moved',
  BMTC_ARRIVAL_UPDATE: 'bmtc:arrival:update',
  BMTC_CROWD_UPDATE: 'bmtc:crowd:update',
  BMTC_RECOMMENDATION_UPDATE: 'bmtc:recommendation:update',
  BMTC_RUSH_UPDATE: 'bmtc:rush:update',
  BMTC_ALERT: 'bmtc:alert',
  BMTC_SYSTEM_UPDATE: 'bmtc:system:update',
  BMTC_PROVIDER_STATUS: 'bmtc:provider:status',
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
  
  // Digital Twin subscriptions
  SUBSCRIBE_DIGITAL_TWIN: 'subscribe:digitalTwin',
  UNSUBSCRIBE_DIGITAL_TWIN: 'unsubscribe:digitalTwin',
  SUBSCRIBE_CITY: 'subscribe:city',
  UNSUBSCRIBE_CITY: 'unsubscribe:city',
  SUBSCRIBE_SIMULATION: 'subscribe:simulation',
  UNSUBSCRIBE_SIMULATION: 'unsubscribe:simulation',
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
