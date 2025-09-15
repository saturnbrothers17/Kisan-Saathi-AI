import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Disease Prediction API</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .result { margin-top: 20px; padding: 15px; border: 1px solid #ccc; background: #f9f9f9; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
        input[type="file"] { margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Disease Prediction API Test</h1>
    <input type="file" id="imageInput" accept="image/*" aria-label="Select plant image">
    <button onclick="testAPI()">Test Disease Prediction</button>
    <div id="result"></div>

    <script>
        async function testAPI() {
            const fileInput = document.getElementById('imageInput');
            const resultDiv = document.getElementById('result');
            
            if (!fileInput.files[0]) {
                resultDiv.innerHTML = '<div style="color: red;">Please select an image first</div>';
                return;
            }

            const file = fileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                const photoDataUri = e.target.result;
                
                try {
                    resultDiv.innerHTML = '<div style="color: blue;">Testing API...</div>';
                    
                    const response = await fetch('/api/predict-disease', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ photoDataUri })
                    });
                    
                    const data = await response.json();
                    
                    resultDiv.innerHTML = \`
                        <h3>Response Status: \${response.status}</h3>
                        <h4>Response Headers:</h4>
                        <pre>\${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}</pre>
                        <h4>Response Data:</h4>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    \`;
                } catch (error) {
                    resultDiv.innerHTML = \`<div style="color: red;">Network Error: \${error.message}</div>\`;
                }
            };
            
            reader.readAsDataURL(file);
        }
    </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { photoDataUri } = await request.json();
    
    // Test direct Genkit usage instead of calling the API
    const { z } = await import('zod');
    const { ai } = await import('@/ai/genkit');
    
    console.log('Testing direct Genkit execution...');
    
    const InputSchema = z.object({
      photoDataUri: z.string().describe('A photo of a plant as a data URI'),
    });
    
    const OutputSchema = z.object({
      isHealthy: z.boolean().describe('Whether the plant is healthy'),
      commonName: z.string().describe('Disease name or "Healthy"'),
      confidencePercentage: z.number().describe('Confidence 0-100'),
    });
    
    const testPrompt = ai.definePrompt(
      {
        name: 'directTestPrompt',
        input: { schema: InputSchema },
        output: { schema: OutputSchema },
      },
      `Analyze this plant image: {{media url=photoDataUri}}
      
      Determine if healthy or diseased and return appropriate values.`
    );
    
    console.log('Executing direct prompt...');
    const { output } = await testPrompt({ photoDataUri });
    
    return NextResponse.json({
      success: true,
      directTest: true,
      result: output,
      message: 'Direct Genkit execution successful'
    });
    
  } catch (error) {
    console.error('Direct test error:', error);
    return NextResponse.json({
      error: 'Direct test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
