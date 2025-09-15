'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Beaker, Calendar, Clock, Leaf, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchApplicationSchedule } from '@/lib/api/agricultural-api';

interface ApplicationSchedule {
  id: string;
  type: 'fertilizer' | 'pesticide' | 'herbicide' | 'fungicide';
  name: string;
  nameHindi: string;
  cropStage: string;
  applicationDate: string;
  applicationTime: string;
  dosage: string;
  method: string;
  weatherConditions: string;
  precautions: string[];
  benefits: string[];
  cost: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'upcoming' | 'due' | 'overdue' | 'completed';
}

export function FertilizerPesticideScheduler() {
  const [schedule, setSchedule] = useState<ApplicationSchedule[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [loading, setLoading] = useState(true);

  const applicationTypes = [
    { id: 'all', name: 'All Applications', icon: '🌾' },
    { id: 'fertilizer', name: 'Fertilizers', icon: '🧪' },
    { id: 'pesticide', name: 'Pesticides', icon: '🐛' },
    { id: 'herbicide', name: 'Herbicides', icon: '🌿' },
    { id: 'fungicide', name: 'Fungicides', icon: '🍄' }
  ];

  const crops = [
    { id: 'rice', name: 'Rice (धान)' },
    { id: 'wheat', name: 'Wheat (गेहूं)' },
    { id: 'cotton', name: 'Cotton (कपास)' },
    { id: 'sugarcane', name: 'Sugarcane (गन्ना)' }
  ];

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        const scheduleData = await fetchApplicationSchedule(selectedCrop);
        setSchedule(scheduleData);
      } catch (error) {
        console.error('Failed to load application schedule:', error);
        // Fallback to empty schedule
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [selectedCrop]);

  const filteredSchedule = selectedType === 'all' 
    ? schedule 
    : schedule.filter(item => item.type === selectedType);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'due': return 'bg-orange-100 text-orange-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fertilizer': return <Beaker className="h-5 w-5 text-green-600" />;
      case 'pesticide': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'herbicide': return <Leaf className="h-5 w-5 text-yellow-600" />;
      case 'fungicide': return <CheckCircle className="h-5 w-5 text-purple-600" />;
      default: return <Beaker className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading application schedule...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Beaker className="h-6 w-6" />
            Fertilizer & Pesticide Application Scheduler
          </CardTitle>
          
          {/* Crop Selection */}
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="text-sm font-medium text-gray-700 mr-2">Crop:</div>
            {crops.map((crop) => (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCrop === crop.id
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {crop.name}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="text-sm font-medium text-gray-700 mr-2">Filter:</div>
            {applicationTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedType === type.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {type.icon} {type.name}
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-900">
              {filteredSchedule.filter(s => s.status === 'due' || s.status === 'overdue').length}
            </div>
            <div className="text-sm text-red-700">Due/Overdue</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">
              {filteredSchedule.filter(s => s.status === 'upcoming').length}
            </div>
            <div className="text-sm text-blue-700">Upcoming</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-900">
              {filteredSchedule.filter(s => s.priority === 'critical' || s.priority === 'high').length}
            </div>
            <div className="text-sm text-orange-700">High Priority</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-900">
              {filteredSchedule.filter(s => s.status === 'completed').length}
            </div>
            <div className="text-sm text-green-700">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Application Schedule */}
      <div className="space-y-4">
        {filteredSchedule.map((item) => (
          <Card key={item.id} className={`border-l-4 ${
            item.priority === 'critical' ? 'border-l-red-500' :
            item.priority === 'high' ? 'border-l-orange-500' :
            item.priority === 'medium' ? 'border-l-yellow-500' :
            'border-l-green-500'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(item.type)}
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <p className="text-sm text-gray-600 font-normal">{item.nameHindi}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.toUpperCase()}
                  </Badge>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </h4>
                  <p className="text-sm text-blue-700">{item.applicationDate}</p>
                  <p className="text-sm text-blue-700">{item.applicationTime}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Dosage & Method</h4>
                  <p className="text-sm text-green-700">{item.dosage}</p>
                  <p className="text-sm text-green-700">{item.method}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-1">Crop Stage</h4>
                  <p className="text-sm text-purple-700">{item.cropStage}</p>
                  <p className="text-sm text-purple-700 font-medium">{item.cost}</p>
                </div>
              </div>

              {/* Weather Conditions */}
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-1 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Weather Conditions
                </h4>
                <p className="text-sm text-yellow-700">{item.weatherConditions}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Precautions */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Safety Precautions
                  </h4>
                  <ul className="space-y-1">
                    {item.precautions.map((precaution, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        {precaution}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Expected Benefits
                  </h4>
                  <ul className="space-y-1">
                    {item.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchedule.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Beaker className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Scheduled</h3>
            <p className="text-gray-600">No fertilizer or pesticide applications found for the selected filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Best Practices */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Leaf className="h-5 w-5" />
            Application Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-emerald-800 mb-2">Safety Guidelines</h4>
              <ul className="space-y-1 text-sm text-emerald-700">
                <li>• Always wear protective equipment (gloves, mask, goggles)</li>
                <li>• Read and follow label instructions carefully</li>
                <li>• Store chemicals in original containers safely</li>
                <li>• Keep records of all applications</li>
                <li>• Dispose of empty containers properly</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-emerald-800 mb-2">Timing & Weather</h4>
              <ul className="space-y-1 text-sm text-emerald-700">
                <li>• Apply during calm weather conditions</li>
                <li>• Avoid application before rain (check 6-hour forecast)</li>
                <li>• Early morning or evening applications are preferred</li>
                <li>• Ensure proper soil moisture for fertilizers</li>
                <li>• Monitor crop growth stage for optimal timing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
