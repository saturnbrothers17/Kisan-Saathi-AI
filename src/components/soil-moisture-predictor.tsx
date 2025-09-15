'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Droplets, Thermometer, RefreshCw } from 'lucide-react';
import { fetchSoilSensorData, type SoilSensorData } from '@/lib/api/real-time-data-api';
import { getCurrentLocation } from '@/lib/api/weather-api';

export function SoilMoisturePredictor() {
  const [soilData, setSoilData] = useState<SoilSensorData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSoilData = async () => {
    try {
      setLoading(true);
      const location = await getCurrentLocation();
      const realSoilData = await fetchSoilSensorData(location);
      setSoilData(realSoilData);
    } catch (error) {
      console.error('Failed to load soil data:', error);
      setSoilData(null); // Set to null on error to show retry button
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoilData();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading soil data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!soilData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Could not load soil data. Please try again.</p>
          <Button onClick={loadSoilData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getMoistureStatus = (moisture: number) => {
    if (moisture < 30) return { status: 'Low', color: 'text-red-600', bg: 'bg-red-100' };
    if (moisture < 60) return { status: 'Optimal', color: 'text-green-600', bg: 'bg-green-100' };
    return { status: 'High', color: 'text-blue-600', bg: 'bg-blue-100' };
  };

  const moistureStatus = getMoistureStatus(soilData.moisture);

  return (
    <Card className="w-full bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Droplets className="h-6 w-6" />
          Real-Time Soil Health Monitor
        </CardTitle>
        <Button onClick={loadSoilData} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Moisture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/50 rounded-lg">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${moistureStatus.bg} ${moistureStatus.color}`}>
              {moistureStatus.status}
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold text-green-900">{soilData.moisture}%</div>
              <div className="text-sm text-green-700">Soil Moisture</div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-white/50 rounded-lg">
            <Thermometer className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">{soilData.temperature}°C</div>
            <div className="text-sm text-orange-700">Soil Temperature</div>
          </div>
          
          <div className="text-center p-4 bg-white/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900">pH {soilData.ph}</div>
            <div className="text-sm text-purple-700">Soil pH Level</div>
          </div>
        </div>

        {/* Nutrient Levels */}
        <div>
          <h3 className="text-lg font-semibold text-green-800 mb-3">Nutrient Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Nitrogen (N)</span>
                <span className="text-lg font-bold text-blue-900">{soilData.nitrogen} kg/ha</span>
              </div>
              <Progress value={(soilData.nitrogen / 300) * 100} className="h-2" />
            </div>
            
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Phosphorus (P)</span>
                <span className="text-lg font-bold text-orange-900">{soilData.phosphorus} kg/ha</span>
              </div>
              <Progress value={(soilData.phosphorus / 50) * 100} className="h-2" />
            </div>
            
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Potassium (K)</span>
                <span className="text-lg font-bold text-green-900">{soilData.potassium} kg/ha</span>
              </div>
              <Progress value={(soilData.potassium / 400) * 100} className="h-2" />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Smart Recommendations</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {soilData.moisture < 40 && <li>• Increase irrigation frequency - soil moisture is below optimal</li>}
            {soilData.ph < 6.0 && <li>• Apply lime to increase soil pH for better nutrient uptake</li>}
            {soilData.nitrogen < 150 && <li>• Apply nitrogen fertilizer - current levels are low</li>}
            {soilData.organicMatter < 1.0 && <li>• Add organic compost to improve soil structure</li>}
            <li>• Last updated: {new Date(soilData.timestamp).toLocaleString()}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
