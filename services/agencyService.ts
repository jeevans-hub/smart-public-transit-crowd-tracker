import Agency, { IAgency } from '../models/Agency';
import { CreateAgencyDTO, UpdateAgencyDTO } from '../types/agency';

export const agencyService = {
  async create(data: CreateAgencyDTO): Promise<IAgency> {
    if (!data.name || !data.city || !data.state || !data.country || !data.contactEmail) {
      throw new Error('Missing required fields: name, city, state, country, contactEmail');
    }

    const agency = new Agency({
      name: data.name,
      city: data.city,
      state: data.state,
      country: data.country,
      logo: data.logo,
      description: data.description,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      website: data.website,
      active: data.active !== undefined ? data.active : true,
    });

    return await agency.save();
  },

  async getAll(): Promise<IAgency[]> {
    return await Agency.find({}).sort({ name: 1 });
  },

  async getById(id: string): Promise<IAgency | null> {
    return await Agency.findById(id);
  },

  async update(id: string, data: UpdateAgencyDTO): Promise<IAgency | null> {
    const agency = await Agency.findById(id);
    if (!agency) {
      throw new Error('Agency not found');
    }

    if (data.name !== undefined) agency.name = data.name;
    if (data.city !== undefined) agency.city = data.city;
    if (data.state !== undefined) agency.state = data.state;
    if (data.country !== undefined) agency.country = data.country;
    if (data.logo !== undefined) agency.logo = data.logo;
    if (data.description !== undefined) agency.description = data.description;
    if (data.contactEmail !== undefined) agency.contactEmail = data.contactEmail;
    if (data.contactPhone !== undefined) agency.contactPhone = data.contactPhone;
    if (data.website !== undefined) agency.website = data.website;
    if (data.active !== undefined) agency.active = data.active;

    return await agency.save();
  },

  async delete(id: string): Promise<boolean> {
    const result = await Agency.findByIdAndDelete(id);
    return !!result;
  },
};
