import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoDataUri } = body;

    if (!photoDataUri) {
      return NextResponse.json(
        { error: 'Photo data URI is required' },
        { status: 400 }
      );
    }

    // Test direct Genkit usage without importing the flow
    const { z } = await import('zod');
    const { ai } = await import('@/ai/genkit');
    
    console.log('Creating simple test prompt...');
    
    const InputSchema = z.object({
      photoDataUri: z.string().describe('A photo of a plant as a data URI'),
    });
    
    const OutputSchema = z.object({
      isHealthy: z.boolean().describe('Whether the plant is healthy'),
      commonName: z.string().describe('Disease name or "Healthy"'),
      confidencePercentage: z.number().describe('Confidence 0-100'),
    });
    
    const testPrompt = ai.definePrompt(
      {
        name: 'testDiseasePrompt',
        input: { schema: InputSchema },
        output: { schema: OutputSchema },
      },
      `Analyze this plant image and determine if it's healthy or diseased.
      
      Image: {{media url=photoDataUri}}
      
      Return:
      - isHealthy: true if healthy, false if diseased
      - commonName: "Healthy" if healthy, otherwise disease name
      - confidencePercentage: your confidence level 0-100`
    );
    
    console.log('Executing test prompt...');
    const { output } = await testPrompt({ photoDataUri });
    
    return NextResponse.json({
      success: true,
      result: output,
      message: 'Direct Genkit execution successful'
    });
    
  } catch (error) {
    console.error('Simple disease test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
