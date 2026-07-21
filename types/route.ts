export type TransportType = 'BUS' | 'METRO' | 'TRAIN';

export interface RouteStop {
  stationId: string;
  stationName: string;
  sequence: number;
  arrivalTime?: string;
  departureTime?: string;
}

export interface Route {
  _id?: string;
  agencyId: string;
  routeNumber: string;
  routeName: string;
  transportType: TransportType;
  originStation: string;
  destinationStation: string;
  stops: RouteStop[];
  estimatedDuration?: number;
  distance?: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateRouteDTO {
  agencyId: string;
  routeNumber: string;
  routeName: string;
  transportType: TransportType;
  originStation: string;
  destinationStation: string;
  stops: RouteStop[];
  estimatedDuration?: number;
  distance?: number;
  active?: boolean;
}

export interface UpdateRouteDTO {
  agencyId?: string;
  routeNumber?: string;
  routeName?: string;
  transportType?: TransportType;
  originStation?: string;
  destinationStation?: string;
  stops?: RouteStop[];
  estimatedDuration?: number;
  distance?: number;
  active?: boolean;
}

export interface RouteResponse {
  success: boolean;
  data?: Route;
  error?: string;
}

export interface RoutesResponse {
  success: boolean;
  data?: Route[];
  error?: string;
}
