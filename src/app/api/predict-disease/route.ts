import { NextRequest, NextResponse } from 'next/server';
import { predictDisease } from '@/ai/flows/disease-prediction';

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

    const result = await predictDisease({ photoDataUri });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Disease prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze the image. Please try again.' },
      { status: 500 }
    );
  }
}
