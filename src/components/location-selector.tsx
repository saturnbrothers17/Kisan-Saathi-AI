'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, Check, X } from 'lucide-react';
import { customGeolocation, type LocationData } from '@/lib/api/custom-geolocation';

interface LocationSelectorProps {
  onLocationChange?: (location: LocationData) => void;
  currentLocation?: LocationData | null;
}

export function LocationSelector({ onLocationChange, currentLocation }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [supportedCities, setSupportedCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');

  useEffect(() => {
    const cities = customGeolocation.getSupportedCities();
    setSupportedCities(cities);
    setFilteredCities(cities.slice(0, 10)); // Show first 10 cities initially
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = supportedCities
        .filter(city => city.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 10);
      setFilteredCities(filtered);
    } else {
      setFilteredCities(supportedCities.slice(0, 10));
    }
  }, [searchTerm, supportedCities]);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    const location = customGeolocation.setManualLocation(city);
    if (location && onLocationChange) {
      onLocationChange(location);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleAutoDetect = async () => {
    try {
      customGeolocation.clearCache();
      const location = await customGeolocation.getCurrentLocation();
      if (onLocationChange) {
        onLocationChange(location);
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Auto-detect failed:', error);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2"
      >
        <MapPin className="h-4 w-4" />
        <span className="text-sm">
          {currentLocation?.city || 'Set Location'}
        </span>
      </Button>
    );
  }

  return (
    <Card className="absolute top-12 right-0 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Select Location</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            className="flex items-center space-x-1"
          >
            <MapPin className="h-4 w-4" />
            <span>Auto-detect</span>
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for a city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1">
          {filteredCities.map((city) => (
            <Button
              key={city}
              variant="ghost"
              size="sm"
              onClick={() => handleCitySelect(city)}
              className="w-full justify-start text-left hover:bg-gray-100"
            >
              <div className="flex items-center justify-between w-full">
                <span>{city}</span>
                {currentLocation?.city === city && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </div>
            </Button>
          ))}
        </div>

        {filteredCities.length === 0 && searchTerm && (
          <div className="text-center text-gray-500 py-4">
            <p>No cities found matching "{searchTerm}"</p>
            <p className="text-sm">Try searching for a major Indian city</p>
          </div>
        )}

        {currentLocation && (
          <div className="pt-3 border-t">
            <div className="text-sm text-gray-600">
              <p><strong>Current:</strong> {currentLocation.city}, {currentLocation.state}</p>
              <p><strong>Source:</strong> {currentLocation.source}</p>
              <p><strong>Accuracy:</strong> {currentLocation.accuracy}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
