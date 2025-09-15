'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, TrendingUp, TrendingDown, Minus, RefreshCw, IndianRupee, Calendar, BarChart3 } from 'lucide-react';
import { realTimeScraperClient } from '@/lib/api/real-time-scraper-client';
import type { DeviceLocationData } from '@/lib/api/device-location';

interface CropPrice {
  commodity: string;
  commodityHindi: string;
  market: string;
  state: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  date: string;
  priceChange: number;
  recommendation: string;
}

// Comprehensive crop list with Hindi names
const CROP_OPTIONS = [
  { value: 'Rice', label: 'Rice (चावल)', category: 'Cereals' },
  { value: 'Wheat', label: 'Wheat (गेहूं)', category: 'Cereals' },
  { value: 'Maize', label: 'Maize (मक्का)', category: 'Cereals' },
  { value: 'Barley', label: 'Barley (जौ)', category: 'Cereals' },
  { value: 'Bajra', label: 'Bajra (बाजरा)', category: 'Cereals' },
  { value: 'Jowar', label: 'Jowar (ज्वार)', category: 'Cereals' },
  
  { value: 'Potato', label: 'Potato (आलू)', category: 'Vegetables' },
  { value: 'Onion', label: 'Onion (प्याज)', category: 'Vegetables' },
  { value: 'Tomato', label: 'Tomato (टमाटर)', category: 'Vegetables' },
  { value: 'Cabbage', label: 'Cabbage (पत्ता गोभी)', category: 'Vegetables' },
  { value: 'Cauliflower', label: 'Cauliflower (फूल गोभी)', category: 'Vegetables' },
  { value: 'Carrot', label: 'Carrot (गाजर)', category: 'Vegetables' },
  { value: 'Brinjal', label: 'Brinjal (बैंगन)', category: 'Vegetables' },
  { value: 'Okra', label: 'Okra (भिंडी)', category: 'Vegetables' },
  
  { value: 'Soybean', label: 'Soybean (सोयाबीन)', category: 'Pulses & Oilseeds' },
  { value: 'Groundnut', label: 'Groundnut (मूंगफली)', category: 'Pulses & Oilseeds' },
  { value: 'Mustard', label: 'Mustard (सरसों)', category: 'Pulses & Oilseeds' },
  { value: 'Sunflower', label: 'Sunflower (सूरजमुखी)', category: 'Pulses & Oilseeds' },
  { value: 'Sesame', label: 'Sesame (तिल)', category: 'Pulses & Oilseeds' },
  { value: 'Arhar', label: 'Arhar (अरहर)', category: 'Pulses & Oilseeds' },
  { value: 'Moong', label: 'Moong (मूंग)', category: 'Pulses & Oilseeds' },
  { value: 'Urad', label: 'Urad (उड़द)', category: 'Pulses & Oilseeds' },
  { value: 'Chana', label: 'Chana (चना)', category: 'Pulses & Oilseeds' },
  
  { value: 'Cotton', label: 'Cotton (कपास)', category: 'Cash Crops' },
  { value: 'Sugarcane', label: 'Sugarcane (गन्ना)', category: 'Cash Crops' },
  { value: 'Jute', label: 'Jute (जूट)', category: 'Cash Crops' },
  
  { value: 'Turmeric', label: 'Turmeric (हल्दी)', category: 'Spices' },
  { value: 'Chilli', label: 'Chilli (मिर्च)', category: 'Spices' },
  { value: 'Coriander', label: 'Coriander (धनिया)', category: 'Spices' },
  { value: 'Cumin', label: 'Cumin (जीरा)', category: 'Spices' },
  { value: 'Fenugreek', label: 'Fenugreek (मेथी)', category: 'Spices' },
  { value: 'Ginger', label: 'Ginger (अदरक)', category: 'Spices' },
  { value: 'Garlic', label: 'Garlic (लहसुन)', category: 'Spices' }
];

