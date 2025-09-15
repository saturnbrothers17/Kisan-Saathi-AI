import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      question, 
      diseaseName, 
      confidencePercentage, 
      treatmentSuggestions, 
      photoDataUri 
    } = body;

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
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
      const { askKisan } = await import('@/ai/flows/kisan-assistant');
      console.log('Kisan assistant function imported successfully');
      const result = await askKisan({
        question,
        diseaseName: diseaseName || '',
        confidencePercentage: confidencePercentage || 0,
        treatment: treatmentSuggestions || {
          conventionalTreatments: [],
          traditionalTreatments: [],
          conventionalTreatmentsHindi: [],
          traditionalTreatmentsHindi: [],
          confidenceNote: ''
        },
        photoDataUri: photoDataUri || ''
      });
      console.log('Kisan assistant result:', result);
      return NextResponse.json(result);
    } catch (importError) {
      console.error('Import or execution error:', importError);
      throw new Error(`AI flow error: ${importError instanceof Error ? importError.message : 'Unknown import error'}`);
    }
  } catch (error) {
    console.error('Kisan assistant error:', error);
    return NextResponse.json(
      { error: 'Failed to get assistant response. Please try again.' },
      { status: 500 }
    );
  }
}
