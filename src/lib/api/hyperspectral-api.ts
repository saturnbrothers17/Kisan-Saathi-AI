// Hyperspectral Imaging and AI-driven Crop Monitoring API
// Integrates spectral analysis, vegetation indices, and environmental sensor data

export interface SpectralData {
  wavelengths: number[];
  reflectance: number[][];
  timestamp: string;
  coordinates: { lat: number; lon: number };
  fieldId: string;
  imageMetadata: {
    resolution: number;
    bands: number;
    captureMethod: 'satellite' | 'drone' | 'ground';
  };
}

export interface VegetationIndices {
  ndvi: number; // Normalized Difference Vegetation Index
  savi: number; // Soil Adjusted Vegetation Index
  evi: number;  // Enhanced Vegetation Index
  gndvi: number; // Green NDVI
  ndre: number; // Normalized Difference Red Edge
  chl: number;  // Chlorophyll Index
  lwi: number;  // Leaf Water Index
  pri: number;  // Photochemical Reflectance Index
}

export interface CropStressAnalysis {
  stressLevel: 'none' | 'mild' | 'moderate' | 'severe';
  stressType: 'water' | 'nutrient' | 'disease' | 'pest' | 'heat' | 'unknown';
  confidence: number;
  affectedArea: number; // percentage
  severity: number; // 0-100
  recommendations: string[];
  predictedYieldImpact: number; // percentage
}

export interface EnvironmentalSensorData {
  soilMoisture: number;
  soilTemperature: number;
  airTemperature: number;
  humidity: number;
  leafWetness: number;
  windSpeed: number;
  solarRadiation: number;
  precipitation: number;
  timestamp: string;
}

export interface SpectralHealthMap {
  fieldId: string;
  timestamp: string;
  healthZones: Array<{
    coordinates: Array<{ lat: number; lon: number }>;
    healthScore: number; // 0-100
    stressIndicators: string[];
    recommendedActions: string[];
  }>;
  overallHealth: number;
  trendDirection: 'improving' | 'stable' | 'declining';
}

export interface PredictiveRiskZone {
  zoneId: string;
  riskType: 'disease' | 'pest' | 'drought' | 'nutrient_deficiency';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  timeframe: string; // e.g., "next 7 days"
  coordinates: Array<{ lat: number; lon: number }>;
  preventiveActions: string[];
  monitoringFrequency: string;
}

// Calculate vegetation indices from hyperspectral data
export function calculateVegetationIndices(spectralData: SpectralData): VegetationIndices {
  const { wavelengths, reflectance } = spectralData;
  
  // Find band indices for common wavelengths
  const redIndex = findClosestWavelength(wavelengths, 670);
  const nirIndex = findClosestWavelength(wavelengths, 800);
  const greenIndex = findClosestWavelength(wavelengths, 550);
  const redEdgeIndex = findClosestWavelength(wavelengths, 720);
  const blueIndex = findClosestWavelength(wavelengths, 450);
  const swirIndex = findClosestWavelength(wavelengths, 1600);
  
  // Calculate average reflectance for each band across the image
  const red = calculateMeanReflectance(reflectance, redIndex);
  const nir = calculateMeanReflectance(reflectance, nirIndex);
  const green = calculateMeanReflectance(reflectance, greenIndex);
  const redEdge = calculateMeanReflectance(reflectance, redEdgeIndex);
  const blue = calculateMeanReflectance(reflectance, blueIndex);
  const swir = calculateMeanReflectance(reflectance, swirIndex);
  
  // Calculate vegetation indices
  const ndvi = (nir - red) / (nir + red);
  const savi = ((nir - red) / (nir + red + 0.5)) * 1.5;
  const evi = 2.5 * ((nir - red) / (nir + 6 * red - 7.5 * blue + 1));
  const gndvi = (nir - green) / (nir + green);
  const ndre = (nir - redEdge) / (nir + redEdge);
  const chl = (redEdge / red) - 1;
  const lwi = (nir - swir) / (nir + swir);
  const pri = (green - red) / (green + red);
  
  return {
    ndvi: Math.max(-1, Math.min(1, ndvi)),
    savi: Math.max(-1, Math.min(1, savi)),
    evi: Math.max(-1, Math.min(1, evi)),
    gndvi: Math.max(-1, Math.min(1, gndvi)),
    ndre: Math.max(-1, Math.min(1, ndre)),
    chl: Math.max(-1, Math.min(5, chl)),
    lwi: Math.max(-1, Math.min(1, lwi)),
    pri: Math.max(-1, Math.min(1, pri))
  };
}

