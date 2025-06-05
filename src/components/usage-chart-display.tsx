
"use client";

import type { ChartDataItem, Period, StoredApiKey } from '@/types';
import { BarChart, Brain, Info, LineChart, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Bar, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Legend } from 'recharts';
import { analyzeUsageTrends } from '@/ai/flows/analyze-usage-trends';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';

interface UsageChartDisplayProps {
  data: ChartDataItem[];
  period: Period;
  seriesKeys: StoredApiKey[]; // Renamed from allApiKeys to reflect its purpose
  selectedChartApiKeyId: string | null; // This is still used by parent to filter what `seriesKeys` are passed
  activeProvider: string; 
}

type ChartType = 'bar' | 'line';

// This config helps map provider names to color variables for the Home view.
const providerColorConfigs = [
  { id: "gemini", filterKeywords: ["gemini", "google"], homeColorIndex: 0, chartColorVarPrefix: 'gemini' },
  { id: "openai", filterKeywords: ["openai", "gpt"], homeColorIndex: 1, chartColorVarPrefix: 'openai' },
  { id: "claude", filterKeywords: ["claude", "anthropic"], homeColorIndex: 2, chartColorVarPrefix: 'claude' },
  { id: "deepseek", filterKeywords: ["deepseek"], homeColorIndex: 3, chartColorVarPrefix: 'deepseek' },
  { id: "grok", filterKeywords: ["grok", "xai"], homeColorIndex: 4, chartColorVarPrefix: 'grok' },
  { id: "unknown", filterKeywords: [], homeColorIndex: 4, chartColorVarPrefix: 'grok' }, // Fallback
];


const getProviderChartColors = (providerNameOrId: string, isClient: boolean): string[] => {
  if (!isClient) return ['hsl(var(--primary))']; // Default server-side

  const rootStyle = getComputedStyle(document.documentElement);
  const getColorValue = (varName: string) => rootStyle.getPropertyValue(varName).trim();
  
  const formatAsHslString = (hslValue: string) => {
    if (!hslValue || hslValue.includes('var(--primary))')) return 'hsl(var(--primary))';
    if (hslValue.startsWith('hsl(') && hslValue.endsWith(')')) return hslValue;
    return `hsl(${hslValue})`;
  };

  const lowerProviderId = providerNameOrId.toLowerCase();
  let colorVars: string[] = [];

  if (lowerProviderId === "home") {
    // For Home view's aggregated chart, use the primary app color.
    colorVars = [getColorValue('--primary')];
  } else {
    // For specific provider views, find their color prefix (e.g., 'gemini', 'openai')
    const config = providerColorConfigs.find(p => p.id === lowerProviderId || p.filterKeywords.some(kw => lowerProviderId.includes(kw)));
    const prefix = config ? config.chartColorVarPrefix : 'grok'; // Fallback prefix
    
    colorVars = [
      getColorValue(`--chart-${prefix}-1`),
      getColorValue(`--chart-${prefix}-2`),
      getColorValue(`--chart-${prefix}-3`),
    ];
  }
  
  return colorVars.map(formatAsHslString).filter(color => color !== 'hsl()' && color !== 'hsl(var(--primary))' && color !== 'hsl(var())' && color);
};


