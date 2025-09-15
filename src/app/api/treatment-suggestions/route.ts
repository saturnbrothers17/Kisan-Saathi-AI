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
      throw new Error(`AI flow error: ${importError instanceof Error ? importError.message : 'Unknown import error'}`);
    }
  } catch (error) {
    console.error('Treatment suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to get treatment suggestions. Please try again.' },
      { status: 500 }
    );
  }
}
