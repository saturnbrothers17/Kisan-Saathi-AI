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

    // Check if required environment variables exist
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }

    // Import and call the AI flow with error handling
    try {
      const { predictDisease } = await import('@/ai/flows/disease-prediction');
      console.log('Disease prediction function imported successfully');
      const result = await predictDisease({ photoDataUri });
      console.log('Disease prediction result:', result);
      return NextResponse.json(result);
    } catch (importError) {
      console.error('Import or execution error:', importError);
      throw new Error(`AI flow error: ${importError instanceof Error ? importError.message : 'Unknown import error'}`);
    }
  } catch (error) {
    console.error('Disease prediction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze the image. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
