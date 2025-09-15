// Advanced Rain Prediction Widget for Farmers
// Integrates AI-powered rain prediction with comprehensive farming advice

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CloudRain, 
  Droplets, 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  MapPin,
  Zap,
  Satellite,
  Radar,
  Brain,
  Shield,
  Sprout
} from 'lucide-react';
import { advancedRainPrediction, RainPredictionData } from '@/lib/api/advanced-rain-prediction';
// import { customGeolocation, LocationData } from '@/lib/api/custom-geolocation'; // Using direct geolocation

interface LocationData {
  lat: number;
  lon: number;
  city: string;
  state: string;
}

interface AdvancedRainWidgetProps {
  cropType?: string;
  location?: LocationData;
}

export function AdvancedRainWidget({ cropType, location }: AdvancedRainWidgetProps) {
  const [rainData, setRainData] = useState<RainPredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(location || null);
  const [expandedView, setExpandedView] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'current' | 'hourly' | 'daily'>('current');

  const loadRainPrediction = async () => {
    try {
      setError(null);
      
      let coords = { lat: 25.3176, lon: 82.9739 }; // Default to Varanasi
      
      if (currentLocation) {
        coords = { lat: currentLocation.lat, lon: currentLocation.lon };
      } else {
        try {
          // Get location using direct geolocation
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!('geolocation' in navigator)) {
              reject(new Error('Geolocation not supported'));
              return;
            }
            
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 300000
              }
            );
          });
          
          const locationResult = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: 'Current Location',
            state: 'India'
          };
          setCurrentLocation(locationResult);
          coords = { lat: locationResult.lat, lon: locationResult.lon };
        } catch (locationError) {
          console.warn('Using default location:', locationError);
        }
      }

      console.log('🌧️ Loading advanced rain prediction for:', coords, cropType);
      const prediction = await advancedRainPrediction.predictRain(coords.lat, coords.lon, cropType);
      setRainData(prediction);
      
    } catch (err) {
      console.error('❌ Rain prediction error:', err);
      setError('Failed to load rain prediction');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRainPrediction();
  };

  useEffect(() => {
    loadRainPrediction();
  }, [cropType, currentLocation]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'extreme': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIntensityIcon = (intensity: string) => {
    switch (intensity) {
      case 'extreme': return <CloudRain className="h-5 w-5 text-red-600" />;
      case 'heavy': return <CloudRain className="h-5 w-5 text-orange-600" />;
      case 'moderate': return <CloudRain className="h-5 w-5 text-blue-600" />;
      case 'light': return <Droplets className="h-5 w-5 text-blue-400" />;
      default: return <Droplets className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <div className="text-lg font-semibold text-gray-800">Advanced Rain Prediction Loading...</div>
              <div className="text-sm text-gray-600">Analyzing satellite data, radar, and AI models</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="animate-pulse w-4 h-4 bg-blue-200 rounded"></div>
                <span>{['Satellite', 'Radar', 'AI Analysis', 'Ground Data'][i]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !rainData) {
    return (
      <Card className="w-full max-w-4xl bg-gradient-to-br from-red-50 to-pink-100 border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <div className="text-lg font-semibold text-red-800">Rain Prediction Unavailable</div>
              <div className="text-sm text-red-600">{error || 'Unable to load advanced weather data'}</div>
            </div>
          </div>
          <Button onClick={handleRefresh} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { currentConditions, shortTerm, dailyForecast, aiInsights, dataSource } = rainData;

  return (
    <Card 
      className="w-full max-w-4xl bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl"
      onClick={() => setExpandedView(!expandedView)}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getIntensityIcon(currentConditions.intensity)}
              <span className="text-xl font-bold text-gray-800">
                Advanced Rain Prediction
              </span>
            </div>
            <Badge className={getRiskLevelColor(aiInsights.riskLevel)}>
              {aiInsights.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>

        {/* Location and Data Sources */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {currentLocation ? `${currentLocation.city}, ${currentLocation.state}` : 'Varanasi, UP'}
            </span>
            {cropType && (
              <Badge variant="outline" className="text-xs">
                <Sprout className="h-3 w-3 mr-1" />
                {cropType}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {dataSource.satellite && <Satellite className="h-4 w-4 text-green-600" />}
            {dataSource.radar && <Radar className="h-4 w-4 text-blue-600" />}
            {dataSource.aiAnalysis && <Brain className="h-4 w-4 text-purple-600" />}
            {dataSource.groundSensors && <Shield className="h-4 w-4 text-orange-600" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Current Conditions - Always Visible */}
        <div className="bg-white rounded-lg p-4 border border-blue-200 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Current Conditions</h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${getConfidenceColor(currentConditions.confidence)}`}>
                {currentConditions.confidence}% Confidence
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentConditions.probability}%</div>
              <div className="text-sm text-gray-600">Rain Chance</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800 capitalize">{currentConditions.intensity}</div>
              <div className="text-sm text-gray-600">Intensity</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {currentConditions.isRaining ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-gray-600">Currently Raining</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {currentConditions.duration ? `${currentConditions.duration}m` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
          </div>

          {currentConditions.isRaining && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <CloudRain className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Active Rainfall Detected - Started at {new Date(currentConditions.startTime!).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {aiInsights.alerts.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Weather Alerts</span>
            </div>
            <div className="space-y-1">
              {aiInsights.alerts.map((alert, index) => (
                <div key={index} className="text-sm text-yellow-700">{alert}</div>
              ))}
            </div>
          </div>
        )}

        {/* Timeframe Selection */}
        <div className="flex space-x-2 mb-4">
          {[
            { key: 'current', label: 'Current', icon: Clock },
            { key: 'hourly', label: '6 Hours', icon: TrendingUp },
            { key: 'daily', label: '7 Days', icon: TrendingUp }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={selectedTimeframe === key ? 'default' : 'outline'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTimeframe(key as any);
              }}
              className="flex items-center space-x-1"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Button>
          ))}
        </div>

        {/* Expanded Content */}
        {expandedView && (
          <div className="space-y-4">
            {/* Hourly Forecast */}
            {selectedTimeframe === 'hourly' && (
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Next 6 Hours</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {shortTerm.map((hour, index) => (
                    <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        {new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-lg font-semibold text-blue-600">{hour.probability}%</div>
                      <div className="text-xs text-gray-500 capitalize">{hour.intensity}</div>
                      <div className="text-xs text-gray-400">{hour.confidence}% conf.</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Forecast */}
            {selectedTimeframe === 'daily' && (
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">7-Day Forecast</h3>
                <div className="space-y-3">
                  {dailyForecast.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-800">
                          {new Date(day.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">{day.timing}</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{day.probability}%</div>
                          <div className="text-xs text-gray-500">Chance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-800">{day.expectedAmount}mm</div>
                          <div className="text-xs text-gray-500">Amount</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">{day.confidence}%</div>
                          <div className="text-xs text-gray-500">Conf.</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center space-x-2 mb-3">
                <Brain className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">AI Weather Analysis</h3>
              </div>
              <div className="text-sm text-gray-700 mb-3">{aiInsights.summary}</div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800">Farming Recommendations:</h4>
                <ul className="space-y-1">
                  {aiInsights.farmingRecommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Sources</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'satellite', label: 'Satellite', icon: Satellite, active: dataSource.satellite },
                  { key: 'radar', label: 'Radar', icon: Radar, active: dataSource.radar },
                  { key: 'aiAnalysis', label: 'AI Analysis', icon: Brain, active: dataSource.aiAnalysis },
                  { key: 'groundSensors', label: 'Ground Sensors', icon: Shield, active: dataSource.groundSensors }
                ].map(({ key, label, icon: Icon, active }) => (
                  <div key={key} className={`flex items-center space-x-2 p-2 rounded-lg ${active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                    <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Last updated: {new Date(dataSource.lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Quick Farming Advice */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <Sprout className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-800">
              {cropType ? `${cropType} Farming Advice` : 'Farming Advice'}
            </span>
          </div>
          <div className="text-sm text-green-700">
            {dailyForecast[0]?.farmerAdvice || 'Monitor weather conditions and plan farming activities accordingly.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
