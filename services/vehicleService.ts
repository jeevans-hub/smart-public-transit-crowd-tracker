import Vehicle, { IVehicle } from '../models/Vehicle';
import { CreateVehicleDTO, UpdateVehicleDTO, VehicleStatus } from '../types/vehicle';

export const vehicleService = {
  async create(data: CreateVehicleDTO): Promise<IVehicle> {
    if (!data.agencyId || !data.routeId || !data.vehicleNumber || 
        !data.vehicleType || !data.capacity) {
      throw new Error('Missing required fields: agencyId, routeId, vehicleNumber, vehicleType, capacity');
    }

    if (data.capacity < 1) {
      throw new Error('Capacity must be at least 1');
    }

    const vehicle = new Vehicle({
      agencyId: data.agencyId,
      routeId: data.routeId,
      vehicleNumber: data.vehicleNumber,
      vehicleType: data.vehicleType,
      capacity: data.capacity,
      currentPassengers: data.currentPassengers || 0,
      driverName: data.driverName,
      gpsEnabled: data.gpsEnabled !== undefined ? data.gpsEnabled : false,
      status: data.status || 'ACTIVE',
    });

    return await vehicle.save();
  },

  async getAll(): Promise<IVehicle[]> {
    return await Vehicle.find({}).sort({ vehicleNumber: 1 });
  },

  async getByAgencyId(agencyId: string): Promise<IVehicle[]> {
    return await Vehicle.find({ agencyId }).sort({ vehicleNumber: 1 });
  },

  async getByRouteId(routeId: string): Promise<IVehicle[]> {
    return await Vehicle.find({ routeId }).sort({ vehicleNumber: 1 });
  },

  async getById(id: string): Promise<IVehicle | null> {
    return await Vehicle.findById(id);
  },

  async update(id: string, data: UpdateVehicleDTO): Promise<IVehicle | null> {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    if (data.agencyId !== undefined) vehicle.agencyId = data.agencyId;
    if (data.routeId !== undefined) vehicle.routeId = data.routeId;
    if (data.vehicleNumber !== undefined) vehicle.vehicleNumber = data.vehicleNumber;
    if (data.vehicleType !== undefined) vehicle.vehicleType = data.vehicleType;
    if (data.capacity !== undefined) {
      if (data.capacity < 1) {
        throw new Error('Capacity must be at least 1');
      }
      vehicle.capacity = data.capacity;
    }
    if (data.currentPassengers !== undefined) {
      if (data.currentPassengers < 0) {
        throw new Error('Current passengers cannot be negative');
      }
      vehicle.currentPassengers = data.currentPassengers;
    }
    if (data.driverName !== undefined) vehicle.driverName = data.driverName;
    if (data.gpsEnabled !== undefined) vehicle.gpsEnabled = data.gpsEnabled;
    if (data.status !== undefined) {
      if (!['ACTIVE', 'IN_SERVICE', 'MAINTENANCE', 'OFFLINE'].includes(data.status)) {
        throw new Error('Invalid status. Must be ACTIVE, IN_SERVICE, MAINTENANCE, or OFFLINE');
      }
      vehicle.status = data.status as VehicleStatus;
    }

    return await vehicle.save();
  },

  async delete(id: string): Promise<boolean> {
    const result = await Vehicle.findByIdAndDelete(id);
    return !!result;
  },
};
