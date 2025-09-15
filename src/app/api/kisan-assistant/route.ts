import { NextRequest, NextResponse } from 'next/server';
import { askKisan } from '@/ai/flows/kisan-assistant';

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
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Kisan assistant error:', error);
    return NextResponse.json(
      { error: 'Failed to get assistant response. Please try again.' },
      { status: 500 }
    );
  }
}
