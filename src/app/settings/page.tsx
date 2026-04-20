'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/common/Header';
import ProfileDrawer from '@/components/ui/ProfileDrawer';
import SettingsCard from '@/components/settings/SettingsCard';
import { User, Bell, Shield, SlidersHorizontal, Briefcase, AlertTriangle } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/components/common/toast/toast';
import { API_BASE_URL } from '@/lib/api-base';

interface SettingsData {
  account: {
    email: string;
    phone: string;
    countryCode: string;
    accountStatus: string;
    lastPasswordChange: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    jobAlerts: boolean;
  };
  privacy: {
    profileVisibility: string;
    dataSharing: boolean;
    activeSessions: number;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: string;
  };
  application: {
    defaultResume: string;
    jobPreferenceDefaults: string;
  };
}

export default function SettingsPage() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [isDangerOpen, setIsDangerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Account state (read-only from profile)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [profileData, setProfileData] = useState<any>(null);

  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [jobAlerts, setJobAlerts] = useState(true);

  // Privacy state
  const [profileVisibility, setProfileVisibility] = useState('Recruiters only');
  const [dataSharing, setDataSharing] = useState(false);
  const [loginSessions, setLoginSessions] = useState('0 active sessions');

  // Preferences state
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Asia/Kolkata (UTC+05:30)');
  const [theme, setTheme] = useState('System');

  // Application state
  const [defaultResume, setDefaultResume] = useState('No resume uploaded');
  const [jobPreferenceDefaults, setJobPreferenceDefaults] = useState('Not set');
  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'privacy' | 'preferences' | 'application' | 'danger'>('account');

  // Get candidate ID from sessionStorage (same as profile page)
  const getCandidateId = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('candidateId');
  }, []);

  // Fetch settings from backend
  const fetchSettings = useCallback(async () => {
    const candidateId = getCandidateId();
    if (!candidateId) {
      showErrorToast('Please log in to view settings');
      return;
    }

    setLoading(true);
    try {
      // Fetch account data from profile API directly
      const profileResponse = await fetch(`${API_BASE_URL}/profile/${candidateId}`);
      const profileResult = await profileResponse.json();

      if (profileResult.success && profileResult.data) {
        const data = profileResult.data;
        console.log('Full API response data:', JSON.stringify(data, null, 2));

        // Data is in personalInfo, not profile
        const personalInfo = data.personalInfo || {};
        console.log('personalInfo:', personalInfo);
        
        const fullName = [personalInfo.firstName, personalInfo.middleName, personalInfo.lastName].filter(Boolean).join(' ');
        const emailValue = personalInfo.email || '';
        const phoneValue = personalInfo.phone || '';
        
        console.log('Setting fullName to:', fullName);
        console.log('Setting email to:', emailValue);
        console.log('Setting phone to:', phoneValue);
        
        setEmail(emailValue);
        setPhone(phoneValue);
        setCountryCode(personalInfo.phoneCode?.split(' ')[0] || '+91');
        setAccountStatus(data.status || 'Active');
        
        // Store personalInfo for display in Profile card
        setProfileData({
          fullName: fullName,
          email: emailValue,
          phoneNumber: phoneValue,
          city: personalInfo.city || '',
          country: personalInfo.country || ''
        });
        
        // Application settings from profile
        setDefaultResume(data.resume?.fileUrl ? data.resume.fileUrl.split('/').pop() : 'No resume uploaded');
        setJobPreferenceDefaults(data.careerPreferences?.preferredJobTitle || 'Not set');
      }

      // Fetch other settings from settings API (commented out temporarily for debugging)
      // const settingsResponse = await fetch(`${API_BASE_URL}/settings/${candidateId}`);
      // const settingsResult = await settingsResponse.json();

      // if (settingsResult.success && settingsResult.data) {
      //   const data: SettingsData = settingsResult.data;
      //   console.log('Settings data from API:', data);
      //   console.log('Settings account:', data.account);
      //   
      //   // Notifications
      //   setEmailNotifications(data.notifications?.emailNotifications ?? true);
      //   setSmsNotifications(data.notifications?.smsNotifications ?? false);
      //   setJobAlerts(data.notifications?.jobAlerts ?? true);
      //   
      //   // Privacy
      //   setProfileVisibility(data.privacy?.profileVisibility || '');
      //   setDataSharing(data.privacy?.dataSharing ?? false);
      //   setLoginSessions(`${data.privacy?.activeSessions || 0} active session${(data.privacy?.activeSessions || 0) !== 1 ? 's' : ''}`);
      //   
      //   // Preferences
      //   setLanguage(data.preferences?.language || '');
      //   setTimezone(data.preferences?.timezone || '');
      //   setTheme(data.preferences?.theme || '');
      // }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showErrorToast('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [getCandidateId]);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Debug: log when email/phone change
  useEffect(() => {
    console.log('Email state changed to:', email);
  }, [email]);

  useEffect(() => {
    console.log('Phone state changed to:', phone);
  }, [phone]);

  useEffect(() => {
    console.log('profileData changed:', profileData);
  }, [profileData]);

  // Save notification settings
  const saveNotificationSettings = async () => {
    const candidateId = getCandidateId();
    if (!candidateId) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings/notifications/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailNotifications, smsNotifications, jobAlerts }),
      });
      const result = await response.json();

      if (result.success) {
        showSuccessToast('Notification preferences updated');
        setIsNotificationsOpen(false);
      } else {
        showErrorToast(result.message || 'Failed to update notifications');
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
      showErrorToast('Failed to update notifications');
    } finally {
      setSaving(false);
    }
  };

  // Save privacy settings
  const savePrivacySettings = async () => {
    const candidateId = getCandidateId();
    if (!candidateId) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings/privacy/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileVisibility, dataSharing }),
      });
      const result = await response.json();

      if (result.success) {
        showSuccessToast('Privacy settings updated');
        setIsPrivacyOpen(false);
      } else {
        showErrorToast(result.message || 'Failed to update privacy');
      }
    } catch (error) {
      console.error('Error saving privacy:', error);
      showErrorToast('Failed to update privacy');
    } finally {
      setSaving(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    const candidateId = getCandidateId();
    if (!candidateId) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings/preferences/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, timezone, theme }),
      });
      const result = await response.json();

      if (result.success) {
        showSuccessToast('Preferences updated');
        setIsPreferencesOpen(false);
      } else {
        showErrorToast(result.message || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showErrorToast('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  // Save application settings
  const saveApplicationSettings = async () => {
    const candidateId = getCandidateId();
    if (!candidateId) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings/application/${candidateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobPreferenceDefaults }),
      });
      const result = await response.json();

      if (result.success) {
        showSuccessToast('Application settings updated');
        setIsApplicationOpen(false);
      } else {
        showErrorToast(result.message || 'Failed to update application settings');
      }
    } catch (error) {
      console.error('Error saving application settings:', error);
      showErrorToast('Failed to update application settings');
    } finally {
      setSaving(false);
    }
  };

  // Logout all sessions
  const handleLogoutAll = async () => {
    const candidateId = getCandidateId();
    if (!candidateId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/settings/logout-all/${candidateId}`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        showSuccessToast('Logged out from all sessions');
        setLoginSessions('0 active sessions');
      } else {
        showErrorToast(result.message || 'Failed to logout');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      showErrorToast('Failed to logout');
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const candidateId = getCandidateId();
    if (!candidateId) return;

    if (!confirm('Are you sure you want to delete your account? This action is permanent and cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/settings/account/${candidateId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        showSuccessToast('Account deleted successfully');
        // Clear local storage and redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        showErrorToast(result.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showErrorToast('Failed to delete account');
    }
  };

  const closeWithSuccess = (close: () => void, message: string) => {
    close();
    showSuccessToast(message);
  };

  const sectionNavItems = [
    { id: 'account', label: 'Account', icon: User, onClick: () => setActiveSection('account') },
    { id: 'notifications', label: 'Notifications', icon: Bell, onClick: () => { setActiveSection('notifications'); setIsNotificationsOpen(true); } },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield, onClick: () => { setActiveSection('privacy'); setIsPrivacyOpen(true); } },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal, onClick: () => { setActiveSection('preferences'); setIsPreferencesOpen(true); } },
    { id: 'application', label: 'Application', icon: Briefcase, onClick: () => { setActiveSection('application'); setIsApplicationOpen(true); } },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, onClick: () => { setActiveSection('danger'); setIsDangerOpen(true); } },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account, preferences, privacy, and application defaults.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          <aside className="md:sticky md:top-20 h-fit rounded-xl border border-gray-200 bg-white p-3">
            <nav className="space-y-1">
              {sectionNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ${
                      active
                        ? 'bg-gray-100 font-semibold text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-6">
            {/* Profile Data Card - Shows raw profile from backend */}
            {profileData && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">Profile Information</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-sm"><span className="font-medium text-gray-700">Full Name:</span> <span className="text-gray-900">{profileData.fullName || '—'}</span></p>
                  <p className="text-sm"><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{profileData.email || '—'}</span></p>
                  <p className="text-sm"><span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-900">{profileData.phoneNumber || '—'}</span></p>
                  <p className="text-sm"><span className="font-medium text-gray-700">City:</span> <span className="text-gray-900">{profileData.city || '—'}</span></p>
                  <p className="text-sm"><span className="font-medium text-gray-700">Country:</span> <span className="text-gray-900">{profileData.country || '—'}</span></p>
                </div>
                {/* Debug: Show raw data */}
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer">Debug: Raw Data</summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-auto">{JSON.stringify(profileData, null, 2)}</pre>
                </details>
              </div>
            )}

            <SettingsCard
              title="Account Settings"
              description="Your core account details and login information."
              icon={<User className="w-5 h-5" />}
              active={activeSection === 'account'}
            >
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Email:</span> {email || <span className="text-gray-400 italic">Not provided</span>}</p>
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Phone:</span> {phone || <span className="text-gray-400 italic">Not provided</span>}</p>
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Account Status:</span> {accountStatus || 'Active'}</p>
            </SettingsCard>

            <SettingsCard
              title="Notification Preferences"
              description="Control how and where you receive updates."
              icon={<Bell className="w-5 h-5" />}
              active={activeSection === 'notifications'}
              onEdit={() => { setActiveSection('notifications'); setIsNotificationsOpen(true); }}
            >
              <ToggleRow label="Email Notifications" enabled={emailNotifications} onToggle={() => setEmailNotifications((v) => !v)} />
              <ToggleRow label="SMS Notifications" enabled={smsNotifications} onToggle={() => setSmsNotifications((v) => !v)} />
              <ToggleRow label="Job Alerts" enabled={jobAlerts} onToggle={() => setJobAlerts((v) => !v)} />
            </SettingsCard>

            <SettingsCard
              title="Privacy & Security"
              description="Control profile visibility, sharing, and security visibility."
              icon={<Shield className="w-5 h-5" />}
              active={activeSection === 'privacy'}
              onEdit={() => { setActiveSection('privacy'); setIsPrivacyOpen(true); }}
            >
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Profile Visibility:</span> {profileVisibility}</p>
              <ToggleRow label="Data Sharing" enabled={dataSharing} onToggle={() => setDataSharing((v) => !v)} />
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Login Sessions:</span> {loginSessions}</p>
            </SettingsCard>

            <SettingsCard
              title="Preferences"
              description="Set language, timezone, and theme behavior."
              icon={<SlidersHorizontal className="w-5 h-5" />}
              active={activeSection === 'preferences'}
              onEdit={() => { setActiveSection('preferences'); setIsPreferencesOpen(true); }}
            >
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Language:</span> {language}</p>
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Timezone:</span> {timezone}</p>
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Theme:</span> {theme}</p>
            </SettingsCard>

            <SettingsCard
              title="Application Settings"
              description="Set your default resume and default job preference profile."
              icon={<Briefcase className="w-5 h-5" />}
              active={activeSection === 'application'}
              onEdit={() => { setActiveSection('application'); setIsApplicationOpen(true); }}
            >
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Default Resume:</span> {defaultResume}</p>
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Job Preference Defaults:</span> {jobPreferenceDefaults}</p>
            </SettingsCard>

            <SettingsCard
              title="Danger Zone"
              description="High-impact actions related to session and account lifecycle."
              icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
              active={activeSection === 'danger'}
              onEdit={() => { setActiveSection('danger'); setIsDangerOpen(true); }}
            >
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-600 font-medium">Logout from this device.</p>
                <p className="text-sm text-red-600 font-semibold hover:underline mt-1">Delete account permanently.</p>
              </div>
            </SettingsCard>
          </div>
        </div>
      </main>

      <ProfileDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Edit Notification Preferences"
        widthClassName="w-full md:w-[520px]"
        footer={(
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsNotificationsOpen(false)} className="h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={saveNotificationSettings} disabled={saving} className="h-10 px-5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        )}
      >
        <div className="space-y-4">
          <ToggleRow label="Email Notifications" enabled={emailNotifications} onToggle={() => setEmailNotifications((v) => !v)} />
          <ToggleRow label="SMS Notifications" enabled={smsNotifications} onToggle={() => setSmsNotifications((v) => !v)} />
          <ToggleRow label="Job Alerts" enabled={jobAlerts} onToggle={() => setJobAlerts((v) => !v)} />
        </div>
      </ProfileDrawer>

      <ProfileDrawer
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        title="Edit Privacy & Security"
        widthClassName="w-full md:w-[520px]"
        footer={(
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsPrivacyOpen(false)} className="h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={savePrivacySettings} disabled={saving} className="h-10 px-5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-600">Profile Visibility</label><input value={profileVisibility} onChange={(e) => setProfileVisibility(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div className="md:col-span-2"><ToggleRow label="Data Sharing" enabled={dataSharing} onToggle={() => setDataSharing((v) => !v)} /></div>
          <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-600">Login Sessions (view only)</label><input value={loginSessions} readOnly className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 text-gray-600" /></div>
        </div>
      </ProfileDrawer>

      <ProfileDrawer
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        title="Edit Preferences"
        widthClassName="w-full md:w-[520px]"
        footer={(
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsPreferencesOpen(false)} className="h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={savePreferences} disabled={saving} className="h-10 px-5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-600">Language</label><input value={language} onChange={(e) => setLanguage(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-600">Timezone</label><input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-600">Theme</label><input value={theme} onChange={(e) => setTheme(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </ProfileDrawer>

      <ProfileDrawer
        isOpen={isApplicationOpen}
        onClose={() => setIsApplicationOpen(false)}
        title="Edit Application Settings"
        widthClassName="w-full md:w-[520px]"
        footer={(
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsApplicationOpen(false)} className="h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={saveApplicationSettings} disabled={saving} className="h-10 px-5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-600">Default Resume</label><input value={defaultResume} onChange={(e) => setDefaultResume(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-600">Job Preference Defaults</label><textarea value={jobPreferenceDefaults} onChange={(e) => setJobPreferenceDefaults(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[100px] resize-none focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </ProfileDrawer>

      <ProfileDrawer
        isOpen={isDangerOpen}
        onClose={() => setIsDangerOpen(false)}
        title="Danger Zone"
        widthClassName="w-full md:w-[520px]"
        footer={(
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsDangerOpen(false)} className="h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={() => setIsDangerOpen(false)} className="h-10 px-5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600">Save Changes</button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">Logout All Sessions</p>
            <p className="text-xs text-gray-500 mt-1">End all active sessions across all devices.</p>
            <button type="button" onClick={handleLogoutAll} className="mt-3 h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Logout All</button>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">Delete Account</p>
            <p className="text-xs text-red-600 mt-1">This action is permanent and cannot be undone.</p>
            <button type="button" onClick={handleDeleteAccount} className="mt-3 h-10 px-5 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700">Delete Account</button>
          </div>
        </div>
      </ProfileDrawer>

    </div>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-6 w-10 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
        aria-pressed={enabled}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}
