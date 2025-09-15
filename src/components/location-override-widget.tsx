'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Target, CheckCircle } from 'lucide-react';
import { useManualLocation } from './manual-location-context';

// Comprehensive Indian cities database
const INDIAN_CITIES = [
  // Uttar Pradesh
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lon: 77.7064 },
  { name: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463 },
  { name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3670, lon: 79.4304 },
  { name: 'Aligarh', state: 'Uttar Pradesh', lat: 27.8974, lon: 78.0880 },
  { name: 'Moradabad', state: 'Uttar Pradesh', lat: 28.8386, lon: 78.7733 },
  { name: 'Saharanpur', state: 'Uttar Pradesh', lat: 29.9680, lon: 77.5552 },
  { name: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.7606, lon: 83.3732 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.3910 },
  { name: 'Firozabad', state: 'Uttar Pradesh', lat: 27.1592, lon: 78.3957 },
  { name: 'Jhansi', state: 'Uttar Pradesh', lat: 25.4484, lon: 78.5685 },
  { name: 'Muzaffarnagar', state: 'Uttar Pradesh', lat: 29.4727, lon: 77.7085 },
  { name: 'Mathura', state: 'Uttar Pradesh', lat: 27.4924, lon: 77.6737 },
  { name: 'Rampur', state: 'Uttar Pradesh', lat: 28.8152, lon: 79.0256 },
  { name: 'Shahjahanpur', state: 'Uttar Pradesh', lat: 27.8805, lon: 79.9066 },
  { name: 'Farrukhabad', state: 'Uttar Pradesh', lat: 27.3929, lon: 79.5800 },
  { name: 'Hapur', state: 'Uttar Pradesh', lat: 28.7306, lon: 77.7669 },
  
  // Major metros
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
  { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lon: 72.9781 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538 },
  { name: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022 },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
];

export function LocationOverrideWidget() {
  const { location, setLocation, clearLocation, isLocationSet } = useManualLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [filteredCities, setFilteredCities] = useState(INDIAN_CITIES);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      const filtered = INDIAN_CITIES.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(INDIAN_CITIES);
    }
  }, [searchTerm]);

  const handleCitySelect = (cityName: string) => {
    const city = INDIAN_CITIES.find(c => c.name === cityName);
    if (city) {
      setLocation({
        city: city.name,
        district: city.state,
        lat: city.lat,
        lon: city.lon,
        timestamp: Date.now()
      });
      setSelectedCity(cityName);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleClearLocation = () => {
    clearLocation();
    setSelectedCity('');
    setSearchTerm('');
  };

  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-green-600" />
          <span>🎯 Location Override</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Location Display */}
        {isLocationSet && location && (
          <div className="bg-green-100 rounded-lg p-3 border border-green-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-800">✅ Current Location</div>
                <div className="text-sm text-green-700">
                  📍 {location.city}, {location.district}
                </div>
                <div className="text-xs text-green-600">
                  🗺️ {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearLocation}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-100 rounded-lg p-3 border border-green-300 animate-pulse">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                ✅ Location updated successfully!
              </span>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">🔍 Search Your City:</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Type city name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* City Selection */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">🏙️ Select City:</div>
          <Select value={selectedCity} onValueChange={handleCitySelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your city..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {filteredCities.slice(0, 50).map((city) => (
                <SelectItem key={`${city.name}-${city.state}`} value={city.name}>
                  <div className="flex items-center justify-between w-full">
                    <span>{city.name}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {city.state}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Popular Cities Quick Select */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">🌟 Popular Cities:</div>
          <div className="grid grid-cols-2 gap-2">
            {['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Mumbai', 'Bangalore'].map((cityName) => (
              <Button
                key={cityName}
                variant="outline"
                size="sm"
                onClick={() => handleCitySelect(cityName)}
                className="text-xs"
              >
                {cityName}
              </Button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-1">💡 Why Override Location?</div>
          <div className="text-xs text-blue-700">
            Your internet provider may route traffic through Delhi servers, causing incorrect location detection. 
            Use this tool to set your actual location for accurate weather and crop data.
          </div>
        </div>

        {/* Search Results Count */}
        {searchTerm && (
          <div className="text-xs text-gray-600 text-center">
            Found {filteredCities.length} cities matching "{searchTerm}"
          </div>
        )}
      </CardContent>
    </Card>
  );
}
