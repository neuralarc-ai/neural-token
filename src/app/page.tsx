
"use client";

import type { TokenEntry } from '@/types';
import { ApiKeyDialog } from '@/components/api-key-dialog';
import { TokenEntryDialog } from '@/components/token-entry-dialog';
import { UsageChartDisplay } from '@/components/usage-chart-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useLocalStorage from '@/hooks/use-local-storage';
import { aggregateTokenData, getTotalTokens } from '@/lib/date-utils';
import type { AppData, ChartDataItem, Period, StoredApiKey, DisplayApiKey as AppDisplayApiKey } from '@/types';
import { KeyRound, Pencil, PlusCircle, Trash2, History, MoreVertical, BotMessageSquare, Settings2, TrendingUp, LayoutDashboard, ChevronRight, Palette, Info, Edit3, Home, BarChart3, List } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const navProviders = [
  { name: "Home", icon: Home, filterKeywords: [] },
  { name: "OpenAI", icon: BotMessageSquare, filterKeywords: ["openai", "gpt"] },
  { name: "Gemini", icon: BotMessageSquare, filterKeywords: ["gemini", "google"] },
  { name: "Claude", icon: BotMessageSquare, filterKeywords: ["claude", "anthropic"] },
  { name: "Deepseek", icon: BotMessageSquare, filterKeywords: ["deepseek"] },
  { name: "Grok", icon: BotMessageSquare, filterKeywords: ["grok", "xai"] },
];

