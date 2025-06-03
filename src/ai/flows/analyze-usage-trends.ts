'use server';

/**
 * @fileOverview Summarizes usage trends from data visualization charts using an LLM.
 *
 * - analyzeUsageTrends - A function that takes chart data and returns a summary of trends.
 * - AnalyzeUsageTrendsInput - The input type for the analyzeUsageTrends function.
 * - AnalyzeUsageTrendsOutput - The return type for the analyzeUsageTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUsageTrendsInputSchema = z.object({
  chartData: z.string().describe('The data from the usage charts as a JSON string.'),
});
export type AnalyzeUsageTrendsInput = z.infer<typeof AnalyzeUsageTrendsInputSchema>;

const AnalyzeUsageTrendsOutputSchema = z.object({
  summary: z.string().describe('A summary of the trends displayed in the data visualization charts.'),
});
export type AnalyzeUsageTrendsOutput = z.infer<typeof AnalyzeUsageTrendsOutputSchema>;

export async function analyzeUsageTrends(input: AnalyzeUsageTrendsInput): Promise<AnalyzeUsageTrendsOutput> {
  return analyzeUsageTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUsageTrendsPrompt',
  input: {schema: AnalyzeUsageTrendsInputSchema},
  output: {schema: AnalyzeUsageTrendsOutputSchema},
  prompt: `You are an expert data analyst. Analyze the following data from usage charts and provide a summary of the trends.

Data: {{{chartData}}}
\nSummarize the trends:
`,
});

const analyzeUsageTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeUsageTrendsFlow',
    inputSchema: AnalyzeUsageTrendsInputSchema,
    outputSchema: AnalyzeUsageTrendsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
