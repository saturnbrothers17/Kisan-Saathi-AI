import { NextRequest, NextResponse } from 'next/server';
import { smartLocationDetection, enhancedLocationDetection } from '@/ai/flows/smart-location';
import type { LocationDetectionInput } from '@/ai/flows/smart-location';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contextData, fallbackCoordinates } = body as {
      contextData: LocationDetectionInput;
      fallbackCoordinates?: { lat: number; lon: number };
    };

    console.log('🤖 Gemini AI location detection API called');

    // Use enhanced detection if we have fallback coordinates
    const locationResult = fallbackCoordinates 
      ? await enhancedLocationDetection(contextData, fallbackCoordinates)
      : await smartLocationDetection(contextData);

    console.log('🤖 Gemini AI result:', {
      city: locationResult.city,
      state: locationResult.state,
      confidence: locationResult.confidence,
      reasoning: locationResult.reasoning?.substring(0, 100) + '...'
    });

    return NextResponse.json(locationResult);
  } catch (error) {
    console.error('Gemini AI location detection failed:', error);
    
    // Return fallback location
    return NextResponse.json({
      latitude: 25.3176,
      longitude: 82.9739,
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      country: 'India',
      confidence: 0.3,
      reasoning: 'Fallback to agricultural center due to API error',
      source: 'pattern_matching',
    });
  }
}
