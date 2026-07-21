export type VehicleStatus = 'ACTIVE' | 'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE';

export interface Vehicle {
  _id?: string;
  agencyId: string;
  routeId: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  currentPassengers: number;
  driverName?: string;
  gpsEnabled: boolean;
  status: VehicleStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateVehicleDTO {
  agencyId: string;
  routeId: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  currentPassengers?: number;
  driverName?: string;
  gpsEnabled?: boolean;
  status?: VehicleStatus;
}

export interface UpdateVehicleDTO {
  agencyId?: string;
  routeId?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  capacity?: number;
  currentPassengers?: number;
  driverName?: string;
  gpsEnabled?: boolean;
  status?: VehicleStatus;
}

export interface VehicleResponse {
  success: boolean;
  data?: Vehicle;
  error?: string;
}

export interface VehiclesResponse {
  success: boolean;
  data?: Vehicle[];
  error?: string;
}
