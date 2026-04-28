'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-base';
import { showSuccessToast, showErrorToast } from '@/components/common/toast/toast';

interface User {
  id: string;
  whatsappNumber: string;
  email?: string;
  name?: string;
  profilePhotoUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, candidateId: string, userData?: any) => void;
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
  '/searchjobs',
  '/ats-check',
  '/courses',
  '/explore-jobs',
  '/aboutus',
  '/contact'
];

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
    console.log('AuthContext: Logout called. Global:', logoutAll);
    const candidateId = localStorage.getItem('candidateId') || sessionStorage.getItem('candidateId');
    
    if (logoutAll && candidateId) {
      try {
        await fetch(`${API_BASE_URL}/settings/logout-all/${candidateId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          }
        });
      } catch (error) {
        console.error('Error logging out of all devices:', error);
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
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const candidateId = localStorage.getItem('candidateId') || sessionStorage.getItem('candidateId');

    console.log(`AuthContext: Refreshing user. Token present: ${!!storedToken}, CandidateId: ${candidateId}`);

    if (!storedToken || !candidateId) {
      console.log('AuthContext: No session found in storage.');
      setIsLoading(false);
      setToken(null);
      return;
    }

    try {
      // Synchronize state with storage immediately
      if (token !== storedToken) setToken(storedToken);

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
          
          setUser({
            id: candidateId,
            whatsappNumber: profile.whatsappNumber || '',
            email: personalInfo.email || '',
            name: [personalInfo.firstName, personalInfo.lastName].filter(Boolean).join(' ') || 'User',
            profilePhotoUrl: personalInfo.profilePhotoUrl || null
          });
          console.log('AuthContext: Profile sync successful.');
        }
      } else if (response.status === 401) {
        console.warn('AuthContext: Token rejected by server (401).');
        logout();
      }
    } catch (error) {
      console.error('AuthContext: Profile fetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [logout, token]);

  const login = useCallback((newToken: string, candidateId: string, userData?: any) => {
    console.log('AuthContext: Login called for', candidateId);
    localStorage.setItem('token', newToken);
    localStorage.setItem('candidateId', candidateId);
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('candidateId', candidateId);
    
    setToken(newToken);
    if (userData) {
      setUser(userData);
    } else {
      refreshUser();
    }
  }, [refreshUser]);

  // Initial session check & Cross-tab sync
  useEffect(() => {
    console.log('AuthContext: Initial mount, checking session...');
    refreshUser();

    // Sync logout across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        console.log('AuthContext: Logout detected in another tab');
        setToken(null);
        setUser(null);
        // The Auth Guard effect (line 145) will handle the redirection
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // Only on mount

  // Debug state changes
  useEffect(() => {
    console.log(`AuthContext: State updated - isAuthenticated: ${!!token}, isLoading: ${isLoading}`);
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
      console.log('AuthContext: Protecting route, redirecting to login');
      router.push('/whatsapp');
    } else if (token && isPublicAuthRoute) {
      console.log('AuthContext: Already logged in, redirecting to dashboard');
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
