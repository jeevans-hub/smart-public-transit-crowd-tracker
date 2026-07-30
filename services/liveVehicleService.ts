import LiveVehicle from '@/models/LiveVehicle';
import { ILiveVehicleDocument, ILiveVehicleResponse, ILiveVehicleStatistics, ILiveVehicleFilters, ILiveVehicleSort } from '@/types/vehicle';
import { determineVehicleStatus } from '@/utils/vehicleStatus';

export async function createLiveVehicle(data: {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  route: string;
  driverName?: string;
  currentStation?: string;
  nextStation?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  capacity: number;
  currentPassengers?: number;
}): Promise<ILiveVehicleDocument> {
  const status = determineVehicleStatus(data.speed || 0, new Date());
  
  const vehicle = new LiveVehicle({
    ...data,
    speed: data.speed || 0,
    heading: data.heading || 0,
    currentPassengers: data.currentPassengers || 0,
    status,
    lastUpdated: new Date(),
  });
  
  await vehicle.save();
  return vehicle;
}

export async function getLiveVehicleById(id: string): Promise<ILiveVehicleDocument | null> {
  return LiveVehicle.findById(id);
}

export async function getLiveVehicleByVehicleId(vehicleId: string): Promise<ILiveVehicleDocument | null> {
  return LiveVehicle.findOne({ vehicleId });
}

export async function getAllLiveVehicles(filters?: ILiveVehicleFilters, sort?: ILiveVehicleSort, page: number = 1, limit: number = 50): Promise<{
  vehicles: ILiveVehicleDocument[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const query: any = {};
  
  if (filters?.status) {
    query.status = filters.status;
  }
  
  if (filters?.route) {
    query.route = filters.route;
  }
  
  if (filters?.vehicleType) {
    query.vehicleType = filters.vehicleType;
  }
  
  if (filters?.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query.$or = [
      { vehicleNumber: searchRegex },
      { driverName: searchRegex },
      { route: searchRegex },
      { currentStation: searchRegex },
    ];
  }
  
  const skip = (page - 1) * limit;
  
  let sortQuery: any = { lastUpdated: -1 };
  if (sort) {
    sortQuery = { [sort.field]: sort.order === 'asc' ? 1 : -1 };
  }
  
  const [vehicles, total] = await Promise.all([
    LiveVehicle.find(query).sort(sortQuery).skip(skip).limit(limit),
    LiveVehicle.countDocuments(query),
  ]);
  
  return {
    vehicles,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateLiveVehicle(id: string, data: {
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  currentPassengers?: number;
  currentStation?: string;
  nextStation?: string;
  status?: 'MOVING' | 'STOPPED' | 'DELAYED' | 'OFFLINE';
}): Promise<ILiveVehicleDocument | null> {
  const vehicle = await LiveVehicle.findById(id);
  if (!vehicle) {
    return null;
  }
  
  if (data.latitude !== undefined) vehicle.latitude = data.latitude;
  if (data.longitude !== undefined) vehicle.longitude = data.longitude;
  if (data.speed !== undefined) vehicle.speed = data.speed;
  if (data.heading !== undefined) vehicle.heading = data.heading;
  if (data.currentPassengers !== undefined) vehicle.currentPassengers = data.currentPassengers;
  if (data.currentStation !== undefined) vehicle.currentStation = data.currentStation;
  if (data.nextStation !== undefined) vehicle.nextStation = data.nextStation;
  
  if (data.status) {
    vehicle.status = data.status;
  } else {
    vehicle.status = determineVehicleStatus(vehicle.speed, vehicle.lastUpdated);
  }
  
  vehicle.lastUpdated = new Date();
  
  await vehicle.save();
  return vehicle;
}

export async function updateLiveVehicleLocation(vehicleId: string, data: {
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
}): Promise<ILiveVehicleDocument | null> {
  const vehicle = await LiveVehicle.findOne({ vehicleId });
  if (!vehicle) {
    return null;
  }
  
  vehicle.latitude = data.latitude;
  vehicle.longitude = data.longitude;
  vehicle.speed = data.speed;
  if (data.heading !== undefined) vehicle.heading = data.heading;
  vehicle.status = determineVehicleStatus(data.speed, vehicle.lastUpdated);
  vehicle.lastUpdated = new Date();
  
  await vehicle.save();
  return vehicle;
}

export async function deleteLiveVehicle(id: string): Promise<ILiveVehicleDocument | null> {
  return LiveVehicle.findByIdAndDelete(id);
}

export async function getLiveVehicleStatistics(): Promise<ILiveVehicleStatistics> {
  const vehicles = await LiveVehicle.find({});
  
  const totalVehicles = vehicles.length;
  const movingVehicles = vehicles.filter(v => v.status === 'MOVING').length;
  const stoppedVehicles = vehicles.filter(v => v.status === 'STOPPED').length;
  const delayedVehicles = vehicles.filter(v => v.status === 'DELAYED').length;
  const offlineVehicles = vehicles.filter(v => v.status === 'OFFLINE').length;
  
  const averageSpeed = vehicles.length > 0
    ? vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicles.length
    : 0;
  
  const averageOccupancy = vehicles.length > 0
    ? vehicles.reduce((sum, v) => sum + (v.currentPassengers / v.capacity) * 100, 0) / vehicles.length
    : 0;
  
  return {
    totalVehicles,
    movingVehicles,
    stoppedVehicles,
    delayedVehicles,
    offlineVehicles,
    averageSpeed,
    averageOccupancy,
  };
}

export function toLiveVehicleResponse(vehicle: ILiveVehicleDocument): ILiveVehicleResponse {
  return {
    _id: vehicle._id.toString(),
    vehicleId: vehicle.vehicleId,
    vehicleNumber: vehicle.vehicleNumber,
    vehicleType: vehicle.vehicleType,
    route: vehicle.route,
    driverName: vehicle.driverName,
    currentStation: vehicle.currentStation,
    nextStation: vehicle.nextStation,
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    speed: vehicle.speed,
    heading: vehicle.heading,
    capacity: vehicle.capacity,
    currentPassengers: vehicle.currentPassengers,
    status: vehicle.status,
    lastUpdated: vehicle.lastUpdated,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}

export async function simulateVehicleMovement(): Promise<void> {
  const vehicles = await LiveVehicle.find({ status: { $ne: 'OFFLINE' } });
  
  for (const vehicle of vehicles) {
    const movement = (Math.random() - 0.5) * 0.001; // Small random movement
    vehicle.latitude += movement;
    vehicle.longitude += movement;
    vehicle.speed = Math.max(0, vehicle.speed + (Math.random() - 0.5) * 5);
    vehicle.heading = (vehicle.heading + (Math.random() - 0.5) * 10 + 360) % 360;
    vehicle.currentPassengers = Math.max(0, Math.min(vehicle.capacity, vehicle.currentPassengers + Math.floor((Math.random() - 0.5) * 5)));
    vehicle.status = determineVehicleStatus(vehicle.speed, vehicle.lastUpdated);
    vehicle.lastUpdated = new Date();
    
    await vehicle.save();
  }
}
