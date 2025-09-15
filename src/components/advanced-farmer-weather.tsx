'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, CloudRain, Sun, Droplets, Wind, AlertTriangle, 
  Sprout, Calendar, MapPin, TrendingUp, Thermometer,
  Zap, Shield, Clock, Target, Wheat, TreePine
} from 'lucide-react';

interface CropAdvisory {
  crop: string;
  stage: string;
  recommendation: string;
  urgency: 'low' | 'medium' | 'high';
}

interface PestRisk {
  pest: string;
  risk: number;
  conditions: string;
  prevention: string;
}

interface IrrigationSchedule {
  nextIrrigation: string;
  amount: string;
  reason: string;
}

interface AdvancedWeatherData {
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  soilMoisture: number;
  uvIndex: number;
  windSpeed: number;
  monsoonStatus: string;
  cropAdvisories: CropAdvisory[];
  pestRisks: PestRisk[];
  irrigationSchedule: IrrigationSchedule;
  extremeWeatherAlerts: string[];
}

export function AdvancedFarmerWeather() {
  const [weatherData, setWeatherData] = useState<AdvancedWeatherData | null>(null);
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  const crops = ['rice', 'wheat', 'cotton', 'sugarcane', 'maize', 'soybean'];
  
  const translations = {
    en: {
      title: 'Kisan Weather Intelligence',
      monsoon: 'Monsoon Status',
      soilMoisture: 'Soil Moisture',
      irrigation: 'Irrigation Schedule',
      pestRisk: 'Pest Risk Alert',
      cropAdvice: 'Crop Advisory',
      extremeWeather: 'Weather Alerts'
    },
    hi: {
      title: 'किसान मौसम बुद्धिमत्ता',
      monsoon: 'मानसून स्थिति',
      soilMoisture: 'मिट्टी की नमी',
      irrigation: 'सिंचाई कार्यक्रम',
      pestRisk: 'कीट जोखिम चेतावनी',
      cropAdvice: 'फसल सलाह',
      extremeWeather: 'मौसम चेतावनी'
    }
  };

  const t = translations[language as keyof typeof translations];

  useEffect(() => {
    const loadRealFarmerWeatherData = async () => {
      try {
        setLoading(true);
        
        // Fetch real-time comprehensive farmer weather data
        const response = await fetch('/api/farmer-weather-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            selectedCrop,
            includeAdvisories: true,
            includePestRisk: true,
            includeIrrigation: true 
          })
        });
        
        if (response.ok) {
          const realWeatherData = await response.json();
          setWeatherData(realWeatherData);
        } else {
          throw new Error('Farmer weather intelligence API unavailable');
        }
        
      } catch (error) {
        console.error('Failed to load real farmer weather data:', error);
        setWeatherData(null); // No fallback data - show error state
      } finally {
        setLoading(false);
      }
    };

    loadRealFarmerWeatherData();
  }, [selectedCrop]);

  if (loading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2">Loading farmer intelligence...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) return null;

  return (
    <div className="w-full max-w-6xl space-y-4">
      {/* Header with Language Toggle */}
      <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Wheat className="h-6 w-6" />
              {t.title}
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm ${language === 'en' ? 'bg-white text-green-600' : 'bg-green-500'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded text-sm ${language === 'hi' ? 'bg-white text-green-600' : 'bg-green-500'}`}
              >
                हिंदी
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-100">
            <MapPin className="h-4 w-4" />
            <span>{weatherData.location}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Current Weather Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Thermometer className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">{weatherData.temperature}°C</div>
                <div className="text-sm text-blue-700">Temperature</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">{weatherData.soilMoisture}%</div>
                <div className="text-sm text-green-700">{t.soilMoisture}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sun className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-900">{weatherData.uvIndex}</div>
                <div className="text-sm text-yellow-700">UV Index</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wind className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-900">{weatherData.windSpeed} km/h</div>
                <div className="text-sm text-purple-700">Wind Speed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monsoon Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
            <CloudRain className="h-5 w-5" />
            {t.monsoon}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-600 text-white px-3 py-1">
              {weatherData.monsoonStatus}
            </Badge>
            <span className="text-blue-700">Rainfall: {weatherData.rainfall}mm today</span>
          </div>
        </CardContent>
      </Card>

      {/* Extreme Weather Alerts */}
      {weatherData.extremeWeatherAlerts.length > 0 && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              {t.extremeWeather}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weatherData.extremeWeatherAlerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-orange-100 rounded-lg">
                <Zap className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span className="text-orange-800 text-sm">{alert}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Crop Selection and Advisory */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-800">
              <Sprout className="h-5 w-5" />
              {t.cropAdvice}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {crops.map((crop) => (
                <button
                  key={crop}
                  onClick={() => setSelectedCrop(crop)}
                  className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                    selectedCrop === crop
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {weatherData.cropAdvisories.map((advisory, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{advisory.crop}</span>
                  <Badge 
                    className={`${
                      advisory.urgency === 'high' ? 'bg-red-100 text-red-800' :
                      advisory.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}
                  >
                    {advisory.urgency} priority
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-1">Stage: {advisory.stage}</div>
                <div className="text-sm">{advisory.recommendation}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Irrigation Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <Droplets className="h-5 w-5" />
              {t.irrigation}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Next Irrigation</span>
                </div>
                <div className="text-lg font-bold text-blue-900 mb-1">
                  {weatherData.irrigationSchedule.nextIrrigation}
                </div>
                <div className="text-sm text-blue-700 mb-2">
                  Amount: {weatherData.irrigationSchedule.amount}
                </div>
                <div className="text-sm text-blue-600">
                  {weatherData.irrigationSchedule.reason}
                </div>
              </div>
              
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Soil Moisture Level</span>
                  <span className="text-sm font-bold">{weatherData.soilMoisture}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${weatherData.soilMoisture}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pest Risk Assessment */}
      <Card className="border-yellow-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
            <Shield className="h-5 w-5" />
            {t.pestRisk}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weatherData.pestRisks.map((pest, index) => (
              <div key={index} className="p-4 border rounded-lg bg-yellow-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-yellow-900">{pest.pest}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-yellow-700">Risk Level:</span>
                    <Badge className={`${pest.risk > 70 ? 'bg-red-600' : pest.risk > 40 ? 'bg-yellow-600' : 'bg-green-600'} text-white`}>
                      {pest.risk}%
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-yellow-700 mb-2">
                  <strong>Conditions:</strong> {pest.conditions}
                </div>
                <div className="text-sm text-yellow-800">
                  <strong>Prevention:</strong> {pest.prevention}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
