'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CloudRain, Droplets, TrendingUp, Calendar, RefreshCw, AlertTriangle, CheckCircle, Sprout } from 'lucide-react';
import { fetchMonsoonData, getCurrentLocation, fetchWeatherData, type MonsoonData } from '@/lib/api/weather-api';

// Dynamic Farmer Advisory Component
interface DynamicFarmerAdvisoryProps {
  monsoonData: MonsoonData;
}

// Helper function to convert technical terms to farmer-friendly language
function getMonsoonStatusText(progress: number): string {
  if (progress < 10) return "बारिश शुरू नहीं हुई / Rain not started";
  if (progress < 30) return "बारिश शुरू हो गई / Rain has begun";
  if (progress < 60) return "अच्छी बारिश हो रही है / Good rainfall";
  if (progress < 85) return "बारिश का अंत आ रहा है / Rain ending soon";
  return "बारिश खत्म हो गई / Rain season over";
}

function getRainfallText(mm: number): string {
  if (mm < 50) return `बहुत कम बारिश / Very little rain (${Math.round(mm/25)} इंच)`;
  if (mm < 200) return `कम बारिश / Less rain (${Math.round(mm/25)} इंच)`;
  if (mm < 500) return `सामान्य बारिश / Normal rain (${Math.round(mm/25)} इंच)`;
  if (mm < 800) return `अच्छी बारिश / Good rain (${Math.round(mm/25)} इंच)`;
  return `बहुत ज्यादा बारिश / Heavy rain (${Math.round(mm/25)} इंच)`;
}

function getRainfallStatus(current: number, normal: number): string {
  const difference = ((current - normal) / normal) * 100;
  if (difference > 20) return "सामान्य से ज्यादा / More than normal";
  if (difference > -20) return "सामान्य / Normal";
  return "सामान्य से कम / Less than normal";
}