// AI-driven crop stress detection using spectral and environmental data
export async function detectCropStress(
  spectralData: SpectralData,
  environmentalData: EnvironmentalSensorData,
  historicalData?: SpectralData[]
): Promise<CropStressAnalysis> {
  const indices = calculateVegetationIndices(spectralData);
  
  // Simulate AI model inference (in real implementation, this would call TensorFlow.js or API)
  let stressLevel: CropStressAnalysis['stressLevel'] = 'none';
  let stressType: CropStressAnalysis['stressType'] = 'unknown';
  let confidence = 0;
  let severity = 0;
  
  // Water stress detection
  if (indices.lwi < 0.1 && environmentalData.soilMoisture < 30) {
    stressLevel = environmentalData.soilMoisture < 15 ? 'severe' : 'moderate';
    stressType = 'water';
    confidence = 0.85;
    severity = Math.max(0, 100 - environmentalData.soilMoisture * 2);
  }
  
  // Nutrient stress detection
  else if (indices.ndvi < 0.6 && indices.chl < 0.5) {
    stressLevel = indices.ndvi < 0.4 ? 'severe' : 'moderate';
    stressType = 'nutrient';
    confidence = 0.78;
    severity = Math.max(0, (0.8 - indices.ndvi) * 125);
  }
  
  // Disease stress detection
  else if (indices.pri < -0.1 && environmentalData.leafWetness > 80) {
    stressLevel = 'moderate';
    stressType = 'disease';
    confidence = 0.72;
    severity = Math.min(100, environmentalData.leafWetness - 20);
  }
  
  // Heat stress detection
  else if (environmentalData.airTemperature > 35 && indices.pri < 0) {
    stressLevel = environmentalData.airTemperature > 40 ? 'severe' : 'moderate';
    stressType = 'heat';
    confidence = 0.80;
    severity = Math.max(0, environmentalData.airTemperature - 30) * 2;
  }
  
  // Generate recommendations based on stress type
  const recommendations = generateStressRecommendations(stressType, stressLevel, environmentalData);
  
  // Calculate predicted yield impact
  const yieldImpact = calculateYieldImpact(stressLevel, severity, stressType);
  
  return {
    stressLevel,
    stressType,
    confidence,
    affectedArea: severity > 50 ? 75 : severity > 25 ? 40 : 15,
    severity,
    recommendations,
    predictedYieldImpact: yieldImpact
  };
}

// Generate spectral health maps for field visualization
export function generateSpectralHealthMap(
  fieldId: string,
  spectralData: SpectralData,
  environmentalData: EnvironmentalSensorData
): SpectralHealthMap {
  const indices = calculateVegetationIndices(spectralData);
  
  // Simulate field segmentation into health zones
  const healthZones = [
    {
      coordinates: [
        { lat: spectralData.coordinates.lat + 0.001, lon: spectralData.coordinates.lon + 0.001 },
        { lat: spectralData.coordinates.lat + 0.002, lon: spectralData.coordinates.lon + 0.002 },
        { lat: spectralData.coordinates.lat + 0.001, lon: spectralData.coordinates.lon + 0.002 }
      ],
      healthScore: Math.round(indices.ndvi * 100),
      stressIndicators: indices.ndvi < 0.5 ? ['Low vegetation vigor'] : [],
      recommendedActions: indices.ndvi < 0.5 ? ['Increase irrigation', 'Check nutrient levels'] : ['Continue monitoring']
    },
    {
      coordinates: [
        { lat: spectralData.coordinates.lat - 0.001, lon: spectralData.coordinates.lon - 0.001 },
        { lat: spectralData.coordinates.lat - 0.002, lon: spectralData.coordinates.lon - 0.002 },
        { lat: spectralData.coordinates.lat - 0.001, lon: spectralData.coordinates.lon - 0.002 }
      ],
      healthScore: Math.round((indices.ndvi + indices.savi) * 50),
      stressIndicators: [],
      recommendedActions: ['Optimal conditions', 'Continue current practices']
    }
  ];
  
  const overallHealth = Math.round(healthZones.reduce((sum, zone) => sum + zone.healthScore, 0) / healthZones.length);
  
  return {
    fieldId,
    timestamp: new Date().toISOString(),
    healthZones,
    overallHealth,
    trendDirection: overallHealth > 70 ? 'improving' : overallHealth > 50 ? 'stable' : 'declining'
  };
}

