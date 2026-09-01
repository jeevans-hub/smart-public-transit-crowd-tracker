/** Socket events retained by the BMTC-focused Version 1.0 application. */
export const SERVER_EVENTS = {
  ALERT_NEW: 'alert:new',
  SYSTEM_STATUS: 'system:status',
  CLIENT_CONNECTED: 'client:connected',
  CLIENT_DISCONNECTED: 'client:disconnected',
  PONG: 'pong',
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

export const CLIENT_EVENTS = {
  AUTHENTICATE: 'authenticate',
  PING: 'ping',
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
} as const;

export const ROOMS = {
  ALERTS: 'alerts',
  ADMIN: 'admin',
} as const;

export const ERROR_EVENTS = {
  AUTHENTICATION_FAILED: 'error:authentication',
  CONNECTION_ERROR: 'error:connection',
  ROOM_ERROR: 'error:room',
} as const;

export type ServerEventName = typeof SERVER_EVENTS[keyof typeof SERVER_EVENTS];
export type ClientEventName = typeof CLIENT_EVENTS[keyof typeof CLIENT_EVENTS];
export type RoomName = typeof ROOMS[keyof typeof ROOMS];
export type ErrorEventName = typeof ERROR_EVENTS[keyof typeof ERROR_EVENTS];
