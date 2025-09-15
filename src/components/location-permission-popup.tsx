'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, X, AlertCircle, CheckCircle } from 'lucide-react';

interface LocationPermissionPopupProps {
  isOpen: boolean;
  onLocationGranted: (location: GeolocationPosition) => void;
  onLocationDenied: () => void;
  onClose: () => void;
}

export const LocationPermissionPopup: React.FC<LocationPermissionPopupProps> = ({
  isOpen,
  onLocationGranted,
  onLocationDenied,
  onClose
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      console.log('📍 Requesting native device location permission...');
      
      if (!('geolocation' in navigator)) {
        throw new Error('Native device location is not supported');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('✅ Native device location granted:', {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              heading: pos.coords.heading,
              speed: pos.coords.speed
            });
            resolve(pos);
          },
          (err) => {
            console.error('❌ Native device location denied:', err);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
          }
        );
      });

      onLocationGranted(position);
      onClose();
      
    } catch (err: any) {
      console.error('Native location request failed:', err);
      
      let errorMessage = 'Unable to access native device location';
      if (err.code === 1) {
        errorMessage = 'Native device location access denied. Please enable location permissions.';
      } else if (err.code === 2) {
        errorMessage = 'Native device location unavailable. Please check device settings.';
      } else if (err.code === 3) {
        errorMessage = 'Native device location timeout. Please try again.';
      }
      
      setError(errorMessage);
      setTimeout(() => {
        onLocationDenied();
        onClose();
      }, 3000);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    console.log('🚫 User denied location permission');
    onLocationDenied();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-in fade-in-0 zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          title="Close location permission dialog"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MapPin className="text-blue-600" size={32} />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Enable Location Access
          </h2>
          
          <p className="text-gray-600 mb-6">
          This app needs access to your device's native location to provide accurate weather forecasts, crop prices, and farming recommendations for your specific area. Location detection is required for the app to function properly.
        </p>
          <p className="text-red-600 text-xs mt-2">
            🔄 Force refresh: Clear cache and request new location
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={requestLocation}
            disabled={isRequesting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isRequesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Getting Location...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Allow Location Access
              </>
            )}
          </button>

          <button
            onClick={handleDeny}
            disabled={isRequesting}
            className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Use Default Location (Varanasi)
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>🔒 Your location data is only used for weather and crop information</p>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionPopup;