export default function TokenTermPage() {
  const [data, setData] = useLocalStorage<AppData>('tokenTermData', { apiKeys: [], tokenEntries: [] });
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isTokenEntryDialogOpen, setIsTokenEntryDialogOpen] = useState(false);
  const [selectedApiKeyForDialog, setSelectedApiKeyForDialog] = useState<StoredApiKey | null>(null);
  const [editingApiKey, setEditingApiKey] = useState<StoredApiKey | undefined>(undefined);
  
  const [activeProvider, setActiveProvider] = useState<string>("Home");
  const [selectedChartApiKeyId, setSelectedChartApiKeyId] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<Period>('daily');

  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setSelectedChartApiKeyId(null); // Reset chart key selection when provider changes
  }, [activeProvider]);

  const handleSaveApiKey = (apiKey: StoredApiKey) => {
    setData(prevData => {
      const existingIndex = prevData.apiKeys.findIndex(k => k.id === apiKey.id);
      if (existingIndex > -1) {
        const updatedKeys = [...prevData.apiKeys];
        updatedKeys[existingIndex] = apiKey;
        return { ...prevData, apiKeys: updatedKeys };
      }
      return { ...prevData, apiKeys: [...prevData.apiKeys, apiKey] };
    });
    setIsApiKeyDialogOpen(false);
    setEditingApiKey(undefined);
  };

  const handleDeleteApiKey = (apiKeyId: string) => {
    setData(prevData => ({
      ...prevData,
      apiKeys: prevData.apiKeys.filter(k => k.id !== apiKeyId),
      tokenEntries: prevData.tokenEntries.filter(entry => entry.apiKeyId !== apiKeyId),
    }));
    if (selectedChartApiKeyId === apiKeyId) {
      setSelectedChartApiKeyId(null);
    }
    toast({ title: "API Key Deleted", description: "The API key and its associated token entries have been removed.", variant: "destructive" });
  };

  const handleSaveTokenEntry = (tokenEntry: TokenEntry) => {
    setData(prevData => {
      const existingEntryIndex = prevData.tokenEntries.findIndex(
        entry => entry.apiKeyId === tokenEntry.apiKeyId && entry.date === tokenEntry.date
      );
      
      if (existingEntryIndex > -1) {
        const updatedEntries = [...prevData.tokenEntries];
        updatedEntries[existingEntryIndex] = {
          ...updatedEntries[existingEntryIndex],
          tokens: updatedEntries[existingEntryIndex].tokens + tokenEntry.tokens,
        };
        return { ...prevData, tokenEntries: updatedEntries };
      }
      return { ...prevData, tokenEntries: [...prevData.tokenEntries, tokenEntry] };
    });
    setIsTokenEntryDialogOpen(false);
  };
  
  const openTokenEntryDialog = (apiKey: StoredApiKey) => {
    setSelectedApiKeyForDialog(apiKey);
    setIsTokenEntryDialogOpen(true);
  };

  const filteredApiKeys = useMemo(() => {
    if (activeProvider === "Home") {
      return data.apiKeys;
    }
    const providerConfig = navProviders.find(p => p.name === activeProvider);
    if (!providerConfig) return [];
    return data.apiKeys.filter(apiKey => 
      providerConfig.filterKeywords.some(keyword => 
        apiKey.name.toLowerCase().includes(keyword) || apiKey.model.toLowerCase().includes(keyword)
      )
    );
  }, [data.apiKeys, activeProvider]);

  const displayApiKeysForList: AppDisplayApiKey[] = filteredApiKeys.map(({ fullKey, ...rest }) => rest);

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (!isClient) return [];
    const keysForChartAggregation = activeProvider === "Home" ? data.apiKeys : filteredApiKeys;
    return aggregateTokenData(data.tokenEntries, keysForChartAggregation, selectedChartApiKeyId, currentPeriod);
  }, [data.tokenEntries, data.apiKeys, filteredApiKeys, activeProvider, selectedChartApiKeyId, currentPeriod, isClient]);

  const totalTokensThisPeriod = useMemo<number>(() => {
    if (!isClient) return 0;
    const entriesForTotal = activeProvider === "Home" 
      ? data.tokenEntries 
      : data.tokenEntries.filter(entry => filteredApiKeys.some(key => key.id === entry.apiKeyId));
    
    const relevantApiKeyIdForTotal = selectedChartApiKeyId;

    return getTotalTokens(entriesForTotal, relevantApiKeyIdForTotal, currentPeriod);
  }, [data.tokenEntries, filteredApiKeys, activeProvider, selectedChartApiKeyId, currentPeriod, isClient]);
  
  const currentViewTitle = activeProvider === "Home" ? "Overall Dashboard" : `${activeProvider} Usage`;
  const addKeyButtonText = activeProvider === "Home" ? "Add New API Key" : `Add New ${activeProvider} Key`;

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page-background">
        <KeyRound className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-body antialiased p-4 sm:p-6 md:p-8 bg-page-background">
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-0 max-w-screen-2xl mx-auto bg-background border-2 border-black shadow-neo rounded-2xl overflow-hidden">
        
        <aside className="lg:col-span-3 bg-card p-6 flex flex-col space-y-6 border-r-2 border-black">
          <div className="flex items-center gap-3 border-b-2 border-black pb-4">
            <KeyRound className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-bold text-foreground">
              TokenTerm
            </h1>
          </div>

          <nav className="flex-grow flex flex-col space-y-2 overflow-hidden">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">Providers</h2>
            {navProviders.map((provider) => (
              <Button
                key={provider.name}
                variant={activeProvider === provider.name ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm h-10 px-3 py-2 rounded-md border-2 border-transparent font-semibold",
                  activeProvider === provider.name 
                    ? "bg-primary text-primary-foreground shadow-neo-sm border-black" 
                    : "text-foreground hover:bg-secondary/50 hover:shadow-neo-sm hover:border-black active:shadow-none",
                  "active:shadow-none"
                )}
                onClick={() => setActiveProvider(provider.name)}
              >
                <provider.icon className="mr-2.5 h-5 w-5" /> {provider.name}
              </Button>
            ))}
          </nav>
          <div className="mt-auto pt-4 border-t-2 border-black">
             <Button variant="outline" className="w-full border-2 border-black shadow-neo-sm hover:shadow-neo active:shadow-none font-semibold">
                <Settings2 className="mr-2 h-5 w-5"/> Settings
             </Button>
          </div>
        </aside>

        <main className="lg:col-span-9 p-6 sm:p-8 bg-page-background overflow-y-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-4xl font-bold text-foreground font-headline">{currentViewTitle}</h2>
                <p className="text-muted-foreground mt-1 text-md">Track your token consumption patterns.</p>
            </div>
            <Button
                onClick={() => { setEditingApiKey(undefined); setIsApiKeyDialogOpen(true); }}
                className="text-md border-2 border-black shadow-neo hover:shadow-neo-sm active:shadow-none font-semibold whitespace-nowrap"
                size="lg"
                variant="default"
            >
                <PlusCircle className="mr-2 h-5 w-5" /> {addKeyButtonText}
            </Button>
          </div>
          
          {data.apiKeys.length === 0 && activeProvider === "Home" ? (
             <Card className="mb-8 h-auto flex flex-col justify-center items-center text-center p-8 bg-card border-2 border-black shadow-neo rounded-xl">
                <LayoutDashboard className="h-16 w-16 mb-6 text-primary opacity-70" />
                <CardTitle className="text-xl font-semibold mb-2">Welcome to TokenTerm!</CardTitle>
                <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
                  Start by adding an API key using the button above. Once added, log consumption and visualize your token usage.
                </CardDescription>
            </Card>
          ) : filteredApiKeys.length === 0 && activeProvider !== "Home" ? (
            <Card className="mb-8 bg-card border-2 border-black shadow-neo rounded-xl p-6 text-center">
                 <BotMessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-60 mb-3" />
                <p className="text-md font-semibold text-foreground mb-1">No {activeProvider} API keys yet.</p>
                <p className="text-sm text-muted-foreground">Click "{addKeyButtonText}" to add one.</p>
            </Card>
          ) : displayApiKeysForList.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center"><List className="mr-2 h-5 w-5 text-primary"/>API Keys</h3>
              <ScrollArea className="h-auto max-h-[300px] -mx-1 pr-1"> 
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-1">
                  {displayApiKeysForList.map(apiKey => {
                    const fullKeyData = data.apiKeys.find(k => k.id === apiKey.id);
                    return (
                      <div key={apiKey.id} className="group bg-card border-2 border-black shadow-neo-sm rounded-lg p-4 transition-all hover:shadow-neo flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-grow">
                              <h4 className="font-semibold text-md text-foreground">{apiKey.name}</h4>
                              <p className="text-xs text-muted-foreground">{apiKey.model}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Key: ...{apiKey.keyFragment.slice(-4)}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0 text-muted-foreground hover:text-primary border border-transparent hover:border-black hover:shadow-neo-sm active:shadow-none">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">More options for {apiKey.name}</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-sm border-2 border-black shadow-neo bg-card rounded-md">
                                <DropdownMenuItem className="text-sm cursor-pointer focus:bg-primary focus:text-primary-foreground" onClick={() => {
                                  if (fullKeyData) {
                                    setEditingApiKey(fullKeyData);
                                    setIsApiKeyDialogOpen(true);
                                  }
                                }}>
                                  <Edit3 className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteApiKey(apiKey.id)} 
                                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground text-sm cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-sm border-2 border-black shadow-neo-sm hover:shadow-neo active:shadow-none font-medium bg-secondary hover:bg-secondary/80 mt-3"
                          onClick={() => fullKeyData && openTokenEntryDialog(fullKeyData)}
                        >
                          <History className="mr-1.5 h-4 w-4" /> Log Token Usage
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : null}
          
            <Card className="bg-card border-2 border-black shadow-neo rounded-xl overflow-hidden">
              <CardHeader className="pb-4 border-b-2 border-black">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2 font-bold">
                           <BarChart3 className="h-6 w-6 text-primary"/>
                           Usage Overview
                        </CardTitle>
                        <CardDescription className="text-sm mt-1 text-muted-foreground">Visualize token usage for {activeProvider === "Home" ? "all keys" : activeProvider}.</CardDescription>
                    </div>
                    <Select 
                        value={selectedChartApiKeyId || "all"}
                        onValueChange={(value) => setSelectedChartApiKeyId(value === "all" ? null : value)}
                        disabled={activeProvider !== "Home" && filteredApiKeys.length <=1 && filteredApiKeys.length > 0}
                    >
                        <SelectTrigger className="w-full sm:w-[220px] text-sm h-11 rounded-md border-2 border-black shadow-neo-sm font-medium">
                          <SelectValue placeholder="Select API Key" />
                        </SelectTrigger>
                        <SelectContent className="text-sm border-2 border-black shadow-neo bg-card rounded-md">
                          <SelectItem value="all" className="text-sm cursor-pointer focus:bg-primary focus:text-primary-foreground">
                            {activeProvider === "Home" ? "All API Keys" : `All ${activeProvider} Keys`}
                          </SelectItem>
                          { (activeProvider === "Home" ? data.apiKeys : filteredApiKeys).map(apiKey => (
                              <SelectItem key={apiKey.id} value={apiKey.id} className="text-sm cursor-pointer focus:bg-primary focus:text-primary-foreground">{apiKey.name}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-4 sm:p-6">
                <Tabs value={currentPeriod} onValueChange={(value) => setCurrentPeriod(value as Period)} className="w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-baseline mb-6 gap-4">
                    <TabsList className="bg-secondary border-2 border-black shadow-neo-sm rounded-lg p-1 py-2 h-fit">
                      <TabsTrigger value="daily" className="text-sm px-4 py-1.5 h-auto rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neo-sm data-[state=active]:border-transparent font-medium">Daily</TabsTrigger>
                      <TabsTrigger value="weekly" className="text-sm px-4 py-1.5 h-auto rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neo-sm data-[state=active]:border-transparent font-medium">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-sm px-4 py-1.5 h-auto rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neo-sm data-[state=active]:border-transparent font-medium">Monthly</TabsTrigger>
                    </TabsList>
                    <Badge variant="outline" className="px-4 py-2 text-sm font-semibold text-foreground border-2 border-black shadow-neo-sm bg-card rounded-md">
                      Total ({currentPeriod}): {totalTokensThisPeriod.toLocaleString()} tokens
                    </Badge>
                  </div>
                  
                  <div className="mt-0 rounded-lg border-2 border-black shadow-neo bg-card p-2">
                    <UsageChartDisplay 
                      data={chartData} 
                      period={currentPeriod}
                      allApiKeys={activeProvider === "Home" ? data.apiKeys : filteredApiKeys} 
                      selectedChartApiKeyId={selectedChartApiKeyId}
                      activeProvider={activeProvider}
                    />
                  </div>
                </Tabs>
              </CardContent>
            </Card>
        </main>
      </div>

      {isApiKeyDialogOpen && (
        <ApiKeyDialog
          isOpen={isApiKeyDialogOpen}
          onClose={() => { setIsApiKeyDialogOpen(false); setEditingApiKey(undefined); }}
          onSave={handleSaveApiKey}
          existingApiKey={editingApiKey}
          defaultProvider={activeProvider !== "Home" ? activeProvider : undefined}
        />
      )}
      {isTokenEntryDialogOpen && selectedApiKeyForDialog && (
        <TokenEntryDialog
          isOpen={isTokenEntryDialogOpen}
          onClose={() => setIsTokenEntryDialogOpen(false)}
          onSave={handleSaveTokenEntry}
          apiKey={selectedApiKeyForDialog}
        />
      )}
    </div>
  );
}
