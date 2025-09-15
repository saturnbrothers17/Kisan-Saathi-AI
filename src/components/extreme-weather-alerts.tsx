'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Cloud, Sun, Wind, Zap, Thermometer, Eye } from 'lucide-react';

interface WeatherAlert {
  id: string;
  type: 'heatwave' | 'cyclone' | 'flood' | 'drought' | 'hailstorm' | 'thunderstorm';
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  title: string;
  titleHindi: string;
  description: string;
  startTime: string;
  endTime: string;
  affectedAreas: string[];
  recommendations: string[];
  economicImpact: string;
  preparationTime: string;
}

export function ExtremeWeatherAlerts() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRealWeatherAlerts = async () => {
      try {
        setLoading(true);
        
        // Get real-time extreme weather alerts from meteorological services
        const response = await fetch('/api/weather-alerts', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const alertsData = await response.json();
          setAlerts(alertsData);
        } else {
          throw new Error('Weather alerts API unavailable');
        }
        
      } catch (error) {
        console.error('Failed to load real weather alerts:', error);
        setAlerts([]); // No fallback data - show error state
      } finally {
        setLoading(false);
      }
    };

    loadRealWeatherAlerts();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'bg-red-100 text-red-800 border-red-500';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-500';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case 'heatwave': return <Sun className="h-6 w-6 text-orange-600" />;
      case 'cyclone': return <Wind className="h-6 w-6 text-blue-600" />;
      case 'flood': return <Cloud className="h-6 w-6 text-blue-600" />;
      case 'drought': return <Sun className="h-6 w-6 text-red-600" />;
      case 'hailstorm': return <Cloud className="h-6 w-6 text-gray-600" />;
      case 'thunderstorm': return <Zap className="h-6 w-6 text-purple-600" />;
      default: return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Monitoring extreme weather conditions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-6 w-6" />
            Extreme Weather Early Warning System
          </CardTitle>
          <p className="text-red-700 text-sm mt-2">
            Real-time alerts for severe weather conditions affecting agriculture
          </p>
        </CardHeader>
      </Card>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-900">
              {alerts.filter(a => a.severity === 'extreme').length}
            </div>
            <div className="text-sm text-red-700">Extreme Alerts</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-900">
              {alerts.filter(a => a.severity === 'high').length}
            </div>
            <div className="text-sm text-orange-700">High Severity</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-900">
              {alerts.filter(a => a.severity === 'moderate').length}
            </div>
            <div className="text-sm text-yellow-700">Moderate</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">
              {alerts.filter(a => a.severity === 'low').length}
            </div>
            <div className="text-sm text-blue-700">Low Risk</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className={`border-l-4 ${
            alert.severity === 'extreme' ? 'border-l-red-500 bg-red-50' :
            alert.severity === 'high' ? 'border-l-orange-500 bg-orange-50' :
            alert.severity === 'moderate' ? 'border-l-yellow-500 bg-yellow-50' :
            'border-l-blue-500 bg-blue-50'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getWeatherIcon(alert.type)}
                  <div>
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <p className="text-sm text-gray-600 font-normal">{alert.titleHindi}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${getSeverityColor(alert.severity)} border-2`}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800">Prep Time</div>
                    <div className="text-xs text-gray-600">{alert.preparationTime}</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-sm text-gray-700">{alert.description}</p>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border">
                  <h4 className="font-medium text-gray-800 mb-1">Start Time</h4>
                  <p className="text-sm text-gray-600">{alert.startTime}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <h4 className="font-medium text-gray-800 mb-1">End Time</h4>
                  <p className="text-sm text-gray-600">{alert.endTime}</p>
                </div>
              </div>

              {/* Affected Areas */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Affected Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {alert.affectedAreas.map((area, idx) => (
                    <Badge key={idx} className="bg-gray-100 text-gray-800">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Immediate Actions Required
                </h4>
                <div className="bg-white p-3 rounded-lg border">
                  <ul className="space-y-2">
                    {alert.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Economic Impact */}
              <div className={`p-3 rounded-lg border ${
                alert.severity === 'extreme' ? 'bg-red-100 border-red-200' :
                alert.severity === 'high' ? 'bg-orange-100 border-orange-200' :
                'bg-yellow-100 border-yellow-200'
              }`}>
                <h4 className="font-medium text-gray-800 mb-1">Economic Impact</h4>
                <p className="text-sm text-gray-700">{alert.economicImpact}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {alerts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Sun className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Weather Alerts</h3>
            <p className="text-gray-600">Weather conditions are currently favorable for farming activities.</p>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contacts */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Thermometer className="h-5 w-5" />
            Emergency Contacts & Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Government Helplines</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Kisan Call Centre: 1800-180-1551</li>
                <li>• Disaster Management: 1078</li>
                <li>• Weather Updates: 1588</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Insurance Claims</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• PMFBY Helpline: 14447</li>
                <li>• Crop Insurance Portal</li>
                <li>• Document damage immediately</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Local Resources</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Agricultural Extension Officer</li>
                <li>• Veterinary Services</li>
                <li>• Cooperative Society</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
