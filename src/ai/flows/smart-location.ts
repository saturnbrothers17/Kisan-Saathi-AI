import { ai } from '../genkit';

// Types for location detection
export interface LocationDetectionInput {
  ipAddress?: string;
  userAgent?: string;
  timeZone?: string;
  language?: string;
  networkInfo?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  browserData?: {
    platform?: string;
    cookieEnabled?: boolean;
    onLine?: boolean;
  };
}

export interface LocationResponse {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  source: 'ai_inference' | 'contextual_analysis' | 'pattern_matching';
  country: string;
  confidence: number;
  reasoning: string;
}

// Smart location detection using Gemini AI
export async function smartLocationDetection(input: LocationDetectionInput): Promise<LocationResponse> {
  try {
    const prompt = `
You are an intelligent geolocation AI assistant for Kisan Saathi, an agricultural app for Indian farmers. 
Your task is to determine the most likely location (city and state in India) based on available contextual information.

Available Information:
- IP Address: ${input.ipAddress || 'Not available'}
- User Agent: ${input.userAgent || 'Not available'}  
- Time Zone: ${input.timeZone || 'Not available'}
- Language: ${input.language || 'Not available'}
- Network Info: ${JSON.stringify(input.networkInfo) || 'Not available'}
- Browser Data: ${JSON.stringify(input.browserData) || 'Not available'}

Instructions:
1. Analyze all available contextual clues to infer the most likely location in India
2. Consider time zone patterns (IST +5:30 indicates India)
3. Look for language preferences (Hindi, regional languages)
4. Consider network patterns and connection types common in different regions
5. Use agricultural context - prioritize farming regions if uncertain
6. Provide coordinates for major Indian cities/agricultural areas
7. Give confidence score based on available data quality (0.0 to 1.0)
8. Explain your reasoning clearly

Focus on these major agricultural regions in India:
- Punjab (wheat, rice) - Chandigarh area: 30.7333, 76.7794
- Haryana (wheat, sugarcane) - Delhi NCR region: 28.6139, 77.2090
- Uttar Pradesh (wheat, rice, sugarcane) - Lucknow: 26.8467, 80.9462
- Maharashtra (cotton, sugarcane) - Pune: 18.5204, 73.8567
- Karnataka (rice, cotton) - Bangalore: 12.9716, 77.5946
- Tamil Nadu (rice, cotton) - Chennai: 13.0827, 80.2707
- Andhra Pradesh (rice, cotton) - Hyderabad: 17.3850, 78.4867
- West Bengal (rice, jute) - Kolkata: 22.5726, 88.3639
- Gujarat (cotton, groundnut) - Ahmedabad: 23.0225, 72.5714
- Rajasthan (wheat, mustard) - Jaipur: 26.9124, 75.7873

Return your response as a JSON object with:
{
  "latitude": number,
  "longitude": number,
  "city": "string",
  "state": "string", 
  "country": "India",
  "confidence": number (0.0-1.0),
  "reasoning": "string explaining your analysis",
  "source": "ai_inference"
}
`;

    const result = await ai.generate({
      prompt,
      output: { format: 'json' }
    });

    return JSON.parse(result.text);
  } catch (error) {
    console.error('Smart location detection failed:', error);
    
    // Emergency fallback to agricultural center
    return {
      latitude: 25.3176,
      longitude: 82.9739,
      city: 'Varanasi',
      state: 'Uttar Pradesh', 
      country: 'India',
      confidence: 0.3,
      reasoning: 'Fallback to agricultural center due to AI detection failure',
      source: 'pattern_matching' as const,
    };
  }
}

// Enhanced location detection with fallback coordinates
export async function enhancedLocationDetection(
  contextData: LocationDetectionInput,
  fallbackCoordinates: { lat: number; lon: number }
): Promise<LocationResponse> {
  try {
    // First try basic AI inference
    const aiResult = await smartLocationDetection(contextData);
    
    // If confidence is low, try to enhance with fallback coordinates
    if (aiResult.confidence < 0.6) {
      const enhancementPrompt = `
Based on the previous analysis and additional coordinate information, provide a more accurate location inference.

Previous Analysis: ${JSON.stringify(aiResult)}
Additional Coordinates: ${fallbackCoordinates.lat}, ${fallbackCoordinates.lon}

Use the coordinates to identify the nearest major agricultural city in India and provide enhanced confidence.
Maintain the same JSON response format but with improved accuracy.
`;

      const enhancedResult = await ai.generate({
        prompt: enhancementPrompt,
        output: { format: 'json' }
      });

      const enhanced = JSON.parse(enhancedResult.text);
      return {
        ...enhanced,
        latitude: fallbackCoordinates.lat,
        longitude: fallbackCoordinates.lon,
        source: 'contextual_analysis' as const,
      };
    }
    
    return aiResult;
  } catch (error) {
    console.error('Enhanced location detection failed:', error);
    
    // Emergency fallback to agricultural center
    return {
      latitude: 25.3176,
      longitude: 82.9739,
      city: 'Varanasi',
      state: 'Uttar Pradesh', 
      country: 'India',
      confidence: 0.3,
      reasoning: 'Fallback to agricultural center due to enhanced detection failure',
      source: 'pattern_matching' as const,
    };
  }
}
