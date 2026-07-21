'use client';

import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import UserProfile from '@/components/auth/UserProfile';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { currentUser, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <UserProfile user={currentUser} />
      </div>
    );
  }

  if (authView === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <LoginForm onClose={() => setAuthView(null)} onRegisterClick={() => setAuthView('register')} />
      </div>
    );
  }

  if (authView === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <RegisterForm onClose={() => setAuthView(null)} onLoginClick={() => setAuthView('login')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Smart Public Transit Crowd Tracker
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 mb-8">
            Real-time crowd monitoring and digital ticketing platform.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setAuthView('login')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Login
            </button>
            <button
              onClick={() => setAuthView('register')}
              className="px-8 py-3 bg-transparent border-2 border-blue-500 hover:bg-blue-500/20 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Register
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon="👥"
            title="Live Crowd Monitoring"
            description="Real-time tracking of passenger density across transit stations and vehicles."
          />
          <FeatureCard
            icon="🎫"
            title="Digital Ticketing"
            description="Seamless mobile ticketing with QR codes and contactless payment integration."
          />
          <FeatureCard
            icon="🤖"
            title="AI Crowd Prediction"
            description="Machine learning algorithms predict crowd patterns and optimize routes."
          />
          <FeatureCard
            icon="🗺️"
            title="Smart Route Planning"
            description="Intelligent route suggestions based on real-time crowd data and schedules."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-blue-100">{description}</p>
    </div>
  );
}
