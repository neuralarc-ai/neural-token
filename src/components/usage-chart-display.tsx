"use client";

import type { ChartDataItem, Period } from '@/types';
import { BarChart, Brain, Info, LineChart, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Bar, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart } from 'recharts';
import { analyzeUsageTrends } from '@/ai/flows/analyze-usage-trends';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';


interface UsageChartDisplayProps {
  data: ChartDataItem[];
  period: Period;
}

type ChartType = 'bar' | 'line';

export function UsageChartDisplay({ data, period }: UsageChartDisplayProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    setAiSummary(null);
    try {
      const chartDataString = JSON.stringify(data);
      const result = await analyzeUsageTrends({ chartData: chartDataString });
      setAiSummary(result.summary);
      toast({ title: "AI Summary Generated", description: "Usage trend analysis complete."});
    } catch (error) {
      console.error("Error generating AI summary:", error);
      setAiSummary("Failed to generate summary. Please try again.");
      toast({ variant: "destructive", title: "AI Summary Error", description: "Could not generate usage trend analysis."});
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  const capitalizedPeriod = period.charAt(0).toUpperCase() + period.slice(1);

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle>{capitalizedPeriod} Token Usage</CardTitle>
        <CardDescription>Visual representation of token usage over the selected period.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Info className="w-12 h-12 mb-4" />
            <p>No token usage data available for this period.</p>
            <p>Add some token entries to see the chart.</p>
          </div>
        ) : (
          <>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                  />
                  {chartType === 'bar' && <Bar dataKey="tokens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />}
                  {chartType === 'line' && <Line type="monotone" dataKey="tokens" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-end">
              <Select value={chartType} onValueChange={(value: string) => setChartType(value as ChartType)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar"><BarChart className="inline-block mr-2 h-4 w-4" />Bar Chart</SelectItem>
                  <SelectItem value="line"><LineChart className="inline-block mr-2 h-4 w-4" />Line Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CardContent>
      {data.length > 0 && (
        <CardFooter className="flex-col items-start gap-4">
           <Button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="w-full sm:w-auto">
            {isLoadingSummary ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            Analyze Usage Trends with AI
          </Button>
          {aiSummary && (
            <Alert className="w-full">
              <Brain className="h-4 w-4" />
              <AlertTitle>AI Usage Analysis</AlertTitle>
              <AlertDescription>{aiSummary}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
