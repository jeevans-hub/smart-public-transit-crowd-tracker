'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeProvider';
import { useLanguage } from '@/contexts/LanguageProvider';
import { 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Lock, 
  Database,
  Save,
  Moon,
  Sun,
  Monitor,
  Phone,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

export default function SettingsPage() {
  const { currentUser, getToken } = useAuth();
  const { theme, fontSize, setTheme, setFontSize } = useTheme();
  const { language, setLanguage: setAppLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('notifications');
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    smsAlerts: false,
    alertThreshold: 'high',
    
    // Security settings
    twoFactorAuth: false,
    loginAlerts: true,
    
    // Language settings
    language: 'en',
    timezone: 'UTC+5:30',
  });

  // SMS settings state
  const [smsSettings, setSmsSettings] = useState({
    phoneNumber: '',
    phoneVerified: false,
    smsAlertsEnabled: false,
    smsAlertThreshold: 'high',
  });

  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Timezone state (immediate changes)
  const [timezone, setTimezone] = useState('UTC+5:30');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    const savedTimezone = localStorage.getItem('timezone');
    if (savedTimezone) setTimezone(savedTimezone);

    // Load SMS settings from backend
    fetchSMSSettings();
  }, []);

  const fetchSMSSettings = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await fetch('/api/sms/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setSmsSettings(result.settings);
        setPhoneNumber(result.settings.phoneNumber || '');
      }
    } catch (error) {
      console.error('Failed to fetch SMS settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Save SMS settings to backend
    try {
      const token = getToken();
      if (token) {
        const response = await fetch('/api/sms/settings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            smsAlertsEnabled: smsSettings.smsAlertsEnabled,
            smsAlertThreshold: smsSettings.smsAlertThreshold,
          }),
        });
        const result = await response.json();
        if (result.success) {
          setMessage({ type: 'success', text: 'Settings saved successfully' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    }

    // Save other settings to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));
    localStorage.setItem('timezone', timezone);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saving settings:', { ...settings, language, timezone });
    setSaving(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSendVerificationCode = async () => {
    setSendingCode(true);
    setMessage(null);

    try {
      const token = getToken();
      console.log('Token for SMS verification:', token ? 'Present' : 'Missing');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please log in again.' });
        setSendingCode(false);
        return;
      }

      const response = await fetch('/api/sms/send-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      const result = await response.json();
      
      console.log('SMS verification response:', result);
      
      if (result.success) {
        setCodeSent(true);
        setCodeExpiry(new Date(result.expiresAt));
        
        // Show mock code in development mode
        if (result.mockCode) {
          setMessage({ 
            type: 'success', 
            text: `Mock mode - Verification code: ${result.mockCode}` 
          });
        } else {
          setMessage({ type: 'success', text: 'Verification code sent successfully' });
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send verification code' });
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setMessage({ type: 'error', text: 'Failed to send verification code' });
    }

    setSendingCode(false);
  };

  const handleVerifyCode = async () => {
    setVerifyingCode(true);
    setMessage(null);

    try {
      const token = getToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required' });
        setVerifyingCode(false);
        return;
      }

      const response = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode }),
      });
      const result = await response.json();
      
      if (result.success) {
        setSmsSettings({
          ...smsSettings,
          phoneVerified: true,
          phoneNumber: result.phoneNumber,
        });
        setCodeSent(false);
        setVerificationCode('');
        setMessage({ type: 'success', text: 'Phone number verified successfully' });
        // Refresh settings
        fetchSMSSettings();
      } else {
        setMessage({ type: 'error', text: result.error || 'Invalid verification code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to verify code' });
    }

    setVerifyingCode(false);
  };

  const tabs = [
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: t('appearance'), icon: Palette },
    { id: 'language', label: t('language_region'), icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-72">
        <Navbar />
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
            <p className="text-gray-600 mt-1">{t('manage_account')}</p>
          </div>

          <div className="max-w-4xl">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex">
                  {tabs.map((tab) => {
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

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Email Notifications</p>
                          <p className="text-sm text-gray-600">Receive email updates about your account</p>
                        </div>
                        <button
                          onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Push Notifications</p>
                          <p className="text-sm text-gray-600">Receive browser push notifications</p>
                        </div>
                        <button
                          onClick={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Phone Number Setup */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Phone size={18} />
                          Phone Number Setup
                        </h4>
                        
                        <div className="space-y-4">
                          {smsSettings.phoneVerified ? (
                            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="text-green-600" size={20} />
                                <div>
                                  <p className="font-medium text-gray-900">{smsSettings.phoneNumber}</p>
                                  <p className="text-sm text-green-600">Verified</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSmsSettings({ ...smsSettings, phoneVerified: false, phoneNumber: '' });
                                  setPhoneNumber('');
                                }}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <div className="flex gap-2">
                                  <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter your phone number"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={codeSent}
                                  />
                                  {!codeSent ? (
                                    <button
                                      onClick={handleSendVerificationCode}
                                      disabled={sendingCode || !phoneNumber}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {sendingCode ? 'Sending...' : 'Send Code'}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setCodeSent(false);
                                        setVerificationCode('');
                                      }}
                                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                      Change
                                    </button>
                                  )}
                                </div>
                              </div>

                              {codeSent && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <Clock size={16} />
                                    <span>Verification code sent. Expires in 10 minutes.</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={verificationCode}
                                      onChange={(e) => setVerificationCode(e.target.value)}
                                      placeholder="Enter 6-digit code"
                                      maxLength={6}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                      onClick={handleVerifyCode}
                                      disabled={verifyingCode || verificationCode.length !== 6}
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {verifyingCode ? 'Verifying...' : 'Verify'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SMS Alerts Toggle */}
                      <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                        <div>
                          <p className="font-medium text-gray-900">SMS Alerts</p>
                          <p className="text-sm text-gray-600">Receive SMS alerts for important updates</p>
                          {!smsSettings.phoneVerified && (
                            <p className="text-xs text-orange-600 mt-1">Phone number must be verified first</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (smsSettings.phoneVerified) {
                              setSmsSettings({ ...smsSettings, smsAlertsEnabled: !smsSettings.smsAlertsEnabled });
                            }
                          }}
                          disabled={!smsSettings.phoneVerified}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            smsSettings.smsAlertsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                          } ${!smsSettings.phoneVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              smsSettings.smsAlertsEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Alert Threshold */}
                      {smsSettings.smsAlertsEnabled && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alert Threshold</label>
                          <select
                            value={smsSettings.smsAlertThreshold}
                            onChange={(e) => setSmsSettings({ ...smsSettings, smsAlertThreshold: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="low">Low - All alerts</option>
                            <option value="medium">Medium - Important alerts only</option>
                            <option value="high">High - Critical alerts only</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <button
                          onClick={() => setSettings({ ...settings, twoFactorAuth: !settings.twoFactorAuth })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Login Alerts</p>
                          <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                        </div>
                        <button
                          onClick={() => setSettings({ ...settings, loginAlerts: !settings.loginAlerts })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.loginAlerts ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Lock size={18} />
                          <span>Change Password</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">{t('appearance')}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">{t('theme')}</label>
                        <div className="flex gap-3">
                          {[
                            { value: 'light', icon: Sun, label: t('light') },
                            { value: 'dark', icon: Moon, label: t('dark') },
                            { value: 'system', icon: Monitor, label: t('system') },
                          ].map((themeOption) => {
                            const Icon = themeOption.icon;
                            return (
                              <button
                                key={themeOption.value}
                                onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'system')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                                  theme === themeOption.value
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <Icon size={24} className={theme === themeOption.value ? 'text-blue-600' : 'text-gray-600'} />
                                <span className="text-sm font-medium">{themeOption.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('font_size')}</label>
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="small">{t('small')}</option>
                          <option value="medium">{t('medium')}</option>
                          <option value="large">{t('large')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'language' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">{t('language_region')}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select
                          value={language}
                          onChange={(e) => setAppLanguage(e.target.value as 'en' | 'hi' | 'kn' | 'ta' | 'te')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="en">English</option>
                          <option value="hi">हिंदी (Hindi)</option>
                          <option value="kn">ಕನ್ನಡ (Kannada)</option>
                          <option value="ta">தமிழ் (Tamil)</option>
                          <option value="te">తెలుగు (Telugu)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('timezone')}</label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="UTC+5:30">UTC+5:30 (India Standard Time)</option>
                          <option value="UTC+0">UTC+0 (GMT)</option>
                          <option value="UTC-5">UTC-5 (Eastern Time)</option>
                          <option value="UTC-8">UTC-8 (Pacific Time)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  {message && (
                    <div
                      className={`mb-4 p-4 rounded-lg ${
                        message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {message.text}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? t('saving') : <><Save size={18} /><span>{t('save')}</span></>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