export function UsageChartDisplay({ data, period, seriesKeys, selectedChartApiKeyId, activeProvider }: UsageChartDisplayProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const { toast } = useToast();
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentViewPalette = useMemo(() => getProviderChartColors(activeProvider, isClient), [activeProvider, isClient]);
  
  const isHomeView = activeProvider === "Home";

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    setAiSummary(null);
    try {
      const chartDataString = JSON.stringify(data);
      const result = await analyzeUsageTrends({ 
        chartData: chartDataString,
        period: period,
        activeProvider: activeProvider
      });
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

  if (!isClient) { 
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Determine if there's any data to display in the chart based on seriesKeys and actual data points
  const hasChartData = data.length > 0 && seriesKeys.length > 0 && 
                       data.some(item => 
                         seriesKeys.some(key => 
                           item[key.name] !== undefined && (item[key.name] as number) > 0
                         )
                       );

  return (
    <div className="bg-card text-card-foreground rounded-lg pt-0">
       <div className="px-4 py-3 flex justify-between items-center border-b-2 border-black">
        <h3 className="text-md font-semibold text-card-foreground">{capitalizedPeriod} Token Usage</h3>
         <Select value={chartType} onValueChange={(value: string) => setChartType(value as ChartType)}>
            <SelectTrigger className="w-[160px] text-xs h-9 rounded-md border-2 border-black shadow-neo-sm font-medium">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent className="rounded-md border-2 border-black shadow-neo bg-card text-xs">
              <SelectItem value="bar" className="text-xs cursor-pointer focus:bg-primary focus:text-primary-foreground"><BarChart className="inline-block mr-1.5 h-3.5 w-3.5" />Bar Chart</SelectItem>
              <SelectItem value="line" className="text-xs cursor-pointer focus:bg-primary focus:text-primary-foreground"><LineChart className="inline-block mr-1.5 h-3.5 w-3.5" />Line Chart</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <div className="p-4">
        {!hasChartData ? (
           <div className="flex flex-col items-center justify-center h-72 text-muted-foreground py-6 px-4 text-center">
            <Info className="w-12 h-12 mb-4 text-muted-foreground opacity-60" />
            <p className="text-md font-medium">No Data Available</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isHomeView 
                ? "No token usage data has been logged yet." 
                : `No token usage data for this period or selection. Add token entries or select an API key with data.`
              }
            </p>
          </div>
        ) : (
          <>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
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
                      boxShadow: '2px 2px 0px hsl(var(--border))', 
                      borderWidth: '2px',
                      fontSize: '12px',
                      padding: '10px 14px',
                    }}
                    cursor={{ fill: 'hsl(var(--primary))', fillOpacity: 0.2 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} iconSize={10} />
                  {seriesKeys.map((series, index) => { // seriesKeys replaces activeApiKeysToDisplay
                    let colorToUse: string;

                    if (isHomeView) { // Home view uses the first color from its palette (primary app color)
                      colorToUse = currentViewPalette[0] || 'hsl(var(--primary))';
                    } else { // Provider-specific view: cycle through shades of THIS provider's palette
                      colorToUse = currentViewPalette[index % currentViewPalette.length] || 'hsl(var(--primary))';
                    }
                    
                    // series.name will be "Total Usage" for Home, or actual API key name for provider views
                    const dataKey = series.name; 

                    if (chartType === 'bar') {
                      return <Bar key={series.id} dataKey={dataKey} fill={colorToUse} radius={[4, 4, 0, 0]} barSize={isHomeView || seriesKeys.length === 1 ? 20 : Math.max(10, 35 / seriesKeys.length)} />;
                    }
                    return <Line key={series.id} type="monotone" dataKey={dataKey} stroke={colorToUse} strokeWidth={2.5} dot={{ r: 4, fill: colorToUse, strokeWidth:2, stroke: 'hsl(var(--background))' }} activeDot={{ r: 6, strokeWidth:2, stroke: 'hsl(var(--background))', fill: colorToUse }} />;
                  })}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
      
      {hasChartData && (
        <div className="px-4 pb-4 pt-3 mt-2 border-t-2 border-black">
           <Button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="w-full text-sm h-10 rounded-md border-2 border-black shadow-neo-sm hover:shadow-neo active:shadow-none font-semibold bg-secondary hover:bg-secondary/80" variant="outline">
            {isLoadingSummary ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            Analyze Usage with AI
          </Button>
          {aiSummary && (
            <Alert className="w-full bg-background border-2 border-black shadow-neo-sm mt-4 text-sm p-4 rounded-lg">
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

