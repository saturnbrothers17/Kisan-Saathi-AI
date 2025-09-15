/**
 * Native GPS Location Service
 * Access device's actual GPS coordinates with proper permission handling
 */

interface GPSLocationData {
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  accuracy: number;
  source: string;
  timestamp: number;
}

class NativeGPSLocation {
  
  /**
   * Request high-accuracy GPS location from device
   */
  async getCurrentGPSLocation(): Promise<GPSLocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('❌ [GPS] Geolocation not supported by this browser');
        resolve(null);
        return;
      }

      console.log('📍 [GPS] Requesting high-accuracy device location...');
      console.log('📍 [GPS] Browser geolocation support:', !!navigator.geolocation);
      console.log('📍 [GPS] User agent:', navigator.userAgent);
      console.log('📍 [GPS] Platform:', navigator.platform);
      
      const options: PositionOptions = {
        enableHighAccuracy: true,    // Use GPS instead of network location
        timeout: 30000,              // 30 second timeout
        maximumAge: 0                // Force fresh location, no cache
      };
      
      console.log('📍 [GPS] Geolocation options:', options);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('✅ [GPS] High-accuracy location obtained:', {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          });
          
          console.log('🔍 [GPS] RAW COORDINATES DEBUG:');
          console.log('🔍 [GPS] Latitude:', position.coords.latitude);
          console.log('🔍 [GPS] Longitude:', position.coords.longitude);
          console.log('🔍 [GPS] Accuracy (meters):', position.coords.accuracy);
          console.log('🔍 [GPS] Location source type: GPS/Network/Cached?');
          
          // Check if this looks like a real GPS coordinate or network approximation
          if (position.coords.accuracy > 1000) {
            console.warn('⚠️ [GPS] Low accuracy detected - might be network location instead of GPS');
          }
          
          if (position.coords.accuracy < 50) {
            console.log('✅ [GPS] High accuracy - likely real GPS coordinates');
          }

          // Get city/state from coordinates using reverse geocoding
          const locationInfo = await this.reverseGeocodeCoordinates(
            position.coords.latitude, 
            position.coords.longitude
          );

          const gpsLocation: GPSLocationData = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: locationInfo?.city || 'Unknown',
            state: locationInfo?.state || 'Unknown', 
            country: 'India',
            accuracy: position.coords.accuracy || 0,
            source: 'native_gps_high_accuracy',
            timestamp: Date.now()
          };

          console.log('🎯 [GPS] Final GPS location with city:', gpsLocation);
          resolve(gpsLocation);
        },
        (error) => {
          console.error('❌ [GPS] Location access failed:', {
            code: error.code,
            message: error.message,
            details: this.getLocationErrorDetails(error.code)
          });
          resolve(null);
        },
        options
      );
    });
  }

  /**
   * Get detailed error information
   */
  private getLocationErrorDetails(code: number): string {
    switch (code) {
      case 1:
        return 'Permission denied - User blocked location access';
      case 2:
        return 'Position unavailable - GPS/network location failed';
      case 3:
        return 'Timeout - Location request took too long';
      default:
        return 'Unknown geolocation error';
    }
  }

  /**
   * Reverse geocode GPS coordinates to get city/state
   */
  private async reverseGeocodeCoordinates(lat: number, lon: number): Promise<{city: string, state: string} | null> {
    const geocoders = [
      {
        name: 'Nominatim',
        url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        headers: {
          'User-Agent': 'KisanSaathiAI/1.0 Agricultural Weather App'
        }
      },
      {
        name: 'BigDataCloud',
        url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        headers: {}
      }
    ];

    for (const geocoder of geocoders) {
      try {
        console.log(`🔍 [GPS] Reverse geocoding with ${geocoder.name}...`);
        
        const response = await fetch(geocoder.url, {
          headers: {
            ...geocoder.headers,
            'User-Agent': geocoder.headers['User-Agent'] || 'KisanSaathiAI/1.0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`📍 [GPS] ${geocoder.name} response:`, data);

          let city = '', state = '';

          console.log(`🔍 [GPS] ${geocoder.name} FULL RESPONSE:`, JSON.stringify(data, null, 2));
          
          if (geocoder.name === 'Nominatim' && data.address) {
            city = data.address.city || data.address.town || data.address.village || data.address.hamlet || '';
            state = data.address.state || '';
            
            console.log(`🔍 [GPS] Nominatim parsed - City: "${city}", State: "${state}"`);
            console.log(`🔍 [GPS] Nominatim address object:`, data.address);
          } else if (geocoder.name === 'BigDataCloud') {
            city = data.city || data.locality || '';
            state = data.principalSubdivision || '';
            
            console.log(`🔍 [GPS] BigDataCloud parsed - City: "${city}", State: "${state}"`);
          }

          if (city && state) {
            console.log(`✅ [GPS] Successfully reverse geocoded: ${city}, ${state}`);
            return { city, state };
          } else {
            console.warn(`⚠️ [GPS] ${geocoder.name} missing city or state - City: "${city}", State: "${state}"`);
          }
        }
      } catch (error) {
        console.error(`❌ [GPS] ${geocoder.name} geocoding failed:`, error);
      }
    }

    // Fallback: Use nearest city matching from coordinates
    return this.findNearestIndianCity(lat, lon);
  }

  /**
   * Find nearest Indian city using Haversine distance
   */
  private findNearestIndianCity(lat: number, lon: number): {city: string, state: string} | null {
    const cities = [
      { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
      { name: 'Delhi', state: 'Delhi', lat: 28.7041, lon: 77.1025 },
      { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
      { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
      { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
      { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
      { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
      { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
      { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
      { name: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311 },
      { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
      { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
      { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
      { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
      { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
      { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
      { name: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
      { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812 },
      { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538 },
      { name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573 },
      { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
      { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898 },
      { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lon: 77.3178 },
      { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lon: 77.7064 },
      { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022 },
      { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
      { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lon: 74.7973 },
      { name: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lon: 75.3433 },
      { name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lon: 86.4304 },
      { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723 },
      { name: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463 },
      { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096 },
      { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
      { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864 },
      { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828 },
      { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480 },
      { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243 },
      { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198 },
      { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296 },
      { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lon: 75.8648 },
      { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
      { name: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362 },
      { name: 'Solapur', state: 'Maharashtra', lat: 17.6599, lon: 75.9064 },
      { name: 'Hubli-Dharwad', state: 'Karnataka', lat: 15.3647, lon: 75.1240 },
      { name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lon: 79.4304 }
    ];

    let nearest = null;
    let minDistance = Infinity;

    for (const city of cities) {
      const distance = this.calculateDistance(lat, lon, city.lat, city.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { city: city.name, state: city.state };
      }
    }

    if (nearest && minDistance < 100) { // 100km threshold
      console.log(`🎯 [GPS] Nearest city: ${nearest.city}, ${nearest.state} (${minDistance.toFixed(1)}km away)`);
      return nearest;
    }

    console.log(`⚠️ [GPS] No nearby city found within 100km (nearest: ${minDistance.toFixed(1)}km)`);
    return null;
  }

  /**
   * Calculate distance using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Check if geolocation permission is granted
   */
  async checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    if (!navigator.permissions) {
      return 'unsupported';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state as 'granted' | 'denied' | 'prompt';
    } catch (error) {
      console.error('❌ [GPS] Permission check failed:', error);
      return 'unsupported';
    }
  }

  /**
   * Request location permission with user-friendly prompt
   */
  async requestLocationPermission(): Promise<boolean> {
    console.log('🔐 [GPS] Requesting location permission...');
    
    const permission = await this.checkLocationPermission();
    
    if (permission === 'granted') {
      console.log('✅ [GPS] Location permission already granted');
      return true;
    }
    
    if (permission === 'denied') {
      console.log('❌ [GPS] Location permission denied');
      return false;
    }

    // Try to get location (this will trigger permission prompt)
    const location = await this.getCurrentGPSLocation();
    return location !== null;
  }
}

export const nativeGPSLocation = new NativeGPSLocation();
export type { GPSLocationData };
