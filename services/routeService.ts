import Route, { IRoute } from '../models/Route';
import { CreateRouteDTO, UpdateRouteDTO, TransportType } from '../types/route';

export const routeService = {
  async create(data: CreateRouteDTO): Promise<IRoute> {
    if (!data.agencyId || !data.routeNumber || !data.routeName || 
        !data.transportType || !data.originStation || !data.destinationStation) {
      throw new Error('Missing required fields: agencyId, routeNumber, routeName, transportType, originStation, destinationStation');
    }

    if (!['BUS', 'METRO', 'TRAIN'].includes(data.transportType)) {
      throw new Error('Invalid transport type. Must be BUS, METRO, or TRAIN');
    }

    const route = new Route({
      agencyId: data.agencyId,
      routeNumber: data.routeNumber,
      routeName: data.routeName,
      transportType: data.transportType as TransportType,
      originStation: data.originStation,
      destinationStation: data.destinationStation,
      stops: data.stops || [],
      estimatedDuration: data.estimatedDuration,
      distance: data.distance,
      active: data.active !== undefined ? data.active : true,
    });

    return await route.save();
  },

  async getAll(): Promise<IRoute[]> {
    return await Route.find({}).sort({ routeNumber: 1 });
  },

  async getByAgencyId(agencyId: string): Promise<IRoute[]> {
    return await Route.find({ agencyId }).sort({ routeNumber: 1 });
  },

  async getById(id: string): Promise<IRoute | null> {
    return await Route.findById(id);
  },

  async update(id: string, data: UpdateRouteDTO): Promise<IRoute | null> {
    const route = await Route.findById(id);
    if (!route) {
      throw new Error('Route not found');
    }

    if (data.agencyId !== undefined) route.agencyId = data.agencyId;
    if (data.routeNumber !== undefined) route.routeNumber = data.routeNumber;
    if (data.routeName !== undefined) route.routeName = data.routeName;
    if (data.transportType !== undefined) {
      if (!['BUS', 'METRO', 'TRAIN'].includes(data.transportType)) {
        throw new Error('Invalid transport type. Must be BUS, METRO, or TRAIN');
      }
      route.transportType = data.transportType as TransportType;
    }
    if (data.originStation !== undefined) route.originStation = data.originStation;
    if (data.destinationStation !== undefined) route.destinationStation = data.destinationStation;
    if (data.stops !== undefined) route.stops = data.stops;
    if (data.estimatedDuration !== undefined) route.estimatedDuration = data.estimatedDuration;
    if (data.distance !== undefined) route.distance = data.distance;
    if (data.active !== undefined) route.active = data.active;

    return await route.save();
  },

  async delete(id: string): Promise<boolean> {
    const result = await Route.findByIdAndDelete(id);
    return !!result;
  },
};
