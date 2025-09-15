'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Droplets, Wind, Eye, Thermometer, Sun, CloudRain, Cloud, AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchWeatherData, type WeatherData } from '@/lib/api/weather-api';

export function DirectWeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lon: number, city: string} | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced location detection with multiple fallback methods
  const getLocationWithFallback = async (): Promise<GeolocationPosition | null> => {
    // Method 1: High-accuracy GPS
    try {
      console.log('🎯 Trying high-accuracy GPS...');
      return await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000
          }
        );
      });
    } catch (error) {
      console.log('❌ High-accuracy GPS failed:', error);
    }

    // Method 2: Standard GPS with longer timeout
    try {
      console.log('📡 Trying standard GPS...');
      return await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 300000
          }
        );
      });
    } catch (error) {
      console.log('❌ Standard GPS failed:', error);
    }

    // Method 3: IP-based geolocation fallback
    try {
      console.log('🌐 Trying IP-based geolocation...');
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        console.log('✅ IP geolocation successful:', data.city, data.region);
        // Create a mock GeolocationPosition object
        return {
          coords: {
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: 10000, // IP location is less accurate
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        } as GeolocationPosition;
      }
    } catch (error) {
      console.log('❌ IP geolocation failed:', error);
    }

    return null;
  };

  const getLocationAndWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌍 DirectWeatherWidget: Getting location...');
      
      // Try multiple location methods for better accuracy
      const position = await getLocationWithFallback();
      
      if (!position) {
        throw new Error('Unable to get location from any source');
      }
      
      console.log('✅ DirectWeatherWidget: Got coordinates:', {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
      
      const nearestCity = getNearestCity(position.coords.latitude, position.coords.longitude);
      
      const locationData = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        city: nearestCity
      };
      
      setLocation(locationData);
      console.log('📍 DirectWeatherWidget: Using location:', locationData);
      
      const weatherData = await fetchWeatherData(locationData.lat, locationData.lon);
      
      if (weatherData) {
        setWeather(weatherData);
        console.log(`📍 Weather loaded for ${nearestCity}`);
      } else {
        throw new Error('No weather data received');
      }
    } catch (err: any) {
      console.error('❌ DirectWeatherWidget: Location/Weather failed:', err);
      
      let errorMessage = 'Weather data unavailable';
      
      if (err.code === 1) {
        errorMessage = 'Location access denied. Please allow location access for accurate weather.';
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable. Please check your GPS settings.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timeout. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const getNearestCity = (lat: number, lon: number): string => {
    const cities = [
      { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
      { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
      { name: 'Pune', lat: 18.5204, lon: 73.8567 },
      { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
      { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
      { name: 'Varanasi', lat: 25.3176, lon: 82.9739 }
    ];

    let nearest = 'Current Location';
    let minDistance = Infinity;

    for (const city of cities) {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = city.name;
      }
    }

    return minDistance <= 50 ? nearest : `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await getLocationAndWeather();
  };

  useEffect(() => {
    getLocationAndWeather();
  }, []);

  const getWeatherIcon = (weatherCode: number) => {
    if (weatherCode === 0) return <Sun className="h-6 w-6 text-yellow-500 animate-spin [animation-duration:8s]" />;
    if (weatherCode >= 1 && weatherCode <= 3) return <Cloud className="h-6 w-6 text-gray-500" />;
    if (weatherCode >= 51 && weatherCode <= 67) return <CloudRain className="h-6 w-6 text-blue-500 animate-bounce" />;
    return <Sun className="h-6 w-6 text-yellow-500" />;
  };

  const getWeatherDescription = (weatherCode: number): string => {
    if (weatherCode === 0) return 'साफ आसमान / Clear Sky';
    if (weatherCode >= 1 && weatherCode <= 3) return 'हल्के बादल / Light Clouds';
    if (weatherCode >= 51 && weatherCode <= 67) return 'बारिश / Rain';
    return 'साफ मौसम / Clear Weather';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Weather...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Weather Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!weather || !location) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p>No weather data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-green-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getWeatherIcon(weather.weatherCode)}
            <span>मौसम / Weather</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{location.city} (📍 Live Location)</span>
        </div>

        {/* Temperature */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-bold">{weather.temperature}°C</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Feels like {weather.temperature}°C</div>
            <div className="text-xs text-gray-500">{getWeatherDescription(weather.weatherCode)}</div>
          </div>
        </div>

        {/* Rain Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Rain Forecast</span>
          </div>
          <div className="text-sm text-blue-700">
            <div>Chance: {weather.precipitationProbability}%</div>
            <div>Humidity: {weather.humidity}%</div>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-600" />
            <span>Wind: {weather.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-600" />
            <span>Visibility: {weather.visibility} km</span>
          </div>
        </div>

        <div className="text-xs text-green-600 text-center mt-4">
          📍 {location?.city}
        </div>
      </CardContent>
    </Card>
  );
}
