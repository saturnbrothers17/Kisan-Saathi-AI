/**
 * Manual Location Popup
 * Shows on app load to let users select their city for all app features
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Search,
  CheckCircle,
  X
} from 'lucide-react';
import { uttarPradeshCities, getMajorUPCities, searchUPCities, type UPCity } from '@/data/uttar-pradesh-cities';
import { useManualLocation } from './manual-location-context';

export function ManualLocationPopup() {
  const { location, setLocation, isLocationSet } = useManualLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState<UPCity[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Show popup if no location is set
  useEffect(() => {
    if (!isLocationSet) {
      setIsOpen(true);
    }
  }, [isLocationSet]);

  // Filter cities based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = searchUPCities(searchQuery).slice(0, 10);
      setFilteredCities(filtered);
      setShowDropdown(true);
    } else {
      setFilteredCities(getMajorUPCities().slice(0, 15));
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const handleCitySelect = (city: UPCity) => {
    const manualLocation = {
      city: city.name,
      district: city.district,
      lat: city.lat,
      lon: city.lon,
      timestamp: Date.now()
    };
    
    setLocation(manualLocation);
    setSearchQuery(city.name);
    setIsOpen(false);
    setShowDropdown(false);
  };

  const handleSkip = () => {
    // Set a default location (Lucknow) if user skips
    const defaultCity = uttarPradeshCities.find(city => city.name === 'Lucknow');
    if (defaultCity) {
      handleCitySelect(defaultCity);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>🏙️ Select Your Location</span>
          </DialogTitle>
          <DialogDescription>
            Choose your city in Uttar Pradesh to get accurate weather, crop prices, and farming information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="city-search" className="text-sm font-medium">
              Search Cities in Uttar Pradesh
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="city-search"
                type="text"
                placeholder="Type city name (e.g., Lucknow, Kanpur, Agra)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onFocus={() => setShowDropdown(true)}
              />
            </div>
          </div>

          {/* City Dropdown */}
          {(showDropdown || searchQuery.length > 0) && (
            <div className="max-h-48 overflow-y-auto border rounded-md bg-white shadow-lg">
              {filteredCities.length > 0 ? (
                filteredCities.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleCitySelect(city)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800">{city.name}</div>
                        <div className="text-xs text-gray-500">{city.district} • {city.type}</div>
                      </div>
                      {city.population && (
                        <Badge variant="outline" className="text-xs">
                          {(city.population / 100000).toFixed(1)}L
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-gray-500">
                  No cities found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}

          {/* Quick Select Major Cities */}
          {!showDropdown && searchQuery.length === 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Popular Cities</Label>
              <div className="grid grid-cols-2 gap-2">
                {getMajorUPCities().slice(0, 8).map((city, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCitySelect(city)}
                    className="text-xs h-8 justify-start"
                  >
                    {city.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                <div className="font-medium mb-1">Why select your location?</div>
                <div>Your city selection will provide accurate weather forecasts, local crop prices, and region-specific farming advice throughout the app.</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Use Lucknow (Default)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
