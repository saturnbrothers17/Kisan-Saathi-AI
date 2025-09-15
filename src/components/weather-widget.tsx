'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Droplets, Wind, Eye, Thermometer, Sun, CloudRain, Cloud, AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchWeatherData, type WeatherData } from '@/lib/api/weather-api';
import { useManualLocation } from '@/components/manual-location-context';

const getWeatherIcon = (weatherCode: number, animated: boolean = true) => {
  const animationClass = animated ? "animate-pulse" : "";
  
  if (weatherCode === 0) return <Sun className={`h-6 w-6 text-yellow-500 ${animated ? 'animate-spin [animation-duration:8s]' : ''}`} />;
  if (weatherCode >= 1 && weatherCode <= 3) return <Cloud className={`h-6 w-6 text-gray-500 ${animationClass}`} />;
  if (weatherCode >= 45 && weatherCode <= 48) return <Cloud className={`h-6 w-6 text-gray-400 ${animationClass}`} />;
  if (weatherCode >= 51 && weatherCode <= 67) return <CloudRain className={`h-6 w-6 text-blue-500 ${animated ? 'animate-bounce' : ''}`} />;
  if (weatherCode >= 71 && weatherCode <= 77) return <Cloud className={`h-6 w-6 text-blue-200 ${animationClass}`} />;
  if (weatherCode >= 80 && weatherCode <= 99) return <CloudRain className={`h-6 w-6 text-blue-600 ${animated ? 'animate-bounce' : ''}`} />;
  
  return <Sun className={`h-6 w-6 text-yellow-500 ${animationClass}`} />;
};

const getWeatherDescription = (weatherCode: number): string => {
  if (weatherCode === 0) return 'साफ आसमान / Clear Sky';
  if (weatherCode >= 1 && weatherCode <= 3) return 'हल्के बादल / Light Clouds';
  if (weatherCode >= 45 && weatherCode <= 48) return 'कोहरा / Fog';
  if (weatherCode >= 51 && weatherCode <= 67) return 'बारिश / Rain';
  if (weatherCode >= 71 && weatherCode <= 77) return 'बर्फबारी / Snow';
  if (weatherCode >= 80 && weatherCode <= 99) return 'तूफान / Storm';
  return 'साफ मौसम / Clear Weather';
};

const getSimpleTemperatureAdvice = (temp: number) => {
  if (temp > 35) return 'बहुत गर्म - फसल को पानी दें / Very Hot - Water crops';
  if (temp > 30) return 'गर्म - दोपहर में छाया दें / Hot - Provide shade';
  if (temp > 25) return 'अच्छा मौसम / Good weather';
  if (temp > 15) return 'ठंडा - फसल सुरक्षित / Cool - Crops safe';
  return 'बहुत ठंड - फसल बचाएं / Very cold - Protect crops';
};