// Predict risk zones using AI models
export function predictRiskZones(
  spectralData: SpectralData,
  environmentalData: EnvironmentalSensorData,
  weatherForecast: any
): PredictiveRiskZone[] {
  const zones: PredictiveRiskZone[] = [];
  
  // Disease risk prediction
  if (environmentalData.humidity > 80 && environmentalData.leafWetness > 70) {
    zones.push({
      zoneId: `disease_${Date.now()}`,
      riskType: 'disease',
      riskLevel: environmentalData.humidity > 90 ? 'high' : 'medium',
      probability: Math.min(95, environmentalData.humidity + environmentalData.leafWetness - 100),
      timeframe: 'next 3-5 days',
      coordinates: [
        { lat: spectralData.coordinates.lat, lon: spectralData.coordinates.lon },
        { lat: spectralData.coordinates.lat + 0.005, lon: spectralData.coordinates.lon + 0.005 }
      ],
      preventiveActions: [
        'Apply preventive fungicide',
        'Improve field drainage',
        'Increase air circulation'
      ],
      monitoringFrequency: 'daily'
    });
  }
  
  // Drought risk prediction
  if (environmentalData.soilMoisture < 25 && environmentalData.airTemperature > 32) {
    zones.push({
      zoneId: `drought_${Date.now()}`,
      riskType: 'drought',
      riskLevel: environmentalData.soilMoisture < 15 ? 'critical' : 'high',
      probability: Math.max(60, 100 - environmentalData.soilMoisture * 2),
      timeframe: 'next 7-10 days',
      coordinates: [
        { lat: spectralData.coordinates.lat - 0.002, lon: spectralData.coordinates.lon - 0.002 },
        { lat: spectralData.coordinates.lat + 0.002, lon: spectralData.coordinates.lon + 0.002 }
      ],
      preventiveActions: [
        'Increase irrigation frequency',
        'Apply mulching',
        'Consider drought-resistant varieties'
      ],
      monitoringFrequency: 'twice daily'
    });
  }
  
  return zones;
}

// Helper functions
function findClosestWavelength(wavelengths: number[], target: number): number {
  return wavelengths.reduce((prev, curr, index) => 
    Math.abs(curr - target) < Math.abs(wavelengths[prev] - target) ? index : prev, 0
  );
}

function calculateMeanReflectance(reflectance: number[][], bandIndex: number): number {
  const values = reflectance.map(pixel => pixel[bandIndex]).filter(val => !isNaN(val));
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function generateStressRecommendations(
  stressType: CropStressAnalysis['stressType'],
  stressLevel: CropStressAnalysis['stressLevel'],
  environmentalData: EnvironmentalSensorData
): string[] {
  const recommendations: string[] = [];
  
  switch (stressType) {
    case 'water':
      recommendations.push(
        'Increase irrigation frequency',
        'Check irrigation system efficiency',
        'Consider drip irrigation for water conservation'
      );
      if (stressLevel === 'severe') {
        recommendations.push('Emergency irrigation required within 24 hours');
      }
      break;
      
    case 'nutrient':
      recommendations.push(
        'Conduct soil nutrient analysis',
        'Apply balanced fertilizer',
        'Consider foliar feeding for quick nutrient uptake'
      );
      break;
      
    case 'disease':
      recommendations.push(
        'Apply appropriate fungicide/bactericide',
        'Improve field sanitation',
        'Increase monitoring frequency'
      );
      break;
      
    case 'heat':
      recommendations.push(
        'Increase irrigation to cool plants',
        'Provide shade if possible',
        'Apply anti-transpirant spray'
      );
      break;
      
    default:
      recommendations.push('Continue regular monitoring', 'Maintain current practices');
  }
  
  return recommendations;
}

function calculateYieldImpact(
  stressLevel: CropStressAnalysis['stressLevel'],
  severity: number,
  stressType: CropStressAnalysis['stressType']
): number {
  const baseImpact = {
    none: 0,
    mild: 5,
    moderate: 15,
    severe: 35
  };
  
  const typeMultiplier = {
    water: 1.2,
    nutrient: 1.0,
    disease: 1.5,
    pest: 1.3,
    heat: 1.1,
    unknown: 0.8
  };
  
  return Math.min(80, baseImpact[stressLevel] * typeMultiplier[stressType] * (severity / 100));
}

// Simulate hyperspectral data acquisition
export async function acquireHyperspectralData(
  fieldId: string,
  coordinates: { lat: number; lon: number }
): Promise<SpectralData> {
  // Simulate data acquisition delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate simulated hyperspectral data
  const wavelengths = Array.from({ length: 200 }, (_, i) => 400 + i * 2); // 400-800nm
  const reflectance = Array.from({ length: 100 }, () => 
    wavelengths.map(wl => {
      // Simulate vegetation reflectance curve
      if (wl < 700) return Math.random() * 0.1 + 0.05; // Low visible reflectance
      else return Math.random() * 0.6 + 0.4; // High NIR reflectance
    })
  );
  
  return {
    wavelengths,
    reflectance,
    timestamp: new Date().toISOString(),
    coordinates,
    fieldId,
    imageMetadata: {
      resolution: 1.0, // meters per pixel
      bands: wavelengths.length,
      captureMethod: 'drone'
    }
  };
}
