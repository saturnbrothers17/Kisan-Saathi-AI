/**
 * Manual Location Input Widget
 * Allows users to manually set their location when IP geolocation fails
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Save, AlertCircle } from 'lucide-react';
import { alternativeLocationDetector } from '@/services/alternative-location-detector';

const INDIAN_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { name: 'Delhi', state: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538 },
  { name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573 },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898 },
  { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lon: 77.3178 },
  { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lon: 77.7064 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lon: 74.7973 },
  { name: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lon: 75.3433 },
  { name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lon: 86.4304 },
  { name: 'Amritsar', state: 'Punjab', lat: 31.6340, lon: 74.8723 },
  { name: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463 },
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864 },
  { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.6480 },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243 },
  { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198 },
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296 },
  { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lon: 75.8648 },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362 },
  { name: 'Solapur', state: 'Maharashtra', lat: 17.6599, lon: 75.9064 },
  { name: 'Hubli-Dharwad', state: 'Karnataka', lat: 15.3647, lon: 75.1240 },
  { name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lon: 79.4304 }
];

export function ManualLocationWidget() {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [customCity, setCustomCity] = useState<string>('');
  const [customState, setCustomState] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  React.useEffect(() => {
    // Check if there's already a saved location
    const savedLocation = localStorage.getItem('kisan_manual_location');
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setCurrentLocation(location);
      } catch (error) {
        console.error('Failed to parse saved location:', error);
      }
    }
  }, []);

  const handleSavePresetCity = () => {
    const city = INDIAN_CITIES.find(c => c.name === selectedCity);
    if (city) {
      alternativeLocationDetector.saveManualLocation(
        city.name,
        city.state,
        city.lat,
        city.lon
      );
      setCurrentLocation({
        city: city.name,
        state: city.state,
        lat: city.lat,
        lon: city.lon
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleSaveCustomCity = () => {
    if (customCity && customState) {
      // For custom cities, we'll use approximate coordinates
      // In a real app, you'd geocode these
      alternativeLocationDetector.saveManualLocation(
        customCity,
        customState,
        28.7041, // Default to Delhi coordinates
        77.1025
      );
      setCurrentLocation({
        city: customCity,
        state: customState,
        lat: 28.7041,
        lon: 77.1025
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleClearLocation = () => {
    localStorage.removeItem('kisan_manual_location');
    setCurrentLocation(null);
    setSelectedCity('');
    setCustomCity('');
    setCustomState('');
  };

  return (
    <Card className="w-full max-w-2xl bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-green-600" />
          <span>📍 Manual Location Setting</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Why set location manually?</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Your internet provider routes traffic through Delhi servers, making IP-based location detection inaccurate. 
                Set your actual location here for accurate weather data.
              </p>
            </div>
          </div>
        </div>

        {currentLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">✅ Current Saved Location:</h4>
            <p className="text-green-700">
              📍 {currentLocation.city}, {currentLocation.state}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Coordinates: {currentLocation.lat?.toFixed(4)}, {currentLocation.lon?.toFixed(4)}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearLocation}
              className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear Location
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="city-select" className="text-sm font-medium">
              Select Your City (Recommended)
            </Label>
            <div className="flex space-x-2 mt-1">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose your city..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {INDIAN_CITIES.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}, {city.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSavePresetCity}
                disabled={!selectedCity}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-sm font-medium">
              Or Enter Custom Location
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <Input
                  placeholder="City name"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="State name"
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleSaveCustomCity}
              disabled={!customCity || !customState}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Custom Location
            </Button>
          </div>
        </div>

        {saved && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
            <p className="text-green-800 font-medium">✅ Location saved successfully!</p>
            <p className="text-sm text-green-600">Refresh the weather widget to see updated location.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