const getRainAdvice = (rainChance: number) => {
  if (rainChance > 80) return 'पक्की बारिश - तैयारी करें / Sure rain - Get ready';
  if (rainChance > 60) return 'बारिश हो सकती है / Rain possible';
  if (rainChance > 30) return 'हल्की बारिश हो सकती है / Light rain possible';
  return 'बारिश नहीं / No rain expected';
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { location } = useManualLocation();

  const loadWeatherData = async () => {
    if (!location) {
      setError('Location not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🌤️ WeatherWidget: Loading weather for:', location.city, location.district);
      
      const weatherData = await fetchWeatherData(location.lat, location.lon);
      
      if (weatherData) {
        setWeather(weatherData);
        console.log(`📍 Weather loaded for ${location.city}, ${location.district}`);
      } else {
        throw new Error('No weather data received');
      }
    } catch (err: any) {
      console.error('❌ WeatherWidget: Weather loading failed:', err);
      setError('Weather data unavailable');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWeatherData();
  };

  const getNearestCity = (lat: number, lon: number): string => {
    // Expanded city database with more Indian cities
    const cities = [
      // Major metros
      { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
      { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
      
      // Tier 1 cities
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
      { name: 'Jabalpur', lat: 23.1815, lon: 79.9864 },
      { name: 'Gwalior', lat: 26.2183, lon: 78.1828 },
      { name: 'Vijayawada', lat: 16.5062, lon: 80.6480 },
      { name: 'Jodhpur', lat: 26.2389, lon: 73.0243 },
      { name: 'Madurai', lat: 9.9252, lon: 78.1198 },
      { name: 'Raipur', lat: 21.2514, lon: 81.6296 },
      { name: 'Kota', lat: 25.2138, lon: 75.8648 },
      { name: 'Guwahati', lat: 26.1445, lon: 91.7362 },
      { name: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
      { name: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366 },
      { name: 'Solapur', lat: 17.6599, lon: 75.9064 },
      { name: 'Hubballi-Dharwad', lat: 15.3647, lon: 75.1240 },
      { name: 'Tiruchirappalli', lat: 10.7905, lon: 78.7047 },
      { name: 'Bareilly', lat: 28.3670, lon: 79.4304 },
      { name: 'Mysore', lat: 12.2958, lon: 76.6394 },
      { name: 'Salem', lat: 11.6643, lon: 78.1460 },
      { name: 'Mira-Bhayandar', lat: 19.2952, lon: 72.8544 }
    ];

    let nearest = 'Current Location';
    let minDistance = Infinity;

    // Use proper Haversine formula for accurate distance calculation
    for (const city of cities) {
      const distance = calculateHaversineDistance(lat, lon, city.lat, city.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = city.name;
      }
    }

    // Show city name if within 25km, otherwise show coordinates
    if (minDistance <= 25) {
      console.log(`📍 Nearest city: ${nearest} (${minDistance.toFixed(1)}km away)`);
      return nearest;
    } else {
      console.log(`📍 No nearby city found. Distance to nearest: ${minDistance.toFixed(1)}km`);
      return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
    }
  };

  // Accurate distance calculation using Haversine formula
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
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

  const getNearestState = (lat: number, lon: number): string => {
    const stateRegions = [
      { name: 'Delhi', minLat: 28.4, maxLat: 28.9, minLon: 76.8, maxLon: 77.3 },
      { name: 'Maharashtra', minLat: 15.6, maxLat: 22.0, minLon: 72.6, maxLon: 80.9 },
      { name: 'Uttar Pradesh', minLat: 23.8, maxLat: 30.4, minLon: 77.1, maxLon: 84.6 },
      { name: 'Karnataka', minLat: 11.5, maxLat: 18.4, minLon: 74.0, maxLon: 78.6 },
      { name: 'Tamil Nadu', minLat: 8.1, maxLat: 13.6, minLon: 76.2, maxLon: 80.3 },
      { name: 'West Bengal', minLat: 21.5, maxLat: 27.2, minLon: 85.8, maxLon: 89.9 }
    ];

    for (const state of stateRegions) {
      if (lat >= state.minLat && lat <= state.maxLat && 
          lon >= state.minLon && lon <= state.maxLon) {
        return state.name;
      }
    }

    return 'India';
  };

  useEffect(() => {
    if (location) {
      loadWeatherData();
    }
  }, [location]);

  if (loading) {
    return (
      <Card className="w-80 bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Detecting location & loading weather...</span>
          </div>
          <span className="text-xs text-gray-500">Requesting location permission...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-80 bg-gradient-to-br from-red-50 to-pink-100 border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Weather Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1"
            >
              {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            {weather && getWeatherIcon(weather.weatherCode)}
            <span>मौसम / Weather</span>
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
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{location?.city}, {location?.district} 📍</span>
          </div>

          {/* Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-gray-800">{weather?.temperature}°C</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">Feels like</div>
              <div className="text-sm font-medium text-gray-700">{weather?.temperature}°C</div>
            </div>
          </div>

          {/* Weather Description */}
          <div className="text-center py-2">
            <div className="text-sm font-medium text-gray-700">
              {weather && getWeatherDescription(weather.weatherCode)}
            </div>
          </div>

          {/* Rain Information */}
          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Rain Forecast</span>
              </div>
              <span className="text-lg font-bold text-blue-700">{weather?.precipitationProbability}%</span>
            </div>
            <div className="text-xs text-blue-600">
              {weather && typeof weather.precipitationProbability === 'number' && getRainAdvice(weather.precipitationProbability)}
            </div>
          </div>

          {/* Additional Weather Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Wind className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Wind: {weather?.windSpeed} km/h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">Visibility: {weather?.visibility} km</span>
            </div>
          </div>

          {/* Farming Advice */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs font-medium text-green-800 mb-1">🌾 Farming Advice</div>
            <div className="text-xs text-green-700">
              {weather && getSimpleTemperatureAdvice(weather.temperature)}
            </div>
          </div>

          {/* Expandable Details */}
          {expandedView && (
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs font-medium text-gray-600 mb-2">Detailed Information</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>Humidity: {weather?.humidity}%</div>
                <div>UV Index: {weather?.uvIndex}</div>
                <div>Pressure: {weather?.pressure} hPa</div>
                <div>Dew Point: {weather?.dewPoint}°C</div>
                <div>Cloud Cover: {weather?.cloudCover}%</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
