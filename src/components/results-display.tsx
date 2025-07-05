import type { PredictDiseaseOutput } from "@/ai/flows/disease-prediction";
import type { TreatmentSuggestionsOutput } from "@/ai/flows/treatment-suggestions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, FlaskConical, Stethoscope, TestTube2, Trees } from "lucide-react";

interface ResultsDisplayProps {
  prediction: PredictDiseaseOutput;
  treatment: TreatmentSuggestionsOutput;
}

export function ResultsDisplay({ prediction, treatment }: ResultsDisplayProps) {
  return (
    <Card className="shadow-lg animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Stethoscope className="h-7 w-7 text-primary" />
          Diagnosis Report
        </CardTitle>
        <CardDescription>
          Here is the AI-powered analysis of your plant's health.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold font-headline">Predicted Disease</h3>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary" className="text-base">
              {prediction.diseaseName}
            </Badge>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Confidence</span>
              <span>{prediction.confidencePercentage.toFixed(0)}%</span>
            </div>
            <Progress value={prediction.confidencePercentage} aria-label={`${prediction.confidencePercentage}% confidence`} />
          </div>
        </div>
        
        <Separator />

        <div>
            <h3 className="text-lg font-semibold font-headline mb-4">Treatment Suggestions</h3>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                <div className="space-y-4">
                    <h4 className="font-headline text-xl font-semibold flex items-center gap-2">English</h4>
                    <TreatmentSection icon={<FlaskConical className="h-5 w-5 text-primary"/>} title="Conventional Treatments" items={treatment.conventionalTreatments} />
                    <TreatmentSection icon={<Trees className="h-5 w-5 text-primary"/>} title="Traditional (Desi) Remedies" items={treatment.traditionalTreatments} />
                </div>
                <div className="space-y-4">
                    <h4 className="font-headline text-xl font-semibold flex items-center gap-2">हिंदी (Hindi)</h4>
                    <TreatmentSection icon={<TestTube2 className="h-5 w-5 text-primary"/>} title="Conventional Treatments" items={treatment.conventionalTreatments} />
                    <TreatmentSection icon={<Trees className="h-5 w-5 text-primary"/>} title="Traditional (Desi) Remedies" items={treatment.traditionalTreatments} />
                </div>
            </div>
        </div>

        {treatment.confidenceNote && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-headline">Important Note</AlertTitle>
            <AlertDescription>
              {treatment.confidenceNote}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

interface TreatmentSectionProps {
    icon: React.ReactNode;
    title: string;
    items: string[];
}

function TreatmentSection({icon, title, items}: TreatmentSectionProps) {
    if (items.length === 0) return null;
    return (
        <div className="space-y-2">
            <h5 className="font-semibold flex items-center gap-2 text-muted-foreground">{icon} {title}</h5>
            <ul className="list-disc list-inside space-y-1 text-sm">
                {items.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </div>
    )
}
