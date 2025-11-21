'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating transaction insights.
 *
 * - transactionInsights - A function that generates insights into spending habits.
 * - TransactionInsightsInput - The input type for the transactionInsights function.
 * - TransactionInsightsOutput - The return type for the transactionInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionInsightsInputSchema = z.object({
  transactionData: z.string().describe('Transaction data from Firestore.'),
});
export type TransactionInsightsInput = z.infer<typeof TransactionInsightsInputSchema>;

const TransactionInsightsOutputSchema = z.object({
  insights: z.string().describe('AI-generated insights into spending habits.'),
});
export type TransactionInsightsOutput = z.infer<typeof TransactionInsightsOutputSchema>;

export async function transactionInsights(input: TransactionInsightsInput): Promise<TransactionInsightsOutput> {
  return transactionInsightsFlow(input);
}

const transactionInsightsPrompt = ai.definePrompt({
  name: 'transactionInsightsPrompt',
  input: {schema: TransactionInsightsInputSchema},
  output: {schema: TransactionInsightsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the following transaction data and provide insights into spending habits, suggesting areas to save money or optimize investments. Be concise and actionable.

Transaction Data:
{{{transactionData}}}`,
});

const transactionInsightsFlow = ai.defineFlow(
  {
    name: 'transactionInsightsFlow',
    inputSchema: TransactionInsightsInputSchema,
    outputSchema: TransactionInsightsOutputSchema,
  },
  async input => {
    const {output} = await transactionInsightsPrompt(input);
    return output!;
  }
);
