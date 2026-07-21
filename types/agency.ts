export interface Agency {
  _id?: string;
  name: string;
  city: string;
  state: string;
  country: string;
  logo?: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAgencyDTO {
  name: string;
  city: string;
  state: string;
  country: string;
  logo?: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  active?: boolean;
}

export interface UpdateAgencyDTO {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  logo?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  active?: boolean;
}

export interface AgencyResponse {
  success: boolean;
  data?: Agency;
  error?: string;
}

export interface AgenciesResponse {
  success: boolean;
  data?: Agency[];
  error?: string;
}