function DynamicFarmerAdvisory({ monsoonData }: DynamicFarmerAdvisoryProps) {
  const generateAdvisory = (): string[] => {
    const advisories: string[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Analyze upcoming rainfall
    const upcomingRain = monsoonData.weeklyForecast.slice(0, 3);
    const heavyRainDays = upcomingRain.filter(day => day.rainfall > 20);
    const highProbabilityDays = upcomingRain.filter(day => day.probability > 70);
    
    // Heavy rainfall advisory - Simple language
    if (heavyRainDays.length > 0) {
      advisories.push(`तेज़ बारिश आएगी - दवा छिड़काव न करें / Heavy rain coming - Don't spray medicine`);
      advisories.push(`खेत में पानी निकासी का इंतज़ाम करें / Arrange water drainage in fields`);
    }
    
    // High probability rain advisory
    if (highProbabilityDays.length > 0) {
      advisories.push(`3 दिन में बारिश पक्की - तैयार फसल काट लें / Rain sure in 3 days - Harvest ready crops`);
    }
    
    // Seasonal crop recommendations - Simple farmer language
    if (currentMonth >= 6 && currentMonth <= 9) { // Monsoon season
      if (monsoonData.progress < 30) {
        advisories.push(`धान रोपाई का अच्छा समय है / Good time for rice planting`);
      } else if (monsoonData.progress < 70) {
        advisories.push(`खरीफ फसल में यूरिया डालें / Add urea to kharif crops`);
      } else {
        advisories.push(`रबी फसल की तैयारी करें / Prepare for rabi crops`);
      }
    } else if (currentMonth >= 10 && currentMonth <= 3) { // Rabi season
      advisories.push(`गेहूं, सरसों बोने का समय / Time to sow wheat, mustard`);
    } else { // Summer season
      advisories.push(`गर्मी में पानी की व्यवस्था करें / Arrange water in summer`);
    }
    
    // Rainfall deficit/excess advisory - Simple terms
    const rainfallDeparture = ((monsoonData.seasonalRainfall - monsoonData.normalRainfall) / monsoonData.normalRainfall) * 100;
    if (rainfallDeparture > 20) {
      advisories.push(`ज्यादा बारिश - बीमारी से बचाव करें / Too much rain - Prevent diseases`);
    } else if (rainfallDeparture < -20) {
      advisories.push(`कम बारिश - पानी बचाकर इस्तेमाल करें / Less rain - Save and use water`);
    }
    
    // Monsoon phase specific advice
    if (monsoonData.currentPhase === 'withdrawal') {
      advisories.push(`बारिश खत्म हो रही - अगली फसल तैयार करें / Rain ending - Prepare next crop`);
    }
    
    return advisories.slice(0, 4); // Limit to 4 most relevant advisories
  };

  const advisories = generateAdvisory();

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
        <Sprout className="h-4 w-4" />
        Real-Time Farmer Advisory
      </h4>
      <ul className="text-sm text-green-700 space-y-1">
        {advisories.map((advisory, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckCircle className="h-3 w-3 mt-1 flex-shrink-0 text-green-600" />
            <span>{advisory}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 pt-2 border-t border-green-200">
        <p className="text-xs text-green-600 italic">
          Advisory updated based on real-time weather data and seasonal patterns
        </p>
      </div>
    </div>
  );
}

export function MonsoonTracker() {
  const [monsoonData, setMonsoonData] = useState<MonsoonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMonsoonData = async () => {
      try {
        setLoading(true);
        const location = await getCurrentLocation();
        const realMonsoonData = await fetchMonsoonData(location.lat, location.lon);
        setMonsoonData(realMonsoonData);
      } catch (error) {
        console.error('Failed to load monsoon data:', error);
        // No fallback data - show error state
        setMonsoonData(null);
      } finally {
        setLoading(false);
      }
    };

    loadMonsoonData();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading monsoon data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!monsoonData) return null;

  const getStatusColor = (phase: string) => {
    switch (phase) {
      case 'onset': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'withdrawal': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <CloudRain className="h-6 w-6" />
          Monsoon Tracker & Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <Badge className={getStatusColor(monsoonData.currentPhase)}>
              {monsoonData.currentPhase.charAt(0).toUpperCase() + monsoonData.currentPhase.slice(1)}
            </Badge>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {getMonsoonStatusText(monsoonData.progress)}
              </div>
              <div className="text-sm text-blue-500">बारिश की स्थिति / Rain Status</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900">{getRainfallText(monsoonData.seasonalRainfall)}</div>
            <div className="text-sm text-green-700">कुल बारिश / Total Rainfall</div>
            <div className="text-xs mt-1 text-blue-600">
              {getRainfallStatus(monsoonData.seasonalRainfall, monsoonData.normalRainfall)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-900">{monsoonData.withdrawalDate || 'जल्द पता चलेगा / Will know soon'}</div>
            <div className="text-sm text-purple-700">बारिश कब खत्म होगी / When rain will end</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-blue-700">
            <span>बारिश का समय / Rain Season Progress</span>
            <span>{getMonsoonStatusText(monsoonData.progress)}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full monsoon-progress-bar"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ width: `${monsoonData.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Weekly Forecast */}
        <div>
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            अगले 7 दिन बारिश / Next 7 Days Rain
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {monsoonData.weeklyForecast.map((day, index) => (
              <div key={index} className="text-center p-3 bg-white rounded-lg border">
                <div className="text-xs font-medium text-gray-600 mb-1">{day.date}</div>
                <div className="text-sm font-bold text-blue-900 mb-1">
                  {day.rainfall > 0 ? `${Math.round(day.rainfall/25)} इंच` : 'सूखा'}
                </div>
                <div className="text-xs text-blue-600">
                  {day.probability > 70 ? 'पक्का बारिश' : day.probability > 40 ? 'हो सकती है' : 'कम चांस'}
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full forecast-probability-bar"
                      // eslint-disable-next-line react/forbid-dom-props
                      style={{ width: `${day.probability}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Farmer Advisory */}
        <DynamicFarmerAdvisory monsoonData={monsoonData} />
      </CardContent>
    </Card>
  );
}
