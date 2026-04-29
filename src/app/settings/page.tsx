'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import ProfileDrawer from '@/components/ui/ProfileDrawer';
import SettingsCard from '@/components/settings/SettingsCard';
import { User, Bell, Shield, SlidersHorizontal, Briefcase, AlertTriangle } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '@/components/common/toast/toast';
import { API_BASE_URL } from '@/lib/api-base';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthContext';
import { GlobalLoader } from '@/components/auth/GlobalLoader';

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
    whatsappNotifications: boolean;
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
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [isDangerOpen, setIsDangerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [minLoadingTimeFinished, setMinLoadingTimeFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingTimeFinished(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Danger Zone Modals
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutAllDevices, setLogoutAllDevices] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Account state (read-only from profile)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [profileData, setProfileData] = useState<any>(null);

  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);
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

  // Get candidate ID from AuthContext
  const getCandidateId = useCallback(() => {
    return user?.id || localStorage.getItem('candidateId') || sessionStorage.getItem('candidateId');
  }, [user]);

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
      const profileResponse = await fetch(`${API_BASE_URL}/profile/${candidateId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
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

      // Fetch other settings from settings API
      const settingsResponse = await fetch(`${API_BASE_URL}/settings/${candidateId}`);
      const settingsResult = await settingsResponse.json();

      if (settingsResult.success && settingsResult.data) {
        const settingsData: SettingsData = settingsResult.data;
        console.log('Settings data from API:', settingsData);
        
        // Set notifications
        setEmailNotifications(settingsData.notifications.emailNotifications ?? true);
        setSmsNotifications(settingsData.notifications.smsNotifications ?? false);
        setWhatsappNotifications(settingsData.notifications.whatsappNotifications ?? false);
        setJobAlerts(settingsData.notifications.jobAlerts ?? true);
        
        // Privacy
        setProfileVisibility(settingsData.privacy?.profileVisibility || '');
        setDataSharing(settingsData.privacy?.dataSharing ?? false);
        setLoginSessions(`${settingsData.privacy?.activeSessions || 0} active session${(settingsData.privacy?.activeSessions || 0) !== 1 ? 's' : ''}`);
        
        // Preferences
        setLanguage(settingsData.preferences?.language || '');
        setTimezone(settingsData.preferences?.timezone || '');
        setTheme(settingsData.preferences?.theme || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showErrorToast('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [getCandidateId]);

  // Load settings on mount and when auth state is ready
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/whatsapp');
        return;
      }
      fetchSettings();
    }
  }, [fetchSettings, authLoading, isAuthenticated, router]);

  const handleScrollToSection = useCallback((id: string) => {
    setActiveSection(id as any);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      // Offset for sticky header if any, otherwise just scroll
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  // Handle hash navigation on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#section-')) {
      const id = hash.replace('#section-', '');
      // Slight delay to ensure render is complete before scrolling
      setTimeout(() => {
        handleScrollToSection(id);
      }, 100);
    }
  }, [handleScrollToSection]);

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
  const updateNotificationSetting = async (key: 'emailNotifications' | 'smsNotifications' | 'whatsappNotifications' | 'jobAlerts', value: boolean) => {
    const candidateId = getCandidateId();
    if (!candidateId) return;

    // optimistic update
    if (key === 'emailNotifications') setEmailNotifications(value);
    if (key === 'smsNotifications') setSmsNotifications(value);
    if (key === 'whatsappNotifications') setWhatsappNotifications(value);
    if (key === 'jobAlerts') setJobAlerts(value);

    try {
      const payload = {
        emailNotifications: key === 'emailNotifications' ? value : emailNotifications,
        smsNotifications: key === 'smsNotifications' ? value : smsNotifications,
        whatsappNotifications: key === 'whatsappNotifications' ? value : whatsappNotifications,
        jobAlerts: key === 'jobAlerts' ? value : jobAlerts,
      };
      
      const response = await fetch(`${API_BASE_URL}/settings/notifications/${candidateId}`, {
        method: 'PUT',
        headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        showSuccessToast('Notification preferences updated');
      } else {
        showErrorToast(result.message || 'Failed to update notifications');
        // revert
        if (key === 'emailNotifications') setEmailNotifications(!value);
        if (key === 'smsNotifications') setSmsNotifications(!value);
        if (key === 'whatsappNotifications') setWhatsappNotifications(!value);
        if (key === 'jobAlerts') setJobAlerts(!value);
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
      showErrorToast('Failed to update notifications');
      // revert
      if (key === 'emailNotifications') setEmailNotifications(!value);
      if (key === 'smsNotifications') setSmsNotifications(!value);
      if (key === 'whatsappNotifications') setWhatsappNotifications(!value);
      if (key === 'jobAlerts') setJobAlerts(!value);
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
        headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
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

  const updatePrivacySetting = async (key: 'dataSharing', value: boolean) => {
    const candidateId = getCandidateId();
    if (!candidateId) return;

    if (key === 'dataSharing') setDataSharing(value);

    try {
      const payload = {
        profileVisibility,
        dataSharing: key === 'dataSharing' ? value : dataSharing,
      };
      
      const response = await fetch(`${API_BASE_URL}/settings/privacy/${candidateId}`, {
        method: 'PUT',
        headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        showSuccessToast('Privacy settings updated');
      } else {
        showErrorToast(result.message || 'Failed to update privacy');
        if (key === 'dataSharing') setDataSharing(!value);
      }
    } catch (error) {
      console.error('Error saving privacy:', error);
      showErrorToast('Failed to update privacy');
      if (key === 'dataSharing') setDataSharing(!value);
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
        headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
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
        headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
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

  // Unified logout function
  const confirmLogout = async () => {
    setLoading(true);
    try {
      await logout(logoutAllDevices);
    } finally {
      setIsLogoutModalOpen(false);
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const candidateId = getCandidateId();
    if (!candidateId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings/account/${candidateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();

      if (result.success) {
        showSuccessToast('Account deleted successfully');
        
        // Thorough cleanup
        localStorage.clear();
        sessionStorage.clear();
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        showErrorToast(result.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showErrorToast('Failed to delete account');
    } finally {
      setIsDeleteModalOpen(false);
      setLoading(false);
    }
  };

  const closeWithSuccess = (close: () => void, message: string) => {
    close();
    showSuccessToast(message);
  };



  const sectionNavItems = [
    { id: 'account', label: 'Account', icon: User, onClick: () => handleScrollToSection('account') },
    { id: 'notifications', label: 'Notifications', icon: Bell, onClick: () => handleScrollToSection('notifications') },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield, onClick: () => handleScrollToSection('privacy') },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal, onClick: () => handleScrollToSection('preferences') },
    { id: 'application', label: 'Application', icon: Briefcase, onClick: () => handleScrollToSection('application') },
    { id: 'danger', label: 'Account Controls', icon: AlertTriangle, onClick: () => handleScrollToSection('danger') },
  ] as const;

  if (!minLoadingTimeFinished) {
    return <GlobalLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-6xl mx-auto px-6 pt-2 pb-6 space-y-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            title="Go Back"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Manage your account, preferences, privacy, and application defaults.</p>
          </div>
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
            {/* Profile Data Card - Shows raw profile from backend (Hidden by request) */}
            <div id="section-account" className="space-y-6">
              {/* {profileData && (
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
                  <details className="mt-4">
                    <summary className="text-xs text-gray-500 cursor-pointer">Debug: Raw Data</summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto">{JSON.stringify(profileData, null, 2)}</pre>
                  </details>
                </div>
              )} */}

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
            </div>

            <div id="section-notifications">
              <SettingsCard
                title="Notification Preferences"
                description="Control how and where you receive updates."
                icon={<Bell className="w-5 h-5" />}
                active={activeSection === 'notifications'}
              >
                <ToggleRow label="Email Notifications" enabled={emailNotifications} onToggle={() => updateNotificationSetting('emailNotifications', !emailNotifications)} />
                <ToggleRow label="SMS Notifications" enabled={smsNotifications} onToggle={() => updateNotificationSetting('smsNotifications', !smsNotifications)} />
                <ToggleRow label="WhatsApp Notifications" enabled={whatsappNotifications} onToggle={() => updateNotificationSetting('whatsappNotifications', !whatsappNotifications)} />
                <ToggleRow label="Job Alerts" enabled={jobAlerts} onToggle={() => updateNotificationSetting('jobAlerts', !jobAlerts)} />
              </SettingsCard>
            </div>

            <div id="section-privacy">
              <SettingsCard
                title="Privacy & Security"
                description="Control profile visibility, sharing, and security visibility."
                icon={<Shield className="w-5 h-5" />}
                active={activeSection === 'privacy'}
                onEdit={() => { setActiveSection('privacy'); setIsPrivacyOpen(true); }}
              >
                <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Profile Visibility:</span> {profileVisibility}</p>
                <ToggleRow label="Data Sharing" enabled={dataSharing} onToggle={() => updatePrivacySetting('dataSharing', !dataSharing)} />
                <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Login Sessions:</span> {loginSessions}</p>
              </SettingsCard>
            </div>

            <div id="section-preferences">
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
            </div>

            <div id="section-application">
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
            </div>

            <div id="section-danger">
              <SettingsCard
                title="Account Controls"
                description="High-impact actions related to session and account lifecycle."
                icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
                active={activeSection === 'danger'}
              >
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsLogoutModalOpen(true)} 
                    disabled={loading}
                    className="flex-1 sm:flex-none h-10 px-6 rounded-lg border border-red-200 bg-white text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Logout
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsDeleteModalOpen(true)} 
                    disabled={loading}
                    className="flex-1 sm:flex-none h-10 px-6 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Delete Account'}
                  </button>
                </div>
              </SettingsCard>
            </div>
          </div>
        </div>
      </main>



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

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setIsLogoutModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-2 flex items-center gap-3 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to log out of your account?</p>
              
              <label className="flex items-center gap-3 mb-6 cursor-pointer p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={logoutAllDevices} 
                  onChange={(e) => setLogoutAllDevices(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-800">Log out from all devices</span>
              </label>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsLogoutModalOpen(false)} 
                  className="h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmLogout} 
                  className="h-10 px-5 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Confirm Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-2 flex items-center gap-3 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">Are you absolutely sure you want to delete your account?</p>
              <p className="text-sm font-medium text-red-600 mb-6 bg-red-50 p-3 rounded-lg border border-red-100">This action is permanent and cannot be undone.</p>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    handleDeleteAccount();
                  }} 
                  className="h-10 px-5 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${enabled ? 'bg-blue-500' : 'bg-gray-200'}`}
        aria-pressed={enabled}
      >
        <span className="sr-only">Toggle {label}</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}
