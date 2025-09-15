/**
 * Native GPS Weather Widget
 * Uses device's actual GPS coordinates for precise location-based weather
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  RefreshCw, 
  Satellite,
  Shield,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { nativeGPSLocation, GPSLocationData } from '@/services/native-gps-location';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  precipitationProbability: number;
  weatherCode: number;
  uvIndex: number;
  pressure: number;
  dewPoint: number;
  cloudCover: number;
}

export function NativeGPSWeatherWidget() {
  const [location, setLocation] = useState<GPSLocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [locationProgress, setLocationProgress] = useState<string>('');

  useEffect(() => {
    checkPermissionAndLoad();
  }, []);

  const checkPermissionAndLoad = async () => {
    const permission = await nativeGPSLocation.checkLocationPermission();
    setPermissionStatus(permission);
    
    if (permission === 'granted') {
      loadGPSLocationAndWeather();
    }
  };

  const loadGPSLocationAndWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      setLocationProgress('📡 Accessing device GPS...');

      // Get high-accuracy GPS location
      const gpsLocation = await nativeGPSLocation.getCurrentGPSLocation();
      
      if (!gpsLocation) {
        throw new Error('Unable to access device location. Please check location permissions.');
      }

      setLocation(gpsLocation);
      setLocationProgress('🌤️ Fetching weather for GPS coordinates...');
      
      // Fetch weather data for GPS coordinates
      const weatherData = await fetchWeatherData(gpsLocation.lat, gpsLocation.lon);
      setWeather(weatherData);
      
      setLocationProgress('');
      console.log('🎯 Native GPS location and weather loaded:', { gpsLocation, weatherData });
      
    } catch (error) {
      console.error('❌ GPS weather loading failed:', error);
      setError(`GPS access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLocationProgress('');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility,precipitation_probability,weather_code&hourly=uv_index&daily=precipitation_probability_max&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    const current = data.current;
    
    return {
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      visibility: Math.round(current.visibility / 1000), // Convert to km
      precipitationProbability: current.precipitation_probability || data.daily.precipitation_probability_max[0] || 0,
      weatherCode: current.weather_code,
      uvIndex: data.hourly.uv_index[0] || 0,
      pressure: 1013, // Default atmospheric pressure
      dewPoint: Math.round(current.temperature_2m - ((100 - current.relative_humidity_2m) / 5)),
      cloudCover: 50 // Estimated
    };
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGPSLocationAndWeather();
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    setLocationProgress('🔐 Requesting location permission...');
    
    const granted = await nativeGPSLocation.requestLocationPermission();
    if (granted) {
      setPermissionStatus('granted');
      loadGPSLocationAndWeather();
    } else {
      setPermissionStatus('denied');
      setError('Location permission denied. Please enable location access in your browser settings.');
      setLoading(false);
      setLocationProgress('');
    }
  };

  const getWeatherIcon = (code: number) => {
    const iconMap: { [key: number]: string } = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
      45: '🌫️', 48: '🌫️',
      51: '🌦️', 53: '🌦️', 55: '🌦️',
      61: '🌧️', 63: '🌧️', 65: '🌧️',
      71: '🌨️', 73: '🌨️', 75: '🌨️',
      95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return iconMap[code] || '🌤️';
  };

  const getWeatherDescription = (code: number): string => {
    const descriptions: { [key: number]: string } = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Depositing rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
      95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm'
    };
    return descriptions[code] || 'Unknown weather';
  };

  const getRainAdvice = (probability: number): string => {
    if (probability >= 80) return '🌧️ Heavy rain expected - avoid outdoor farming';
    if (probability >= 60) return '🌦️ Rain likely - prepare for wet conditions';
    if (probability >= 40) return '☔ Possible rain - keep equipment ready';
    if (probability >= 20) return '🌤️ Low chance of rain - good for farming';
    return '☀️ No rain expected - perfect farming weather';
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy <= 10) return 'bg-green-500';
    if (accuracy <= 50) return 'bg-blue-500';
    if (accuracy <= 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Permission denied or not granted
  if (permissionStatus === 'denied' || (permissionStatus === 'prompt' && !loading)) {
    return (
      <Card className="w-80 bg-gradient-to-br from-red-50 to-orange-100 border-2 border-red-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Lock className="h-12 w-12 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                📍 GPS Access Required
              </h3>
              <p className="text-sm text-red-600 mb-4">
                This widget needs access to your device's GPS for accurate location-based weather data.
              </p>
              <Button 
                onClick={handleRequestPermission}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={loading}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Enable GPS Access
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-80 bg-gradient-to-br from-blue-50 to-green-100 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Satellite className="h-8 w-8 text-blue-600 animate-pulse" />
              <Shield className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-800 mb-2">
                📡 GPS Location Access
              </div>
              <div className="text-sm text-blue-600 animate-pulse">
                {locationProgress || 'Accessing device GPS...'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-80 bg-gradient-to-br from-red-50 to-orange-100 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <div className="text-red-600 mb-4">❌ GPS Access Failed</div>
            <div className="text-sm text-red-700 mb-4">{error}</div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              🔄 Retry GPS Access
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!location || !weather) {
    return null;
  }

  return (
    <Card className="w-80 bg-gradient-to-br from-green-50 to-blue-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            <div className="relative">
              {getWeatherIcon(weather.weatherCode)}
              <Satellite className="h-3 w-3 text-green-600 absolute -top-1 -right-1" />
            </div>
            <span>📡 GPS Weather</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0 hover:bg-white/50"
          >
            <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* GPS Location Display */}
          <div className="bg-white/60 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Satellite className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{location.city}, {location.state}</span>
              </div>
              <Badge className={`${getAccuracyColor(location.accuracy)} text-white text-xs`}>
                ±{location.accuracy}m
              </Badge>
            </div>
            
            <div className="text-xs text-gray-600 flex items-center space-x-1">
              <Shield className="h-3 w-3 text-green-500" />
              <span>Native GPS coordinates: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-gray-800">{weather.temperature}°C</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">GPS-based</div>
              <div className="text-sm font-medium text-gray-700">Live data</div>
            </div>
          </div>

          {/* Weather Description */}
          <div className="text-center py-2">
            <div className="text-sm font-medium text-gray-700">
              {getWeatherDescription(weather.weatherCode)}
            </div>
          </div>

          {/* Rain Information */}
          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Rain Forecast</span>
              </div>
              <span className="text-lg font-bold text-blue-700">{weather.precipitationProbability}%</span>
            </div>
            <div className="text-xs text-blue-600">
              {weather && typeof weather.precipitationProbability === 'number' && getRainAdvice(weather.precipitationProbability)}
            </div>
          </div>

          {/* Additional Weather Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Wind className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Wind: {weather.windSpeed} km/h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Visibility: {weather.visibility} km</span>
            </div>
          </div>

          {/* Farming Advice */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs font-medium text-green-800 mb-1">🌾 GPS Farming Advice</div>
            <div className="text-xs text-green-700">
              Based on your exact GPS location: {weather.temperature > 30 ? 'Hot weather - ensure adequate irrigation' : weather.temperature < 15 ? 'Cool weather - protect sensitive crops' : 'Ideal temperature for most crops'}
            </div>
          </div>

          {/* Expandable Details */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedView(!expandedView)}
            className="w-full text-xs"
          >
            {expandedView ? 'Hide GPS Details' : 'Show GPS Details'}
          </Button>

          {expandedView && (
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs font-medium text-gray-600 mb-2">GPS Location Details</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>Humidity: {weather.humidity}%</div>
                <div>UV Index: {weather.uvIndex}</div>
                <div>Pressure: {weather.pressure} hPa</div>
                <div>Dew Point: {weather.dewPoint}°C</div>
                <div>Cloud Cover: {weather.cloudCover}%</div>
                <div>GPS Source: {location.source}</div>
              </div>
              
              <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                <div className="font-medium text-green-700 mb-1">📡 GPS Information:</div>
                <div className="text-green-600">
                  Coordinates: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}
                </div>
                <div className="text-green-600">
                  Accuracy: ±{location.accuracy} meters
                </div>
                <div className="text-green-600">
                  Last updated: {new Date(location.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
