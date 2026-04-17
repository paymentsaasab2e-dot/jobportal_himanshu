'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { MY_SERVICES_MOCK, type MyServiceItem, type MyServiceStatus } from '../data/my-services-mock';

interface ServicesContextType {
  requests: MyServiceItem[];
  addServiceRequest: (item: MyServiceItem) => void;
  updateServiceStatus: (id: string, status: MyServiceStatus) => void;
  updateServiceItem: (id: string, updates: Partial<MyServiceItem>) => void;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  // Initialize with our mock data so the dashboard isn't empty
  const [requests, setRequests] = useState<MyServiceItem[]>(MY_SERVICES_MOCK);

  const addServiceRequest = useCallback((item: MyServiceItem) => {
    // Add to the beginning of the list
    setRequests(prev => [item, ...prev]);
  }, []);

  const updateServiceStatus = useCallback((id: string, status: MyServiceStatus) => {
    setRequests(prev => 
      prev.map(req => req.id === id ? { ...req, status } : req)
    );
  }, []);

  const updateServiceItem = useCallback((id: string, updates: Partial<MyServiceItem>) => {
    setRequests(prev => 
      prev.map(req => req.id === id ? { ...req, ...updates } : req)
    );
  }, []);

  return (
    <ServicesContext.Provider value={{ requests, addServiceRequest, updateServiceStatus, updateServiceItem }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}
