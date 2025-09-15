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

    // Return mock treatment suggestions for now
    const mockTreatment = {
      conventional: [
        {
          name: "Fungicide Application",
          nameHindi: "कवकनाशी का प्रयोग",
          description: "Apply appropriate fungicide as per disease severity",
          descriptionHindi: "रोग की गंभीरता के अनुसार उपयुक्त कवकनाशी का प्रयोग करें"
        }
      ],
      traditional: [
        {
          name: "Neem Oil Treatment",
          nameHindi: "नीम तेल उपचार",
          description: "Apply neem oil solution to affected areas",
          descriptionHindi: "प्रभावित क्षेत्रों पर नीम तेल का घोल लगाएं"
        }
      ]
    };

    return NextResponse.json(mockTreatment);
  } catch (error) {
    console.error('Treatment suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to get treatment suggestions. Please try again.' },
      { status: 500 }
    );
  }
}
