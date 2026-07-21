import { Agency } from '@/types/agency';
import { Building2, MapPin, Mail, Phone, Globe } from 'lucide-react';

interface AgencyCardProps {
  agency: Agency;
  onEdit?: (agency: Agency) => void;
  onDelete?: (agency: Agency) => void;
}

export default function AgencyCard({ agency, onEdit, onDelete }: AgencyCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {agency.logo ? (
            <img src={agency.logo} alt={agency.name} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="text-blue-600" size={24} />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{agency.name}</h3>
            <p className="text-sm text-gray-500">{agency.city}, {agency.state}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          agency.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {agency.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin size={16} />
          <span>{agency.country}</span>
        </div>
        {agency.contactEmail && (
          <div className="flex items-center gap-2">
            <Mail size={16} />
            <span className="truncate">{agency.contactEmail}</span>
          </div>
        )}
        {agency.contactPhone && (
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <span>{agency.contactPhone}</span>
          </div>
        )}
        {agency.website && (
          <div className="flex items-center gap-2">
            <Globe size={16} />
            <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
              {agency.website}
            </a>
          </div>
        )}
      </div>

      {agency.description && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{agency.description}</p>
      )}

      {(onEdit || onDelete) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(agency)}
              className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(agency)}
              className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
