/**
 * Location Debug Widget - Test IP geolocation APIs directly
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bug, Globe, MapPin } from 'lucide-react';

interface IPLocationResult {
  service: string;
  ip: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  isp?: string;
  org?: string;
  success: boolean;
  error?: string;
  rawData?: any;
}

export function LocationDebugWidget() {
  const [results, setResults] = useState<IPLocationResult[]>([]);
  const [testing, setTesting] = useState(false);

  const testIPInfo = async (): Promise<IPLocationResult> => {
    try {
      const response = await fetch('https://ipinfo.io/json');
      const data = await response.json();
      
      const [lat, lon] = (data.loc || '0,0').split(',').map(Number);
      
      return {
        service: 'IPInfo.io',
        ip: data.ip || 'Unknown',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country: data.country || 'Unknown',
        lat,
        lon,
        isp: data.org,
        success: true,
        rawData: data
      };
    } catch (error) {
      return {
        service: 'IPInfo.io',
        ip: 'Error',
        city: 'Error',
        region: 'Error',
        country: 'Error',
        lat: 0,
        lon: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const testIPAPI = async (): Promise<IPLocationResult> => {
    try {
      const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,query,isp,org');
      const data = await response.json();
      
      return {
        service: 'IP-API.com',
        ip: data.query || 'Unknown',
        city: data.city || 'Unknown',
        region: data.regionName || 'Unknown',
        country: data.country || 'Unknown',
        lat: data.lat || 0,
        lon: data.lon || 0,
        isp: data.isp,
        org: data.org,
        success: data.status === 'success',
        error: data.status !== 'success' ? data.message : undefined,
        rawData: data
      };
    } catch (error) {
      return {
        service: 'IP-API.com',
        ip: 'Error',
        city: 'Error',
        region: 'Error',
        country: 'Error',
        lat: 0,
        lon: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const testIPGeolocation = async (): Promise<IPLocationResult> => {
    try {
      const response = await fetch('https://api.ipgeolocation.io/ipgeo');
      const data = await response.json();
      
      return {
        service: 'IPGeolocation.io',
        ip: data.ip || 'Unknown',
        city: data.city || 'Unknown',
        region: data.state_prov || 'Unknown',
        country: data.country_name || 'Unknown',
        lat: parseFloat(data.latitude) || 0,
        lon: parseFloat(data.longitude) || 0,
        isp: data.isp,
        success: true,
        rawData: data
      };
    } catch (error) {
      return {
        service: 'IPGeolocation.io',
        ip: 'Error',
        city: 'Error',
        region: 'Error',
        country: 'Error',
        lat: 0,
        lon: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const testMyIP = async (): Promise<IPLocationResult> => {
    try {
      const response = await fetch('https://api.myip.com');
      const data = await response.json();
      
      return {
        service: 'MyIP.com',
        ip: data.ip || 'Unknown',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country: data.country || 'Unknown',
        lat: 0,
        lon: 0,
        success: true,
        rawData: data
      };
    } catch (error) {
      return {
        service: 'MyIP.com',
        ip: 'Error',
        city: 'Error',
        region: 'Error',
        country: 'Error',
        lat: 0,
        lon: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);
    
    console.log('🔍 [DEBUG] Starting IP geolocation tests...');
    
    const tests = [
      testIPInfo,
      testIPAPI,
      testIPGeolocation,
      testMyIP
    ];
    
    const testResults: IPLocationResult[] = [];
    
    for (const test of tests) {
      try {
        console.log(`🔍 [DEBUG] Running test: ${test.name}`);
        const result = await test();
        console.log(`📍 [DEBUG] Test result:`, result);
        testResults.push(result);
        setResults([...testResults]);
        
        // Delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ [DEBUG] Test failed:`, error);
      }
    }
    
    setTesting(false);
    console.log('✅ [DEBUG] All tests completed');
  };

  return (
    <Card className="w-full max-w-4xl bg-gradient-to-br from-red-50 to-orange-100 border-2 border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bug className="h-5 w-5 text-red-600" />
          <span>🔍 IP Location Debug Tool</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Test multiple IP geolocation services to see what location they detect
          </p>
          <Button 
            onClick={runAllTests} 
            disabled={testing}
            className="bg-red-600 hover:bg-red-700"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Test All Services
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Test Results:</h3>
            
            {results.map((result, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{result.service}</span>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                
                {result.success ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">IP:</span>
                      <div className="font-mono">{result.ip}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">City:</span>
                      <div className="font-semibold">{result.city}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Region:</span>
                      <div className="font-semibold">{result.region}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Country:</span>
                      <div>{result.country}</div>
                    </div>
                    {result.lat !== 0 && result.lon !== 0 && (
                      <>
                        <div>
                          <span className="text-gray-600">Latitude:</span>
                          <div className="font-mono">{result.lat.toFixed(4)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Longitude:</span>
                          <div className="font-mono">{result.lon.toFixed(4)}</div>
                        </div>
                      </>
                    )}
                    {result.isp && (
                      <div className="col-span-2">
                        <span className="text-gray-600">ISP:</span>
                        <div className="text-xs">{result.isp}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-600 text-sm">
                    Error: {result.error}
                  </div>
                )}
                
                {result.rawData && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">Raw API Response</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(result.rawData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