const getTrendIcon = (trend: string, priceChange: number) => {
  if (trend === 'increasing') {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  } else if (trend === 'decreasing') {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  } else {
    return <Minus className="h-4 w-4 text-gray-500" />;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'increasing': return 'text-green-600 bg-green-50 border-green-200';
    case 'decreasing': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export function CropPricesWidget() {
  const [selectedCrop, setSelectedCrop] = useState<string>('Rice');
  const [prices, setPrices] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [location, setLocation] = useState<{lat: number, lon: number, city: string, district: string} | null>(null);

  // Get GPS location on component mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
          });
        });
        
        // Set location with GPS coordinates and default city names
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          city: 'Current Location',
          district: 'Current Area'
        });
      } catch (error) {
        console.error('GPS location failed:', error);
        // Set default location if GPS fails
        setLocation({
          lat: 28.6139,
          lon: 77.2090,
          city: 'Delhi',
          district: 'Delhi'
        });
      }
    };
    
    getLocation();
  }, []);

  // Load crop prices when location or selected crop changes
  useEffect(() => {
    if (location) {
      loadCropPrices();
    }
  }, [location, selectedCrop]);

  const loadCropPrices = async () => {
    if (!location || !selectedCrop) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`💰 Fetching ${selectedCrop} prices for ${location.city}, ${location.district}`);

      const response = await fetch(
        `/api/scrape/market-prices?cropType=${encodeURIComponent(selectedCrop)}&state=${encodeURIComponent(location.district)}&market=${encodeURIComponent(location.city)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPrices(result.data);
        console.log(`✅ Successfully fetched ${result.data.length} price records for ${selectedCrop}`);
      } else {
        throw new Error(result.error || 'Failed to fetch prices');
      }
    } catch (error) {
      console.error('❌ Error fetching crop prices:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch crop prices');
      
      // No fallback data - show error state
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrices = async () => {
    setIsRefreshing(true);
    await loadCropPrices();
    setIsRefreshing(false);
  };

  const handleCropChange = (value: string) => {
    setSelectedCrop(value);
  };

  const getEstimatedPrice = (cropType: string): number => {
    const basePrices: Record<string, number> = {
      'Rice': 2500, 'Wheat': 2200, 'Potato': 1500, 'Onion': 2000, 'Tomato': 3000,
      'Cotton': 6000, 'Sugarcane': 350, 'Maize': 1800, 'Soybean': 4500, 'Groundnut': 5500,
      'Mustard': 5000, 'Turmeric': 8000, 'Chilli': 12000, 'Coriander': 7000, 'Cumin': 25000
    };
    return Math.round(basePrices[cropType] || 2000);
  };

  const groupedCrops = CROP_OPTIONS.reduce((acc, crop) => {
    if (!acc[crop.category]) {
      acc[crop.category] = [];
    }
    acc[crop.category].push(crop);
    return acc;
  }, {} as Record<string, typeof CROP_OPTIONS>);

  return (
    <Card className="w-full max-w-2xl bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-xl">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-green-600" />
            <span className="font-bold text-gray-800">Live Crop Prices</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPrices}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              {location ? `${location.city}, ${location.district}` : 'Detecting location...'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Crop Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Select Crop:</label>
          <Select value={selectedCrop} onValueChange={handleCropChange}>
            <SelectTrigger className="w-full bg-white border-green-200 focus:border-green-400">
              <SelectValue placeholder="Choose a crop..." />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {Object.entries(groupedCrops).map(([category, crops]) => (
                <div key={category}>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100">
                    {category}
                  </div>
                  {crops.map((crop) => (
                    <SelectItem key={crop.value} value={crop.value}>
                      {crop.label}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading prices...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Price Data */}
        {!loading && !error && prices.length > 0 && (
          <div className="space-y-3">
            {prices.slice(0, 3).map((price, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-800">
                      {price.commodity} ({price.commodityHindi})
                    </h3>
                    {getTrendIcon(price.trend, price.priceChange)}
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{price.date}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Min Price</p>
                    <div className="flex items-center justify-center">
                      <IndianRupee className="h-3 w-3 text-gray-600" />
                      <span className="font-medium text-gray-800">{price.minPrice}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Modal Price</p>
                    <div className="flex items-center justify-center">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-lg text-green-700">{price.modalPrice}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Max Price</p>
                    <div className="flex items-center justify-center">
                      <IndianRupee className="h-3 w-3 text-gray-600" />
                      <span className="font-medium text-gray-800">{price.maxPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Trend Indicator */}
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTrendColor(price.trend)}`}>
                  {getTrendIcon(price.trend, price.priceChange)}
                  <span className="ml-1">
                    {price.trend === 'increasing' ? 'Rising' : price.trend === 'decreasing' ? 'Falling' : 'Stable'}
                    {price.priceChange !== 0 && (
                      <span className="ml-1">
                        ({price.priceChange > 0 ? '+' : ''}₹{price.priceChange})
                      </span>
                    )}
                  </span>
                </div>

                {/* Recommendation */}
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  <strong>💡 Recommendation:</strong> {price.recommendation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Market Info */}
        {location && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-green-200">
            Prices from {location.city} market • Updated in real-time via AgMarkNet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
