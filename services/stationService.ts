import Station, { IStation } from '../models/Station';
import { CreateStationDTO, UpdateStationDTO } from '../types/station';

export const stationService = {
  async create(data: CreateStationDTO): Promise<IStation> {
    if (!data.agencyId || !data.stationName || !data.stationCode || 
        !data.latitude || !data.longitude || !data.address) {
      throw new Error('Missing required fields: agencyId, stationName, stationCode, latitude, longitude, address');
    }

    if (data.latitude < -90 || data.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (data.longitude < -180 || data.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    const station = new Station({
      agencyId: data.agencyId,
      stationName: data.stationName,
      stationCode: data.stationCode,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      zone: data.zone,
      platformCount: data.platformCount,
      facilities: data.facilities || [],
      active: data.active !== undefined ? data.active : true,
    });

    return await station.save();
  },

  async getAll(): Promise<IStation[]> {
    return await Station.find({}).sort({ stationName: 1 });
  },

  async getByAgencyId(agencyId: string): Promise<IStation[]> {
    return await Station.find({ agencyId }).sort({ stationName: 1 });
  },

  async getById(id: string): Promise<IStation | null> {
    return await Station.findById(id);
  },

  async update(id: string, data: UpdateStationDTO): Promise<IStation | null> {
    const station = await Station.findById(id);
    if (!station) {
      throw new Error('Station not found');
    }

    if (data.agencyId !== undefined) station.agencyId = data.agencyId;
    if (data.stationName !== undefined) station.stationName = data.stationName;
    if (data.stationCode !== undefined) station.stationCode = data.stationCode;
    if (data.latitude !== undefined) {
      if (data.latitude < -90 || data.latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
      station.latitude = data.latitude;
    }
    if (data.longitude !== undefined) {
      if (data.longitude < -180 || data.longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
      station.longitude = data.longitude;
    }
    if (data.address !== undefined) station.address = data.address;
    if (data.zone !== undefined) station.zone = data.zone;
    if (data.platformCount !== undefined) station.platformCount = data.platformCount;
    if (data.facilities !== undefined) station.facilities = data.facilities;
    if (data.active !== undefined) station.active = data.active;

    return await station.save();
  },

  async delete(id: string): Promise<boolean> {
    const result = await Station.findByIdAndDelete(id);
    return !!result;
  },
};
