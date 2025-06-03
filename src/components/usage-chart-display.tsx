
"use client";

import type { ChartDataItem, Period, StoredApiKey } from '@/types';
import { BarChart, Brain, Info, LineChart, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Bar, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Legend } from 'recharts';
import { analyzeUsageTrends } from '@/ai/flows/analyze-usage-trends';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface UsageChartDisplayProps {
  data: ChartDataItem[];
  period: Period;
  allApiKeys: StoredApiKey[];
  selectedChartApiKeyId: string | null;
}

type ChartType = 'bar' | 'line';

const getChartColors = () => [
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
  const chartColors = getChartColors();


  const activeApiKeysToDisplay = useMemo(() => {
    const keysWithDataInCurrentPeriod = new Set<string>();
    if (data.length > 0) {
        data.forEach(dataItem => {
            Object.keys(dataItem).forEach(key => {
                if (key !== 'name' && typeof dataItem[key] === 'number' && (dataItem[key] as number) > 0) {
                    const apiKey = allApiKeys.find(k => k.name === key);
                    if(apiKey) keysWithDataInCurrentPeriod.add(apiKey.id);
                }
            });
        });
    }

    if (selectedChartApiKeyId) {
      return allApiKeys.filter(key => key.id === selectedChartApiKeyId && keysWithDataInCurrentPeriod.has(key.id));
    }
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
    <div className="bg-card text-card-foreground rounded-lg pt-0">
       <div className="px-4 py-3 flex justify-between items-center border-b border-border/30">
        <h3 className="text-md font-semibold text-card-foreground">{capitalizedPeriod} Token Usage</h3>
         <Select value={chartType} onValueChange={(value: string) => setChartType(value as ChartType)}>
            <SelectTrigger className="w-[150px] text-xs h-8 rounded-md">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent className="rounded-md">
              <SelectItem value="bar" className="text-xs"><BarChart className="inline-block mr-1.5 h-3.5 w-3.5" />Bar Chart</SelectItem>
              <SelectItem value="line" className="text-xs"><LineChart className="inline-block mr-1.5 h-3.5 w-3.5" />Line Chart</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <div className="p-4">
        {(data.length === 0 || activeApiKeysToDisplay.length === 0) ? (
           <div className="flex flex-col items-center justify-center h-72 text-muted-foreground py-6 px-4 text-center">
            <Info className="w-12 h-12 mb-4 text-muted-foreground opacity-60" />
            <p className="text-md font-medium">No Data Available</p>
            <p className="text-sm text-muted-foreground mt-1">
              No token usage data for this period or selection. <br/> Add token entries or select an API key with data.
            </p>
          </div>
        ) : (
          <>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={{stroke: 'hsl(var(--border))', opacity: 0.8}}
                    dy={10}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={{stroke: 'hsl(var(--border))', opacity: 0.8}}
                    tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
                    dx={-5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--popover-foreground))',
                      borderRadius: 'var(--radius)',
                      boxShadow: 'var(--shadow-lg)',
                      fontSize: '12px',
                      padding: '10px 14px',
                    }}
                    cursor={{ fill: 'hsl(var(--primary))', fillOpacity: 0.1 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} iconSize={10} />
                  {activeApiKeysToDisplay.map((apiKey, index) => {
                    const color = chartColors[index % chartColors.length];
                    if (chartType === 'bar') {
                      return <Bar key={apiKey.id} dataKey={apiKey.name} fill={color} radius={[5, 5, 0, 0]} barSize={selectedChartApiKeyId ? 20 : Math.max(10, 35 / activeApiKeysToDisplay.length)} />;
                    }
                    return <Line key={apiKey.id} type="monotone" dataKey={apiKey.name} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth:1, stroke: 'hsl(var(--card))' }} activeDot={{ r: 5, strokeWidth:2 }} />;
                  })}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
      
      {(data.length > 0 && activeApiKeysToDisplay.length > 0) && (
        <div className="px-4 pb-4 pt-3 mt-2 border-t border-border/30">
           <Button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="w-full text-sm h-10 rounded-md" variant="ghost">
            {isLoadingSummary ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            Analyze Usage with AI
          </Button>
          {aiSummary && (
            <Alert className="w-full bg-secondary/70 border-secondary mt-4 text-sm p-4 rounded-lg">
              <Brain className="h-4 w-4 text-primary" />
              <AlertTitle className="font-semibold text-card-foreground text-sm mb-1">AI Usage Analysis</AlertTitle>
              <AlertDescription className="text-muted-foreground text-sm leading-relaxed">{aiSummary}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
