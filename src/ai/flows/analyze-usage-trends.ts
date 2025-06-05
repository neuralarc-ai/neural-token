
'use server';

/**
 * @fileOverview Summarizes usage trends from data visualization charts using an LLM.
 *
 * - analyzeUsageTrends - A function that takes chart data, period, and provider context, and returns a detailed analysis of trends.
 * - AnalyzeUsageTrendsInput - The input type for the analyzeUsageTrends function.
 * - AnalyzeUsageTrendsOutput - The return type for the analyzeUsageTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUsageTrendsInputSchema = z.object({
  chartData: z.string().describe('The data from the usage charts as a JSON string.'),
  period: z.string().describe('The time period the chart data represents (e.g., "daily", "weekly", "monthly").'),
  activeProvider: z.string().describe('The AI provider context for the chart (e.g., "Home", "OpenAI", "Gemini"). "Home" means aggregated data across all providers.'),
});
export type AnalyzeUsageTrendsInput = z.infer<typeof AnalyzeUsageTrendsInputSchema>;

const AnalyzeUsageTrendsOutputSchema = z.object({
  summary: z.string().describe('A detailed analysis of the trends, spikes, and patterns in the usage data.'),
});
export type AnalyzeUsageTrendsOutput = z.infer<typeof AnalyzeUsageTrendsOutputSchema>;

export async function analyzeUsageTrends(input: AnalyzeUsageTrendsInput): Promise<AnalyzeUsageTrendsOutput> {
  return analyzeUsageTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUsageTrendsPrompt',
  input: {schema: AnalyzeUsageTrendsInputSchema},
  output: {schema: AnalyzeUsageTrendsOutputSchema},
  prompt: `You are an expert data analyst specializing in API token usage patterns for AI models.
The user is viewing a chart of their token consumption.

Chart Period: {{{period}}}
Provider Focus: {{{activeProvider}}}
Data: {{{chartData}}}

Please provide a concise yet insightful analysis of this usage data. Your analysis should:
1.  Identify any significant overall trends (e.g., consistent growth, decline, cyclical patterns over the displayed period).
2.  Highlight any notable spikes, drops, or specific days/weeks/months with unusually high or low activity.
3.  If the 'Provider Focus' is not 'Home' and the data contains multiple series (implying multiple API keys for that provider), briefly comment on their relative usage or any diverging patterns if apparent. If 'Provider Focus' is 'Home', comment on the overall aggregated usage.
4.  Conclude with a brief overall assessment of the usage pattern observed. For example, is it stable, erratic, trending upwards, etc.?

Focus on clear, actionable language. Avoid vague statements.
Present your analysis as a coherent narrative summary.
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

