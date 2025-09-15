'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  CloudRain, 
  Sprout, 
  Bug, 
  Droplets, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Thermometer,
  Wind,
  Sun,
  Languages,
  Bell,
  ArrowLeft,
  Satellite
} from 'lucide-react';
import { fetchSoilSensorData, type SoilSensorData } from '@/lib/api/real-time-data-api';
import { getCurrentLocation } from '@/lib/api/weather-api';
import { DirectWeatherWidget } from './direct-weather-widget';
import { PestDiseaseAlert } from './pest-disease-alert';
import { CropAdvisory } from './crop-advisory';
import { MonsoonTracker } from './monsoon-tracker';
import { SoilMoisturePredictor } from './soil-moisture-predictor';
import { IrrigationScheduler } from './irrigation-scheduler';
import { FertilizerPesticideScheduler } from './fertilizer-pesticide-scheduler';
import { SeasonalCropPlanner } from './seasonal-crop-planner';
import { AdvancedFarmerWeather } from './advanced-farmer-weather';
import { HyperspectralDashboard } from './hyperspectral-dashboard';
import { ExtremeWeatherAlerts } from './extreme-weather-alerts';

interface FarmerDashboardProps {
  onBack?: () => void;
}

// Real-time Soil Moisture Card Component
function SoilMoistureCard() {
  const [soilData, setSoilData] = useState<SoilSensorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSoilData = async () => {
      try {
        const location = await getCurrentLocation();
        const realSoilData = await fetchSoilSensorData(location);
        setSoilData(realSoilData);
      } catch (error) {
        console.error('Failed to load soil data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSoilData();
  }, []);

  if (loading) {
    return (
      <Card className="bg-cyan-50 border-cyan-200">
        <CardContent className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-2"></div>
          <div className="text-sm text-cyan-700">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!soilData) {
    return (
      <Card className="bg-cyan-50 border-cyan-200">
        <CardContent className="p-4 text-center">
          <Droplets className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-cyan-900">--</div>
          <div className="text-sm text-cyan-700">Soil Moisture</div>
          <Badge className="mt-2 bg-cyan-100 text-cyan-800">No Data</Badge>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (moisture: number) => {
    if (moisture >= 70) return { text: 'Optimal', class: 'bg-green-100 text-green-800' };
    if (moisture >= 50) return { text: 'Good', class: 'bg-blue-100 text-blue-800' };
    if (moisture >= 30) return { text: 'Below Optimal', class: 'bg-orange-100 text-orange-800' };
    return { text: 'Critical', class: 'bg-red-100 text-red-800' };
  };

  const status = getStatusBadge(soilData.moisture);

  return (
    <Card className="bg-cyan-50 border-cyan-200">
      <CardContent className="p-4 text-center">
        <Droplets className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-cyan-900">{soilData.moisture}%</div>
        <div className="text-sm text-cyan-700">Soil Moisture</div>
        <Badge className={`mt-2 ${status.class}`}>{status.text}</Badge>
      </CardContent>
    </Card>
  );
}

export function FarmerDashboard({ onBack }: FarmerDashboardProps) {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [activeTab, setActiveTab] = useState('overview');

  const translations = {
    en: {
      title: 'Kisan Saathi AI - Farmer Dashboard',
      subtitle: 'Advanced Agricultural Intelligence System',
      overview: 'Overview',
      weather: 'Weather',
      monsoon: 'Monsoon',
      crops: 'Crops',
      pests: 'Pest Alerts',
      irrigation: 'Irrigation',
      soil: 'Soil Health',
      advanced: 'Advanced'
    },
    hi: {
      title: 'किसान साथी AI - किसान डैशबोर्ड',
      subtitle: 'उन्नत कृषि बुद्धिमत्ता प्रणाली',
      overview: 'अवलोकन',
      weather: 'मौसम',
      monsoon: 'मानसून',
      crops: 'फसल',
      pests: 'कीट चेतावनी',
      irrigation: 'सिंचाई',
      soil: 'मिट्टी स्वास्थ्य',
      advanced: 'उन्नत'
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">{t.title}</CardTitle>
                <p className="text-green-100 mt-1">{t.subtitle}</p>
              </div>
              <div className="flex items-center gap-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Languages className="h-4 w-4" />
                  {language === 'en' ? 'हिंदी' : 'English'}
                </button>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">3 Alerts</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{t.overview}</span>
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <CloudRain className="h-4 w-4" />
              <span className="hidden sm:inline">{t.weather}</span>
            </TabsTrigger>
            <TabsTrigger value="monsoon" className="flex items-center gap-2">
              <CloudRain className="h-4 w-4" />
              <span className="hidden sm:inline">{t.monsoon}</span>
            </TabsTrigger>
            <TabsTrigger value="crops" className="flex items-center gap-2">
              <Sprout className="h-4 w-4" />
              <span className="hidden sm:inline">{t.crops}</span>
            </TabsTrigger>
            <TabsTrigger value="pests" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              <span className="hidden sm:inline">{t.pests}</span>
            </TabsTrigger>
            <TabsTrigger value="irrigation" className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">{t.irrigation}</span>
            </TabsTrigger>
            <TabsTrigger value="soil" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{t.soil}</span>
            </TabsTrigger>
            <TabsTrigger value="hyperspectral" className="flex items-center gap-2">
              <Satellite className="h-4 w-4" />
              <span className="hidden sm:inline">Spectral</span>
            </TabsTrigger>
            <TabsTrigger value="planning" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Planning</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DirectWeatherWidget />
              </div>
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-green-800">Quick Alerts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="font-medium text-red-800">High Pest Risk</div>
                        <div className="text-sm text-red-600">Brown plant hopper detected</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <Droplets className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium text-orange-800">Irrigation Due</div>
                        <div className="text-sm text-orange-600">Soil moisture below optimal</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <CloudRain className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-800">Rain Expected</div>
                        <div className="text-sm text-blue-600">Heavy rain in 2 days</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <Sprout className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">Rice</div>
                  <div className="text-sm text-green-700">Tillering Stage</div>
                  <Badge className="mt-2 bg-green-100 text-green-800">Day 28/35</Badge>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <CloudRain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">75%</div>
                  <div className="text-sm text-blue-700">Monsoon Progress</div>
                  <Badge className="mt-2 bg-blue-100 text-blue-800">Active</Badge>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4 text-center">
                  <Bug className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-900">2</div>
                  <div className="text-sm text-orange-700">Active Pest Alerts</div>
                  <Badge className="mt-2 bg-orange-100 text-orange-800">High Risk</Badge>
                </CardContent>
              </Card>
              
              <SoilMoistureCard />
            </div>
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">🟢 Weather Information</h3>
                  <DirectWeatherWidget />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">🌧️ Monsoon Tracking</h3>
                  <MonsoonTracker />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Monsoon Tab */}
          <TabsContent value="monsoon">
            <MonsoonTracker />
          </TabsContent>

          {/* Crops Tab */}
          <TabsContent value="crops">
            <CropAdvisory />
          </TabsContent>

          {/* Pest Alerts Tab */}
          <TabsContent value="pests">
            <PestDiseaseAlert />
          </TabsContent>

          {/* Irrigation Tab */}
          <TabsContent value="irrigation">
            <IrrigationScheduler />
          </TabsContent>

          {/* Soil Health Tab */}
          <TabsContent value="soil">
            <SoilMoisturePredictor />
          </TabsContent>

          {/* Hyperspectral Imaging Tab */}
          <TabsContent value="hyperspectral">
            <HyperspectralDashboard fieldId="field_001" userRole="farmer" />
          </TabsContent>

          {/* Planning Tab */}
          <TabsContent value="planning" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <SeasonalCropPlanner />
              <FertilizerPesticideScheduler />
              <ExtremeWeatherAlerts />
            </div>
          </TabsContent>

          {/* Advanced Tab - Keep existing for backward compatibility */}
          <TabsContent value="advanced">
            <AdvancedFarmerWeather />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
