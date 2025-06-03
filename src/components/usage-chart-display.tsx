
"use client";

import type { ChartDataItem, Period, StoredApiKey, DisplayApiKey } from '@/types';
import { BarChart, Brain, Info, LineChart, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Bar, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Legend } from 'recharts';
import { analyzeUsageTrends } from '@/ai/flows/analyze-usage-trends';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';

interface UsageChartDisplayProps {
  data: ChartDataItem[];
  period: Period;
  allApiKeys: DisplayApiKey[]; // All available API keys for legend/color mapping
  selectedChartApiKeyId: string | null; // To know which keys are active
}

type ChartType = 'bar' | 'line';

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function UsageChartDisplay({ data, period, allApiKeys, selectedChartApiKeyId }: UsageChartDisplayProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const { toast } = useToast();

  const activeApiKeysToDisplay = useMemo(() => {
    if (selectedChartApiKeyId) {
      return allApiKeys.filter(key => key.id === selectedChartApiKeyId);
    }
    // If "All Keys" is selected, find keys that actually have data
    if (data.length > 0) {
      const dataKeys = Object.keys(data[0]).filter(key => key !== 'name');
      return allApiKeys.filter(apiKey => dataKeys.includes(apiKey.name));
    }
    return [];
  }, [selectedChartApiKeyId, allApiKeys, data]);


  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    setAiSummary(null);
    try {
      // The data is already structured with multiple series if "All Keys" is selected
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
    <Card className="bg-card text-card-foreground shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle>{capitalizedPeriod} Token Usage</CardTitle>
        <CardDescription>Visual representation of token consumption.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 || activeApiKeysToDisplay.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Info className="w-12 h-12 mb-4" />
            <p>No token usage data available for this period or selection.</p>
            <p>Add some token entries or select an API key with data.</p>
          </div>
        ) : (
          <>
            <div className="h-80"> {/* Consider adjusting height if needed */}
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--popover-foreground))',
                      borderRadius: 'var(--radius)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                    cursor={{ fill: 'hsl(var(--accent))', opacity: 0.5 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {activeApiKeysToDisplay.map((apiKey, index) => {
                    const color = chartColors[index % chartColors.length];
                    if (chartType === 'bar') {
                      return <Bar key={apiKey.id} dataKey={apiKey.name} fill={color} radius={[4, 4, 0, 0]} barSize={selectedChartApiKeyId ? 20 : Math.max(10, 40 / activeApiKeysToDisplay.length)} />;
                    }
                    return <Line key={apiKey.id} type="monotone" dataKey={apiKey.name} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth:1, stroke: 'hsl(var(--background))' }} activeDot={{ r: 5, strokeWidth:2 }} />;
                  })}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex justify-end">
              <Select value={chartType} onValueChange={(value: string) => setChartType(value as ChartType)}>
                <SelectTrigger className="w-[180px] text-sm">
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
      {(data.length > 0 && activeApiKeysToDisplay.length > 0) && (
        <CardFooter className="flex-col items-start gap-4 pt-4 border-t border-border/50">
           <Button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="w-full sm:w-auto">
            {isLoadingSummary ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            Analyze Usage Trends with AI
          </Button>
          {aiSummary && (
            <Alert className="w-full bg-secondary/50 border-secondary">
              <Brain className="h-4 w-4 text-primary" />
              <AlertTitle className="font-semibold text-foreground">AI Usage Analysis</AlertTitle>
              <AlertDescription className="text-muted-foreground">{aiSummary}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
