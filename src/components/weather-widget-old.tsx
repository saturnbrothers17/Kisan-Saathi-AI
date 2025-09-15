'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Droplets, Wind, Eye, Thermometer, Sun, CloudRain, Cloud, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { fetchWeatherData, getCurrentLocation, type WeatherData } from '@/lib/api/weather-api';

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
  if (weatherCode === 0) return 'Clear sky';
  if (weatherCode >= 1 && weatherCode <= 3) return 'Partly cloudy';
  if (weatherCode >= 45 && weatherCode <= 48) return 'Foggy';
  if (weatherCode >= 51 && weatherCode <= 67) return 'Rainy';
  if (weatherCode >= 71 && weatherCode <= 77) return 'Snowy';
  if (weatherCode >= 80 && weatherCode <= 99) return 'Thunderstorm';
  return 'Clear';
};

const RainIntensityBar = ({ intensity }: { intensity: number }) => {
  const getIntensityColor = (value: number) => {
    if (value === 0) return 'bg-gray-200';
    if (value < 0.5) return 'bg-blue-300';
    if (value < 2) return 'bg-blue-500';
    if (value < 5) return 'bg-blue-700';
    return 'bg-blue-900';
  };
  
  const getIntensityText = (value: number) => {
    if (value === 0) return 'No Rain';
    if (value < 0.5) return 'Light';
    if (value < 2) return 'Moderate';
    if (value < 5) return 'Heavy';
    return 'Very Heavy';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 rain-intensity-bar ${getIntensityColor(intensity)}`}
          data-width={Math.min((intensity / 10) * 100, 100)}
        />
      </div>
      <span className="text-xs text-gray-600 min-w-[60px]">{getIntensityText(intensity)}</span>
    </div>
  );
};

const RainPrediction = ({ weather }: { weather: WeatherData }) => {
  const rainChance = weather.precipitation > 0 ? Math.min(90, weather.precipitation * 10) : 10;
  const nextRainTime = weather.precipitation > 0 ? "In 2 hours" : "Tomorrow morning";
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Rain Chance</span>
        <span className="text-sm font-medium">{rainChance}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Next Rain</span>
        <span className="text-sm font-medium">{nextRainTime}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${rainChance}%` }}
        />
      </div>
    </div>
  );
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState(false);

  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const location = await getCurrentLocation();
        const weatherData = await fetchWeatherData(location.lat, location.lon);
        
        console.log('Real weather data loaded:', weatherData);
        setWeather(weatherData);
      } catch (error) {
        console.error('Failed to load weather data:', error);
        setError('Failed to load weather data');
        // Set fallback data
        setWeather({
          location: 'Lucknow, IN',
          temperature: 28,
          description: 'Clear sky',
          humidity: 65,
          windSpeed: 3.2,
          visibility: 10,
          weatherCode: 0,
          precipitation: 0,
          uvIndex: 5,
          pressure: 1013,
          dewPoint: 18,
          feelsLike: 30,
          rainChance: 0,
          isRaining: false,
          cloudCover: 20
        });
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, []);

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      // Using Open-Meteo API - no API key required, including extended forecast
      const currentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation,surface_pressure,uv_index&hourly=precipitation,precipitation_probability,temperature_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=7`;
      
      // Use reverse geocoding to get location name from coordinates
      const geocodingUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      
      console.log('Fetching weather for coordinates:', lat, lon);
      
      // Fetch weather data and location name in parallel
      const [weatherResponse, locationResponse] = await Promise.all([
        fetch(currentWeatherUrl),
        fetch(geocodingUrl)
      ]);
      
      console.log('Open-Meteo API Response status:', weatherResponse.status);
      
      if (!weatherResponse.ok) {
        console.log('Open-Meteo API failed, using demo data');
        setWeather({
          location: 'Lucknow, IN',
          temperature: 28,
          description: 'Clear sky',
          humidity: 65,
          windSpeed: 3.2,
          visibility: 10,
          weatherCode: 0,
          precipitation: 0,
          uvIndex: 5,
          pressure: 1013,
          dewPoint: 18,
          feelsLike: 30,
          rainChance: 0,
          isRaining: false,
          cloudCover: 20
        });
        return;
      }
      
      const weatherData = await weatherResponse.json();
      const locationData = await locationResponse.json();
      
      console.log('Real weather data received:', weatherData);
      console.log('Location data received:', locationData);
      console.log('Location results array:', locationData.results);
      console.log('Is this real data or demo?', 'REAL DATA FROM OPEN-METEO API');
      
      // Get location name from reverse geocoding API
      const locationName = (() => {
        if (locationData.city || locationData.locality) {
          const parts = [];
          
          // Add city or locality
          if (locationData.city) parts.push(locationData.city);
          else if (locationData.locality) parts.push(locationData.locality);
          
          // Add state/province
          if (locationData.principalSubdivision) {
            parts.push(locationData.principalSubdivision);
          }
          
          // Add country
          if (locationData.countryCode) {
            parts.push(locationData.countryCode.toUpperCase());
          }
          
          return parts.join(', ');
        }
        
        // Fallback to coordinates if no location data
        return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      })();
      
      // Map weather codes to descriptions and icons
      const getWeatherInfo = (code: number) => {
        const weatherCodes: { [key: number]: { description: string; icon: string } } = {
          0: { description: 'clear sky', icon: '01d' },
          1: { description: 'mainly clear', icon: '02d' },
          2: { description: 'partly cloudy', icon: '03d' },
          3: { description: 'overcast', icon: '04d' },
          45: { description: 'fog', icon: '50d' },
          48: { description: 'depositing rime fog', icon: '50d' },
          51: { description: 'light drizzle', icon: '09d' },
          53: { description: 'moderate drizzle', icon: '09d' },
          55: { description: 'dense drizzle', icon: '09d' },
          61: { description: 'slight rain', icon: '10d' },
          63: { description: 'moderate rain', icon: '10d' },
          65: { description: 'heavy rain', icon: '10d' },
          71: { description: 'slight snow', icon: '13d' },
          73: { description: 'moderate snow', icon: '13d' },
          75: { description: 'heavy snow', icon: '13d' },
          95: { description: 'thunderstorm', icon: '11d' }
        };
        return weatherCodes[code] || { description: 'unknown', icon: '01d' };
      };
      
      const weatherInfo = getWeatherInfo(weatherData.current.weather_code);
      
      // Process hourly rain forecast for next 4 hours
      const currentHour = new Date().getHours();
      const rainForecast = weatherData.hourly.time
        .slice(0, 24) // Get today's hours
        .map((time: string, index: number) => ({
          time: new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          precipitation: weatherData.hourly.precipitation[index] || 0,
          probability: weatherData.hourly.precipitation_probability[index] || 0
        }))
        .filter((_: any, index: number) => index >= currentHour && index < currentHour + 4); // Next 4 hours
      
      // Process 7-day forecast
      const dailyForecast = weatherData.daily.time.map((date: string, index: number) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        maxTemp: Math.round(weatherData.daily.temperature_2m_max[index]),
        minTemp: Math.round(weatherData.daily.temperature_2m_min[index]),
        precipitation: weatherData.daily.precipitation_sum[index] || 0,
        weatherCode: weatherData.daily.weather_code[index]
      })).slice(0, 7);
      
      setWeather({
        location: locationName,
        temperature: Math.round(weatherData.current.temperature_2m),
        description: weatherInfo.description,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        visibility: 10,
        weatherCode: weatherData.current.weather_code,
        precipitation: weatherData.current.precipitation || 0,
        uvIndex: weatherData.current.uv_index || 0,
        pressure: weatherData.current.surface_pressure || 1013,
        dewPoint: Math.round(weatherData.current.temperature_2m - ((100 - weatherData.current.relative_humidity_2m) / 5)),
        feelsLike: Math.round(weatherData.current.apparent_temperature || weatherData.current.temperature_2m),
        rainChance: rainForecast[0]?.probability || 0,
        isRaining: (weatherData.current.precipitation || 0) > 0,
        cloudCover: weatherData.current.cloud_cover || 0
      });
    } catch (err) {
      console.error('Weather API failed:', err);
      setWeather({
        location: 'Lucknow, IN',
        temperature: 28,
        description: 'Clear sky',
        humidity: 65,
        windSpeed: 3.2,
        visibility: 10,
        weatherCode: 0,
        precipitation: 0,
        uvIndex: 5,
        pressure: 1013,
        dewPoint: 18,
        feelsLike: 30,
        rainChance: 0,
        isRaining: false,
        cloudCover: 20
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (city: string = 'Lucknow') => {
    try {
      // First get coordinates for the city using Open-Meteo geocoding
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      
      console.log('Fetching coordinates for city:', city);
      
      const geocodingResponse = await fetch(geocodingUrl);
      
      if (!geocodingResponse.ok) {
        console.log('Geocoding failed, using demo data');
        setWeather({
          location: 'Lucknow, IN',
          temperature: 28,
          description: 'Clear sky',
          humidity: 65,
          windSpeed: 3.2,
          visibility: 10,
          weatherCode: 0,
          precipitation: 0,
          uvIndex: 5,
          pressure: 1013,
          dewPoint: 18,
          feelsLike: 30,
          rainChance: 0,
          isRaining: false,
          cloudCover: 20
        });
        return;
      }
      
      const geocodingData = await geocodingResponse.json();
      
      if (!geocodingData.results || geocodingData.results.length === 0) {
        console.log('City not found, using demo data');
        setWeather({
          location: 'Lucknow, IN',
          temperature: 28,
          description: 'Clear sky',
          humidity: 65,
          windSpeed: 3.2,
          visibility: 10,
          weatherCode: 0,
          precipitation: 0,
          uvIndex: 5,
          pressure: 1013,
          dewPoint: 18,
          feelsLike: 30,
          rainChance: 0,
          isRaining: false,
          cloudCover: 20
        });
        return;
      }
      
      const { latitude, longitude } = geocodingData.results[0];
      console.log('City coordinates found:', latitude, longitude);
      
      // Now fetch weather using coordinates
      await fetchWeatherByCoords(latitude, longitude);
    } catch (err) {
      console.error('City weather API failed:', err);
      setWeather({
        location: 'Lucknow, IN',
        temperature: 28,
        description: 'Clear sky',
        humidity: 65,
        windSpeed: 3.2,
        visibility: 10,
        weatherCode: 0,
        precipitation: 0,
        uvIndex: 5,
        pressure: 1013,
        dewPoint: 18,
        feelsLike: 30,
        rainChance: 0,
        isRaining: false,
        cloudCover: 20
      });
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      console.log('Requesting geolocation permission...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Geolocation success:', position.coords.latitude, position.coords.longitude);
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log('Geolocation error:', error.code, error.message);
          if (error.code === 1) {
            console.log('Geolocation permission denied, using Lucknow as fallback');
          } else if (error.code === 2) {
            console.log('Geolocation position unavailable, using Lucknow as fallback');
          } else if (error.code === 3) {
            console.log('Geolocation timeout, using Lucknow as fallback');
          }
          fetchWeatherByCity('Lucknow');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.log('Geolocation not supported, using Lucknow as fallback');
      fetchWeatherByCity('Lucknow');
    }
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Weather & Rain Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-600">Weather Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  const hasRainSoon = weather.rainForecast?.some(forecast => forecast.probability > 30) || false;
  const nextRain = weather.rainForecast?.find(forecast => forecast.precipitation > 0);

  return (
    <Card className="w-full max-w-lg bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 border-green-200 shadow-lg transition-all duration-300 hover:shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-green-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getWeatherIcon(weather.weatherCode)}
            <span>Advanced Weather System</span>
          </div>
          <button 
            onClick={() => setExpandedView(!expandedView)}
            className="text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded transition-colors"
          >
            {expandedView ? 'Compact' : 'Expand'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weather with Animation */}
        <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-3 transition-all duration-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{weather.location}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-900 transition-all duration-300">
                {weather.temperature}°C
              </div>
              <div className="text-xs text-green-600 capitalize">{weather.description}</div>
            </div>
          </div>
        </div>

        {/* Severe Weather Alert */}
        {(hasRainSoon || weather.precipitation > 2) && (
          <div className="bg-gradient-to-r from-orange-100 to-red-100 border-l-4 border-orange-500 rounded-lg p-3 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-bold text-orange-800">Weather Alert for Farmers</span>
            </div>
            {weather.precipitation > 2 ? (
              <p className="text-sm text-orange-700">Heavy rain detected! Consider postponing field activities.</p>
            ) : nextRain ? (
              <p className="text-sm text-orange-700">
                Rain expected at {nextRain.time} ({nextRain.probability}% chance) - Plan accordingly!
              </p>
            ) : (
              <p className="text-sm text-orange-700">High chance of rain in next few hours - Prepare equipment!</p>
            )}
          </div>
        )}

        {/* Real-time Rain Intensity */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <CloudRain className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Current Rain Intensity</span>
          </div>
          <RainIntensityBar intensity={weather.precipitation} />
        </div>

        {/* Enhanced Hourly Forecast */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <h4 className="text-sm font-medium text-green-800">Next 4 Hours Rain Forecast</h4>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {weather.rainForecast?.map((forecast, index) => (
              <div key={index} className="bg-white rounded-lg p-2 border shadow-sm hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-xs font-medium text-green-700 mb-1">{forecast.time}</div>
                  <div className="text-lg font-bold text-blue-600 mb-1">{forecast.probability}%</div>
                  <div className="text-xs text-blue-800">
                    {forecast.precipitation > 0 ? `${forecast.precipitation}mm` : '0mm'}
                  </div>
                  <div className="mt-1">
                    <RainIntensityBar intensity={forecast.precipitation} />
                  </div>
                </div>
              </div>
            )) || (
              <div className="col-span-4 text-center text-gray-500 text-sm animate-pulse">
                Loading detailed forecast...
              </div>
            )}
          </div>
        </div>

        {/* Extended 7-Day Forecast (Expandable) */}
        {expandedView && weather.dailyForecast && (
          <div className="space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <h4 className="text-sm font-medium text-green-800">7-Day Agricultural Forecast</h4>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {weather.dailyForecast.map((day, index) => (
                <div key={index} className="bg-white rounded p-2 text-center border hover:bg-green-50 transition-colors">
                  <div className="font-medium text-green-700 mb-1">{day.date.split(',')[0]}</div>
                  <div className="text-green-900 font-bold">{day.maxTemp}°</div>
                  <div className="text-green-600">{day.minTemp}°</div>
                  <div className="text-blue-600 text-[10px] mt-1">
                    {day.precipitation > 0 ? `${day.precipitation}mm` : '0mm'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Metrics (Expandable) */}
        {expandedView && (
          <div className="grid grid-cols-2 gap-3 animate-fadeIn">
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-1">UV Index</div>
              <div className="text-lg font-bold text-orange-600">{weather.uvIndex || 0}</div>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-1">Pressure</div>
              <div className="text-lg font-bold text-gray-700">{weather.pressure || 1013} hPa</div>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-1">Dew Point</div>
              <div className="text-lg font-bold text-blue-600">{weather.dewPoint || 0}°C</div>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-600 mb-1">Humidity</div>
              <div className="text-lg font-bold text-blue-500">{weather.humidity}%</div>
            </div>
          </div>
        )}

        {/* Basic Weather Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-green-200">
          <div className="flex items-center gap-2 bg-white rounded-lg p-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <div>
              <div className="text-xs text-gray-600">Humidity</div>
              <div className="font-medium text-green-700">{weather.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg p-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-600">Wind</div>
              <div className="font-medium text-green-700">{weather.windSpeed} m/s</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg p-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-600">Visibility</div>
              <div className="font-medium text-green-700">{weather.visibility} km</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
