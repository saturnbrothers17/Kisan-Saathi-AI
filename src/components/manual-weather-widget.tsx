/**
 * Manual Weather Widget
 * Allows users to manually select their city from Uttar Pradesh and get weather data
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  RefreshCw, 
  Search,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { uttarPradeshCities, getMajorUPCities, searchUPCities, getUPCityByName, type UPCity } from '@/data/uttar-pradesh-cities';

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

interface SelectedLocation {
  city: string;
  district: string;
  lat: number;
  lon: number;
}

export function ManualWeatherWidget() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState<UPCity[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load saved location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('manual-weather-location');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setSelectedLocation(location);
        loadWeatherForLocation(location);
      } catch (error) {
        console.error('Failed to load saved location:', error);
      }
    }
  }, []);

  // Filter cities based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = searchUPCities(searchQuery).slice(0, 10); // Limit to 10 results
      setFilteredCities(filtered);
      setShowDropdown(true);
    } else {
      setFilteredCities(getMajorUPCities().slice(0, 15)); // Show major cities by default
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const loadWeatherForLocation = async (location: SelectedLocation) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🌤️ Fetching weather for:', location.city, location.district);
      
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

  const handleCitySelect = (city: UPCity) => {
    const location: SelectedLocation = {
      city: city.name,
      district: city.district,
      lat: city.lat,
      lon: city.lon
    };
    
    setSelectedLocation(location);
    setSearchQuery(city.name);
    setShowDropdown(false);
    
    // Save to localStorage
    localStorage.setItem('manual-weather-location', JSON.stringify(location));
    
    // Load weather for selected location
    loadWeatherForLocation(location);
  };

  const handleRefresh = () => {
    if (selectedLocation) {
      setIsRefreshing(true);
      loadWeatherForLocation(selectedLocation);
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

  // If no location selected, show city selector
  if (!selectedLocation) {
    return (
      <Card className="w-80 bg-gradient-to-br from-blue-50 to-green-100 border-2 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>🏙️ Select Your City</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="city-search" className="text-sm font-medium text-gray-700">
              Search Uttar Pradesh Cities
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="city-search"
                type="text"
                placeholder="Type city name (e.g., Lucknow, Kanpur, Agra)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onFocus={() => setShowDropdown(true)}
              />
            </div>
          </div>

          {/* City Dropdown */}
          {(showDropdown || searchQuery.length > 0) && (
            <div className="max-h-48 overflow-y-auto border rounded-md bg-white shadow-lg">
              {filteredCities.length > 0 ? (
                filteredCities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleCitySelect(city)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800">{city.name}</div>
                        <div className="text-xs text-gray-500">{city.district} • {city.type}</div>
                      </div>
                      {city.population && (
                        <Badge variant="outline" className="text-xs">
                          {(city.population / 100000).toFixed(1)}L
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-gray-500">
                  No cities found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {/* Quick Select Major Cities */}
          {!showDropdown && searchQuery.length === 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Popular Cities</Label>
              <div className="grid grid-cols-2 gap-2">
                {getMajorUPCities().slice(0, 8).map((city, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCitySelect(city)}
                    className="text-xs h-8 justify-start"
                  >
                    {city.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
            <div className="font-medium mb-1">📍 Manual Location Selection</div>
            <div>Choose your city from {uttarPradeshCities.length}+ Uttar Pradesh locations for accurate weather data.</div>
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
              <Thermometer className="h-8 w-8 text-blue-600 animate-pulse" />
              <CheckCircle className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-800 mb-2">
                🌤️ Loading Weather
              </div>
              <div className="text-sm text-blue-600 animate-pulse">
                Getting weather for {selectedLocation.city}...
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
            <div className="text-red-600 mb-4">❌ Weather Load Failed</div>
            <div className="text-sm text-red-700 mb-4">{error}</div>
            <div className="space-y-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                🔄 Retry Weather
              </Button>
              <Button 
                onClick={() => setSelectedLocation(null)} 
                variant="ghost" 
                size="sm"
                className="w-full"
              >
                📍 Change City
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <Card className="w-80 bg-gradient-to-br from-green-50 to-blue-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            <div className="relative">
              {getWeatherIcon(weather.weatherCode)}
              <CheckCircle className="h-3 w-3 text-green-600 absolute -top-1 -right-1" />
            </div>
            <span>🏙️ Manual Weather</span>
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
          {/* Selected Location Display */}
          <div className="bg-white/60 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{selectedLocation.city}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLocation(null)}
                className="h-6 px-2 text-xs"
              >
                Change
              </Button>
            </div>
            
            <div className="text-xs text-gray-600 flex items-center space-x-1">
              <Badge variant="outline" className="text-xs">
                {selectedLocation.district}
              </Badge>
              <span>• Manual selection</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-gray-800">{weather.temperature}°C</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">Selected city</div>
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
              {getRainAdvice(weather.precipitationProbability)}
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
            <div className="text-xs font-medium text-green-800 mb-1">🌾 Farming Advice for {selectedLocation.city}</div>
            <div className="text-xs text-green-700">
              {weather.temperature > 30 ? 'Hot weather - ensure adequate irrigation' : weather.temperature < 15 ? 'Cool weather - protect sensitive crops' : 'Ideal temperature for most crops'}
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
              <div className="text-xs font-medium text-gray-600 mb-2">Weather Details</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>Humidity: {weather.humidity}%</div>
                <div>UV Index: {weather.uvIndex}</div>
                <div>Pressure: {weather.pressure} hPa</div>
                <div>Dew Point: {weather.dewPoint}°C</div>
                <div>Cloud Cover: {weather.cloudCover}%</div>
                <div>Data Source: Manual</div>
              </div>
              
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                <div className="font-medium text-blue-700 mb-1">📍 Location Information:</div>
                <div className="text-blue-600">
                  City: {selectedLocation.city}, {selectedLocation.district}
                </div>
                <div className="text-blue-600">
                  Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
                </div>
                <div className="text-blue-600">
                  Source: Manual city selection
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
