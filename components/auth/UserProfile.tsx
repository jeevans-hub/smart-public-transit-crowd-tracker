'use client';

import { useAuth } from '@/hooks/useAuth';

interface UserProfileProps {
  user: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    role: string;
    level: number;
    experience: number;
    coins: number;
  };
}

export default function UserProfile({ user }: UserProfileProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Welcome, {user.username}!</h1>
                <p className="text-blue-200">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard label="Level" value={user.level} icon="⭐" />
              <StatCard label="Experience" value={user.experience} icon="📊" />
              <StatCard label="Coins" value={user.coins} icon="💰" />
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Logout
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Account Details</h2>
            <div className="space-y-3">
              <DetailRow label="Username" value={user.username} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Role" value={user.role} />
              <DetailRow label="Level" value={user.level.toString()} />
              <DetailRow label="Experience" value={user.experience.toString()} />
              <DetailRow label="Coins" value={user.coins.toString()} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-blue-200">{label}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/10">
      <span className="text-blue-200">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
