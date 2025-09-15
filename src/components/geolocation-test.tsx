'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export function GeolocationTest() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [location, setLocation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`🧪 GeolocationTest: ${message}`);
  };

  const testGeolocation = async () => {
    setIsLoading(true);
    setError(null);
    setLocation(null);
    setLogs([]);
    
    addLog('Starting geolocation test...');
    
    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      const errorMsg = 'Geolocation is not supported by this browser';
      setError(errorMsg);
      addLog(`❌ ${errorMsg}`);
      setIsLoading(false);
      return;
    }
    
    addLog('✅ Geolocation API is supported');
    
    // Check permissions
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        addLog(`📋 Permission state: ${permission.state}`);
        
        permission.onchange = () => {
          addLog(`🔄 Permission changed to: ${permission.state}`);
        };
      }
    } catch (permErr) {
      addLog(`⚠️ Could not check permissions: ${permErr}`);
    }
    
    // Check if we're on HTTPS
    const isHttps = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isHttps && !isLocalhost) {
      const warningMsg = 'Geolocation requires HTTPS in production. Currently on HTTP.';
      addLog(`⚠️ ${warningMsg}`);
    } else {
      addLog(`✅ Protocol check passed (${window.location.protocol})`);
    }
    
    setStatus('Requesting location permission...');
    addLog('📍 Calling navigator.geolocation.getCurrentPosition...');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout after 30 seconds'));
        }, 30000);
        
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            addLog(`✅ Location received: ${pos.coords.latitude}, ${pos.coords.longitude}`);
            addLog(`📊 Accuracy: ${pos.coords.accuracy}m`);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutId);
            addLog(`❌ Geolocation error: ${err.message} (Code: ${err.code})`);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 25000,
            maximumAge: 0
          }
        );
      });
      
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: new Date(position.timestamp).toLocaleString()
      });
      
      setStatus('✅ Location access successful!');
      addLog('🎉 Geolocation test completed successfully');
      
    } catch (err: any) {
      let errorMessage = 'Unknown geolocation error';
      
      if (err.code === 1) {
        errorMessage = 'Location access denied by user';
        addLog('🚫 User denied location permission');
      } else if (err.code === 2) {
        errorMessage = 'Location unavailable';
        addLog('📍 Location unavailable (GPS/network issue)');
      } else if (err.code === 3) {
        errorMessage = 'Location request timeout';
        addLog('⏰ Location request timed out');
      } else {
        errorMessage = err.message || 'Geolocation failed';
        addLog(`❌ Error: ${errorMessage}`);
      }
      
      setError(errorMessage);
      setStatus('❌ Location access failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearTest = () => {
    setStatus('Ready to test');
    setLocation(null);
    setError(null);
    setLogs([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geolocation Debug Test
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testGeolocation} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {isLoading ? 'Testing...' : 'Test Native Location'}
          </Button>
          
          <Button 
            onClick={clearTest} 
            variant="outline"
            disabled={isLoading}
          >
            Clear
          </Button>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {status.includes('✅') ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : status.includes('❌') ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <RefreshCw className={`h-4 w-4 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
            )}
            <span className="font-medium">{status}</span>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {location && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-800 mb-2">Location Data</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                  <div>Latitude: {location.latitude}</div>
                  <div>Longitude: {location.longitude}</div>
                  <div>Accuracy: {location.accuracy}m</div>
                  <div>Altitude: {location.altitude || 'N/A'}</div>
                  <div>Heading: {location.heading || 'N/A'}</div>
                  <div>Speed: {location.speed || 'N/A'}</div>
                  <div className="col-span-2">Time: {location.timestamp}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {logs.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800 mb-2">Debug Logs</p>
            <div className="text-xs text-gray-600 space-y-1 max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="font-mono">{log}</div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Common Issues:</strong></p>
          <p>• Location blocked in browser settings</p>
          <p>• HTTPS required (except localhost)</p>
          <p>• GPS/network connectivity issues</p>
          <p>• Browser compatibility problems</p>
          <p>• Popup blockers preventing permission dialog</p>
        </div>
      </CardContent>
    </Card>
  );
}
