
"use client";

import type { ChartDataItem, Period, StoredApiKey } from '@/types';
import { BarChart, Info, LineChart, Loader2 } from 'lucide-react'; // Removed Brain
import { useState, useMemo, useEffect } from 'react';
import { Bar, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ComposedChart, Legend } from 'recharts';
// Removed: import { analyzeUsageTrends } from '@/ai/flows/analyze-usage-trends';

// Removed: import { Button } from '@/components/ui/button'; (if only used for AI button)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Removed: import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; (if only used for AI summary)
// Removed: import { useToast } from '@/hooks/use-toast'; (if only used for AI summary)

interface UsageChartDisplayProps {
  data: ChartDataItem[];
  period: Period;
  seriesKeys: StoredApiKey[];
  selectedChartApiKeyId: string | null;
  activeProvider: string;
}

type ChartType = 'bar' | 'line';

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
    colorVars = [getColorValue('--primary')];
  } else {
    const config = providerColorConfigs.find(p => p.id === lowerProviderId || p.filterKeywords.some(kw => lowerProviderId.includes(kw)));
    const prefix = config ? config.chartColorVarPrefix : 'grok';
    
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
  // Removed: const [aiSummary, setAiSummary] = useState<string | null>(null);
  // Removed: const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  // Removed: const { toast } = useToast(); // Assuming toast was only for AI summary
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentViewPalette = useMemo(() => getProviderChartColors(activeProvider, isClient), [activeProvider, isClient]);
  
  const isHomeView = activeProvider === "Home";

  // Removed: handleGenerateSummary function

  const capitalizedPeriod = period.charAt(0).toUpperCase() + period.slice(1);

  if (!isClient) { 
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
                  {seriesKeys.map((series, index) => {
                    let colorToUse: string;

                    if (isHomeView) {
                      colorToUse = currentViewPalette[0] || 'hsl(var(--primary))';
                    } else {
                      colorToUse = currentViewPalette[index % currentViewPalette.length] || 'hsl(var(--primary))';
                    }
                    
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
      
      {/* Removed AI Summary Button and Display Section */}
    </div>
  );
}
