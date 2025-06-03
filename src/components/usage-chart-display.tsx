
"use client";

import type { ChartDataItem, Period, StoredApiKey } from '@/types'; // Changed DisplayApiKey to StoredApiKey
import { BarChart, Brain, Info, LineChart, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Bar, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Legend } from 'recharts';
import { analyzeUsageTrends } from '@/ai/flows/analyze-usage-trends';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface UsageChartDisplayProps {
  data: ChartDataItem[];
  period: Period;
  allApiKeys: StoredApiKey[]; // Use StoredApiKey as it's the full type from data source
  selectedChartApiKeyId: string | null;
}

type ChartType = 'bar' | 'line';

// Colors will be derived from CSS variables in globals.css
const getChartColors = () => [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export function UsageChartDisplay({ data, period, allApiKeys, selectedChartApiKeyId }: UsageChartDisplayProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const { toast } = useToast();
  const chartColors = getChartColors();


  const activeApiKeysToDisplay = useMemo(() => {
    const keysWithDataInCurrentPeriod = new Set<string>();
    if (data.length > 0) {
        data.forEach(dataItem => {
            Object.keys(dataItem).forEach(key => {
                if (key !== 'name' && typeof dataItem[key] === 'number' && dataItem[key] > 0) {
                    // Find the API key object by name
                    const apiKey = allApiKeys.find(k => k.name === key);
                    if(apiKey) keysWithDataInCurrentPeriod.add(apiKey.id);
                }
            });
        });
    }

    if (selectedChartApiKeyId) {
      return allApiKeys.filter(key => key.id === selectedChartApiKeyId && keysWithDataInCurrentPeriod.has(key.id));
    }
    // For "All Keys", show keys that are present in `allApiKeys` AND have data in the current period.
    return allApiKeys.filter(apiKey => keysWithDataInCurrentPeriod.has(apiKey.id));
  }, [selectedChartApiKeyId, allApiKeys, data]);


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
    <div className="bg-card text-card-foreground rounded-lg pt-2">
      {/* Chart Title and Type Selector moved outside CardContent for better layout consistency */}
       <div className="px-4 pb-3 flex justify-between items-center">
        <h3 className="text-md font-semibold text-card-foreground">{capitalizedPeriod} Token Usage</h3>
         <Select value={chartType} onValueChange={(value: string) => setChartType(value as ChartType)}>
            <SelectTrigger className="w-[150px] text-xs h-8">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar" className="text-xs"><BarChart className="inline-block mr-1.5 h-3.5 w-3.5" />Bar Chart</SelectItem>
              <SelectItem value="line" className="text-xs"><LineChart className="inline-block mr-1.5 h-3.5 w-3.5" />Line Chart</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <Separator className="mb-4" />

      <div className="px-1"> {/* Reduced horizontal padding for chart content specifically */}
        {(data.length === 0 || activeApiKeysToDisplay.length === 0) && !selectedChartApiKeyId && (data.some(d => Object.keys(d).length > 1)) ? (
          // Special case: "All Keys" selected, data exists, but no *specific* key has data (e.g. all values are 0 for all keys over period)
          // This case might be rare if aggregateTokenData filters out keys with no data.
          // Let's refine the condition to be more about `activeApiKeysToDisplay`
           <div className="flex flex-col items-center justify-center h-64 text-muted-foreground py-6 px-4 text-center">
            <Info className="w-10 h-10 mb-3 text-muted-foreground opacity-70" />
            <p className="text-sm">No significant token usage data for the selected API keys in this period.</p>
            <p className="text-xs mt-1">Try a different period or ensure token entries are logged.</p>
          </div>
        ) : (data.length === 0 || activeApiKeysToDisplay.length === 0) ? (
           <div className="flex flex-col items-center justify-center h-64 text-muted-foreground py-6 px-4 text-center">
            <Info className="w-10 h-10 mb-3 text-muted-foreground opacity-70" />
            <p className="text-sm">No token usage data for this period or selection.</p>
            <p className="text-xs mt-1">Add token entries or select an API key with data.</p>
          </div>
        ) : (
          <>
            <div className="h-72"> {/* Adjusted height */}
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}> {/* Adjusted margins */}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
                    dx={-5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--popover-foreground))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', paddingBottom: '5px' }} iconSize={10} />
                  {activeApiKeysToDisplay.map((apiKey, index) => {
                    const color = `hsl(${chartColors[index % chartColors.length]})`;
                    if (chartType === 'bar') {
                      return <Bar key={apiKey.id} dataKey={apiKey.name} fill={color} radius={[3, 3, 0, 0]} barSize={selectedChartApiKeyId ? 18 : Math.max(8, 30 / activeApiKeysToDisplay.length)} />;
                    }
                    return <Line key={apiKey.id} type="monotone" dataKey={apiKey.name} stroke={color} strokeWidth={2} dot={{ r: 2.5, fill: color, strokeWidth:1, stroke: 'hsl(var(--card))' }} activeDot={{ r: 4, strokeWidth:1.5 }} />;
                  })}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
      
      {(data.length > 0 && activeApiKeysToDisplay.length > 0) && (
        <div className="px-4 pb-4 pt-3 mt-2 border-t border-border/60">
           <Button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="w-full text-xs h-9" variant="ghost">
            {isLoadingSummary ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            Analyze Usage with AI
          </Button>
          {aiSummary && (
            <Alert className="w-full bg-secondary/30 border-secondary/50 mt-3 text-xs p-3">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <AlertTitle className="font-semibold text-card-foreground text-xs mb-0.5">AI Usage Analysis</AlertTitle>
              <AlertDescription className="text-muted-foreground text-xs leading-snug">{aiSummary}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
