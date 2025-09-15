'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sprout, Calendar, TrendingUp, Droplets, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchCropAdvisory, type CropData } from '@/lib/api/agricultural-api';
import { getCurrentLocation } from '@/lib/api/weather-api';
import { CropPricesWidget } from '@/components/crop-prices-widget';

// Remove duplicate interfaces - using the ones from agricultural-api.ts

export function CropAdvisory() {
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [cropData, setCropData] = useState<CropData | null>(null);
  const [loading, setLoading] = useState(true);

  const crops = [
    { id: 'rice', name: 'धान / Rice', icon: '🌾', season: 'kharif' },
    { id: 'wheat', name: 'गेहूं / Wheat', icon: '🌾', season: 'rabi' },
    { id: 'cotton', name: 'कपास / Cotton', icon: '🌱', season: 'kharif' },
    { id: 'sugarcane', name: 'गन्ना / Sugarcane', icon: '🎋', season: 'perennial' },
    { id: 'maize', name: 'मक्का / Maize', icon: '🌽', season: 'kharif' },
    { id: 'soybean', name: 'सोयाबीन / Soybean', icon: '🫘', season: 'kharif' },
    { id: 'mustard', name: 'सरसों / Mustard', icon: '🌻', season: 'rabi' },
    { id: 'potato', name: 'आलू / Potato', icon: '🥔', season: 'rabi' },
    { id: 'tomato', name: 'टमाटर / Tomato', icon: '🍅', season: 'all' },
    { id: 'onion', name: 'प्याज / Onion', icon: '🧅', season: 'all' }
  ];

  useEffect(() => {
    const loadCropAdvisory = async () => {
      try {
        setLoading(true);
        const location = await getCurrentLocation();
        
        // Fetch real crop advisory data
        const realCropData = await fetchCropAdvisory(location.lat, location.lon, selectedCrop);
        setCropData(realCropData);
      } catch (error) {
        console.error('Failed to load crop advisory:', error);
        setCropData(null); // No fallback data - show error state
      } finally {
        setLoading(false);
      }
    };

    loadCropAdvisory();
  }, [selectedCrop]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading crop advisory...</p>
        </CardContent>
      </Card>
    );
  }

  if (!cropData) return null;

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const progressPercentage = (cropData.currentStage.currentDay / cropData.currentStage.totalDays) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Crop Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Sprout className="h-6 w-6" />
फसल सलाह सिस्टम / Crop Advisory System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop.id)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  selectedCrop === crop.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="text-2xl mb-1">{crop.icon}</div>
                <div className="text-sm font-medium">{crop.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {crop.season === 'kharif' ? 'खरीफ' : crop.season === 'rabi' ? 'रबी' : crop.season === 'perennial' ? 'साल भर' : 'सभी मौसम'}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Crop Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{cropData.name} - {cropData.variety}</span>
              <Badge className={getSuitabilityColor(cropData.weatherSuitability)}>
                Weather: {cropData.weatherSuitability}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Stage Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-green-800">{cropData.currentStage.name}</h3>
                <span className="text-sm text-gray-600">
                  दिन {cropData.currentStage.currentDay} / {cropData.currentStage.totalDays}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-500 crop-progress-bar"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">{cropData.currentStage.duration}</div>
            </div>

            {/* Activities */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                अभी करने वाले काम / Current Activities
              </h4>
              <ul className="space-y-2">
                {cropData.currentStage.activities.map((activity, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{activity}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weather Requirements */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">मौसम की जरूरत / Weather Requirements</h4>
              <p className="text-sm text-blue-700">{cropData.currentStage.weatherRequirements}</p>
            </div>
            
            {/* Real-time Market Prices */}
            <div className="bg-green-50 p-3 rounded-lg">
              <CropPricesWidget />
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Calendar className="h-5 w-5" />
              फसल का समय / Crop Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="text-sm font-medium">बोया गया / Planted</div>
                  <div className="text-xs text-gray-600">{cropData.plantingDate}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div>
                  <div className="text-sm font-medium">अभी की स्थिति / Current Stage</div>
                  <div className="text-xs text-gray-600">{cropData.currentStage.name}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <div>
                  <div className="text-sm font-medium">अगली स्थिति / Next Stage</div>
                  <div className="text-xs text-gray-600">{cropData.nextStage}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div>
                  <div className="text-sm font-medium">कटाई / Harvest</div>
                  <div className="text-xs text-gray-600">{cropData.harvestDate}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              सुझाव / Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {cropData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              चेतावनी और खतरे / Alerts & Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cropData.alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-orange-800">{alert}</span>
                </div>
              ))}
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">इस समय के खतरे / Stage Risks</h4>
                <ul className="space-y-1">
                  {cropData.currentStage.risks.map((risk, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
