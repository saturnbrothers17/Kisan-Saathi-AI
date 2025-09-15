'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CloudRain, Droplets, Calendar, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { advancedRainPrediction, type RainPredictionData } from '@/lib/api/advanced-rain-prediction';
import { useManualLocation } from '@/components/manual-location-context';
export function MonsoonPredictionWidget() {
  const [prediction, setPrediction] = useState<RainPredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { location } = useManualLocation();

  const loadMonsoonData = async () => {
    if (!location) {
      console.log('⏳ Waiting for location from LocationProvider...');
      return;
    }

    try {
      setError(null);
      console.log('🌧️ Loading monsoon data for:', location.city, location.district);

      // Get rain prediction using advanced system
      console.log('🤖 Fetching AI rain prediction...');
      const rainData = await advancedRainPrediction.predictRain(
        location.lat,
        location.lon,
        'wheat'
      );

      setPrediction(rainData);
      console.log('✅ Monsoon prediction loaded successfully');

    } catch (error) {
      console.error('❌ Error loading monsoon data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load monsoon data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMonsoonData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (location) {
      loadMonsoonData();
    }
  }, [location]);

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'extreme': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIntensityIcon = (intensity: string) => {
    switch (intensity) {
      case 'none': return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'light': return <Droplets className="h-4 w-4 text-blue-400" />;
      case 'moderate': return <CloudRain className="h-4 w-4 text-blue-600" />;
      case 'heavy': return <CloudRain className="h-4 w-4 text-blue-800" />;
      case 'extreme': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md shadow-lg border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-blue-900">🌧️ मानसून पूर्वानुमान</CardTitle>
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-blue-200 rounded mb-2"></div>
              <div className="h-3 bg-blue-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !prediction) {
    return (
      <Card className="w-full max-w-md shadow-lg border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-red-900">🌧️ मानसून पूर्वानुमान</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error || 'Failed to load predictions'}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-blue-900">🌧️ मानसून पूर्वानुमान</CardTitle>
            <p className="text-xs text-blue-600 mt-1">
              📍 {location?.city}, {location?.district}
            </p>
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
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Monsoon Status */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">वर्तमान स्थिति / Current Status</span>
            <div className="flex items-center gap-1">
              {getIntensityIcon(prediction.currentConditions.intensity)}
              <span className="text-lg font-bold text-blue-900">
                {prediction.currentConditions.probability}%
              </span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mb-1">
            {prediction.currentConditions.intensity === 'none' ? 'No Rain' : 
             prediction.currentConditions.intensity === 'light' ? 'Light Rain' :
             prediction.currentConditions.intensity === 'moderate' ? 'Moderate Rain' :
             prediction.currentConditions.intensity === 'heavy' ? 'Heavy Rain' : 'Extreme Rain'}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-600">Confidence: {prediction.currentConditions.confidence}%</span>
            <Badge variant="outline" className="text-xs">
              AI Enhanced
            </Badge>
          </div>
        </div>

        {/* Next 6 Hours Forecast */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-800 flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            अगले 6 घंटे / Next 6 Hours
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {prediction.shortTerm.slice(0, 3).map((forecast: any, index: number) => (
              <div key={index} className="bg-gray-50 rounded p-2 text-center">
                <div className="text-xs text-gray-600 mb-1">
                  {new Date(forecast.time).toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </div>
                <div className="flex items-center justify-center mb-1">
                  {getIntensityIcon(forecast.intensity)}
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  {forecast.probability}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Forecast */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-800 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            साप्ताहिक पूर्वानुमान / Weekly Forecast
          </h4>
          <div className="space-y-1">
            {prediction.dailyForecast.slice(0, 3).map((day: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-600">
                  {new Date(day.date).toLocaleDateString('en-IN', { 
                    weekday: 'short',
                    day: 'numeric'
                  })}
                </span>
                <div className="flex items-center gap-2">
                  {getIntensityIcon(day.probability > 70 ? 'moderate' : day.probability > 40 ? 'light' : 'none')}
                  <span className="text-sm font-medium">{day.probability}%</span>
                  <span className="text-xs text-gray-500">{day.expectedAmount}mm</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-800">जोखिम मूल्यांकन / Risk Assessment</h4>
          <Badge className={`w-full justify-center py-1 ${getRiskColor(prediction.aiInsights.riskLevel)}`}>
            {prediction.aiInsights.riskLevel.toUpperCase()} RISK
          </Badge>
        </div>

        {/* AI Insights */}
        {prediction.aiInsights && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-1 flex items-center gap-1">
              🤖 AI सुझाव / AI Recommendations
            </h4>
            <p className="text-xs text-green-700 leading-relaxed">
              {prediction.aiInsights.summary.slice(0, 120)}...
            </p>
          </div>
        )}

        {/* Data Sources */}
        <div className="flex justify-center gap-2 pt-2 border-t">
          <Badge variant="outline" className="text-xs">🛰️ Satellite</Badge>
          <Badge variant="outline" className="text-xs">📡 Radar</Badge>
          <Badge variant="outline" className="text-xs">🧠 AI</Badge>
          <Badge variant="outline" className="text-xs">🌡️ Ground</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
