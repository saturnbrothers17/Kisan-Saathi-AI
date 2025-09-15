'use client';

import { useState, type ChangeEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { type PredictDiseaseOutput } from '@/ai/flows/disease-prediction';
import { type TreatmentSuggestionsOutput } from '@/ai/flows/treatment-suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Leaf, UploadCloud, Loader2, Camera, VideoOff, BarChart3, MapPin, Zap } from 'lucide-react';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ResultsDisplay } from '@/components/results-display';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CropPricesWidget } from '@/components/crop-prices-widget';
import { FarmerDashboard } from '@/components/farmer-dashboard';
import { CameraCapture } from '@/components/camera-capture';

const AuthButton = dynamic(() => 
  import('@/components/auth-button').then(mod => mod.AuthButton), 
  { 
    ssr: false,
    loading: () => <Skeleton className="h-10 w-24 rounded-md" /> 
  }
);

function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prediction, setPrediction] = useState<PredictDiseaseOutput | null>(null);
  const [treatment, setTreatment] = useState<TreatmentSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('upload');
  const [showDashboard, setShowDashboard] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function enableCamera() {
      if (activeTab !== 'camera') return;
      
      setIsCameraLoading(true);
      stopCameraStream();
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (isMounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } else {
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        if (isMounted) {
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this app.',
          });
        }
      } finally {
        if (isMounted) {
          setIsCameraLoading(false);
        }
      }
    }

    enableCamera();

    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, [activeTab, toast]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPrediction(null);
      setTreatment(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImageDataUri(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setImageDataUri(dataUri);
        setImagePreview(dataUri);
      }
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value !== 'camera') {
      stopCameraStream();
      setHasCameraPermission(null);
    }
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setImageDataUri(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (dataUri: string) => {
    setImageDataUri(dataUri);
    setImagePreview(dataUri);
  };

  const handleAnalyze = async () => {
    if (!imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'No Image Selected',
        description: 'Please upload an image or capture one using the camera.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call API endpoint instead of direct function
      const predictionResponse = await fetch('/api/predict-disease', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoDataUri: imageDataUri }),
      });
      
      if (!predictionResponse.ok) {
        throw new Error('Disease prediction failed');
      }
      
      const predictionResult = await predictionResponse.json();
      setPrediction(predictionResult);
      
      // Call treatment API endpoint
      const treatmentResponse = await fetch('/api/treatment-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diseaseName: predictionResult.commonName,
          confidencePercentage: predictionResult.confidencePercentage,
        }),
      });
      
      if (!treatmentResponse.ok) {
        throw new Error('Treatment suggestions failed');
      }
      
      const treatmentResult = await treatmentResponse.json();
      setTreatment(treatmentResult);
      
      toast({
        title: 'Analysis Complete',
        description: `Disease detected: ${predictionResult.commonName}`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Failed to analyze the image. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'No Image Selected',
        description: 'Please select or capture an image of a plant to analyze.',
      });
      return;
    }

    setIsLoading(true);
    setPrediction(null);
    setTreatment(null);

    try {
      // Call API endpoint instead of direct function
      const predictionResponse = await fetch('/api/predict-disease', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoDataUri: imageDataUri }),
      });
      
      if (!predictionResponse.ok) {
        throw new Error('Disease prediction failed');
      }
      
      const predResult = await predictionResponse.json();
      setPrediction(predResult);

      if (predResult.isHealthy) {
        setTreatment({
          conventionalTreatments: [],
          traditionalTreatments: [],
          conventionalTreatmentsHindi: [],
          traditionalTreatmentsHindi: [],
          confidenceNote: 'The plant appears to be healthy. No treatment is necessary. Continue with regular care.',
        });
      } else {
        // Call treatment API endpoint
        const treatmentResponse = await fetch('/api/treatment-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            diseaseName: predResult.commonName,
            confidencePercentage: predResult.confidencePercentage,
          }),
        });
        
        if (!treatmentResponse.ok) {
          throw new Error('Treatment suggestions failed');
        }
        
        const treatResult = await treatmentResponse.json();
        setTreatment(treatResult);
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'An error occurred while analyzing the image. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showDashboard) {
    return <FarmerDashboard onBack={() => setShowDashboard(false)} />;
  }

  return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
        <div className="container mx-auto px-4 py-8 space-y-8">
          
          <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-8 md:p-12">

            <div className="w-full max-w-2xl space-y-8">
              <header className="relative flex flex-col items-center text-center py-4">
                <div className="absolute top-4 right-0 flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDashboard(true)}
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Farmer Dashboard
                  </Button>
                  <AuthButton />
                </div>
                <Leaf className="mb-2 h-12 w-12 text-primary" />
                <h1 className="font-headline text-5xl font-bold text-primary">Kisan Saathi AI</h1>
                <p className="mt-2 text-lg text-muted-foreground">जय जवान जय किसान 🇮🇳</p>
              </header>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Provide Plant Image</CardTitle>
                  <CardDescription>Choose a method to provide an image for disease diagnosis.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="upload"><UploadCloud className="mr-2 h-4 w-4"/>File Upload</TabsTrigger>
                      <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4"/>Live Camera</TabsTrigger>
                      <TabsTrigger value="location"><MapPin className="mr-2 h-4 w-4"/>Location Test</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-4">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <label htmlFor="file-upload" className="w-full cursor-pointer">
                          <div className="relative flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary">
                            {imagePreview ? (
                              <Image src={imagePreview} alt="Selected plant" layout="fill" objectFit="contain" className="rounded-lg" />
                            ) : (
                              <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                                <UploadCloud className="h-12 w-12" />
                                <span className="font-semibold">Click to upload or drag and drop</span>
                                <span className="text-sm">PNG, JPG, or WEBP</span>
                              </div>
                            )}
                          </div>
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="camera" className="mt-4">
                      <CameraCapture onCapture={handleCameraCapture} />
                    </TabsContent>
                    <TabsContent value="location" className="mt-4">
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700">
                            Location is automatically set when you first visit the app. 
                            Your current location will be used for weather and crop price data.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!selectedFile && !imageDataUri}
                    className="w-full"
                    size="lg"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Analyze Plant Disease
                  </Button>
                </CardFooter>
              </Card>

              {isLoading && <LoadingSkeleton />}

              {!isLoading && prediction && treatment && imageDataUri && (
                <ResultsDisplay prediction={prediction} treatment={treatment} imageDataUri={imageDataUri} />
              )}

            </div>
          </div>
        </div>
      </main>
  );
}

export default Home;
