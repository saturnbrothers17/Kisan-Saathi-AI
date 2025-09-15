'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import styles from './hyperspectral-dashboard.module.css';
import { 
  Satellite, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Activity, 
  Thermometer,
  Droplets,
  Leaf,
  BarChart3,
  Camera,
  Zap,
  Target
} from 'lucide-react';
import { 
  SpectralData, 
  VegetationIndices, 
  CropStressAnalysis, 
  SpectralHealthMap,
  PredictiveRiskZone,
  calculateVegetationIndices,
  detectCropStress,
  generateSpectralHealthMap,
  predictRiskZones,
  acquireHyperspectralData
} from '@/lib/api/hyperspectral-api';
import { getCurrentLocation } from '@/lib/api/weather-api';

interface HyperspectralDashboardProps {
  fieldId?: string;
  userRole?: 'farmer' | 'agronomist' | 'researcher' | 'technician';
}

export function HyperspectralDashboard({ 
  fieldId = 'field_001', 
  userRole = 'farmer' 
}: HyperspectralDashboardProps) {
  const [spectralData, setSpectralData] = useState<SpectralData | null>(null);
  const [vegetationIndices, setVegetationIndices] = useState<VegetationIndices | null>(null);
  const [stressAnalysis, setStressAnalysis] = useState<CropStressAnalysis | null>(null);
  const [healthMap, setHealthMap] = useState<SpectralHealthMap | null>(null);
  const [riskZones, setRiskZones] = useState<PredictiveRiskZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadHyperspectralData();
  }, [fieldId]);

  const loadHyperspectralData = async () => {
    try {
      setLoading(true);
      
      // Get current location
      const location = await getCurrentLocation();
      
      // Acquire hyperspectral data
      const spectral = await acquireHyperspectralData(fieldId, location);
      setSpectralData(spectral);
      
      // Calculate vegetation indices
      const indices = calculateVegetationIndices(spectral);
      setVegetationIndices(indices);
      
      // Simulate environmental sensor data
      const environmentalData = {
        soilMoisture: 45 + Math.random() * 30,
        soilTemperature: 22 + Math.random() * 8,
        airTemperature: 28 + Math.random() * 10,
        humidity: 60 + Math.random() * 30,
        leafWetness: Math.random() * 100,
        windSpeed: Math.random() * 15,
        solarRadiation: 800 + Math.random() * 400,
        precipitation: Math.random() * 5,
        timestamp: new Date().toISOString()
      };
      
      // Detect crop stress
      const stress = await detectCropStress(spectral, environmentalData);
      setStressAnalysis(stress);
      
      // Generate health map
      const healthMapData = generateSpectralHealthMap(fieldId, spectral, environmentalData);
      setHealthMap(healthMapData);
      
      // Predict risk zones
      const risks = predictRiskZones(spectral, environmentalData, {});
      setRiskZones(risks);
      
    } catch (error) {
      console.error('Failed to load hyperspectral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStressLevelColor = (level: string) => {
    switch (level) {
      case 'none': return 'bg-green-100 text-green-800';
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">फसल की जांच हो रही है... / Checking crop health...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">फसल स्वास्थ्य निगरानी / Crop Health Monitor</h1>
          <p className="text-gray-600">उन्नत तकनीक से फसल की देखभाल / Advanced crop care technology</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Satellite className="h-4 w-4" />
            <span>Field {fieldId}</span>
          </Badge>
          <Badge variant="outline" className="capitalize">
            {userRole}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">कुल स्वास्थ्य / Overall Health</p>
                <p className="text-2xl font-bold">{healthMap?.overallHealth || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">हरियाली सूचकांक / Greenness Index</p>
                <p className="text-2xl font-bold">{vegetationIndices?.ndvi.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">तनाव स्तर / Stress Level</p>
                <Badge className={getStressLevelColor(stressAnalysis?.stressLevel || 'none')}>
                  {stressAnalysis?.stressLevel || 'none'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">जोखिम क्षेत्र / Risk Zones</p>
                <p className="text-2xl font-bold">{riskZones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">सारांश / Overview</TabsTrigger>
          <TabsTrigger value="spectral">फसल विश्लेषण / Crop Analysis</TabsTrigger>
          <TabsTrigger value="health">स्वास्थ्य मानचित्र / Health Maps</TabsTrigger>
          <TabsTrigger value="predictions">जोखिम भविष्यवाणी / Risk Predictions</TabsTrigger>
          <TabsTrigger value="trends">समय के साथ बदलाव / Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crop Stress Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>फसल तनाव विश्लेषण / Crop Stress Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stressAnalysis && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>तनाव का प्रकार / Stress Type:</span>
                      <Badge variant="outline" className="capitalize">
                        {stressAnalysis.stressType}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>गंभीरता / Severity:</span>
                      <span className="font-semibold">{stressAnalysis.severity}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>विश्वसनीयता / Confidence:</span>
                      <span className="font-semibold">{(stressAnalysis.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>प्रभावित क्षेत्र / Affected Area:</span>
                      <span className="font-semibold">{stressAnalysis.affectedArea}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>उत्पादन पर प्रभाव / Yield Impact:</span>
                      <span className="font-semibold text-red-600">-{stressAnalysis.predictedYieldImpact.toFixed(1)}%</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>सुझाव / AI Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stressAnalysis?.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>जोखिम क्षेत्र की भविष्यवाणी / Predictive Risk Zones</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskZones.map((zone, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskLevelColor(zone.riskLevel)}>
                          {zone.riskLevel}
                        </Badge>
                        <span className="font-semibold capitalize">{zone.riskType.replace('_', ' ')}</span>
                      </div>
                      <span className="text-sm text-gray-600">{zone.timeframe}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      संभावना / Probability: {zone.probability}% | निगरानी / Monitor: {zone.monitoringFrequency}
                    </div>
                    <div className="space-y-1">
                      {zone.preventiveActions.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spectral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vegetation Indices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>वनस्पति सूचकांक / Vegetation Indices</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vegetationIndices && (
                  <div className="space-y-3">
                    {Object.entries(vegetationIndices).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium uppercase">{key}:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full vegetation-index-bar" 
                              // eslint-disable-next-line react/forbid-dom-props
                              style={{ width: `${Math.max(0, Math.min(100, (value + 1) * 50))}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12">{value.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Spectral Data Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>स्पेक्ट्रल डेटा / Spectral Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {spectralData && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>बैंड / Bands:</span>
                      <span className="font-semibold">{spectralData.imageMetadata.bands}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>रिज़ॉल्यूशन / Resolution:</span>
                      <span className="font-semibold">{spectralData.imageMetadata.resolution}m/pixel</span>
                    </div>
                    <div className="flex justify-between">
                      <span>कैप्चर विधि / Capture Method:</span>
                      <Badge variant="outline" className="capitalize">
                        {spectralData.imageMetadata.captureMethod}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>तरंग दैर्घ्य रेंज / Wavelength Range:</span>
                      <span className="font-semibold">
                        {Math.min(...spectralData.wavelengths)}-{Math.max(...spectralData.wavelengths)}nm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>समय / Timestamp:</span>
                      <span className="font-semibold">
                        {new Date(spectralData.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>खेत स्वास्थ्य क्षेत्र / Field Health Zones</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthMap && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span>कुल स्वास्थ्य स्कोर / Overall Health Score:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full health-score-bar" 
                          // eslint-disable-next-line react/forbid-dom-props
                          style={{ width: `${healthMap.overallHealth}%` }}
                        />
                      </div>
                      <span className="font-bold">{healthMap.overallHealth}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <span>रुझान / Trend:</span>
                    <Badge className={
                      healthMap.trendDirection === 'improving' ? 'bg-green-100 text-green-800' :
                      healthMap.trendDirection === 'stable' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {healthMap.trendDirection}
                    </Badge>
                  </div>

                  {healthMap.healthZones.map((zone, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">क्षेत्र / Zone {index + 1}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full health-score-bar" 
                              // eslint-disable-next-line react/forbid-dom-props
                              style={{ width: `${zone.healthScore}%` }}
                            />
                          </div>
                          <span className="font-semibold">{zone.healthScore}%</span>
                        </div>
                      </div>
                      
                      {zone.stressIndicators.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-red-600">तनाव संकेतक / Stress Indicators:</span>
                          <div className="text-sm text-red-600">
                            {zone.stressIndicators.join(', ')}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm font-medium">सुझाए गए कार्य / Recommended Actions:</span>
                        <div className="text-sm text-gray-600">
                          {zone.recommendedActions.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>AI आधारित जोखिम भविष्यवाणी / AI-Powered Risk Predictions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {riskZones.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-green-600 mb-2">
                      <Activity className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">कोई जोखिम क्षेत्र नहीं मिला / No Risk Zones Detected</h3>
                    <p className="text-green-600">आपका खेत अभी अच्छी स्थिति में है! / Your field is currently in optimal condition!</p>
                  </div>
                ) : (
                  riskZones.map((zone, index) => (
                    <div key={index} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          <span className="font-semibold capitalize text-orange-800">
                            {zone.riskType.replace('_', ' ')} जोखिम / Risk
                          </span>
                        </div>
                        <Badge className={getRiskLevelColor(zone.riskLevel)}>
                          {zone.riskLevel} ({zone.probability}%)
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium">समय सीमा / Timeframe:</span>
                          <p className="text-sm text-gray-700">{zone.timeframe}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">निगरानी / Monitoring:</span>
                          <p className="text-sm text-gray-700">{zone.monitoringFrequency}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium mb-2 block">बचाव के उपाय / Preventive Actions:</span>
                        <div className="space-y-1">
                          {zone.preventiveActions.map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>समय के साथ रुझान विश्लेषण / Temporal Trend Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">समय विश्लेषण / Temporal Analysis</h3>
                <p className="text-gray-500">ऐतिहासिक रुझान डेटा यहाँ दिखाया जाएगा / Historical trend data will be displayed here</p>
                <p className="text-sm text-gray-400 mt-2">
                  रुझान विश्लेषण के लिए समय के साथ कई डेटा पॉइंट्स की आवश्यकता / Requires multiple data points over time for trend analysis
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
