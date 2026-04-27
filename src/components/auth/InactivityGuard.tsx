'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, LogOut, ShieldCheck } from 'lucide-react';

// Configuration
const IDLE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours of inactivity
const WARNING_TIMEOUT = 2 * 60 * 1000; // 2 minutes warning before logout
const CHECK_INTERVAL = 1000; // Check every second

export const InactivityGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(WARNING_TIMEOUT / 1000);
  
  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetActivity = useCallback((isManual: boolean = false) => {
    const now = Date.now();
    
    // If warning is shown, only manual clicks on the modal buttons can reset the timer
    if (showWarning && !isManual) return;
    
    // Throttle resets for performance, but always allow manual ones
    if (!isManual && now - lastActivityRef.current < 500) return;
    
    lastActivityRef.current = now;
    
    if (showWarning && isManual) {
      setShowWarning(false);
      setRemainingTime(WARNING_TIMEOUT / 1000);
    }
  }, [showWarning]);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    logout();
  }, [logout]);

  const stayLoggedIn = useCallback(() => {
    resetActivity(true); // Pass true to indicate manual reset
    setShowWarning(false);
  }, [resetActivity]);

  const isFirstAuth = useRef(true);

  // Reset activity timer when user logs in to prevent immediate logout
  useEffect(() => {
    if (isAuthenticated && isFirstAuth.current) {
      resetActivity();
      isFirstAuth.current = false;
    } else if (!isAuthenticated) {
      isFirstAuth.current = true;
    }
  }, [isAuthenticated, resetActivity]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleEvent = () => resetActivity(false);
    
    events.forEach(event => document.addEventListener(event, handleEvent));

    const checkIdle = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;

      if (idleTime >= IDLE_TIMEOUT - WARNING_TIMEOUT && !showWarning) {
        setShowWarning(true);
      }

      if (idleTime >= IDLE_TIMEOUT) {
        handleLogout();
      }
    }, CHECK_INTERVAL);

    return () => {
      events.forEach(event => document.removeEventListener(event, handleEvent));
      clearInterval(checkIdle);
    };
  }, [isAuthenticated, resetActivity, showWarning, handleLogout]);

  useEffect(() => {
    if (showWarning) {
      countdownIntervalRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setRemainingTime(WARNING_TIMEOUT / 1000);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning]);

  return (
    <>
      {children}
      
      <AnimatePresence>
        {showWarning && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
                <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-2">Session Expiring</h3>
              <p className="text-[15px] font-medium text-slate-500 mb-8 px-4 leading-relaxed">
                You've been inactive for a while. For your security, we'll log you out in 
                <span className="text-amber-600 font-bold ml-1">{remainingTime} seconds</span>.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={stayLoggedIn}
                  className="w-full h-14 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-2xl shadow-lg shadow-sky-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Stay Logged In
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full h-14 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Logout Now
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Security Protection Active
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
