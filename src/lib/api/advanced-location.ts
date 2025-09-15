// Advanced Location System for Kisan Saathi AI
// Utilizes GPS, device sensors, motion detection, and continuous tracking

import type { LocationData } from './custom-geolocation';

export interface DeviceSensorData {
  orientation?: {
    alpha: number | null; // Compass heading
    beta: number | null;  // Tilt front-to-back
    gamma: number | null; // Tilt left-to-right
  };
  motion?: {
    acceleration: {
      x: number | null;
      y: number | null;
      z: number | null;
    };
    rotationRate: {
      alpha: number | null;
      beta: number | null;
      gamma: number | null;
    };
  };
  networkInfo?: {
    connection: string;
    downlink?: number;
    effectiveType?: string;
  };
}

export interface AdvancedLocationData extends LocationData {
  confidence: number; // 0-100 confidence score
  sensorData?: DeviceSensorData;
  trackingId?: string;
  lastUpdated: number;
}

export class AdvancedLocationSystem {
  private watchId: number | null = null;
  private sensorData: DeviceSensorData = {};
  private locationHistory: AdvancedLocationData[] = [];
  private isTracking = false;
  private isInitialized = false;

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.initializeSensors();
    }
  }

  private initializeSensors(): void {
    if (typeof window === 'undefined') return;
    
    this.isInitialized = true;
    
    // Device Orientation (Compass)
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', (event) => {
        this.sensorData.orientation = {
          alpha: event.alpha, // Compass heading (0-360°)
          beta: event.beta,   // Tilt front-to-back (-180 to 180°)
          gamma: event.gamma  // Tilt left-to-right (-90 to 90°)
        };
      });
    }

    // Device Motion (Accelerometer & Gyroscope)
    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', (event) => {
        this.sensorData.motion = {
          acceleration: {
            x: event.acceleration?.x || null,
            y: event.acceleration?.y || null,
            z: event.acceleration?.z || null
          },
          rotationRate: {
            alpha: event.rotationRate?.alpha || null,
            beta: event.rotationRate?.beta || null,
            gamma: event.rotationRate?.gamma || null
          }
        };
      });
    }

    // Network Information
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      this.sensorData.networkInfo = {
        connection: connection.effectiveType || 'unknown',
        downlink: connection.downlink,
        effectiveType: connection.effectiveType
      };
    }
  }

  private ensureBrowserEnvironment(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      console.warn('Advanced location system requires browser environment');
      return false;
    }
    
    if (!this.isInitialized) {
      this.initializeSensors();
    }
    
    return true;
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.ensureBrowserEnvironment()) return false;
    
    const permissions = [];

    // Request geolocation permission
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        permissions.push('geolocation');
      } catch (error) {
        console.warn('Geolocation permission denied or unavailable');
      }
    }

    // Request device orientation permission (iOS 13+)
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          permissions.push('orientation');
        }
      } catch (error) {
        console.warn('Device orientation permission denied');
      }
    }

    // Request device motion permission (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === 'granted') {
          permissions.push('motion');
        }
      } catch (error) {
        console.warn('Device motion permission denied');
      }
    }

    console.log('🔐 Advanced location permissions granted:', permissions);
    return permissions.length > 0;
  }

  async getHighAccuracyLocation(): Promise<AdvancedLocationData> {
    if (!this.ensureBrowserEnvironment()) {
      throw new Error('Browser environment required for advanced location');
    }
    
    return new Promise((resolve, reject) => {
      console.log('🎯 Requesting ULTRA-HIGH-ACCURACY location with device sensors...');

      const ultraHighAccuracyOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 45000, // 45 seconds for GPS lock
        maximumAge: 0   // Force fresh reading
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
          const timestamp = position.timestamp;

          // Calculate confidence based on accuracy and sensor data
          const confidence = this.calculateConfidence(accuracy, heading, speed);

          console.log('🛰️ ULTRA-HIGH-ACCURACY GPS location obtained:', {
            lat: latitude,
            lon: longitude,
            accuracy: accuracy ? `${accuracy}m` : 'unknown',
            altitude: altitude ? `${altitude}m` : 'unknown',
            heading: heading ? `${heading}°` : 'unknown',
            speed: speed ? `${speed}m/s` : 'unknown',
            confidence: `${confidence}%`,
            sensors: this.sensorData
          });

          try {
            // Use reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            
            let city = 'Unknown';
            let state = 'Unknown';
            
            if (response.ok) {
              const data = await response.json();
              const address = data.address || {};
              
              city = address.city || address.town || address.village || address.suburb || address.municipality || 'Unknown';
              state = address.state || address.state_district || 'Unknown';
              
              // Special handling for Delhi
              if (city.toLowerCase().includes('delhi') || state.toLowerCase().includes('delhi')) {
                city = 'Delhi';
                state = 'Delhi';
              }
            }

            const locationData: AdvancedLocationData = {
              lat: latitude,
              lon: longitude,
              city,
              state,
              country: 'India',
              accuracy: accuracy && accuracy <= 10 ? 'high' : accuracy && accuracy <= 50 ? 'medium' : 'low',
              source: 'gps',
              confidence,
              sensorData: { ...this.sensorData },
              trackingId: `gps_${Date.now()}`,
              lastUpdated: timestamp,
              metadata: {
                rawAccuracy: accuracy,
                altitude,
                heading,
                speed,
                timestamp,
                method: 'GPS + Device Sensors'
              }
            };

            this.locationHistory.push(locationData);
            console.log(`🎯 ULTRA-HIGH-ACCURACY SUCCESS: ${city}, ${state} (${accuracy}m, ${confidence}% confidence)`);
            resolve(locationData);
          } catch (error) {
            console.error('❌ Advanced location processing failed:', error);
            reject(new Error('Advanced location processing failed'));
          }
        },
        (error) => {
          let errorMessage = 'Ultra-high-accuracy GPS failed';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'GPS permission denied - please enable location services';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'GPS unavailable - please ensure location services are enabled';
              break;
            case error.TIMEOUT:
              errorMessage = 'GPS timeout - unable to get precise location';
              break;
          }
          console.error('❌ Ultra-high-accuracy GPS ERROR:', errorMessage);
          reject(new Error(errorMessage));
        },
        ultraHighAccuracyOptions
      );
    });
  }

  startContinuousTracking(callback: (location: AdvancedLocationData) => void): void {
    if (!this.ensureBrowserEnvironment()) return;
    
    if (this.isTracking) {
      console.log('📍 Continuous tracking already active');
      return;
    }

    console.log('🔄 Starting continuous high-accuracy location tracking...');
    this.isTracking = true;

    const trackingOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 10000 // 10 seconds for continuous updates
    };

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
        const timestamp = position.timestamp;
        const confidence = this.calculateConfidence(accuracy, heading, speed);

        // Only update if location has significantly changed or accuracy improved
        const lastLocation = this.locationHistory[this.locationHistory.length - 1];
        if (lastLocation) {
          const distance = this.calculateDistance(
            latitude, longitude, lastLocation.lat, lastLocation.lon
          );
          
          // Skip update if movement < 10m and accuracy hasn't improved significantly
          if (distance < 0.01 && (!accuracy || !lastLocation.metadata?.rawAccuracy || 
              accuracy >= lastLocation.metadata.rawAccuracy)) {
            return;
          }
        }

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`
          );
          
          let city = 'Unknown';
          let state = 'Unknown';
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            
            city = address.city || address.town || address.village || address.suburb || 'Unknown';
            state = address.state || address.state_district || 'Unknown';
            
            if (city.toLowerCase().includes('delhi') || state.toLowerCase().includes('delhi')) {
              city = 'Delhi';
              state = 'Delhi';
            }
          }

          const locationData: AdvancedLocationData = {
            lat: latitude,
            lon: longitude,
            city,
            state,
            country: 'India',
            accuracy: accuracy && accuracy <= 10 ? 'high' : accuracy && accuracy <= 50 ? 'medium' : 'low',
            source: 'gps',
            confidence,
            sensorData: { ...this.sensorData },
            trackingId: `track_${Date.now()}`,
            lastUpdated: timestamp,
            metadata: {
              rawAccuracy: accuracy,
              altitude,
              heading,
              speed,
              timestamp,
              method: 'Continuous GPS Tracking'
            }
          };

          this.locationHistory.push(locationData);
          
          // Keep only last 10 locations in history
          if (this.locationHistory.length > 10) {
            this.locationHistory.shift();
          }

          console.log(`📍 Location updated: ${city}, ${state} (${accuracy}m, ${confidence}% confidence)`);
          callback(locationData);
        } catch (error) {
          console.error('❌ Continuous tracking error:', error);
        }
      },
      (error) => {
        console.error('❌ Continuous tracking failed:', error.message);
      },
      trackingOptions
    );
  }

  stopContinuousTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
      console.log('⏹️ Continuous location tracking stopped');
    }
  }

  private calculateConfidence(accuracy: number | null, heading: number | null, speed: number | null): number {
    let confidence = 50; // Base confidence

    // Accuracy factor (most important)
    if (accuracy) {
      if (accuracy <= 5) confidence += 40;
      else if (accuracy <= 10) confidence += 30;
      else if (accuracy <= 20) confidence += 20;
      else if (accuracy <= 50) confidence += 10;
      else confidence -= 10;
    }

    // Heading availability (indicates GPS lock)
    if (heading !== null) confidence += 10;

    // Speed availability (indicates movement/GPS active)
    if (speed !== null) confidence += 5;

    // Sensor data availability
    if (this.sensorData.orientation?.alpha !== null) confidence += 5;
    if (this.sensorData.motion?.acceleration?.x !== null) confidence += 5;

    return Math.min(100, Math.max(0, confidence));
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  getLocationHistory(): AdvancedLocationData[] {
    return [...this.locationHistory];
  }

  getBestLocation(): AdvancedLocationData | null {
    if (this.locationHistory.length === 0) return null;
    
    // Return location with highest confidence and most recent timestamp
    return this.locationHistory.reduce((best, current) => {
      if (current.confidence > best.confidence) return current;
      if (current.confidence === best.confidence && current.lastUpdated > best.lastUpdated) return current;
      return best;
    });
  }
}

// Export singleton instance - only create in browser environment
export const advancedLocationSystem = typeof window !== 'undefined' ? new AdvancedLocationSystem() : null;
