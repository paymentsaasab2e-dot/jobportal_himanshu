'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-base';
import {
  getStoredCandidateId,
  getStoredToken,
  persistAuthSession,
  syncAuthStorage,
} from '@/lib/auth-storage';
import { useTabVisibilityRefresh } from '@/hooks/useTabVisibilityRefresh';
import { showSuccessToast } from '@/components/common/toast/toast';
import { getAuthContextDisplayName } from '@/components/dashboard/dashboard-utils';
import {
  PROFILE_PHOTO_UPDATED_EVENT,
  type ProfilePhotoUpdatedDetail,
} from '@/lib/profile-photo';

interface User {
  id: string;
  whatsappNumber: string;
  email?: string;
  name?: string;
  profilePhotoUrl?: string | null;
}

type LoginUserData = Partial<User> & {
  id?: string | number;
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, candidateId: string, userData?: LoginUserData) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', 
  '/whatsapp', 
  '/whatsapp/verify', 
  '/login', 
  '/signup',
  '/privacypolicy',
  '/terms',
  '/trust-safety',
  '/help',
  '/services',
  '/employers',
  '/aicveditor',
  '/apply',
  '/searchjobs',
  '/ats-check',
  '/courses',
  '/explore-jobs',
  '/aboutus',
  '/contact'
];

function buildPlaceholderUser(candidateId: string): User {
  return {
    id: candidateId,
    whatsappNumber: '',
    email: '',
    name: 'Candidate',
    profilePhotoUrl: null,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(async (logoutAll: boolean = false) => {
    const candidateId = getStoredCandidateId();
    
    if (logoutAll && candidateId) {
      try {
        await fetch(`${API_BASE_URL}/settings/logout-all/${candidateId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getStoredToken()}`
          }
        });
      } catch {
      }
    }

    showSuccessToast(logoutAll ? 'Logged out from all devices' : 'Logged out successfully');

    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setToken(null);
    
    setTimeout(() => {
      window.location.href = '/';
    }, 800);
  }, []);

  const refreshUser = useCallback(async () => {
    syncAuthStorage();
    const storedToken = getStoredToken();
    const candidateId = getStoredCandidateId();

    if (!storedToken || !candidateId) {
      setIsLoading(false);
      setToken(null);
      setUser(null);
      return;
    }

    try {
      if (token !== storedToken) setToken(storedToken);
      setUser((prev) => prev ?? buildPlaceholderUser(candidateId));

      const response = await fetch(`${API_BASE_URL}/profile/${candidateId}`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const profile = result.data;
          const personalInfo = profile.personalInfo || {};
          persistAuthSession(storedToken, candidateId);
          
          setUser({
            id: candidateId,
            whatsappNumber: profile.whatsappNumber || '',
            email: personalInfo.email || '',
            name: getAuthContextDisplayName(profile),
            profilePhotoUrl: personalInfo.profilePhotoUrl || null
          });
        } else {
          setUser((prev) => prev ?? buildPlaceholderUser(candidateId));
        }
      } else if (response.status === 401) {
        // Brief wait + one retry: session row may lag the JWT by a few ms on cold DB.
        await new Promise((r) => setTimeout(r, 400));
        const retry = await fetch(`${API_BASE_URL}/profile/${candidateId}`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (retry.ok) {
          const result = await retry.json();
          if (result.success && result.data) {
            const profile = result.data;
            const personalInfo = profile.personalInfo || {};
            setUser({
              id: candidateId,
              whatsappNumber: profile.whatsappNumber || '',
              email: personalInfo.email || '',
              name: [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ') || 'User',
              profilePhotoUrl: personalInfo.profilePhotoUrl || null,
            });
          }
        } else {
          logout();
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [logout, token]);

  const login = useCallback((newToken: string, candidateId: string, userData?: LoginUserData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('candidateId', candidateId);
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('candidateId', candidateId);

    setToken(newToken);
    // Always set a user row immediately so gated pages (e.g. candidate-dashboard)
    // can read `user.id` as `candidateId` before /profile returns. If we only
    // waited for refreshUser(), a 401 during grace (or any delay) left
    // `user` null while `token` existed — the dashboard never got a
    // candidateId, never cleared `loading`, and showed an infinite loader.
    if (userData && typeof userData === 'object' && userData.id) {
      setUser({
        id: String(userData.id),
        whatsappNumber: String(userData.whatsappNumber || ''),
        email: userData.email,
        name: userData.name || 'User',
        profilePhotoUrl: userData.profilePhotoUrl ?? null,
      });
    } else {
      setUser(buildPlaceholderUser(candidateId));
    }
    setIsLoading(false);
    // Defer profile fetch to the next macrotask so navigation from /whatsapp/verify
    // can settle first (closer to pre–package.json behaviour, fewer 401 races on cold Prisma).
    setTimeout(() => {
      void refreshUser();
    }, 0);
  }, [refreshUser]);

  const refreshUserRef = useRef(refreshUser);
  refreshUserRef.current = refreshUser;

  // Initial session check & Cross-tab sync
  useEffect(() => {
    void refreshUserRef.current();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        setToken(null);
        setUser(null);
      } else if (e.key === 'token' || e.key === 'candidateId') {
        syncAuthStorage();
        void refreshUserRef.current();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useTabVisibilityRefresh(() => {
    if (getStoredToken()) {
      void refreshUserRef.current();
    }
  }, !!token);

  useEffect(() => {
    const onProfilePhotoUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ProfilePhotoUpdatedDetail>).detail;
      if (!detail || detail.profilePhotoUrl === undefined) return;
      setUser((prev) =>
        prev ? { ...prev, profilePhotoUrl: detail.profilePhotoUrl } : prev
      );
    };

    window.addEventListener(PROFILE_PHOTO_UPDATED_EVENT, onProfilePhotoUpdated);
    return () =>
      window.removeEventListener(PROFILE_PHOTO_UPDATED_EVENT, onProfilePhotoUpdated);
  }, []);

  // Debug state changes
  useEffect(() => {
  }, [token, isLoading]);

  // Auth Guard Logic
  useEffect(() => {
    if (isLoading) return;

    // Only redirect away from the phone-entry page.
    // /whatsapp/verify manages its own post-login navigation — do NOT interfere.
    // /uploadcv is intentionally accessible post-login for new users.
    const isPublicAuthRoute = pathname === '/whatsapp';
    const isPublicRoute = PUBLIC_ROUTES.some(path => pathname === path || (path !== '/' && pathname.startsWith(path + '/')));
    
    if (!token && !isPublicRoute) {
      router.push('/whatsapp');
    } else if (token && isPublicAuthRoute) {
      router.push('/candidate-dashboard');
    }
  }, [token, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
