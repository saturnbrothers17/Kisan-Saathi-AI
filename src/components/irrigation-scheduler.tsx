'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Calendar, Clock, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface IrrigationSchedule {
  date: string;
  time: string;
  duration: number; // minutes
  amount: number; // liters per square meter
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cropStage: string;
  weatherFactor: string;
}

interface SoilMoisture {
  current: number; // percentage
  optimal: number; // percentage
  status: 'deficit' | 'optimal' | 'excess';
  lastUpdated: string;
}

export function IrrigationScheduler() {
  const [schedule, setSchedule] = useState<IrrigationSchedule[]>([]);
  const [soilMoisture, setSoilMoisture] = useState<SoilMoisture | null>(null);
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const crops = [
    { id: 'rice', name: 'Rice (धान)', waterReq: 'High' },
    { id: 'wheat', name: 'Wheat (गेहूं)', waterReq: 'Medium' },
    { id: 'cotton', name: 'Cotton (कपास)', waterReq: 'Medium' },
    { id: 'sugarcane', name: 'Sugarcane (गन्ना)', waterReq: 'Very High' },
    { id: 'vegetables', name: 'Vegetables (सब्जी)', waterReq: 'High' }
  ];

  useEffect(() => {
    const loadRealIrrigationData = async () => {
      try {
        setLoading(true);
        
        // Get real-time soil moisture data from IoT sensors
        const soilResponse = await fetch('/api/soil-moisture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crop: selectedCrop })
        });
        
        if (soilResponse.ok) {
          const soilData = await soilResponse.json();
          setSoilMoisture(soilData);
        } else {
          throw new Error('Soil moisture API unavailable');
        }

        // Get real-time irrigation schedule from agricultural database
        const scheduleResponse = await fetch('/api/irrigation-schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crop: selectedCrop })
        });
        
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          setSchedule(scheduleData);
        } else {
          throw new Error('Irrigation schedule API unavailable');
        }
        
      } catch (error) {
        console.error('Failed to load real irrigation data:', error);
        setError('Unable to load irrigation data. Please check sensor connectivity.');
      } finally {
        setLoading(false);
      }
    };

    loadRealIrrigationData();
  }, [selectedCrop]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMoistureColor = (status: string) => {
    switch (status) {
      case 'deficit': return 'text-red-600';
      case 'optimal': return 'text-green-600';
      case 'excess': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getMoistureIcon = (status: string) => {
    switch (status) {
      case 'deficit': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'optimal': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'excess': return <TrendingDown className="h-5 w-5 text-blue-500" />;
      default: return <Droplets className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Calculating irrigation schedule...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Droplets className="h-6 w-6" />
            Smart Irrigation Scheduler
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-3">
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCrop === crop.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {crop.name}
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Soil Moisture Status */}
      {soilMoisture && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-800">Current Soil Moisture</h3>
                {getMoistureIcon(soilMoisture.status)}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current</span>
                  <span className={`font-bold ${getMoistureColor(soilMoisture.status)}`}>
                    {soilMoisture.current}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      soilMoisture.status === 'deficit' ? 'bg-red-500' :
                      soilMoisture.status === 'optimal' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${soilMoisture.current}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>Optimal: {soilMoisture.optimal}%</span>
                  <span>100%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {soilMoisture.lastUpdated}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Water Requirements</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Crop Type</span>
                  <span className="font-medium">{crops.find(c => c.id === selectedCrop)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Water Need</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {crops.find(c => c.id === selectedCrop)?.waterReq}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Daily Requirement</span>
                  <span className="font-medium">25-30 L/m²</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Weather Impact</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Temperature</span>
                  <span className="font-medium">32°C (High)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Humidity</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rain Forecast</span>
                  <span className="font-medium text-orange-600">No rain (3 days)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Irrigation Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Calendar className="h-5 w-5" />
            Upcoming Irrigation Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedule.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                item.priority === 'critical' ? 'border-l-red-500 bg-red-50' :
                item.priority === 'high' ? 'border-l-orange-500 bg-orange-50' :
                item.priority === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                'border-l-green-500 bg-green-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold">{item.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">{item.time}</span>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="text-center p-2 bg-white rounded">
                    <div className="text-lg font-bold text-blue-900">{item.duration} min</div>
                    <div className="text-xs text-gray-600">Duration</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className="text-lg font-bold text-blue-900">{item.amount} L/m²</div>
                    <div className="text-xs text-gray-600">Water Amount</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <div className="text-sm font-medium text-blue-900">{item.cropStage}</div>
                    <div className="text-xs text-gray-600">Crop Stage</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Reason: </span>
                    <span className="text-sm text-gray-600">{item.reason}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Weather Factor: </span>
                    <span className="text-sm text-gray-600">{item.weatherFactor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Water Conservation Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <TrendingDown className="h-5 w-5" />
            Water Conservation Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-800 mb-2">Efficient Irrigation Methods</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Use drip irrigation to reduce water waste by 30-50%</li>
                <li>• Install moisture sensors for precise watering</li>
                <li>• Irrigate early morning or late evening to reduce evaporation</li>
                <li>• Apply mulch to retain soil moisture</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">Smart Scheduling</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Check weather forecast before irrigation</li>
                <li>• Adjust schedule based on rainfall predictions</li>
                <li>• Monitor soil moisture regularly</li>
                <li>• Use rainwater harvesting when possible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
