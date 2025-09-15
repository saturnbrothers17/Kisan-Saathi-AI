/**
 * Updated Crop Prices Widget
 * Uses manual location context for location-specific pricing
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw,
  MapPin,
  IndianRupee
} from 'lucide-react';
import { useManualLocation } from './manual-location-context';

interface CropPrice {
  name: string;
  price: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  quality: string;
}

export function UpdatedCropPricesWidget() {
  const { location, isLocationSet } = useManualLocation();
  const [prices, setPrices] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (location && isLocationSet) {
      loadCropPrices();
    }
  }, [location, isLocationSet]);

  const loadCropPrices = async () => {
    if (!location) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Loading crop prices for:', location.city, location.district);
      
      // Simulate location-based pricing with realistic variations
      const basePrices = generateLocationBasedPrices(location.city, location.district);
      setPrices(basePrices);
      setLastUpdated(new Date());
      
      console.log('✅ Crop prices loaded for:', location.city);
      
    } catch (error) {
      console.error('❌ Crop prices loading failed:', error);
      setError('Failed to load crop prices');
    } finally {
      setLoading(false);
    }
  };

  const generateLocationBasedPrices = (city: string, district: string): CropPrice[] => {
    // Base prices with location-specific variations
    const locationMultiplier = getLocationPriceMultiplier(city, district);
    
    const baseCrops = [
      { name: 'Wheat', basePrice: 2200, unit: 'quintal', quality: 'Grade A' },
      { name: 'Rice (Basmati)', basePrice: 4500, unit: 'quintal', quality: 'Premium' },
      { name: 'Sugarcane', basePrice: 350, unit: 'quintal', quality: 'Fresh' },
      { name: 'Potato', basePrice: 1200, unit: 'quintal', quality: 'Grade A' },
      { name: 'Onion', basePrice: 2800, unit: 'quintal', quality: 'Medium' },
      { name: 'Mustard', basePrice: 5200, unit: 'quintal', quality: 'Oil Grade' },
      { name: 'Gram (Chana)', basePrice: 4800, unit: 'quintal', quality: 'Bold' },
      { name: 'Pea', basePrice: 3500, unit: 'quintal', quality: 'Green' }
    ];

    return baseCrops.map(crop => {
      const locationPrice = Math.round(crop.basePrice * locationMultiplier);
      const randomChange = (Math.random() - 0.5) * 200; // ±100 variation
      const finalPrice = Math.max(locationPrice + randomChange, crop.basePrice * 0.7);
      
      const changePercent = ((finalPrice - crop.basePrice) / crop.basePrice) * 100;
      
      return {
        name: crop.name,
        price: Math.round(finalPrice),
        unit: crop.unit,
        change: Math.round(changePercent * 10) / 10,
        trend: changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'stable',
        quality: crop.quality
      };
    });
  };

  const getLocationPriceMultiplier = (city: string, district: string): number => {
    // Major cities typically have higher prices due to demand
    const majorCities = ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Ghaziabad', 'Noida'];
    const industrialCities = ['Kanpur', 'Ghaziabad', 'Noida', 'Meerut', 'Moradabad'];
    const agriculturalDistricts = ['Hardoi', 'Sitapur', 'Barabanki', 'Unnao', 'Farrukhabad'];

    if (majorCities.includes(city)) {
      return 1.15; // 15% higher in major cities
    }
    if (industrialCities.includes(city)) {
      return 1.10; // 10% higher in industrial cities
    }
    if (agriculturalDistricts.includes(district)) {
      return 0.90; // 10% lower in agricultural districts (direct from farmers)
    }
    
    return 1.0; // Base price for other locations
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isLocationSet || !location) {
    return (
      <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-50 to-yellow-50 border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600 mb-2">📍 Location Required</div>
          <div className="text-sm text-gray-500">
            Please select your city to view local crop prices
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl bg-gradient-to-br from-yellow-50 to-green-50 border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <IndianRupee className="h-8 w-8 text-yellow-600 animate-pulse mx-auto mb-4" />
          <div className="text-lg font-semibold text-yellow-800 mb-2">
            💰 Loading Crop Prices
          </div>
          <div className="text-sm text-yellow-600 animate-pulse">
            Getting prices for {location.city}...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl bg-gradient-to-br from-red-50 to-orange-100 border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-4">❌ Price Load Failed</div>
          <div className="text-sm text-red-700 mb-4">{error}</div>
          <Button onClick={loadCropPrices} variant="outline" size="sm">
            🔄 Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl bg-gradient-to-br from-yellow-50 to-green-50 border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IndianRupee className="h-5 w-5 text-yellow-600" />
            <span>💰 Crop Prices</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadCropPrices}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        
        {/* Location Display */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{location.city}, {location.district}</span>
          {lastUpdated && (
            <Badge variant="outline" className="text-xs">
              Updated {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {prices.map((crop, index) => (
            <div key={index} className="bg-white/60 rounded-lg p-4 hover:bg-white/80 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">{crop.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {crop.quality}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">per {crop.unit}</div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-gray-800">
                      ₹{crop.price.toLocaleString()}
                    </span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(crop.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(crop.trend)}`}>
                        {crop.change > 0 ? '+' : ''}{crop.change}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Market Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs font-medium text-blue-800 mb-1">📈 Market Information</div>
          <div className="text-xs text-blue-700">
            Prices shown are for {location.city} market. Rates may vary by quality, quantity, and local demand. 
            {location.city === 'Lucknow' && ' Premium rates due to capital city demand.'}
            {['Kanpur', 'Ghaziabad', 'Noida'].includes(location.city) && ' Industrial city pricing with higher demand.'}
            {['Hardoi', 'Sitapur', 'Barabanki'].includes(location.district) && ' Agricultural region with direct farmer rates.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
