'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sprout, TrendingUp, MapPin, Clock, DollarSign } from 'lucide-react';
import { fetchCropAdvisory } from '@/lib/api/agricultural-api';
import { scraperEnhancedAgriculturalAPI } from '@/lib/api/scraper-enhanced-agricultural-api';
import { getCurrentLocation } from '@/lib/api/weather-api';

interface CropSeason {
  name: string;
  nameHindi: string;
  season: 'Kharif' | 'Rabi' | 'Zaid';
  sowingStart: string;
  sowingEnd: string;
  harvestStart: string;
  harvestEnd: string;
  duration: number; // days
  waterRequirement: 'Low' | 'Medium' | 'High' | 'Very High';
  soilType: string[];
  expectedYield: string;
  marketPrice: string;
  profitability: 'Low' | 'Medium' | 'High' | 'Very High';
  climateRequirement: string;
  currentStatus: 'upcoming' | 'active' | 'completed';
}

export function SeasonalCropPlanner() {
  const [selectedSeason, setSelectedSeason] = useState<'Kharif' | 'Rabi' | 'Zaid'>('Kharif');
  const [crops, setCrops] = useState<CropSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{lat: number; lon: number} | null>(null);

  const seasons = [
    { id: 'Kharif', name: 'Kharif (खरीफ)', period: 'Jun-Oct', color: 'bg-green-100 text-green-800' },
    { id: 'Rabi', name: 'Rabi (रबी)', period: 'Nov-Apr', color: 'bg-blue-100 text-blue-800' },
    { id: 'Zaid', name: 'Zaid (जायद)', period: 'Mar-Jun', color: 'bg-orange-100 text-orange-800' }
  ];

  const getSeasonalCrops = (season: 'Kharif' | 'Rabi' | 'Zaid'): string[] => {
    const cropMap = {
      'Kharif': ['Rice', 'Cotton', 'Sugarcane', 'Maize', 'Soybean'],
      'Rabi': ['Wheat', 'Barley', 'Mustard', 'Gram', 'Pea'],
      'Zaid': ['Fodder', 'Watermelon', 'Cucumber', 'Fodder Maize', 'Green Fodder']
    };
    return cropMap[season] || [];
  };

  const getSowingPeriod = (season: 'Kharif' | 'Rabi' | 'Zaid'): {start: string, end: string} => {
    const periods = {
      'Kharif': {start: 'June 15', end: 'July 31'},
      'Rabi': {start: 'November 1', end: 'December 31'},
      'Zaid': {start: 'March 1', end: 'April 30'}
    };
    return periods[season];
  };

  const getHarvestPeriod = (season: 'Kharif' | 'Rabi' | 'Zaid'): {start: string, end: string} => {
    const periods = {
      'Kharif': {start: 'October 15', end: 'December 15'},
      'Rabi': {start: 'March 15', end: 'May 15'},
      'Zaid': {start: 'June 1', end: 'July 31'}
    };
    return periods[season];
  };

  const getDuration = (season: 'Kharif' | 'Rabi' | 'Zaid'): number => {
    const durations = {
      'Kharif': 120,
      'Rabi': 150,
      'Zaid': 90
    };
    return durations[season];
  };

  const getWaterRequirement = (cropName: string): 'Low' | 'Medium' | 'High' | 'Very High' => {
    const waterMap: {[key: string]: 'Low' | 'Medium' | 'High' | 'Very High'} = {
      'Rice': 'Very High',
      'Sugarcane': 'Very High',
      'Cotton': 'High',
      'Wheat': 'Medium',
      'Maize': 'Medium',
      'Soybean': 'Medium'
    };
    return waterMap[cropName] || 'Medium';
  };

  const getProfitability = (price: number): 'Low' | 'Medium' | 'High' | 'Very High' => {
    if (price > 3000) return 'Very High';
    if (price > 2500) return 'High';
    if (price > 2000) return 'Medium';
    return 'Low';
  };

  const getCurrentStatus = (season: 'Kharif' | 'Rabi' | 'Zaid'): 'upcoming' | 'active' | 'completed' => {
    const month = new Date().getMonth() + 1;
    
    if (season === 'Kharif') {
      if (month >= 6 && month <= 10) return 'active';
      if (month >= 11 || month <= 5) return 'upcoming';
    } else if (season === 'Rabi') {
      if (month >= 11 || month <= 4) return 'active';
      if (month >= 5 && month <= 10) return 'upcoming';
    } else if (season === 'Zaid') {
      if (month >= 3 && month <= 6) return 'active';
      if (month >= 7 || month <= 2) return 'upcoming';
    }
    
    return 'upcoming';
  };

  const getFallbackCropData = (cropName: string, season: 'Kharif' | 'Rabi' | 'Zaid'): CropSeason => {
    const sowingPeriod = getSowingPeriod(season);
    const harvestPeriod = getHarvestPeriod(season);
    
    return {
      name: cropName,
      nameHindi: cropName, // Would need translation map
      season,
      sowingStart: sowingPeriod.start,
      sowingEnd: sowingPeriod.end,
      harvestStart: harvestPeriod.start,
      harvestEnd: harvestPeriod.end,
      duration: getDuration(season),
      waterRequirement: getWaterRequirement(cropName),
      soilType: ['Alluvial', 'Clay loam'],
      expectedYield: '30-50 quintals/hectare',
      marketPrice: '₹2000-2500/quintal',
      profitability: 'Medium',
      climateRequirement: 'Moderate climate',
      currentStatus: getCurrentStatus(season)
    };
  };

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const currentLocation = await getCurrentLocation();
        setLocation(currentLocation);
      } catch (error) {
        console.error('Error getting location:', error);
        // No fallback location - show error state
        setLocation(null);
      }
    };
    
    initializeLocation();
  }, []);

  useEffect(() => {
    const loadSeasonalData = async () => {
      if (!location) return;
      
      try {
        setLoading(true);
        
        // Get crop data for the selected season
        const seasonCrops = getSeasonalCrops(selectedSeason);
        const cropDataPromises = seasonCrops.map(async (cropName: string) => {
          try {
            const enhancedData = await scraperEnhancedAgriculturalAPI.getComprehensiveCropData(
              location.lat,
              location.lon,
              cropName
            );
            
            const sowingPeriod = getSowingPeriod(selectedSeason);
            const harvestPeriod = getHarvestPeriod(selectedSeason);
            
            return {
              name: enhancedData.name,
              nameHindi: enhancedData.nameHindi,
              season: selectedSeason,
              sowingStart: sowingPeriod.start,
              sowingEnd: sowingPeriod.end,
              harvestStart: harvestPeriod.start,
              harvestEnd: harvestPeriod.end,
              duration: getDuration(selectedSeason),
              waterRequirement: getWaterRequirement(cropName),
              soilType: ['Alluvial', 'Clay loam'],
              expectedYield: enhancedData.expectedYield,
              marketPrice: `₹${enhancedData.marketPrice.current}/quintal`,
              profitability: getProfitability(enhancedData.marketPrice.current),
              climateRequirement: enhancedData.weatherSuitability.temperature ? 
                `${enhancedData.weatherSuitability.temperature.min}-${enhancedData.weatherSuitability.temperature.max}°C` : 
                'Moderate climate',
              currentStatus: getCurrentStatus(selectedSeason)
            } as CropSeason;
          } catch (error) {
            console.error(`Error loading data for ${cropName}:`, error);
            return null; // No fallback data - skip failed crops
          }
        });
        
        const allCropsData = await Promise.all(cropDataPromises);
        setCrops(allCropsData.filter((crop): crop is CropSeason => crop !== null));
        
      } catch (error) {
        console.error('Failed to load seasonal crop data:', error);
        // No fallback data - show error state
        setCrops([]);
      } finally {
        setLoading(false);
      }
    };

    loadSeasonalData();
  }, [selectedSeason, location]);

  const filteredCrops = crops.filter(crop => crop.season === selectedSeason);

  const getProfitabilityColor = (profitability: string) => {
    switch (profitability) {
      case 'Very High': return 'bg-green-100 text-green-800 border-green-200';
      case 'High': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWaterRequirementColor = (requirement: string) => {
    switch (requirement) {
      case 'Very High': return 'text-blue-800';
      case 'High': return 'text-blue-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading seasonal crop data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Calendar className="h-6 w-6" />
            Seasonal Crop Planning System
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-3">
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => setSelectedSeason(season.id as any)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedSeason === season.id
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <div className="font-medium">{season.name}</div>
                <div className="text-xs opacity-75">{season.period}</div>
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Season Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-900">
              {filteredCrops.filter(c => c.currentStatus === 'active').length}
            </div>
            <div className="text-sm text-green-700">Active Crops</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">
              {filteredCrops.filter(c => c.currentStatus === 'upcoming').length}
            </div>
            <div className="text-sm text-blue-700">Upcoming Season</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-900">
              {filteredCrops.filter(c => c.profitability === 'Very High' || c.profitability === 'High').length}
            </div>
            <div className="text-sm text-yellow-700">High Profit Crops</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-900">
              {Math.round(filteredCrops.reduce((acc, crop) => acc + crop.duration, 0) / filteredCrops.length)}
            </div>
            <div className="text-sm text-purple-700">Avg Duration (days)</div>
          </CardContent>
        </Card>
      </div>

      {/* Crop Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCrops.map((crop, index) => (
          <Card key={index} className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sprout className="h-6 w-6 text-green-600" />
                  <div>
                    <CardTitle className="text-lg">{crop.name}</CardTitle>
                    <p className="text-sm text-gray-600 font-normal">{crop.nameHindi}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(crop.currentStatus)}>
                    {crop.currentStatus}
                  </Badge>
                  <Badge className={getProfitabilityColor(crop.profitability)}>
                    {crop.profitability} Profit
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timeline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Sowing Period
                  </h4>
                  <p className="text-sm text-green-700">{crop.sowingStart} - {crop.sowingEnd}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-1 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Harvest Period
                  </h4>
                  <p className="text-sm text-orange-700">{crop.harvestStart} - {crop.harvestEnd}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Duration & Water</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{crop.duration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Water Need:</span>
                      <span className={`font-medium ${getWaterRequirementColor(crop.waterRequirement)}`}>
                        {crop.waterRequirement}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Economics
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Yield:</span>
                      <span className="font-medium">{crop.expectedYield}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-green-600">{crop.marketPrice}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Soil Types */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Suitable Soil Types
                </h4>
                <div className="flex flex-wrap gap-2">
                  {crop.soilType.map((soil, idx) => (
                    <Badge key={idx} className="bg-brown-100 text-brown-800 text-xs">
                      {soil}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Climate Requirements */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Climate Requirements</h4>
                <p className="text-sm text-blue-700">{crop.climateRequirement}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCrops.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Sprout className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Crops Available</h3>
            <p className="text-gray-600">No crops found for the selected season.</p>
          </CardContent>
        </Card>
      )}

      {/* Planning Tips */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <TrendingUp className="h-5 w-5" />
            Seasonal Planning Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-emerald-800 mb-2">Pre-Season Preparation</h4>
              <ul className="space-y-1 text-sm text-emerald-700">
                <li>• Soil testing and nutrient analysis</li>
                <li>• Seed procurement and quality check</li>
                <li>• Equipment maintenance and repair</li>
                <li>• Weather forecast monitoring</li>
                <li>• Market price trend analysis</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-emerald-800 mb-2">Risk Management</h4>
              <ul className="space-y-1 text-sm text-emerald-700">
                <li>• Crop insurance enrollment</li>
                <li>• Diversified crop selection</li>
                <li>• Water source backup planning</li>
                <li>• Pest management preparation</li>
                <li>• Storage facility arrangement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
