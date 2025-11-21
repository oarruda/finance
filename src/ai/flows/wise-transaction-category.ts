'use server';

/**
 * @fileOverview AI-powered transaction categorization for WISE transactions.
 *
 * - suggestWiseTransactionCategory - A function that suggests a transaction category based on transaction details.
 * - WiseTransactionInput - The input type for the suggestWiseTransactionCategory function.
 * - WiseTransactionOutput - The return type for the suggestWiseTransactionCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WiseTransactionInputSchema = z.object({
  transactionDetails: z
    .string()
    .describe('The details of the WISE transaction, including amount, date, and description.'),
});
export type WiseTransactionInput = z.infer<typeof WiseTransactionInputSchema>;

const WiseTransactionOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The suggested category for the WISE transaction (e.g., Travel, Investment, Currency Exchange).' + 
      'If you are unsure, use the category `Other`.'
    ),
});
export type WiseTransactionOutput = z.infer<typeof WiseTransactionOutputSchema>;

export async function suggestWiseTransactionCategory(
  input: WiseTransactionInput
): Promise<WiseTransactionOutput> {
  return wiseTransactionCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'wiseTransactionCategoryPrompt',
  input: {schema: WiseTransactionInputSchema},
  output: {schema: WiseTransactionOutputSchema},
  prompt: `You are an expert financial analyst specializing in categorizing WISE transactions.

  Based on the following transaction details, suggest the most appropriate category.

  Transaction Details: {{{transactionDetails}}}

  Consider categories such as:
  - Travel
  - Investment
  - Currency Exchange
  - Bills and Utilities
  - Shopping
  - Food and Dining
  - Entertainment
  - Other

  Return ONLY the name of the category.
  If you are unsure, categorize the transaction as \"Other\".
  `,
});

const wiseTransactionCategoryFlow = ai.defineFlow(
  {
    name: 'wiseTransactionCategoryFlow',
    inputSchema: WiseTransactionInputSchema,
    outputSchema: WiseTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

