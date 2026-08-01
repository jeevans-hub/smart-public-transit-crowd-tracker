'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Bus, 
  Map, 
  Car, 
  Menu,
  X,
  ChevronDown,
  Brain,
  Radio,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Overview and statistics'
  },
  { 
    href: '/dashboard/live', 
    label: 'Live Crowd', 
    icon: Bus,
    description: 'Real-time crowd monitoring'
  },
  { 
    href: '/dashboard/live-vehicles', 
    label: 'Live Vehicles', 
    icon: Radio,
    description: 'Real-time vehicle tracking'
  },
  { 
    href: '/dashboard/predictions', 
    label: 'AI Predictions', 
    icon: Brain,
    description: 'Crowd forecasting engine'
  },
  { 
    href: '/dashboard/analytics', 
    label: 'Analytics', 
    icon: LayoutDashboard,
    description: 'Historical analytics'
  },
  { 
    href: '/dashboard/operations', 
    label: 'Operations', 
    icon: Settings,
    description: 'Fleet management & maintenance'
  },
  { 
    href: '/dashboard/stations', 
    label: 'Stations', 
    icon: Bus,
    description: 'Manage stations'
  },
  { 
    href: '/dashboard/routes', 
    label: 'Routes', 
    icon: Map,
    description: 'Manage routes'
  },
  { 
    href: '/dashboard/vehicles', 
    label: 'Vehicles', 
    icon: Car,
    description: 'Fleet management'
  },
  { 
    href: '/dashboard/agencies', 
    label: 'Agencies', 
    icon: LayoutDashboard,
    description: 'Manage agencies'
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">TT</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Transit Tracker</h1>
              <p className="text-sm text-gray-500">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isExpanded = expandedItem === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setIsOpen(false);
                  setExpandedItem(isExpanded ? null : item.href);
                }}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
                <div className="flex-1">
                  <span className="block">{item.label}</span>
                  {isExpanded && (
                    <span className="block text-xs text-gray-500 mt-0.5">{item.description}</span>
                  )}
                </div>
                <ChevronDown 
                  size={16} 
                  className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                />
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {currentUser?.username?.substring(0, 2).toUpperCase() || 'JD'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{currentUser?.username || 'User'}</p>
              <p className="text-xs text-gray-500">{currentUser?.role || 'Administrator'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
