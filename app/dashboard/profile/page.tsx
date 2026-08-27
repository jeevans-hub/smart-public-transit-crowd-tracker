'use client';

import { useState, useRef } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageProvider';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Star, 
  Coins, 
  Camera, 
  Lock, 
  History, 
  Monitor,
  Trash2,
  AlertTriangle,
  Key,
  LogOut,
  Smartphone
} from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, updateUser } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Local state for profile data that can be edited
  const [profileData, setProfileData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
  });
  
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Mock activity data
  const [recentActivity] = useState([
    { id: 1, action: 'Login', location: 'Chrome on Windows', time: '2 hours ago', ip: '192.168.1.1' },
    { id: 2, action: 'Password Changed', location: 'Chrome on Windows', time: '3 days ago', ip: '192.168.1.1' },
    { id: 3, action: 'Profile Updated', location: 'Chrome on Windows', time: '1 week ago', ip: '192.168.1.1' },
    { id: 4, action: 'Login', location: 'Firefox on Mac', time: '2 weeks ago', ip: '192.168.1.2' },
  ]);

  // Mock active sessions
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'Chrome on Windows', location: 'Bangalore, India', lastActive: 'Now', current: true },
    { id: 2, device: 'Firefox on Mac', location: 'Mumbai, India', lastActive: '2 days ago', current: false },
  ]);

  const handleSave = () => {
    // Update the profile data with the form data
    setProfileData(formData);
    
    // Update the auth context to reflect changes in Navbar
    if (currentUser) {
      updateUser({
        username: formData.username,
        email: formData.email,
      });
    }
    
    setIsEditing(false);
    
    // TODO: Implement actual API call to update user profile
    // Example:
    // await fetch('/api/user/profile', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData)
    // });
  };

  const handleCancel = () => {
    // Reset form data to current profile data
    setFormData(profileData);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = () => {
    // TODO: Implement password change API call
    console.log('Changing password:', passwordData);
    setShowPasswordForm(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion API call
    console.log('Deleting account');
    setShowDeleteModal(false);
  };

  const handleRevokeSession = (sessionId: number) => {
    // Remove the session from the list
    setActiveSessions(activeSessions.filter(session => session.id !== sessionId));
    // TODO: Implement session revocation API call
    console.log('Revoking session:', sessionId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-72">
        <Navbar />
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t('user_profile')}</h1>
            <p className="text-gray-600 mt-1">{t('manage_account')}</p>
          </div>

          <div className="max-w-4xl">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <nav className="flex">
                {[
                  { id: 'profile', label: t('profile'), icon: User },
                  { id: 'security', label: t('security'), icon: Lock },
                  { id: 'activity', label: t('activity'), icon: History },
                  { id: 'sessions', label: t('sessions'), icon: Monitor },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}
                      <button
                        onClick={handleAvatarClick}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                      >
                        <Camera size={16} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{profileData.username || 'User'}</h2>
                      <p className="text-gray-600">{currentUser?.role || 'Administrator'}</p>
                    </div>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('edit')}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t('save_changes')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('username')}</label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profileData.username || 'N/A'}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {isEditing ? (
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900">{profileData.email || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900 capitalize">{currentUser?.role || 'User'}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('level')}</label>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{currentUser?.level || 1}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('coins')}</label>
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{currentUser?.coins || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('account_info')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('experience')}</label>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{currentUser?.experience || 0} XP</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('account_status')}</label>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <p className="text-green-600 font-medium">{t('active')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('password')}</h3>
                  {!showPasswordForm ? (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Key size={18} />
                      <span>{t('change_password')}</span>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('current_password')}</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('new_password')}</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirm_password')}</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowPasswordForm(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          onClick={handlePasswordChange}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {t('update_password')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('two_factor')}</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{t('enable_2fa')}</p>
                      <p className="text-sm text-gray-600">{t('2fa_desc')}</p>
                    </div>
                    <button
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">{t('danger_zone')}</h3>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                    <span>{t('delete_account')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('recent_activity')}</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <History size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.location}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time} • IP: {activity.ip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('active_sessions')}</h3>
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Smartphone size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{session.device}</p>
                          <p className="text-sm text-gray-600">{session.location}</p>
                          <p className="text-xs text-gray-500 mt-1">Last active: {session.lastActive}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.current && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            {t('current')}
                          </span>
                        )}
                        {!session.current && (
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                          >
                            <LogOut size={16} />
                            <span>{t('revoke')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{t('delete_account')}</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {t('delete_confirm')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('delete_account')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
