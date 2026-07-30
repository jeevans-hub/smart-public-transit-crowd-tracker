import CrowdReport from '@/models/CrowdReport';
import { ICrowdReportDocument, ICrowdReportResponse, ICrowdStatistics, IVehicleOccupancy, IStationOccupancy, IRouteOccupancy, CrowdLevel } from '@/types/crowd';
import { calculateOccupancyPercentage, calculateCrowdLevel as calcCrowdLevel, calculateAverageOccupancy } from '@/utils/crowdCalculator';

export async function createCrowdReport(data: {
  vehicleId: string;
  routeId: string;
  stationId: string;
  reportedBy: string;
  crowdLevel: CrowdLevel;
  passengerCount: number;
  vehicleCapacity: number;
  reportSource: 'USER' | 'STAFF' | 'SYSTEM';
}): Promise<ICrowdReportDocument> {
  const occupancyPercentage = calculateOccupancyPercentage(data.passengerCount, data.vehicleCapacity);
  
  const report = new CrowdReport({
    ...data,
    occupancyPercentage,
    verified: false,
  });
  
  await report.save();
  return report;
}

export async function getLatestReport(vehicleId: string): Promise<ICrowdReportDocument | null> {
  return CrowdReport.findOne({ vehicleId }).sort({ createdAt: -1 });
}

export async function getVehicleOccupancy(vehicleId: string): Promise<IVehicleOccupancy | null> {
  const report = await getLatestReport(vehicleId);
  if (!report) return null;
  
  return {
    vehicleId: report.vehicleId,
    routeId: report.routeId,
    stationId: report.stationId,
    crowdLevel: report.crowdLevel,
    passengerCount: report.passengerCount,
    vehicleCapacity: report.vehicleCapacity,
    occupancyPercentage: report.occupancyPercentage,
    reportedAt: report.createdAt,
    verified: report.verified,
  };
}

export async function getStationOccupancy(stationId: string): Promise<IStationOccupancy | null> {
  const reports = await CrowdReport.find({ stationId }).sort({ createdAt: -1 }).limit(50);
  
  if (reports.length === 0) return null;
  
  const averageOccupancy = calculateAverageOccupancy(reports.map(r => r.occupancyPercentage));
  
  return {
    stationId,
    averageOccupancy,
    reportCount: reports.length,
    latestReport: reports[0].createdAt,
  };
}

export async function getRouteOccupancy(routeId: string): Promise<IRouteOccupancy | null> {
  const reports = await CrowdReport.find({ routeId }).sort({ createdAt: -1 }).limit(50);
  
  if (reports.length === 0) return null;
  
  const averageOccupancy = calculateAverageOccupancy(reports.map(r => r.occupancyPercentage));
  
  return {
    routeId,
    averageOccupancy,
    reportCount: reports.length,
    latestReport: reports[0].createdAt,
  };
}

export async function getAverageOccupancy(filters?: {
  vehicleId?: string;
  routeId?: string;
  stationId?: string;
  hours?: number;
}): Promise<number> {
  const query: any = {};
  
  if (filters?.vehicleId) query.vehicleId = filters.vehicleId;
  if (filters?.routeId) query.routeId = filters.routeId;
  if (filters?.stationId) query.stationId = filters.stationId;
  
  if (filters?.hours) {
    const cutoffDate = new Date(Date.now() - filters.hours * 60 * 60 * 1000);
    query.createdAt = { $gte: cutoffDate };
  }
  
  const reports = await CrowdReport.find(query);
  
  if (reports.length === 0) return 0;
  
  return calculateAverageOccupancy(reports.map(r => r.occupancyPercentage));
}

export async function getRecentReports(limit: number = 20): Promise<ICrowdReportDocument[]> {
  return CrowdReport.find().sort({ createdAt: -1 }).limit(limit);
}

export async function getTodayReports(): Promise<ICrowdReportDocument[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  return CrowdReport.find({
    createdAt: { $gte: startOfDay },
  }).sort({ createdAt: -1 });
}

export async function getMostCrowdedVehicle(): Promise<{
  vehicleId: string;
  routeId: string;
  occupancyPercentage: number;
} | null> {
  const reports = await CrowdReport.find()
    .sort({ occupancyPercentage: -1 })
    .limit(1);
  
  if (reports.length === 0) return null;
  
  return {
    vehicleId: reports[0].vehicleId,
    routeId: reports[0].routeId,
    occupancyPercentage: reports[0].occupancyPercentage,
  };
}

export async function getMostCrowdedStation(): Promise<{
  stationId: string;
  occupancyPercentage: number;
} | null> {
  const reports = await CrowdReport.find()
    .sort({ occupancyPercentage: -1 })
    .limit(1);
  
  if (reports.length === 0) return null;
  
  return {
    stationId: reports[0].stationId,
    occupancyPercentage: reports[0].occupancyPercentage,
  };
}

export async function getMostCrowdedRoute(): Promise<{
  routeId: string;
  occupancyPercentage: number;
} | null> {
  const reports = await CrowdReport.find()
    .sort({ occupancyPercentage: -1 })
    .limit(1);
  
  if (reports.length === 0) return null;
  
  return {
    routeId: reports[0].routeId,
    occupancyPercentage: reports[0].occupancyPercentage,
  };
}

export async function getCrowdStatistics(): Promise<ICrowdStatistics> {
  const todayReports = await getTodayReports();
  const averageOccupancy = await getAverageOccupancy({ hours: 24 });
  const mostCrowdedVehicle = await getMostCrowdedVehicle();
  const mostCrowdedRoute = await getMostCrowdedRoute();
  const mostCrowdedStation = await getMostCrowdedStation();
  
  const uniqueVehicles = new Set(todayReports.map(r => r.vehicleId));
  
  return {
    vehiclesOnline: uniqueVehicles.size,
    reportsToday: todayReports.length,
    averageOccupancy,
    mostCrowdedVehicle,
    mostCrowdedRoute,
    mostCrowdedStation,
  };
}

export async function deleteCrowdReport(id: string): Promise<ICrowdReportDocument | null> {
  return CrowdReport.findByIdAndDelete(id);
}

export async function getCrowdReportById(id: string): Promise<ICrowdReportDocument | null> {
  return CrowdReport.findById(id);
}

export function toCrowdReportResponse(report: ICrowdReportDocument): ICrowdReportResponse {
  return {
    _id: report._id.toString(),
    vehicleId: report.vehicleId,
    routeId: report.routeId,
    stationId: report.stationId,
    reportedBy: report.reportedBy,
    crowdLevel: report.crowdLevel,
    passengerCount: report.passengerCount,
    vehicleCapacity: report.vehicleCapacity,
    occupancyPercentage: report.occupancyPercentage,
    reportSource: report.reportSource,
    verified: report.verified,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

export function calculateCrowdLevel(occupancyPercentage: number): CrowdLevel {
  return calcCrowdLevel(occupancyPercentage);
}
