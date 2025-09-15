import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { diseaseName, confidencePercentage } = body;

    if (!diseaseName || confidencePercentage === undefined) {
      return NextResponse.json(
        { error: 'Disease name and confidence percentage are required' },
        { status: 400 }
      );
    }

    // Check if required environment variables exist
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }

    try {
      // Import Genkit and create direct prompt
      const { ai } = await import('@/ai/genkit');
      const { z } = await import('zod');

      const TreatmentOutputSchema = z.object({
        conventionalTreatments: z.array(z.string()).describe('Conventional treatment methods in English'),
        traditionalTreatments: z.array(z.string()).describe('Traditional/organic treatment methods in English'),
        conventionalTreatmentsHindi: z.array(z.string()).describe('Conventional treatment methods in Hindi'),
        traditionalTreatmentsHindi: z.array(z.string()).describe('Traditional/organic treatment methods in Hindi'),
        confidenceNote: z.string().describe('A note about the confidence level and treatment effectiveness')
      });

      const prompt = ai.definePrompt(
        {
          name: 'treatmentSuggestionsPrompt',
          input: {
            schema: z.object({
              diseaseName: z.string(),
              confidenceLevel: z.number()
            })
          },
          output: {
            schema: TreatmentOutputSchema
          }
        },
        `You are an agricultural expert providing treatment suggestions for plant diseases.

Based on the identified disease: {{diseaseName}} with confidence level: {{confidenceLevel}}, suggest appropriate treatment methods.

Include both conventional and traditional (desi) remedies. Provide the treatments in both English and Hindi.

For conventional treatments, suggest:
- Chemical fungicides or pesticides
- Modern agricultural practices
- Commercial products

For traditional treatments, suggest:
- Organic/natural remedies
- Traditional Indian farming methods
- Home-made solutions using neem, turmeric, etc.

Provide practical, actionable advice that farmers can implement.`
      );

      const result = await prompt({
        diseaseName,
        confidenceLevel: confidencePercentage / 100
      });

      console.log('Treatment suggestion result:', result);
      return NextResponse.json(result);
    } catch (importError) {
      console.error('Import or execution error:', importError);
      return NextResponse.json(
        { 
          error: 'Failed to get AI treatment suggestions. Please try again.',
          details: importError instanceof Error ? importError.message : 'Unknown import error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Treatment suggestion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get treatment suggestions. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Working treatment suggestions endpoint',
    method: 'POST required with diseaseName and confidencePercentage in body'
  });
}
