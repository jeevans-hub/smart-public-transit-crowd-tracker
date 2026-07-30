// Mock data for Smart Public Transit Crowd Monitoring System Dashboard

export interface StatCardData {
  title: string;
  value: number;
  change: number;
  icon: string;
}

export interface CrowdData {
  station: string;
  vehicle: string;
  route: string;
  passengers: number;
  crowdPercentage: number;
  status: 'healthy' | 'moderate' | 'high' | 'critical';
  lastUpdated: string;
}

export interface AlertData {
  id: string;
  type: 'High Crowd' | 'Platform Congestion' | 'Vehicle Delay' | 'Emergency' | 'Maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  location: string;
  description: string;
}

export interface ActivityData {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface MapMarker {
  id: string;
  type: 'station' | 'vehicle';
  name: string;
  lat: number;
  lng: number;
  status: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Stat Cards Data
export const statCardsData: StatCardData[] = [
  {
    title: 'Total Stations',
    value: 156,
    change: 12.5,
    icon: 'MapPin',
  },
  {
    title: 'Active Vehicles',
    value: 342,
    change: 8.2,
    icon: 'Car',
  },
  {
    title: 'Passengers Today',
    value: 45890,
    change: 15.3,
    icon: 'Users',
  },
  {
    title: 'Average Occupancy',
    value: 68,
    change: -2.4,
    icon: 'Activity',
  },
  {
    title: 'Critical Alerts',
    value: 7,
    change: -40.0,
    icon: 'AlertTriangle',
  },
  {
    title: 'Healthy Stations',
    value: 142,
    change: 5.6,
    icon: 'CheckCircle',
  },
];

// Passenger Count Chart Data (Line Chart)
export const passengerData: ChartData[] = [
  { name: '6 AM', value: 1200 },
  { name: '8 AM', value: 8500 },
  { name: '10 AM', value: 6200 },
  { name: '12 PM', value: 7100 },
  { name: '2 PM', value: 5800 },
  { name: '4 PM', value: 8900 },
  { name: '6 PM', value: 9200 },
  { name: '8 PM', value: 4500 },
  { name: '10 PM', value: 2100 },
];

// Keep the old name for compatibility
export const passengerCountData = passengerData;

// Vehicle Occupancy Data (Area Chart)
export const vehicleOccupancyData: ChartData[] = [
  { name: 'Mon', value: 65, capacity: 100 },
  { name: 'Tue', value: 72, capacity: 100 },
  { name: 'Wed', value: 68, capacity: 100 },
  { name: 'Thu', value: 75, capacity: 100 },
  { name: 'Fri', value: 82, capacity: 100 },
  { name: 'Sat', value: 45, capacity: 100 },
  { name: 'Sun', value: 38, capacity: 100 },
];

// Peak Hours Data (Bar Chart)
export const peakHoursData: ChartData[] = [
  { name: '6-7 AM', value: 1200 },
  { name: '7-8 AM', value: 5600 },
  { name: '8-9 AM', value: 8900 },
  { name: '9-10 AM', value: 4200 },
  { name: '10-11 AM', value: 2800 },
  { name: '11-12 PM', value: 3500 },
  { name: '12-1 PM', value: 4800 },
  { name: '1-2 PM', value: 3200 },
  { name: '2-3 PM', value: 2900 },
  { name: '3-4 PM', value: 4100 },
  { name: '4-5 PM', value: 6200 },
  { name: '5-6 PM', value: 8500 },
  { name: '6-7 PM', value: 5800 },
  { name: '7-8 PM', value: 3200 },
  { name: '8-9 PM', value: 1800 },
];

// Crowd Distribution Data (Pie Chart)
export const crowdDistributionData: ChartData[] = [
  { name: 'Low (0-30%)', value: 35 },
  { name: 'Moderate (31-60%)', value: 28 },
  { name: 'High (61-80%)', value: 22 },
  { name: 'Critical (81-100%)', value: 15 },
];

// Station Utilization Data (Radial Bar Chart)
export const stationUtilizationData: ChartData[] = [
  { name: 'Central Station', value: 92 },
  { name: 'North Terminal', value: 78 },
  { name: 'South Hub', value: 85 },
  { name: 'East Junction', value: 65 },
  { name: 'West Point', value: 71 },
];

// Live Crowd Table Data
export const liveCrowdData: CrowdData[] = [
  {
    station: 'Central Station',
    vehicle: 'Bus-101',
    route: 'Route A',
    passengers: 45,
    crowdPercentage: 90,
    status: 'critical',
    lastUpdated: '2 min ago',
  },
  {
    station: 'North Terminal',
    vehicle: 'Bus-205',
    route: 'Route B',
    passengers: 28,
    crowdPercentage: 56,
    status: 'moderate',
    lastUpdated: '1 min ago',
  },
  {
    station: 'South Hub',
    vehicle: 'Bus-312',
    route: 'Route C',
    passengers: 12,
    crowdPercentage: 24,
    status: 'healthy',
    lastUpdated: '3 min ago',
  },
  {
    station: 'East Junction',
    vehicle: 'Bus-418',
    route: 'Route D',
    passengers: 38,
    crowdPercentage: 76,
    status: 'high',
    lastUpdated: '1 min ago',
  },
  {
    station: 'West Point',
    vehicle: 'Bus-520',
    route: 'Route E',
    passengers: 8,
    crowdPercentage: 16,
    status: 'healthy',
    lastUpdated: '4 min ago',
  },
  {
    station: 'Central Station',
    vehicle: 'Bus-103',
    route: 'Route A',
    passengers: 32,
    crowdPercentage: 64,
    status: 'high',
    lastUpdated: '2 min ago',
  },
  {
    station: 'North Terminal',
    vehicle: 'Bus-207',
    route: 'Route B',
    passengers: 18,
    crowdPercentage: 36,
    status: 'moderate',
    lastUpdated: '3 min ago',
  },
  {
    station: 'South Hub',
    vehicle: 'Bus-314',
    route: 'Route C',
    passengers: 42,
    crowdPercentage: 84,
    status: 'critical',
    lastUpdated: '1 min ago',
  },
];

// Live Alerts Data
export const liveAlertsData: AlertData[] = [
  {
    id: '1',
    type: 'High Crowd',
    priority: 'critical',
    timestamp: '2 min ago',
    location: 'Central Station',
    description: 'Platform A exceeds 90% capacity',
  },
  {
    id: '2',
    type: 'Vehicle Delay',
    priority: 'high',
    timestamp: '5 min ago',
    location: 'Route B - North Terminal',
    description: 'Bus-205 delayed by 15 minutes',
  },
  {
    id: '3',
    type: 'Platform Congestion',
    priority: 'medium',
    timestamp: '8 min ago',
    location: 'East Junction',
    description: 'Platform 2 experiencing heavy congestion',
  },
  {
    id: '4',
    type: 'Emergency',
    priority: 'critical',
    timestamp: '12 min ago',
    location: 'South Hub',
    description: 'Medical emergency reported',
  },
  {
    id: '5',
    type: 'Maintenance',
    priority: 'low',
    timestamp: '15 min ago',
    location: 'West Point',
    description: 'Scheduled maintenance completed',
  },
  {
    id: '6',
    type: 'High Crowd',
    priority: 'high',
    timestamp: '18 min ago',
    location: 'South Hub',
    description: 'Platform B exceeds 85% capacity',
  },
];

// Activity Timeline Data
export const activityTimelineData: ActivityData[] = [
  {
    id: '1',
    action: 'Passenger count updated',
    timestamp: '1 min ago',
    details: 'Central Station - 45 passengers',
  },
  {
    id: '2',
    action: 'Vehicle departed',
    timestamp: '3 min ago',
    details: 'Bus-101 departed from North Terminal',
  },
  {
    id: '3',
    action: 'Station status changed',
    timestamp: '5 min ago',
    details: 'East Junction marked as high congestion',
  },
  {
    id: '4',
    action: 'Crowd alert generated',
    timestamp: '8 min ago',
    details: 'Critical alert at Central Station',
  },
  {
    id: '5',
    action: 'Maintenance completed',
    timestamp: '12 min ago',
    details: 'West Point maintenance finished',
  },
  {
    id: '6',
    action: 'Vehicle added',
    timestamp: '15 min ago',
    details: 'Bus-600 added to fleet',
  },
  {
    id: '7',
    action: 'Route updated',
    timestamp: '20 min ago',
    details: 'Route C schedule modified',
  },
  {
    id: '8',
    action: 'Alert resolved',
    timestamp: '25 min ago',
    details: 'Platform congestion cleared at South Hub',
  },
];

// Map Markers Data
export const mapMarkersData: MapMarker[] = [
  {
    id: '1',
    type: 'station',
    name: 'Central Station',
    lat: 40.7128,
    lng: -74.0060,
    status: 'critical',
  },
  {
    id: '2',
    type: 'station',
    name: 'North Terminal',
    lat: 40.7589,
    lng: -73.9851,
    status: 'moderate',
  },
  {
    id: '3',
    type: 'station',
    name: 'South Hub',
    lat: 40.6892,
    lng: -74.0445,
    status: 'high',
  },
  {
    id: '4',
    type: 'station',
    name: 'East Junction',
    lat: 40.7484,
    lng: -73.9857,
    status: 'healthy',
  },
  {
    id: '5',
    type: 'station',
    name: 'West Point',
    lat: 40.7831,
    lng: -73.9712,
    status: 'healthy',
  },
  {
    id: '6',
    type: 'vehicle',
    name: 'Bus-101',
    lat: 40.7150,
    lng: -74.0080,
    status: 'active',
  },
  {
    id: '7',
    type: 'vehicle',
    name: 'Bus-205',
    lat: 40.7600,
    lng: -73.9900,
    status: 'active',
  },
  {
    id: '8',
    type: 'vehicle',
    name: 'Bus-312',
    lat: 40.6950,
    lng: -74.0500,
    status: 'delayed',
  },
  {
    id: '9',
    type: 'vehicle',
    name: 'Bus-418',
    lat: 40.7500,
    lng: -73.9800,
    status: 'active',
  },
  {
    id: '10',
    type: 'vehicle',
    name: 'Bus-520',
    lat: 40.7900,
    lng: -73.9750,
    status: 'active',
  },
];

// Crowd Gauge Values
export const crowdGaugeValues = [15, 42, 68, 91];
