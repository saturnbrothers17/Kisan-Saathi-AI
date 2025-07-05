import { useState, useEffect, useRef } from "react";
import type { PredictDiseaseOutput } from "@/ai/flows/disease-prediction";
import type { TreatmentSuggestionsOutput } from "@/ai/flows/treatment-suggestions";
import { askKisan } from "@/ai/flows/kisan-assistant";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Bot, FlaskConical, Loader2, Mic, Send, Stethoscope, TestTube2, Trees, User } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface ResultsDisplayProps {
  prediction: PredictDiseaseOutput;
  treatment: TreatmentSuggestionsOutput;
  imageDataUri: string;
}

// Type definition for browser SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function ResultsDisplay({ prediction, treatment, imageDataUri }: ResultsDisplayProps) {
  const [messages, setMessages] = useState<{ author: 'user' | 'kisan'; content: string }[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const { toast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserQuestion(prev => (prev ? prev + ' ' : '') + transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast({
            variant: 'destructive',
            title: 'Voice Error',
            description: 'Could not recognize speech, please try again.',
        });
      };
      
      recognitionRef.current = recognition;
    }

    return () => {
        recognitionRef.current?.abort();
    }
  }, [toast]);


  const handleToggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
        toast({
            variant: 'destructive',
            title: 'Not Supported',
            description: 'Voice input is not supported on this browser.',
        });
        return;
    }
    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.start();
    }
  };

  const handleAskKisan = async () => {
    if (!userQuestion.trim()) return;

    const newMessages = [...messages, { author: 'user' as const, content: userQuestion }];
    setMessages(newMessages);
    const questionToAsk = userQuestion;
    setUserQuestion('');
    setIsAssistantLoading(true);

    try {
      const result = await askKisan({
        question: questionToAsk,
        diseaseName: prediction.commonName,
        confidencePercentage: prediction.confidencePercentage,
        treatment: treatment,
        photoDataUri: imageDataUri,
      });
      setMessages([...newMessages, { author: 'kisan' as const, content: result.answer }]);
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: "Assistant Error",
        description: "Sorry, I couldn't get a response. Please try again.",
      });
      setMessages(messages); // Revert messages if the call fails
    } finally {
      setIsAssistantLoading(false);
    }
  };


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
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <Badge variant="secondary" className="text-base">
              {prediction.commonName}
            </Badge>
            <Badge variant="outline" className="text-base font-normal">
              {prediction.hindiName}
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
                    <TreatmentSection icon={<TestTube2 className="h-5 w-5 text-primary"/>} title="रासायनिक उपचार" items={treatment.conventionalTreatmentsHindi} />
                    <TreatmentSection icon={<Trees className="h-5 w-5 text-primary"/>} title="पारंपरिक (देसी) उपचार" items={treatment.traditionalTreatmentsHindi} />
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

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold font-headline">Ask Kisan Assistant</h3>
              <p className="text-sm text-muted-foreground">Ask a follow-up question about this diagnosis.</p>
            </div>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <ScrollArea className="h-48 w-full pr-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-3 ${message.author === 'user' ? 'justify-end' : ''}`}>
                      {message.author === 'kisan' && (
                        <Avatar className="h-8 w-8">
                           <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        message.author === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                       {message.author === 'user' && (
                        <Avatar className="h-8 w-8">
                           <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                   {isAssistantLoading && (
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg bg-background px-3 py-2 text-sm flex items-center gap-2">
                           <Loader2 className="h-4 w-4 animate-spin"/>
                           <span>Kisan is thinking...</span>
                        </div>
                      </div>
                    )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 pt-0">
               <div className="flex w-full items-center gap-2">
                  <Textarea
                    placeholder="Type your question, or use the mic to speak in Hindi..."
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAskKisan();
                      }
                    }}
                    rows={1}
                    className="min-h-[40px] resize-none"
                    disabled={isAssistantLoading}
                  />
                  {speechSupported && (
                    <Button onClick={handleToggleListening} disabled={isAssistantLoading} size="icon" variant="outline">
                        {isListening ? (
                            <Mic className="h-4 w-4 text-destructive animate-pulse" />
                        ) : (
                            <Mic className="h-4 w-4" />
                        )}
                        <span className="sr-only">{isListening ? 'Stop speaking' : 'Start speaking'}</span>
                    </Button>
                  )}
                  <Button onClick={handleAskKisan} disabled={!userQuestion.trim() || isAssistantLoading} size="icon">
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
            </CardFooter>
          </Card>
        </div>
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
    if (!items || items.length === 0) return null;
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
