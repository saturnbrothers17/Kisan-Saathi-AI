'use server';

/**
 * @fileOverview Image-based disease prediction flow for plants.
 *
 * - predictDisease - A function that handles the disease prediction process based on an image.
 * - PredictDiseaseInput - The input type for the predictDisease function.
 * - PredictDiseaseOutput - The return type for the predictDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const PredictDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type PredictDiseaseInput = z.infer<typeof PredictDiseaseInputSchema>;

const PredictDiseaseOutputSchema = z.object({
  isHealthy: z.boolean().describe('Whether the plant is healthy or not.'),
  commonName: z.string().describe('If not healthy, the common name of the disease. If healthy, "Healthy".'),
  hindiName: z.string().describe('If not healthy, the Hindi name of the disease. If healthy, "स्वस्थ".'),
  confidencePercentage: z.number().describe('The confidence percentage of the prediction (0-100). If healthy, this will be 100.'),
});
export type PredictDiseaseOutput = z.infer<typeof PredictDiseaseOutputSchema>;

export async function predictDisease(input: PredictDiseaseInput): Promise<PredictDiseaseOutput> {
  return predictDiseaseFlow(input);
}

const prompt = ai.definePrompt(
  {
    name: 'predictDiseasePrompt',
    input: {schema: PredictDiseaseInputSchema},
    output: {schema: PredictDiseaseOutputSchema},
  },
  `You are an expert in plant pathology. Analyze the provided image of a plant.

  First, determine if the plant is perfectly healthy. Analyze the complete image to be sure.
  
  - If the plant is 100% healthy, you MUST set the 'isHealthy' flag to true. In this case, set 'commonName' to "Healthy", 'hindiName' to "स्वस्थ", and 'confidencePercentage' to 100.
  
  - If the plant shows any signs of disease, you MUST set 'isHealthy' to false. Then, predict the disease affecting the plant. Provide a common, easy-to-understand name for the disease in English, and also provide the name in Hindi. Return the common English name, the Hindi name, and the confidence percentage of your prediction.
  
  Analyze this photo: {{media url=photoDataUri}}
  `
);

const predictDiseaseFlow = ai.defineFlow(
  {
    name: 'predictDiseaseFlow',
    inputSchema: PredictDiseaseInputSchema,
    outputSchema: PredictDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
