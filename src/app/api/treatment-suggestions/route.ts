import { NextRequest, NextResponse } from 'next/server';
import { suggestTreatment } from '@/ai/flows/treatment-suggestions';

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

    const result = await suggestTreatment({ 
      diseaseName, 
      confidenceLevel: confidencePercentage / 100,
      imageUri: '' // Will be passed from frontend if needed
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Treatment suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to get treatment suggestions. Please try again.' },
      { status: 500 }
    );
  }
}
