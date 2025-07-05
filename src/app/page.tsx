'use client';

import { useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { predictDisease, type PredictDiseaseOutput } from '@/ai/flows/disease-prediction';
import { suggestTreatment, type TreatmentSuggestionsOutput } from '@/ai/flows/treatment-suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Leaf, UploadCloud, Loader2 } from 'lucide-react';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ResultsDisplay } from '@/components/results-display';

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictDiseaseOutput | null>(null);
  const [treatment, setTreatment] = useState<TreatmentSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPrediction(null);
      setTreatment(null);
      setImagePreview(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!imageDataUri) {
      toast({
        variant: 'destructive',
        title: 'No Image Selected',
        description: 'Please select an image of a plant to analyze.',
      });
      return;
    }

    setIsLoading(true);
    setPrediction(null);
    setTreatment(null);

    try {
      const predResult = await predictDisease({ photoDataUri: imageDataUri });
      setPrediction(predResult);

      const treatResult = await suggestTreatment({
        diseaseName: predResult.commonName,
        confidenceLevel: predResult.confidencePercentage / 100,
        imageUri: imageDataUri,
      });
      setTreatment(treatResult);
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
        <header className="flex flex-col items-center text-center">
          <Leaf className="mb-2 h-12 w-12 text-primary" />
          <h1 className="font-headline text-5xl font-bold text-primary">Kisan Saathi AI</h1>
          <p className="mt-2 text-lg text-muted-foreground">Your AI-powered crop health companion</p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Upload Plant Image</CardTitle>
            <CardDescription>Upload an image of the affected plant for disease diagnosis.</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button size="lg" onClick={handleSubmit} disabled={!imageDataUri || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isLoading ? 'Analyzing...' : 'Analyze Plant'}
            </Button>
          </CardFooter>
        </Card>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && prediction && treatment && (
          <ResultsDisplay prediction={prediction} treatment={treatment} />
        )}
      </div>
    </main>
  );
}
