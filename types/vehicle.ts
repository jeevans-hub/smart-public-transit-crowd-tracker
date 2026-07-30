import { Document } from 'mongoose';

export type VehicleStatus = 'ACTIVE' | 'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE';
export type LiveVehicleStatus = 'MOVING' | 'STOPPED' | 'DELAYED' | 'OFFLINE';

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

export interface ILiveVehicle {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  route: string;
  driverName?: string;
  currentStation?: string;
  nextStation?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  capacity: number;
  currentPassengers: number;
  status: LiveVehicleStatus;
  lastUpdated: Date;
}

export interface ILiveVehicleDocument extends ILiveVehicle, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ILiveVehicleResponse {
  _id: string;
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  route: string;
  driverName?: string;
  currentStation?: string;
  nextStation?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  capacity: number;
  currentPassengers: number;
  status: LiveVehicleStatus;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILiveVehicleStatistics {
  totalVehicles: number;
  movingVehicles: number;
  stoppedVehicles: number;
  delayedVehicles: number;
  offlineVehicles: number;
  averageSpeed: number;
  averageOccupancy: number;
}

export interface ILiveVehicleFilters {
  status?: LiveVehicleStatus;
  route?: string;
  vehicleType?: string;
  search?: string;
}

export interface ILiveVehicleSort {
  field: 'vehicleNumber' | 'speed' | 'currentPassengers' | 'lastUpdated';
  order: 'asc' | 'desc';
}
