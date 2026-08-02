/**
 * Network Analyzer
 * 
 * Visualizes and analyzes the transit network including:
 * - Route Connectivity
 * - Station Connectivity
 * - Passenger Flow
 * - Congestion Nodes
 * - Critical Bottlenecks
 * - Vehicle Distribution
 * - Incident Clusters
 */

import Station from '@/models/Station';
import LiveVehicle from '@/models/LiveVehicle';
import Route from '@/models/Route';
import CrowdReport from '@/models/CrowdReport';
import PredictionHistory from '@/models/PredictionHistory';
import ControlCenter from '@/models/ControlCenter';
import { NetworkNode, NetworkEdge } from '@/types/digitalTwin';

/**
 * Network Analyzer
 * Builds and analyzes transit network graphs
 */
export class NetworkAnalyzer {
  /**
   * Build complete network graph for a city
   */
  public async buildNetworkGraph(cityId: string): Promise<NetworkNode[]> {
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];

    // Get all entities
    const [stations, vehicles, routes, controlCenters, crowdReports, predictions] = await Promise.all([
      Station.find({ active: true }),
      LiveVehicle.find(),
      Route.find({ active: true }),
      ControlCenter.find({ cityId, active: true }),
      CrowdReport.find().sort({ createdAt: -1 }).limit(1000),
      PredictionHistory.find().sort({ createdAt: -1 }).limit(1000),
    ]);

    // Create station nodes
    const stationNodes = this.createStationNodes(stations, crowdReports);
    nodes.push(...stationNodes);

    // Create vehicle nodes
    const vehicleNodes = this.createVehicleNodes(vehicles);
    nodes.push(...vehicleNodes);

    // Create route nodes
    const routeNodes = this.createRouteNodes(routes, crowdReports);
    nodes.push(...routeNodes);

    // Create control center nodes
    const controlCenterNodes = this.createControlCenterNodes(controlCenters);
    nodes.push(...controlCenterNodes);

    // Create edges (connections)
    const networkEdges = this.createNetworkEdges(stations, routes, vehicles, controlCenters);
    edges.push(...networkEdges);

    // Identify congestion nodes
    this.identifyCongestionNodes(nodes, crowdReports);

    // Identify bottlenecks
    this.identifyBottlenecks(nodes, edges, crowdReports);

    // Identify incident clusters
    this.identifyIncidentClusters(nodes, predictions);

