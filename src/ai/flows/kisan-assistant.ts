'use server';

/**
 * @fileOverview An AI assistant named Kisan that answers questions about a specific crop disease diagnosis.
 *
 * - askKisan - A function that allows users to ask follow-up questions about a plant disease diagnosis.
 * - KisanAssistantInput - The input type for the askKisan function.
 * - KisanAssistantOutput - The return type for the askKisan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type {TreatmentSuggestionsOutput} from './treatment-suggestions';

// Re-defining the schema here to avoid exporting it from a 'use server' file.
const TreatmentSuggestionsOutputSchema = z.object({
    conventionalTreatments: z.array(z.string()),
    traditionalTreatments: z.array(z.string()),
    conventionalTreatmentsHindi: z.array(z.string()),
    traditionalTreatmentsHindi: z.array(z.string()),
    confidenceNote: z.string(),
});

const KisanAssistantInputSchema = z.object({
  question: z.string().describe("The user's question about the crop disease."),
  diseaseName: z.string().describe('The name of the plant disease that was diagnosed.'),
  confidencePercentage: z.number().describe('The confidence percentage of the disease prediction.'),
  treatment: TreatmentSuggestionsOutputSchema.describe('The suggested treatments for the disease.'),
  photoDataUri: z
    .string()
    .describe(
      "The photo of the plant, as a data URI. To be used for visual context."
    ),
});
export type KisanAssistantInput = z.infer<typeof KisanAssistantInputSchema>;

const KisanAssistantOutputSchema = z.object({
  answer: z.string().describe("The AI assistant's answer to the user's question."),
});
export type KisanAssistantOutput = z.infer<typeof KisanAssistantOutputSchema>;


export async function askKisan(input: KisanAssistantInput): Promise<KisanAssistantOutput> {
  return kisanAssistantFlow(input);
}

const prompt = ai.definePrompt(
  {
    name: 'kisanAssistantPrompt',
    input: {schema: KisanAssistantInputSchema},
    output: {schema: KisanAssistantOutputSchema},
  },
  `You are "Kisan," a friendly and knowledgeable AI assistant for farmers. Your purpose is to answer follow-up questions about a specific plant disease diagnosis.

You have been provided with the following context:
- Disease Name: {{diseaseName}}
- Confidence of Diagnosis: {{confidencePercentage}}%
- Suggested Conventional Treatments (English): {{#each treatment.conventionalTreatments}}{{this}}; {{/each}}
- Suggested Traditional Treatments (English): {{#each treatment.traditionalTreatments}}{{this}}; {{/each}}
- Suggested Conventional Treatments (Hindi): {{#each treatment.conventionalTreatmentsHindi}}{{this}}; {{/each}}
- Suggested Traditional Treatments (Hindi): {{#each treatment.traditionalTreatmentsHindi}}{{this}}; {{/each}}
- Image of the plant: {{media url=photoDataUri}}

The user has asked the following question:
"{{question}}"

Your task is to:
1.  Analyze the user's question in the context of the provided diagnosis and treatment information.
2.  Provide a clear, concise, and helpful answer. You can provide the answer in English or Hindi based on the user's question language.
3.  Be polite and empathetic.
4.  **IMPORTANT:** If the user asks a question that is NOT related to the diagnosed disease, the plant, or its treatment, you MUST politely decline to answer. For example, if they ask about the weather, other crops, or general knowledge, say something like, "I can only answer questions about the current disease analysis. Please ask a question related to '{{diseaseName}}'."

Formulate your response and provide it in the 'answer' field.`
);


const kisanAssistantFlow = ai.defineFlow(
  {
    name: 'kisanAssistantFlow',
    inputSchema: KisanAssistantInputSchema,
    outputSchema: KisanAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
