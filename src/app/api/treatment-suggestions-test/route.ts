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

    // Import and call the AI flow with error handling
    try {
      const { suggestTreatment } = await import('@/ai/flows/treatment-suggestions');
      console.log('Treatment suggestion function imported successfully');
      const result = await suggestTreatment({ 
        diseaseName, 
        confidenceLevel: confidencePercentage / 100,
        imageUri: '' // Will be passed from frontend if needed
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
    message: 'Treatment suggestions endpoint is working',
    method: 'POST required with diseaseName and confidencePercentage in body'
  });
}
