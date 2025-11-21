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
  language: z.string().optional().describe('User language preference (PT-BR, PT-PT, EN-US)'),
});
export type TransactionInsightsInput = z.infer<typeof TransactionInsightsInputSchema>;

const TransactionInsightsOutputSchema = z.object({
  insights: z.string().describe('AI-generated insights into spending habits.'),
});
export type TransactionInsightsOutput = z.infer<typeof TransactionInsightsOutputSchema>;

export async function transactionInsights(input: TransactionInsightsInput): Promise<TransactionInsightsOutput> {
  return transactionInsightsFlow(input);
}

function getPromptByLanguage(language: string = 'PT-BR'): string {
  const prompts: Record<string, string> = {
    'EN-US': `You are FIN, an intelligent and friendly financial assistant. Analyze the transaction data below and provide insights about the user's spending habits, suggesting areas to save or optimize investments. Be concise, objective, and use accessible language.

Transaction Data:
{{{transactionData}}}`,
    'PT-PT': `Você é a FIN, uma assistente financeira inteligente e amigável. Analise os dados de transações abaixo e forneça insights sobre os hábitos de gastos do utilizador, sugerindo áreas para economizar ou otimizar investimentos. Seja concisa, objetiva e use uma linguagem acessível em português europeu.

Dados das Transações:
{{{transactionData}}}`,
    'PT-BR': `Você é a FIN, uma assistente financeira inteligente e amigável. Analise os dados de transações abaixo e forneça insights sobre os hábitos de gastos do usuário, sugerindo áreas para economizar ou otimizar investimentos. Seja concisa, objetiva e use uma linguagem acessível em português brasileiro.

Dados das Transações:
{{{transactionData}}}`,
  };
  return prompts[language] || prompts['PT-BR'];
}

const transactionInsightsPrompt = ai.definePrompt({
  name: 'transactionInsightsPrompt',
  input: {schema: TransactionInsightsInputSchema},
  output: {schema: TransactionInsightsOutputSchema},
  prompt: `{{{prompt}}}`,
});

const transactionInsightsFlow = ai.defineFlow(
  {
    name: 'transactionInsightsFlow',
    inputSchema: TransactionInsightsInputSchema,
    outputSchema: TransactionInsightsOutputSchema,
  },
  async input => {
    const prompt = getPromptByLanguage(input.language);
    const {output} = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: prompt.replace('{{{transactionData}}}', input.transactionData),
      output: {schema: TransactionInsightsOutputSchema},
    });
    return output!;
  }
);
