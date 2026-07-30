import { Document } from 'mongoose';

export type CrowdLevel = 'EMPTY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL';
export type ReportSource = 'USER' | 'STAFF' | 'SYSTEM';

export interface ICrowdReport {
  vehicleId: string;
  routeId: string;
  stationId: string;
  reportedBy: string;
  crowdLevel: CrowdLevel;
  passengerCount: number;
  vehicleCapacity: number;
  occupancyPercentage: number;
  reportSource: ReportSource;
  verified: boolean;
}

export interface ICrowdReportDocument extends ICrowdReport, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ICrowdReportResponse {
  _id: string;
  vehicleId: string;
  routeId: string;
  stationId: string;
  reportedBy: string;
  crowdLevel: CrowdLevel;
  passengerCount: number;
  vehicleCapacity: number;
  occupancyPercentage: number;
  reportSource: ReportSource;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICrowdStatistics {
  vehiclesOnline: number;
  reportsToday: number;
  averageOccupancy: number;
  mostCrowdedVehicle: {
    vehicleId: string;
    routeId: string;
    occupancyPercentage: number;
  } | null;
  mostCrowdedRoute: {
    routeId: string;
    occupancyPercentage: number;
  } | null;
  mostCrowdedStation: {
    stationId: string;
    occupancyPercentage: number;
  } | null;
}

export interface IVehicleOccupancy {
  vehicleId: string;
  routeId: string;
  stationId: string;
  crowdLevel: CrowdLevel;
  passengerCount: number;
  vehicleCapacity: number;
  occupancyPercentage: number;
  reportedAt: Date;
  verified: boolean;
}

export interface IStationOccupancy {
  stationId: string;
  averageOccupancy: number;
  reportCount: number;
  latestReport: Date;
}

export interface IRouteOccupancy {
  routeId: string;
  averageOccupancy: number;
  reportCount: number;
  latestReport: Date;
}
