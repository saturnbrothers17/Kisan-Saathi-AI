/**
 * Updated Weather Widget
 * Uses manual location context instead of auto-detection
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  RefreshCw, 
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  Zap
} from 'lucide-react';
import { useManualLocation } from './manual-location-context';

interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  precipitationProbability: number;
  weatherCode: number;
  uvIndex: number;
  pressure: number;
  dewPoint: number;
  cloudCover: number;
}

export function UpdatedWeatherWidget() {
  const { location, isLocationSet } = useManualLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedView, setExpandedView] = useState(false);

  useEffect(() => {
    if (location && isLocationSet) {
      loadWeatherData();
    }
  }, [location, isLocationSet]);

  const loadWeatherData = async () => {
    if (!location) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🌤️ Fetching weather for manual location:', location.city, location.district);
      
      const weatherData = await fetchWeatherData(location.lat, location.lon);
      setWeather(weatherData);
      
      console.log('✅ Weather loaded for:', location.city);
      
    } catch (error) {
      console.error('❌ Weather loading failed:', error);
      setError(`Weather data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,visibility,precipitation_probability,weather_code,surface_pressure,cloud_cover&hourly=uv_index&daily=precipitation_probability_max&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    const current = data.current;
    
    return {
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: current.wind_direction_10m,
      visibility: Math.round(current.visibility / 1000),
      precipitationProbability: current.precipitation_probability || data.daily.precipitation_probability_max[0] || 0,
      weatherCode: current.weather_code,
      uvIndex: data.hourly.uv_index[0] || 0,
      pressure: Math.round(current.surface_pressure),
      dewPoint: Math.round(current.temperature_2m - ((100 - current.relative_humidity_2m) / 5)),
      cloudCover: current.cloud_cover || 0
    };
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWeatherData();
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="h-6 w-6 text-yellow-500" />;
    if (code <= 3) return <Cloud className="h-6 w-6 text-gray-500" />;
    if (code <= 67) return <CloudRain className="h-6 w-6 text-blue-500" />;
    if (code >= 95) return <Zap className="h-6 w-6 text-purple-500" />;
    return <Cloud className="h-6 w-6 text-gray-500" />;
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

  const getFarmingAdvice = (weather: WeatherData): string => {
    if (weather.precipitationProbability >= 80) {
      return '🌧️ Heavy rain expected - avoid outdoor farming activities';
    }
    if (weather.precipitationProbability >= 60) {
      return '🌦️ Rain likely - prepare equipment and cover crops';
    }
    if (weather.temperature > 35) {
      return '🔥 Very hot - ensure adequate irrigation and shade';
    }
    if (weather.temperature < 10) {
      return '❄️ Cold weather - protect sensitive crops from frost';
    }
    if (weather.windSpeed > 25) {
      return '💨 Strong winds - secure equipment and support tall crops';
    }
    if (weather.humidity > 80) {
      return '💧 High humidity - monitor for fungal diseases';
    }
    return '✅ Good conditions for farming activities';
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  if (!isLocationSet || !location) {
    return (
      <Card className="w-80 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600 mb-2">📍 Location Required</div>
          <div className="text-sm text-gray-500">
            Please select your city to view weather information
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
            <Thermometer className="h-8 w-8 text-blue-600 animate-pulse" />
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-800 mb-2">
                🌤️ Loading Weather
              </div>
              <div className="text-sm text-blue-600 animate-pulse">
                Getting weather for {location.city}...
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
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">❌ Weather Load Failed</div>
          <div className="text-sm text-red-700 mb-4">{error}</div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            🔄 Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <Card className="w-80 bg-gradient-to-br from-blue-50 to-green-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            {getWeatherIcon(weather.weatherCode)}
            <span>🌤️ Weather</span>
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
          {/* Location Display */}
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{location.city}, {location.district}</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-red-500" />
              <span className="text-3xl font-bold text-gray-800">{weather.temperature}°C</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">Feels like</div>
              <div className="text-lg font-medium text-gray-700">{weather.apparentTemperature}°C</div>
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
                <span className="text-sm font-medium text-blue-800">Rain Chance</span>
              </div>
              <span className="text-lg font-bold text-blue-700">{weather.precipitationProbability}%</span>
            </div>
          </div>

          {/* Weather Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Wind className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{weather.windSpeed} km/h {getWindDirection(weather.windDirection)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{weather.visibility} km</span>
            </div>
            <div className="text-gray-700">Humidity: {weather.humidity}%</div>
            <div className="text-gray-700">UV Index: {weather.uvIndex}</div>
          </div>

          {/* Farming Advice */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs font-medium text-green-800 mb-1">🌾 Farming Advice</div>
            <div className="text-xs text-green-700">
              {getFarmingAdvice(weather)}
            </div>
          </div>

          {/* Expandable Details */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedView(!expandedView)}
            className="w-full text-xs"
          >
            {expandedView ? 'Hide Details' : 'Show Details'}
          </Button>

          {expandedView && (
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs font-medium text-gray-600 mb-2">Detailed Weather</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>Pressure: {weather.pressure} hPa</div>
                <div>Dew Point: {weather.dewPoint}°C</div>
                <div>Cloud Cover: {weather.cloudCover}%</div>
                <div>Wind Dir: {weather.windDirection}°</div>
              </div>
              
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                <div className="font-medium text-blue-700 mb-1">📍 Location:</div>
                <div className="text-blue-600">
                  {location.city}, {location.district}
                </div>
                <div className="text-blue-600">
                  {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
