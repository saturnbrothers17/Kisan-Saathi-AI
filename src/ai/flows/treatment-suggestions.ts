// treatment-suggestions.ts
'use server';

/**
 * @fileOverview Provides treatment suggestions for plant diseases, including conventional and traditional remedies.
 *
 * - suggestTreatment - A function that suggests treatment methods for a given plant disease and confidence level.
 * - TreatmentSuggestionsInput - The input type for the suggestTreatment function.
 * - TreatmentSuggestionsOutput - The return type for the suggestTreatment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TreatmentSuggestionsInputSchema = z.object({
  diseaseName: z.string().describe('The name of the plant disease.'),
  confidenceLevel: z
    .number()
    .describe('The confidence level of the disease prediction (0-1).'),
  imageUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TreatmentSuggestionsInput = z.infer<typeof TreatmentSuggestionsInputSchema>;

const TreatmentSuggestionsOutputSchema = z.object({
  conventionalTreatments: z
    .array(z.string())
    .describe('A list of conventional treatment methods.'),
  traditionalTreatments: z
    .array(z.string())
    .describe('A list of traditional treatment methods.'),
  confidenceNote: z
    .string()
    .describe(
      'Explanatory note about the confidence level and the treatments suggested.'
    ),
});
export type TreatmentSuggestionsOutput = z.infer<typeof TreatmentSuggestionsOutputSchema>;

export async function suggestTreatment(
  input: TreatmentSuggestionsInput
): Promise<TreatmentSuggestionsOutput> {
  return suggestTreatmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'treatmentSuggestionsPrompt',
  input: {
    schema: TreatmentSuggestionsInputSchema,
  },
  output: {
    schema: TreatmentSuggestionsOutputSchema,
  },
  prompt: `You are an agricultural expert providing treatment suggestions for plant diseases.

  Based on the identified disease: {{diseaseName}}, its prediction confidence level: {{confidenceLevel}}, and the image of the plant: {{media url=imageUri}}, suggest appropriate treatment methods.

  Include both conventional and traditional (desi) remedies.

  If the confidence level is below 0.5, emphasize caution and suggest consulting with a local agricultural expert.  Explain this in the confidenceNote field.

  Format the conventionalTreatments and traditionalTreatments as bulleted lists.
`,
});

const suggestTreatmentFlow = ai.defineFlow(
  {
    name: 'suggestTreatmentFlow',
    inputSchema: TreatmentSuggestionsInputSchema,
    outputSchema: TreatmentSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
