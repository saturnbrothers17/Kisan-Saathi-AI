'use client';

import { useState, type ChangeEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { predictDisease, type PredictDiseaseOutput } from '@/ai/flows/disease-prediction';
import { suggestTreatment, type TreatmentSuggestionsOutput } from '@/ai/flows/treatment-suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Leaf, UploadCloud, Loader2, Camera, VideoOff } from 'lucide-react';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ResultsDisplay } from '@/components/results-display';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AuthButton = dynamic(() => 
  import('@/components/auth-button').then(mod => mod.AuthButton), 
  { 
    ssr: false,
    loading: () => <Skeleton className="h-10 w-24 rounded-md" /> 
  }
);

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictDiseaseOutput | null>(null);
  const [treatment, setTreatment] = useState<TreatmentSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('upload');
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
        setActiveTab('upload');
      }
    }
  };

  const handleTabChange = (value: string) => {
    if (value === activeTab) return;

    setImagePreview(null);
    setImageDataUri(null);
    setPrediction(null);
    setTreatment(null);
    setActiveTab(value);

    if(value !== 'camera'){
        stopCameraStream();
    }
  }

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
      const predResult = await predictDisease({ photoDataUri: imageDataUri });
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
        const treatResult = await suggestTreatment({
          diseaseName: predResult.commonName,
          confidenceLevel: predResult.confidencePercentage / 100,
          imageUri: imageDataUri,
        });
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

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl space-y-8">
        <header className="relative flex flex-col items-center text-center py-4">
           <div className="absolute top-4 right-0">
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload"><UploadCloud className="mr-2 h-4 w-4"/>File Upload</TabsTrigger>
                <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4"/>Live Camera</TabsTrigger>
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
                    <Input id="file-upload" type="file" accept="image/png, image/jpeg, image/webp" className="sr-only" onChange={handleImageChange} />
                  </div>
              </TabsContent>
              <TabsContent value="camera" className="mt-4">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-full aspect-video rounded-lg border bg-muted/50 overflow-hidden flex items-center justify-center">
                    {isCameraLoading ? (
                       <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                          <Loader2 className="h-12 w-12 animate-spin" />
                          <span>Starting Camera...</span>
                       </div>
                    ) : hasCameraPermission === true ? (
                       <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    ): (
                       <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground p-4 text-center">
                         <VideoOff className="h-12 w-12" />
                         <span className="font-semibold">Camera Not Available</span>
                         <span className="text-sm">Could not access the camera. Please check your browser permissions.</span>
                       </div>
                    )}
                  </div>
                  {hasCameraPermission && (
                    <Button size="lg" onClick={handleCapture} disabled={isCameraLoading}>
                       <Camera className="mr-2 h-5 w-5" />
                       Capture Photo
                    </Button>
                  )}
                  {hasCameraPermission === false && (
                     <Alert variant="destructive">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                          Please allow camera access in your browser settings to use this feature. You may need to refresh the page after granting permission.
                        </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button size="lg" onClick={handleSubmit} disabled={!imageDataUri || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isLoading ? 'Analyzing...' : 'Analyze Plant'}
            </Button>
          </CardFooter>
        </Card>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && prediction && treatment && imageDataUri && (
          <ResultsDisplay prediction={prediction} treatment={treatment} imageDataUri={imageDataUri} />
        )}
      </div>
    </main>
  );
}
