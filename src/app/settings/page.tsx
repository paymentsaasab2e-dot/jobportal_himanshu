'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';
import ProfileDrawer from '@/components/ui/ProfileDrawer';
import SettingsCard from '@/components/settings/SettingsCard';
import { User, Bell, Shield, SlidersHorizontal, Briefcase, AlertTriangle } from 'lucide-react';
import { showSuccessToast } from '@/components/common/toast/toast';

export default function SettingsPage() {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [isDangerOpen, setIsDangerOpen] = useState(false);

  const [email, setEmail] = useState('candidate@saasa.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [accountStatus, setAccountStatus] = useState('Active');
  const [passwordHint, setPasswordHint] = useState('Last changed 30 days ago');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [jobAlerts, setJobAlerts] = useState(true);

  const [profileVisibility, setProfileVisibility] = useState('Recruiters only');
  const [dataSharing, setDataSharing] = useState(false);
  const [loginSessions] = useState('2 active sessions');

  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Asia/Kolkata (UTC+05:30)');
  const [theme, setTheme] = useState('System');

  const [defaultResume, setDefaultResume] = useState('Resume_2026.pdf');
  const [jobPreferenceDefaults, setJobPreferenceDefaults] = useState('Software Engineer, Remote');
  const [activeSection, setActiveSection] = useState<'account' | 'notifications' | 'privacy' | 'preferences' | 'application' | 'danger'>('account');

  const closeWithSuccess = (close: () => void, message: string) => {
    close();
    showSuccessToast(message);
  };

  const sectionNavItems = [
    { id: 'account', label: 'Account', icon: User, onClick: () => { setActiveSection('account'); setIsAccountOpen(true); } },
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
            <SettingsCard
              title="Account Settings"
              description="Update your core account details and login information."
              icon={<User className="w-5 h-5" />}
              active={activeSection === 'account'}
              onEdit={() => { setActiveSection('account'); setIsAccountOpen(true); }}
            >
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Email:</span> {email}</p>
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Phone:</span> {phone}</p>
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Account Status:</span> {accountStatus}</p>
              <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">Password:</span> {passwordHint}</p>
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
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        title="Edit Account Settings"
        widthClassName="w-full md:w-[520px]"
        footer={(
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsAccountOpen(false)} className="h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={() => closeWithSuccess(() => setIsAccountOpen(false), 'Account settings updated')} className="h-10 px-5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600">Save Changes</button>
          </div>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-600">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-gray-600">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-600">Account Status</label><input value={accountStatus} onChange={(e) => setAccountStatus(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-600">Password</label><input value={passwordHint} onChange={(e) => setPasswordHint(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 px-3 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </ProfileDrawer>

      <ProfileDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Edit Notification Preferences"
        widthClassName="w-full md:w-[520px]"
        footer={(
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsNotificationsOpen(false)} className="h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={() => closeWithSuccess(() => setIsNotificationsOpen(false), 'Notification preferences updated')} className="h-10 px-5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600">Save Changes</button>
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
            <button onClick={() => closeWithSuccess(() => setIsPrivacyOpen(false), 'Privacy settings updated')} className="h-10 px-5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600">Save Changes</button>
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
            <button onClick={() => closeWithSuccess(() => setIsPreferencesOpen(false), 'Preferences updated')} className="h-10 px-5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600">Save Changes</button>
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
            <button onClick={() => closeWithSuccess(() => setIsApplicationOpen(false), 'Application settings updated')} className="h-10 px-5 rounded-lg bg-orange-500 text-sm font-medium text-white hover:bg-orange-600">Save Changes</button>
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
            <p className="text-sm font-medium text-gray-900">Logout</p>
            <p className="text-xs text-gray-500 mt-1">End your current session on this device.</p>
            <button type="button" className="mt-3 h-10 px-5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Logout</button>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">Delete Account</p>
            <p className="text-xs text-red-600 mt-1">This action is permanent and cannot be undone.</p>
            <button type="button" className="mt-3 h-10 px-5 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700">Delete Account</button>
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
