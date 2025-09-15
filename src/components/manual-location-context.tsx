/**
 * Manual Location Context
 * Provides manual location selection across the entire app
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { uttarPradeshCities, getMajorUPCities, searchUPCities, type UPCity } from '@/data/uttar-pradesh-cities';

interface ManualLocation {
  city: string;
  district: string;
  lat: number;
  lon: number;
  timestamp: number;
}

interface ManualLocationContextType {
  location: ManualLocation | null;
  setLocation: (location: ManualLocation) => void;
  clearLocation: () => void;
  isLocationSet: boolean;
}

const ManualLocationContext = createContext<ManualLocationContextType | undefined>(undefined);

interface ManualLocationProviderProps {
  children: ReactNode;
}

export function ManualLocationProvider({ children }: ManualLocationProviderProps) {
  const [location, setLocationState] = useState<ManualLocation | null>(null);
  const [isLocationSet, setIsLocationSet] = useState(false);

  // Load saved location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('app-manual-location');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setLocationState(parsedLocation);
        setIsLocationSet(true);
        console.log('📍 Loaded saved manual location:', parsedLocation.city, parsedLocation.district);
      } catch (error) {
        console.error('Failed to load saved location:', error);
        localStorage.removeItem('app-manual-location');
      }
    }
  }, []);

  const setLocation = (newLocation: ManualLocation) => {
    const locationWithTimestamp = {
      ...newLocation,
      timestamp: Date.now()
    };
    
    setLocationState(locationWithTimestamp);
    setIsLocationSet(true);
    
    // Save to localStorage
    localStorage.setItem('app-manual-location', JSON.stringify(locationWithTimestamp));
    console.log('📍 Manual location set:', locationWithTimestamp.city, locationWithTimestamp.district);
  };

  const clearLocation = () => {
    setLocationState(null);
    setIsLocationSet(false);
    localStorage.removeItem('app-manual-location');
    console.log('📍 Manual location cleared');
  };

  return (
    <ManualLocationContext.Provider value={{
      location,
      setLocation,
      clearLocation,
      isLocationSet
    }}>
      {children}
    </ManualLocationContext.Provider>
  );
}

export function useManualLocation() {
  const context = useContext(ManualLocationContext);
  if (context === undefined) {
    throw new Error('useManualLocation must be used within a ManualLocationProvider');
  }
  return context;
}
