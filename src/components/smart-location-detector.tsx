'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface LocationData {
  city: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  source: 'GPS' | 'IP' | 'MANUAL';
  accuracy: number;
  timestamp: number;
}

interface SmartLocationDetectorProps {
  onLocationDetected: (location: LocationData) => void;
  autoDetect?: boolean;
}

export function SmartLocationDetector({ onLocationDetected, autoDetect = true }: SmartLocationDetectorProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectionMethods, setDetectionMethods] = useState<{
    gps: 'pending' | 'success' | 'failed';
  }>({
    gps: 'pending'
  });

  useEffect(() => {
    if (autoDetect) {
      detectLocation();
    }
  }, [autoDetect]);

  const detectLocation = async () => {
    setIsDetecting(true);
    setError(null);
    setDetectionMethods({ gps: 'pending' });

    try {
      // Method 1: Try GPS first (most accurate)
      const gpsLocation = await tryGPSLocation();
      if (gpsLocation) {
        setDetectionMethods(prev => ({ ...prev, gps: 'success' }));
        setDetectedLocation(gpsLocation);
        onLocationDetected(gpsLocation);
        setIsDetecting(false);
        return;
      }
      setDetectionMethods(prev => ({ ...prev, gps: 'failed' }));
      setError('GPS location detection failed. Please select your location manually.');
      
    } catch (error) {
      console.error('Location detection failed:', error);
      setError('Location detection failed. Please try manual selection.');
    } finally {
      setIsDetecting(false);
    }
  };

  const tryGPSLocation = async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      console.log('❌ Geolocation not supported');
      return null;
    }

    // Check permissions first
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      console.log('📍 Geolocation permission:', permission.state);
      
      if (permission.state === 'denied') {
        console.log('❌ Geolocation permission denied');
        setError('Location access denied. Please allow location access in your browser settings and refresh the page.');
        return null;
      }
    } catch (e) {
      console.log('⚠️ Could not check geolocation permission');
    }

    return new Promise((resolve) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 30000, // Increased timeout to 30 seconds
        maximumAge: 0 // Always get fresh location
      };

      let attempts = 0;
      const maxAttempts = 3;

      const attemptLocation = () => {
        attempts++;
        console.log(`📍 GPS attempt ${attempts}/${maxAttempts}`);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            console.log(`📍 GPS coordinates: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
            
            // Accept accuracy up to 100m for better success rate
            if (accuracy > 100) {
              console.log(`⚠️ GPS accuracy: ${accuracy}m, trying again...`);
              if (attempts < maxAttempts) {
                setTimeout(attemptLocation, 2000); // Wait 2 seconds before retry
                return;
              } else {
                console.log(`❌ GPS accuracy still poor after ${maxAttempts} attempts: ${accuracy}m`);
                resolve(null);
                return;
              }
            }

            // Try reverse geocoding to get location details
            const locationDetails = await reverseGeocode(latitude, longitude);
            
            if (locationDetails) {
              console.log(`✅ GPS location found: ${locationDetails.city}, ${locationDetails.state}`);
              resolve({
                ...locationDetails,
                lat: latitude,
                lon: longitude,
                source: 'GPS',
                accuracy: accuracy,
                timestamp: Date.now()
              });
            } else {
              console.log('❌ GPS reverse geocoding failed, trying again...');
              if (attempts < maxAttempts) {
                setTimeout(attemptLocation, 2000);
                return;
              } else {
                resolve(null);
              }
            }
          },
          (error) => {
            console.error(`GPS error (attempt ${attempts}):`, {
              code: error.code,
              message: error.message,
              PERMISSION_DENIED: error.code === 1,
              POSITION_UNAVAILABLE: error.code === 2,
              TIMEOUT: error.code === 3
            });
            
            // Set specific error message based on error code
            if (error.code === 1) {
              setError('Location access denied. Please allow location access in your browser settings.');
            } else if (error.code === 2) {
              setError('Location unavailable. Please ensure GPS is enabled and you have a clear view of the sky.');
            } else if (error.code === 3) {
              setError('Location request timed out. Please ensure GPS is enabled and try again.');
            }
            
            if (attempts < maxAttempts && error.code !== 1) { // Don't retry if permission denied
              console.log('🔄 Retrying GPS in 3 seconds...');
              setTimeout(attemptLocation, 3000);
            } else {
              console.log('❌ GPS failed after all attempts');
              resolve(null);
            }
          },
          options
        );
      };

      attemptLocation();
    });
  };

  const tryIPLocation = async (): Promise<LocationData | null> => {
    const ipServices = [
      {
        name: 'ipapi.co',
        url: 'https://ipapi.co/json/',
        parser: (data: any) => ({
          city: data.city,
          district: data.region,
          state: data.region,
          lat: parseFloat(data.latitude),
          lon: parseFloat(data.longitude)
        })
      },
      {
        name: 'ip-api.com',
        url: 'http://ip-api.com/json/',
        parser: (data: any) => ({
          city: data.city,
          district: data.regionName,
          state: data.regionName,
          lat: data.lat,
          lon: data.lon
        })
      },
      {
        name: 'ipinfo.io',
        url: 'https://ipinfo.io/json',
        parser: (data: any) => {
          const [lat, lon] = (data.loc || '0,0').split(',').map(parseFloat);
          return {
            city: data.city,
            district: data.region,
            state: data.region,
            lat: lat,
            lon: lon
          };
        }
      },
      {
        name: 'freegeoip.app',
        url: 'https://freegeoip.app/json/',
        parser: (data: any) => ({
          city: data.city,
          district: data.region_name,
          state: data.region_name,
          lat: parseFloat(data.latitude),
          lon: parseFloat(data.longitude)
        })
      }
    ];

    for (const service of ipServices) {
      try {
        console.log(`🌐 Trying IP location service: ${service.name}`);
        const response = await fetch(service.url);
        if (!response.ok) continue;
        
        const data = await response.json();
        const locationData = service.parser(data);
        
        // Validate the data and reject Delhi results
        if (locationData.city && locationData.lat && locationData.lon && 
            !isNaN(locationData.lat) && !isNaN(locationData.lon) &&
            locationData.city.toLowerCase() !== 'delhi' &&
            locationData.city.toLowerCase() !== 'new delhi') {
          
          console.log(`✅ IP location detected: ${locationData.city}, ${locationData.state}`);
          return {
            ...locationData,
            source: 'IP',
            accuracy: 5000, // IP accuracy is typically ~5km
            timestamp: Date.now()
          };
        } else {
          console.log(`❌ ${service.name} returned Delhi or invalid data, trying next service`);
        }
      } catch (error) {
        console.error(`IP service ${service.name} failed:`, error);
        continue;
      }
    }
    
    console.log('❌ All IP services failed or returned Delhi');
    return null;
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<{city: string, district: string, state: string} | null> => {
    try {
      // Try OpenStreetMap Nominatim (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const address = data.address;
      
      return {
        city: address.city || address.town || address.village || address.hamlet || 'Unknown City',
        district: address.state_district || address.county || address.city || 'Unknown District',
        state: address.state || 'Unknown State'
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'failed') => {
    switch (status) {
      case 'pending': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: 'pending' | 'success' | 'failed') => {
    switch (status) {
      case 'pending': return 'Detecting...';
      case 'success': return 'Success';
      case 'failed': return 'Failed';
    }
  };

  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span>🎯 Smart Location Detection</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Detection Methods Status */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Detection Methods:</div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
              <div className="flex items-center space-x-2">
                {getStatusIcon(detectionMethods.gps)}
                <span className="text-sm">📡 GPS Location</span>
              </div>
              <Badge variant={detectionMethods.gps === 'success' ? 'default' : 'secondary'}>
                {getStatusText(detectionMethods.gps)}
              </Badge>
            </div>
            
            
          </div>
        </div>

        {/* Detected Location */}
        {detectedLocation && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-sm font-medium text-green-800 mb-2">✅ Location Detected</div>
            <div className="space-y-1 text-sm text-green-700">
              <div>📍 {detectedLocation.city}, {detectedLocation.district}</div>
              <div>🗺️ {detectedLocation.state}</div>
              <div>📊 Source: {detectedLocation.source}</div>
              <div>🎯 Accuracy: {Math.round(detectedLocation.accuracy)}m</div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="text-sm font-medium text-red-800 mb-1">❌ Detection Failed</div>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            onClick={detectLocation} 
            disabled={isDetecting}
            className="flex-1"
            variant="default"
          >
            {isDetecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Detection
              </>
            )}
          </Button>
        </div>

        {/* GPS Guidance */}
        {error && (
          <div className="text-xs text-red-600 text-center bg-red-50 p-2 rounded border border-red-200">
            ⚠️ {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
