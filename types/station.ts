export interface Station {
  _id?: string;
  agencyId: string;
  stationName: string;
  stationCode: string;
  latitude: number;
  longitude: number;
  address: string;
  zone?: string;
  platformCount?: number;
  facilities?: string[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateStationDTO {
  agencyId: string;
  stationName: string;
  stationCode: string;
  latitude: number;
  longitude: number;
  address: string;
  zone?: string;
  platformCount?: number;
  facilities?: string[];
  active?: boolean;
}

export interface UpdateStationDTO {
  agencyId?: string;
  stationName?: string;
  stationCode?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  zone?: string;
  platformCount?: number;
  facilities?: string[];
  active?: boolean;
}

export interface StationResponse {
  success: boolean;
  data?: Station;
  error?: string;
}

export interface StationsResponse {
  success: boolean;
  data?: Station[];
  error?: string;
}
