import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test basic imports
    console.log('Testing basic imports...');
    
    // Test zod import
    const { z } = await import('zod');
    console.log('Zod imported successfully:', typeof z);
    
    // Test genkit import
    const { genkit } = await import('genkit');
    console.log('Genkit imported successfully:', typeof genkit);
    
    // Test googleai import
    const { googleAI } = await import('@genkit-ai/googleai');
    console.log('GoogleAI imported successfully:', typeof googleAI);
    
    // Test our genkit config
    const { ai } = await import('@/ai/genkit');
    console.log('AI config imported successfully:', typeof ai);
    
    // Test definePrompt
    console.log('Testing definePrompt...');
    const testPrompt = ai.definePrompt(
      {
        name: 'testPrompt',
        input: { schema: z.object({ test: z.string() }) },
        output: { schema: z.object({ result: z.string() }) },
      },
      'Test prompt: {{test}}'
    );
    console.log('definePrompt works:', typeof testPrompt);
    
    return NextResponse.json({
      status: 'success',
      message: 'All Genkit components imported and working',
      tests: {
        zod: typeof z,
        genkit: typeof genkit,
        googleAI: typeof googleAI,
        ai: typeof ai,
        definePrompt: typeof testPrompt
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