    return nodes;
  }

  /**
   * Create station nodes
   */
  private createStationNodes(stations: any[], crowdReports: any[]): NetworkNode[] {
    return stations.map(station => {
      const stationReports = crowdReports.filter(r => r.stationId?.toString() === station._id.toString());
      const averageOccupancy = stationReports.length > 0
        ? stationReports.reduce((sum, r) => sum + r.occupancyLevel, 0) / stationReports.length
        : 0;
      const passengerFlow = stationReports.length > 0
        ? stationReports.reduce((sum, r) => sum + r.passengerCount, 0) / stationReports.length
        : 0;

      return {
        id: station._id.toString(),
        type: 'station',
        name: station.stationName,
        position: {
          x: station.longitude,
          y: station.latitude,
        },
        data: {
          occupancy: averageOccupancy,
          status: station.active ? 'active' : 'inactive',
          connections: 0, // Will be calculated from edges
          passengerFlow,
        },
      };
    });
  }

  /**
   * Create vehicle nodes
   */
  private createVehicleNodes(vehicles: any[]): NetworkNode[] {
    return vehicles.map(vehicle => ({
      id: vehicle._id.toString(),
      type: 'vehicle',
      name: vehicle.vehicleNumber,
      position: {
        x: vehicle.longitude,
        y: vehicle.latitude,
      },
      data: {
        occupancy: vehicle.occupancy || 0,
        status: vehicle.status,
        connections: 0,
      },
    }));
  }

  /**
   * Create route nodes
   */
  private createRouteNodes(routes: any[], crowdReports: any[]): NetworkNode[] {
    return routes.map(route => {
      const routeReports = crowdReports.filter(r => r.routeId?.toString() === route._id.toString());
      const averageOccupancy = routeReports.length > 0
        ? routeReports.reduce((sum, r) => sum + r.occupancyLevel, 0) / routeReports.length
        : 0;
      const passengerFlow = routeReports.length > 0
        ? routeReports.reduce((sum, r) => sum + r.passengerCount, 0) / routeReports.length
        : 0;

      return {
        id: route._id.toString(),
        type: 'route',
        name: route.routeName,
        position: {
          x: (route.stations?.[0]?.longitude || 0),
          y: (route.stations?.[0]?.latitude || 0),
        },
        data: {
          occupancy: averageOccupancy,
          status: route.active ? 'active' : 'inactive',
          connections: route.stations?.length || 0,
          passengerFlow,
        },
      };
    });
  }

  /**
   * Create control center nodes
   */
  private createControlCenterNodes(controlCenters: any[]): NetworkNode[] {
    return controlCenters.map(center => ({
      id: center._id.toString(),
      type: 'controlCenter',
      name: center.centerName,
      position: {
        x: center.longitude,
        y: center.latitude,
      },
      data: {
        status: center.active ? 'active' : 'inactive',
        connections: center.regionIds?.length || 0,
      },
    }));
  }

  /**
   * Create network edges
   */
  private createNetworkEdges(
    stations: any[],
    routes: any[],
    vehicles: any[],
    controlCenters: any[]
  ): NetworkEdge[] {
    const edges: NetworkEdge[] = [];

    // Station-route connections
    routes.forEach(route => {
      if (route.stations && Array.isArray(route.stations)) {
        route.stations.forEach((station: any, index: number) => {
          if (index < route.stations.length - 1) {
            const nextStation = route.stations[index + 1];
            edges.push({
              source: station._id?.toString() || '',
              target: nextStation._id?.toString() || '',
              type: 'route',
              weight: 1,
              data: {
                distance: this.calculateDistance(
                  station.latitude, station.longitude,
                  nextStation.latitude, nextStation.longitude
                ),
              },
            });
          }
        });
      }
    });

    // Vehicle-station connections (when vehicle is near station)
    vehicles.forEach(vehicle => {
      stations.forEach(station => {
        const distance = this.calculateDistance(
          vehicle.latitude, vehicle.longitude,
          station.latitude, station.longitude
        );
        if (distance < 0.01) { // Within ~1km
          edges.push({
            source: vehicle._id.toString(),
            target: station._id.toString(),
            type: 'connection',
            weight: 0.5,
            data: {
              distance,
            },
          });
        }
      });
    });

    // Control center-region connections
    controlCenters.forEach(center => {
      if (center.regionIds && Array.isArray(center.regionIds)) {
        center.regionIds.forEach((regionId: any) => {
          edges.push({
            source: center._id.toString(),
            target: regionId.toString(),
            type: 'dependency',
            weight: 1,
            data: {},
          });
        });
      }
    });

    return edges;
  }

  /**
   * Identify congestion nodes
   */
  private identifyCongestionNodes(nodes: NetworkNode[], crowdReports: any[]): void {
    nodes.forEach(node => {
      if (node.type === 'station' || node.type === 'route') {
        const isCongested = (node.data.occupancy || 0) > 80;
        if (isCongested) {
          node.data.status = 'congested';
        }
      }
    });
  }

  /**
   * Identify bottlenecks
   */
  private identifyBottlenecks(nodes: NetworkNode[], edges: NetworkEdge[], crowdReports: any[]): void {
    // Calculate connection counts
    nodes.forEach(node => {
      const connectionCount = edges.filter(
        e => e.source === node.id || e.target === node.id
      ).length;
      node.data.connections = connectionCount;
    });

    // Identify high-traffic nodes with many connections
    nodes.forEach(node => {
      if ((node.data.connections || 0) > 5 && (node.data.occupancy || 0) > 70) {
        node.data.status = 'bottleneck';
      }
    });
  }

  /**
   * Identify incident clusters
   */
  private identifyIncidentClusters(nodes: NetworkNode[], predictions: any[]): void {
    const highRiskPredictions = predictions.filter(p => 
      p.riskLevel === 'high' || p.riskLevel === 'critical'
    );

    // Mark nodes with high-risk predictions
    highRiskPredictions.forEach(prediction => {
      const node = nodes.find(n => n.id === prediction.entityId?.toString());
      if (node) {
        node.data.status = 'incident';
      }
    });
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get network statistics
   */
  public async getNetworkStatistics(cityId: string): Promise<any> {
    const nodes = await this.buildNetworkGraph(cityId);

    const totalNodes = nodes.length;
    const stationNodes = nodes.filter(n => n.type === 'station');
    const vehicleNodes = nodes.filter(n => n.type === 'vehicle');
    const routeNodes = nodes.filter(n => n.type === 'route');
    const controlCenterNodes = nodes.filter(n => n.type === 'controlCenter');

    const congestedNodes = nodes.filter(n => n.data.status === 'congested');
    const bottleneckNodes = nodes.filter(n => n.data.status === 'bottleneck');
    const incidentNodes = nodes.filter(n => n.data.status === 'incident');

    const averageConnections = nodes.length > 0
      ? nodes.reduce((sum, n) => sum + (n.data.connections || 0), 0) / nodes.length
      : 0;

    return {
      totalNodes,
      stationCount: stationNodes.length,
      vehicleCount: vehicleNodes.length,
      routeCount: routeNodes.length,
      controlCenterCount: controlCenterNodes.length,
      congestedNodes: congestedNodes.length,
      bottleneckNodes: bottleneckNodes.length,
      incidentNodes: incidentNodes.length,
      averageConnections,
    };
  }

  /**
   * Get connectivity analysis
   */
  public async getConnectivityAnalysis(cityId: string): Promise<any> {
    const nodes = await this.buildNetworkGraph(cityId);

    // Find most connected nodes
    const sortedByConnections = [...nodes].sort((a, b) => (b.data.connections || 0) - (a.data.connections || 0));
    const mostConnected = sortedByConnections.slice(0, 10);

    // Find least connected nodes
    const leastConnected = sortedByConnections.slice(-10).reverse();

    return {
      mostConnected,
      leastConnected,
    };
  }
}

export const networkAnalyzer = new NetworkAnalyzer();
