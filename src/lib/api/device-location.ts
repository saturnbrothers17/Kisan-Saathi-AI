'use client';

// Pure native device location system - no external APIs
// Direct access to device location services only

export interface DeviceLocationData {
  lat: number;
  lon: number;
  city: string;
  state: string;
  country: string;
  accuracy: number;
  source: 'native_device' | 'fallback';
  timestamp: number;
}

export interface LocationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  unavailable: boolean;
}

class DeviceLocationService {
  private static instance: DeviceLocationService;
  private currentLocation: DeviceLocationData | null = null;
  private permissionState: LocationPermissionState = {
    granted: false,
    denied: false,
    prompt: true,
    unavailable: false
  };

  private constructor() {}

  static getInstance(): DeviceLocationService {
    if (!DeviceLocationService.instance) {
      DeviceLocationService.instance = new DeviceLocationService();
    }
    return DeviceLocationService.instance;
  }

  // Request native device location directly
  async requestDeviceLocation(): Promise<DeviceLocationData> {
    return new Promise((resolve, reject) => {
      console.log('📱 Accessing native device location...');

      // Check if device has location capabilities
      if (!('geolocation' in navigator)) {
        console.error('❌ Device location not available');
        reject(new Error('Device location not supported'));
        return;
      }

      // Access native device location with maximum accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Native device location acquired:', {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed
          });

          // Create location data with native coordinates only
          const locationData: DeviceLocationData = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: this.getCityFromCoordinates(position.coords.latitude, position.coords.longitude),
            state: this.getStateFromCoordinates(position.coords.latitude, position.coords.longitude),
            country: 'India',
            accuracy: position.coords.accuracy || 0,
            source: 'native_device',
            timestamp: Date.now()
          };

          this.currentLocation = locationData;
          this.permissionState.granted = true;
          this.permissionState.denied = false;

          console.log('🎯 Native location data:', locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('❌ Native device location failed:', error);
          
          this.permissionState.denied = error.code === 1;
          this.permissionState.granted = false;

          let errorMessage = 'Native location access failed';
          switch (error.code) {
            case 1:
              errorMessage = 'Device location access denied';
              break;
            case 2:
              errorMessage = 'Device location unavailable';
              break;
            case 3:
              errorMessage = 'Device location timeout';
              break;
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0 // Always get fresh native location
        }
      );
    });
  }

  // Get city name from coordinates using offline calculation
  private getCityFromCoordinates(lat: number, lon: number): string {
    // Indian major cities coordinates for offline matching
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
      { name: 'Thane', lat: 19.2183, lon: 72.9781 },
      { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
      { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
      { name: 'Pimpri-Chinchwad', lat: 18.6298, lon: 73.7997 },
      { name: 'Patna', lat: 25.5941, lon: 85.1376 },
      { name: 'Vadodara', lat: 22.3072, lon: 73.1812 },
      { name: 'Ghaziabad', lat: 28.6692, lon: 77.4538 },
      { name: 'Ludhiana', lat: 30.9010, lon: 75.8573 },
      { name: 'Agra', lat: 27.1767, lon: 78.0081 },
      { name: 'Nashik', lat: 19.9975, lon: 73.7898 },
      { name: 'Faridabad', lat: 28.4089, lon: 77.3178 },
      { name: 'Meerut', lat: 28.9845, lon: 77.7064 },
      { name: 'Rajkot', lat: 22.3039, lon: 70.8022 },
      { name: 'Kalyan-Dombivali', lat: 19.2403, lon: 73.1305 },
      { name: 'Vasai-Virar', lat: 19.4912, lon: 72.8054 },
      { name: 'Varanasi', lat: 25.3176, lon: 82.9739 },
      { name: 'Srinagar', lat: 34.0837, lon: 74.7973 },
      { name: 'Aurangabad', lat: 19.8762, lon: 75.3433 },
      { name: 'Dhanbad', lat: 23.7957, lon: 86.4304 },
      { name: 'Amritsar', lat: 31.6340, lon: 74.8723 },
      { name: 'Navi Mumbai', lat: 19.0330, lon: 73.0297 },
      { name: 'Allahabad', lat: 25.4358, lon: 81.8463 },
      { name: 'Ranchi', lat: 23.3441, lon: 85.3096 },
      { name: 'Howrah', lat: 22.5958, lon: 88.2636 },
      { name: 'Coimbatore', lat: 11.0168, lon: 76.9558 },
      { name: 'Jabalpur', lat: 23.1815, lon: 79.9864 }
    ];

    // Find nearest city using distance calculation
    let nearestCity = 'Current Location';
    let minDistance = Infinity;

    for (const city of indianCities) {
      const distance = this.calculateDistance(lat, lon, city.lat, city.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city.name;
      }
    }

    // If within 50km of a major city, use that city name
    if (minDistance <= 50) {
      console.log(`📍 Nearest city: ${nearestCity} (${minDistance.toFixed(1)}km away)`);
      return nearestCity;
    }

    return 'Current Location';
  }

  // Get state from coordinates using offline calculation
  private getStateFromCoordinates(lat: number, lon: number): string {
    // Indian states approximate boundaries
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
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  // Get fallback location (Mumbai instead of Delhi/Varanasi)
  // Removed fallback location - app should show error instead

  // Get cached location if available and recent
  getCachedLocation(): DeviceLocationData | null {
    if (!this.currentLocation) return null;
    
    // Cache valid for 5 minutes
    const cacheAge = Date.now() - this.currentLocation.timestamp;
    if (cacheAge > 5 * 60 * 1000) {
      this.currentLocation = null;
      return null;
    }

    return this.currentLocation;
  }

  // Clear cached location
  clearCache(): void {
    this.currentLocation = null;
    console.log('🗑️ Native location cache cleared');
  }

  // Get current permission state
  getPermissionState(): LocationPermissionState {
    return this.permissionState;
  }
}

// Export singleton instance
export const deviceLocation = DeviceLocationService.getInstance();

// Export types and service class
export { DeviceLocationService };
export default deviceLocation;
