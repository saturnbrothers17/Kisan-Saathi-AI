'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import LocationPermissionPopup from './location-permission-popup';
import { deviceLocation, type DeviceLocationData } from '@/lib/api/device-location';

interface LocationContextType {
  location: DeviceLocationData | null;
  isLocationGranted: boolean;
  requestLocation: () => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<DeviceLocationData | null>(null);
  const [showPermissionPopup, setShowPermissionPopup] = useState(false);
  const [isLocationGranted, setIsLocationGranted] = useState(false);

  // Check for cached location on mount
  useEffect(() => {
    const checkInitialLocation = async () => {
      console.log('🔍 LocationProvider: Checking for cached location...');
      
      // Clear any existing cached location to force fresh detection
      deviceLocation.clearCache();
      
      // Always show permission popup on first load to force fresh location
      console.log('📍 LocationProvider: Requesting fresh native location permission...');
      setShowPermissionPopup(true);
    };

    checkInitialLocation();
  }, []);

  const handleLocationGranted = async (position: GeolocationPosition) => {
    console.log('✅ Native device location permission granted:', {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy
    });
    
    // Clear any cached location first
    deviceLocation.clearCache();
    
    // Create location data directly from position coordinates
    const locationData: DeviceLocationData = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      city: getCityFromCoordinates(position.coords.latitude, position.coords.longitude),
      state: getStateFromCoordinates(position.coords.latitude, position.coords.longitude),
      country: 'India',
      accuracy: position.coords.accuracy || 0,
      source: 'native_device',
      timestamp: Date.now()
    };

    console.log('🎯 Final location data:', locationData);
    setLocation(locationData);
    setIsLocationGranted(true);
    setShowPermissionPopup(false);
  };

  // Get city name from coordinates using offline calculation
  const getCityFromCoordinates = (lat: number, lon: number): string => {
    const indianCities = [
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
      { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
      { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
      { name: 'Pune', lat: 18.5204, lon: 73.8567 },
      { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
      { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
      { name: 'Surat', lat: 21.1702, lon: 72.8311 },
      { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
      { name: 'Kanpur', lat: 26.4499, lon: 80.3319 },
      { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
      { name: 'Indore', lat: 22.7196, lon: 75.8577 },
      { name: 'Varanasi', lat: 25.3176, lon: 82.9739 }
    ];

    let nearestCity = 'Current Location';
    let minDistance = Infinity;

    for (const city of indianCities) {
      const distance = calculateDistance(lat, lon, city.lat, city.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city.name;
      }
    }

    if (minDistance <= 50) {
      console.log(`📍 Nearest city: ${nearestCity} (${minDistance.toFixed(1)}km away)`);
      return nearestCity;
    }

    return 'Current Location';
  };

  // Get state from coordinates using offline calculation
  const getStateFromCoordinates = (lat: number, lon: number): string => {
    const stateRegions = [
      { name: 'Maharashtra', minLat: 15.6, maxLat: 22.0, minLon: 72.6, maxLon: 80.9 },
      { name: 'Uttar Pradesh', minLat: 23.8, maxLat: 30.4, minLon: 77.1, maxLon: 84.6 },
      { name: 'Karnataka', minLat: 11.5, maxLat: 18.4, minLon: 74.0, maxLon: 78.6 },
      { name: 'Tamil Nadu', minLat: 8.1, maxLat: 13.6, minLon: 76.2, maxLon: 80.3 },
      { name: 'West Bengal', minLat: 21.5, maxLat: 27.2, minLon: 85.8, maxLon: 89.9 },
      { name: 'Gujarat', minLat: 20.1, maxLat: 24.7, minLon: 68.2, maxLon: 74.5 },
      { name: 'Rajasthan', minLat: 23.0, maxLat: 30.2, minLon: 69.5, maxLon: 78.3 },
      { name: 'Andhra Pradesh', minLat: 12.6, maxLat: 19.9, minLon: 76.8, maxLon: 84.8 },
      { name: 'Madhya Pradesh', minLat: 21.1, maxLat: 26.9, minLon: 74.0, maxLon: 82.8 },
      { name: 'Telangana', minLat: 15.8, maxLat: 19.9, minLon: 77.3, maxLon: 81.8 },
      { name: 'Kerala', minLat: 8.2, maxLat: 12.8, minLon: 74.9, maxLon: 77.4 },
      { name: 'Punjab', minLat: 29.5, maxLat: 32.5, minLon: 73.9, maxLon: 76.9 },
      { name: 'Haryana', minLat: 27.4, maxLat: 30.9, minLon: 74.5, maxLon: 77.6 },
      { name: 'Bihar', minLat: 24.3, maxLat: 27.5, minLon: 83.3, maxLon: 88.1 },
      { name: 'Odisha', minLat: 17.8, maxLat: 22.6, minLon: 81.4, maxLon: 87.5 },
      { name: 'Jharkhand', minLat: 21.9, maxLat: 25.3, minLon: 83.3, maxLon: 87.6 },
      { name: 'Assam', minLat: 24.1, maxLat: 28.2, minLon: 89.7, maxLon: 96.0 }
    ];

    for (const state of stateRegions) {
      if (lat >= state.minLat && lat <= state.maxLat && 
          lon >= state.minLon && lon <= state.maxLon) {
        console.log(`🗺️ Detected state: ${state.name}`);
        return state.name;
      }
    }

    return 'India';
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI/180);
  };

  const handleLocationDenied = () => {
    console.log('🚫 Location permission denied');
    setLocation(null);
    setIsLocationGranted(false);
    setShowPermissionPopup(false);
  };

  const requestLocation = () => {
    console.log('🔄 Requesting fresh location...');
    deviceLocation.clearCache();
    setShowPermissionPopup(true);
  };

  const clearLocation = () => {
    console.log('🗑️ Clearing location data...');
    deviceLocation.clearCache();
    setLocation(null);
    setIsLocationGranted(false);
  };


  const contextValue: LocationContextType = {
    location,
    isLocationGranted,
    requestLocation,
    clearLocation
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
      
      <LocationPermissionPopup
        isOpen={showPermissionPopup}
        onLocationGranted={handleLocationGranted}
        onLocationDenied={handleLocationDenied}
        onClose={() => setShowPermissionPopup(false)}
      />
    </LocationContext.Provider>
  );
};

export default LocationProvider;
