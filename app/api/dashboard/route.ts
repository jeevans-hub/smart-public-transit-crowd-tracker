import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Station from '@/models/Station';
import { ICrowdReportDocument } from '@/types/crowd';
import { getRecentReports, getTodayReports, getCrowdStatistics } from '@/services/crowdService';
import { calculateCrowdDistribution, calculateAverageOccupancy } from '@/utils/crowdCalculator';
import { occupancyToDashboardStatus, statusToAlertPriority } from '@/utils/crowdStatus';
import {
  passengerData as demoPassengerData,
  vehicleOccupancyData as demoVehicleOccupancyData,
  peakHoursData as demoPeakHoursData,
} from '@/data/dashboard';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const requestedHours = Number.parseInt(searchParams.get('hours') || '24', 10);
    const hours = Number.isFinite(requestedHours) ? Math.min(Math.max(requestedHours, 1), 168) : 24;
    
    // Get all recent reports
    const recentReports = await getRecentReports(100);
    const todayReports = await getTodayReports();
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const periodReports = recentReports.filter(report => new Date(report.createdAt).getTime() >= cutoff);
    const statistics = await getCrowdStatistics();
    
    // Get station and route counts
    const totalStations = await Station.countDocuments({ active: true });
    
    // Calculate stat cards
    const uniqueVehicles = new Set(todayReports.map(r => r.vehicleId));
    const activeVehicles = uniqueVehicles.size;
    const passengersToday = todayReports.reduce((sum, r) => sum + r.passengerCount, 0);
    const averageOccupancy = statistics.averageOccupancy;
    
    // Count critical alerts (occupancy > 80%)
    const criticalAlerts = recentReports.filter(r => r.occupancyPercentage > 80).length;
    
    // Count healthy stations (average occupancy <= 60%)
    const stationOccupancyMap = new Map<string, number[]>();
    recentReports.forEach(r => {
      const existing = stationOccupancyMap.get(r.stationId) || [];
      existing.push(r.occupancyPercentage);
      stationOccupancyMap.set(r.stationId, existing);
    });
    
    let healthyStations = 0;
    stationOccupancyMap.forEach((occupancies) => {
      const avg = calculateAverageOccupancy(occupancies);
      if (avg <= 60) healthyStations++;
    });
    
    const statCardsData = [
      {
        title: 'Total Stations',
        value: totalStations,
        change: 0,
        icon: 'MapPin',
      },
      {
        title: 'Active Vehicles',
        value: activeVehicles,
        change: 0,
        icon: 'Car',
      },
      {
        title: 'Passengers Today',
        value: passengersToday,
        change: 0,
        icon: 'Users',
      },
      {
        title: 'Average Occupancy',
        value: averageOccupancy,
        change: 0,
        icon: 'Activity',
      },
      {
        title: 'Critical Alerts',
        value: criticalAlerts,
        change: 0,
        icon: 'AlertTriangle',
      },
      {
        title: 'Healthy Stations',
        value: healthyStations,
        change: 0,
        icon: 'CheckCircle',
      },
    ];
    
    // Calculate chart data based on actual reports
    const passengerData = generatePassengerData(periodReports);
    const vehicleOccupancyData = generateVehicleOccupancyData(periodReports);
    const peakHoursData = generatePeakHoursData(periodReports);
    const crowdDistributionData = generateCrowdDistributionData(recentReports);
    const stationUtilizationData = generateStationUtilizationData(stationOccupancyMap);
    
    // Generate live crowd table data
    const liveCrowdReports = recentReports.slice(0, 20);
    
    // Get all unique station IDs for crowd data
    const crowdStationIds = [...new Set(liveCrowdReports.map(r => r.stationId))];
    const crowdStations = await Station.find({ _id: { $in: crowdStationIds } });
    const crowdStationMap = new Map(crowdStations.map(s => [s._id.toString(), s.stationName]));
    
    const liveCrowdData = liveCrowdReports.map(report => {
      const status = occupancyToDashboardStatus(report.occupancyPercentage);
      const now = new Date();
      const reportTime = new Date(report.createdAt);
      const diffMs = now.getTime() - reportTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      // Get station name from map
      const stationName = crowdStationMap.get(report.stationId) || report.stationId;
      
      return {
        station: stationName,
        vehicle: report.vehicleId,
        route: report.routeId,
        passengers: report.passengerCount,
        crowdPercentage: report.occupancyPercentage,
        status: status as 'healthy' | 'moderate' | 'high' | 'critical',
        lastUpdated: diffMins < 1 ? 'Just now' : `${diffMins} min ago`,
      };
    });
    
    // Generate live alerts data
    const highOccupancyReports = recentReports
      .filter(r => r.occupancyPercentage > 75)
      .slice(0, 10);
    
    // Get all unique station IDs
    const stationIds = [...new Set(highOccupancyReports.map(r => r.stationId))];
    const alertStations = await Station.find({ _id: { $in: stationIds } });
    const stationMap = new Map(alertStations.map(s => [s._id.toString(), s.stationName]));
    
    const liveAlertsData = highOccupancyReports.map((report) => {
      const status = occupancyToDashboardStatus(report.occupancyPercentage);
      const priority = statusToAlertPriority(status);
      const now = new Date();
      const reportTime = new Date(report.createdAt);
      const diffMs = now.getTime() - reportTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      let alertType = 'High Crowd';
      if (status === 'critical') alertType = 'Critical Crowd';
      else if (status === 'high') alertType = 'High Crowd';
      
      // Get station name from map
      const stationName = stationMap.get(report.stationId) || report.stationId;
      
      return {
        id: report._id.toString(),
        type: alertType,
        priority: priority as 'low' | 'medium' | 'high' | 'critical',
        timestamp: diffMins < 1 ? 'Just now' : `${diffMins} min ago`,
        location: stationName,
        description: `${report.vehicleId} at ${stationName} exceeds ${report.occupancyPercentage}% capacity`,
      };
    });
    
    // Generate activity timeline data
    const activityReports = recentReports.slice(0, 10);
    
    // Get all unique station IDs for activity data
    const activityStationIds = [...new Set(activityReports.map(r => r.stationId))];
    const activityStations = await Station.find({ _id: { $in: activityStationIds } });
    const activityStationMap = new Map(activityStations.map(s => [s._id.toString(), s.stationName]));
    
    const activityTimelineData = activityReports.map((report) => {
      const now = new Date();
      const reportTime = new Date(report.createdAt);
      const diffMs = now.getTime() - reportTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      // Get station name from map
      const stationName = activityStationMap.get(report.stationId) || report.stationId;
      
      return {
        id: report._id.toString(),
        action: 'Passenger count updated',
        timestamp: diffMins < 1 ? 'Just now' : `${diffMins} min ago`,
        details: `${report.vehicleId} at ${stationName} - ${report.passengerCount} passengers`,
      };
    });
    
    // Generate map markers data (using station data - only Bengaluru stations)
    const bengaluruStationCodes = ['MBS001', 'KMS001', 'IMS001', 'MGS001', 'YBS001', 'EBS001', 'BBS001', 'KRS001', 'WBS001', 'JDI001'];
    const mapStations = await Station.find({ 
      active: true,
      stationCode: { $in: bengaluruStationCodes }
    });
    const mapMarkersData = mapStations.map(station => {
      const stationReports = recentReports.filter(r => r.stationId === station._id.toString());
      const latestOccupancy = stationReports.length > 0 ? stationReports[0].occupancyPercentage : 0;
      const status = occupancyToDashboardStatus(latestOccupancy);
      
      return {
        id: station._id.toString(),
        type: 'station' as const,
        name: station.stationName,
        lat: station.latitude,
        lng: station.longitude,
        status: status,
      };
    });
    
    // Generate crowd gauge values from recent reports
    const crowdGaugeValues = recentReports.slice(0, 4).map(r => r.occupancyPercentage);
    
    return NextResponse.json({
      success: true,
      data: {
        statCardsData,
        passengerData,
        vehicleOccupancyData,
        peakHoursData,
        crowdDistributionData,
        stationUtilizationData,
        liveCrowdData,
        liveAlertsData,
        activityTimelineData,
        mapMarkersData,
        crowdGaugeValues,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// Helper functions to generate chart data
type DashboardReport = Pick<ICrowdReportDocument, 'createdAt' | 'passengerCount' | 'occupancyPercentage'>;

function generatePassengerData(reports: DashboardReport[]) {
  const hours = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];
  const totals = new Map(hours.map(hour => [hour, 0]));

  reports.forEach(report => {
    const hour = new Date(report.createdAt).getHours();
    const bucket = Math.min(Math.max(Math.floor((hour - 6) / 2), 0), hours.length - 1);
    if (hour >= 6 && hour <= 22) {
      const label = hours[bucket];
      totals.set(label, (totals.get(label) || 0) + report.passengerCount);
    }
  });

  const data = hours.map(name => ({ name, value: totals.get(name) || 0 }));
  return data.some(point => point.value > 0) ? data : demoPassengerData;
}

function generateVehicleOccupancyData(reports: DashboardReport[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = new Map(days.map(day => [day, [] as number[]]));

  reports.forEach(report => {
    const date = new Date(report.createdAt);
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    values.get(days[dayIndex])?.push(report.occupancyPercentage);
  });

  const data = days.map(name => {
    const dayValues = values.get(name) || [];
    return {
      name,
      value: dayValues.length ? Math.round(dayValues.reduce((sum, value) => sum + value, 0) / dayValues.length) : 0,
      capacity: 100,
    };
  });
  return data.some(point => point.value > 0) ? data : demoVehicleOccupancyData;
}

function generatePeakHoursData(reports: DashboardReport[]) {
  const hours = ['6-7 AM', '7-8 AM', '8-9 AM', '9-10 AM', '10-11 AM', '11-12 PM', '12-1 PM', '1-2 PM', '2-3 PM', '3-4 PM', '4-5 PM', '5-6 PM', '6-7 PM', '7-8 PM', '8-9 PM'];
  const totals = new Map(hours.map(hour => [hour, 0]));

  reports.forEach(report => {
    const hour = new Date(report.createdAt).getHours();
    const index = hour - 6;
    if (index >= 0 && index < hours.length) {
      const label = hours[index];
      totals.set(label, (totals.get(label) || 0) + report.passengerCount);
    }
  });

  const data = hours.map(name => ({ name, value: totals.get(name) || 0 }));
  return data.some(point => point.value > 0) ? data : demoPeakHoursData;
}

function generateCrowdDistributionData(reports: Pick<ICrowdReportDocument, 'occupancyPercentage'>[]) {
  const distribution = calculateCrowdDistribution(reports);
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0) || 1;
  
  return [
    { name: 'Low (0-30%)', value: Math.round((distribution.empty / total) * 100) || 35 },
    { name: 'Moderate (31-60%)', value: Math.round((distribution.low / total) * 100) || 28 },
    { name: 'High (61-80%)', value: Math.round((distribution.medium / total) * 100) || 22 },
    { name: 'Critical (81-100%)', value: Math.round((distribution.high + distribution.full) / total * 100) || 15 },
  ];
}

function generateStationUtilizationData(stationOccupancyMap: Map<string, number[]>) {
  const data = [];
  let count = 0;
  
  for (const [stationId, occupancies] of stationOccupancyMap) {
    if (count >= 5) break;
    const avg = calculateAverageOccupancy(occupancies);
    data.push({
      name: stationId,
      value: avg,
    });
    count++;
  }
  
  return data;
}
