
"use client";

import { ApiKeyDialog } from '@/components/api-key-dialog';
import { TokenEntryDialog } from '@/components/token-entry-dialog';
import { UsageChartDisplay } from '@/components/usage-chart-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useLocalStorage from '@/hooks/use-local-storage';
import { aggregateTokenData, getTotalTokens } from '@/lib/date-utils';
import type { AppData, ChartDataItem, Period, StoredApiKey, DisplayApiKey as AppDisplayApiKey } from '@/types';
import { KeyRound, Pencil, PlusCircle, Trash2, History, MoreVertical, BotMessageSquare, Settings2, TrendingUp, LayoutDashboard, ChevronRight } from 'lucide-react';
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

export default function TokenTermPage() {
  const [data, setData] = useLocalStorage<AppData>('tokenTermData', { apiKeys: [], tokenEntries: [] });
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isTokenEntryDialogOpen, setIsTokenEntryDialogOpen] = useState(false);
  const [selectedApiKeyForDialog, setSelectedApiKeyForDialog] = useState<StoredApiKey | null>(null);
  const [editingApiKey, setEditingApiKey] = useState<StoredApiKey | undefined>(undefined);
  
  const [selectedChartApiKeyId, setSelectedChartApiKeyId] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<Period>('daily');

  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const displayApiKeys: AppDisplayApiKey[] = data.apiKeys.map(({ fullKey, ...rest }) => rest);

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (!isClient) return [];
    return aggregateTokenData(data.tokenEntries, data.apiKeys, selectedChartApiKeyId, currentPeriod);
  }, [data.tokenEntries, data.apiKeys, selectedChartApiKeyId, currentPeriod, isClient]);

  const totalTokensThisPeriod = useMemo<number>(() => {
    if (!isClient) return 0;
    return getTotalTokens(data.tokenEntries, selectedChartApiKeyId, currentPeriod);
  }, [data.tokenEntries, selectedChartApiKeyId, currentPeriod, isClient]);
  
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page-background">
        <KeyRound className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-body antialiased p-4 sm:p-6 md:p-8 bg-page-background">
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-screen-2xl mx-auto bg-background rounded-2xl shadow-xl overflow-hidden">
        {/* Sidebar / API Key Management */}
        <aside className="lg:col-span-3 bg-card p-6 flex flex-col space-y-6 border-r border-border/50">
          <div className="flex items-center gap-3">
            <KeyRound className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-headline font-semibold text-foreground">
              TokenTerm
            </h1>
          </div>

          <nav className="flex-grow space-y-4">
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">API Keys</h2>
              <Button
                onClick={() => { setEditingApiKey(undefined); setIsApiKeyDialogOpen(true); }}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Key
              </Button>
            </div>

            {displayApiKeys.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-lg mt-4">
                  <BotMessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-60 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">No API keys yet.</p>
                  <p className="text-xs text-muted-foreground">Click "Add New Key" to start.</p>
              </div>
            ) : (
              <ScrollArea className="flex-grow -mx-2 pr-2 h-[calc(100vh-280px)]"> {/* Adjust height as needed */}
                <div className="space-y-2 px-2">
                  {displayApiKeys.map(apiKey => {
                    const fullKeyData = data.apiKeys.find(k => k.id === apiKey.id);
                    return (
                      <div key={apiKey.id} className="group bg-secondary/50 hover:bg-sidebar-accent rounded-lg p-3 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-grow">
                            <h4 className="font-medium text-sm text-foreground group-hover:text-sidebar-accent-foreground">{apiKey.name}</h4>
                            <p className="text-xs text-muted-foreground group-hover:text-sidebar-accent-foreground/80">{apiKey.model}</p>
                            <p className="text-xs text-muted-foreground group-hover:text-sidebar-accent-foreground/80 mt-0.5">Key: ...{apiKey.keyFragment.slice(-4)}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0 text-muted-foreground hover:text-primary group-hover:text-sidebar-accent-foreground">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More options for {apiKey.name}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem className="text-xs" onClick={() => {
                                if (fullKeyData) {
                                  setEditingApiKey(fullKeyData);
                                  setIsApiKeyDialogOpen(true);
                                }
                              }}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteApiKey(apiKey.id)} 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 text-xs"
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground group-hover:border-sidebar-primary group-hover:bg-sidebar-primary group-hover:text-sidebar-primary-foreground"
                          onClick={() => fullKeyData && openTokenEntryDialog(fullKeyData)}
                        >
                          <History className="mr-1.5 h-3.5 w-3.5" /> Log Token Usage
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </nav>
          {/* Placeholder for potential future sidebar items like "Settings", "Help" */}
        </aside>

        {/* Main Content / Usage Dashboard */}
        <main className="lg:col-span-9 p-6 sm:p-8 bg-secondary/30 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground mt-1">Track your token consumption patterns with ease.</p>
          </div>
          
          {data.apiKeys.length === 0 ? (
            <Card className="h-full flex flex-col justify-center items-center text-center shadow-card rounded-xl p-8 bg-card">
                <LayoutDashboard className="h-16 w-16 mb-6 text-primary opacity-70" />
                <CardTitle className="text-xl font-semibold mb-2">Welcome to TokenTerm!</CardTitle>
                <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
                  Start by adding an API key using the panel on the left. Once added, you can log consumption and visualize your token usage patterns here.
                </CardDescription>
                <Button
                    onClick={() => { setEditingApiKey(undefined); setIsApiKeyDialogOpen(true); }}
                    className="mt-8 text-sm"
                    size="default"
                >
                    <PlusCircle className="mr-2 h-5 w-5" /> Add Your First API Key
                </Button>
            </Card>
          ) : (
            <Card className="shadow-card rounded-xl overflow-hidden bg-card">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                           <TrendingUp className="h-5 w-5 text-primary"/>
                           Usage Overview
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">Visualize token usage across your keys and periods.</CardDescription>
                    </div>
                    <Select 
                        value={selectedChartApiKeyId || "all"}
                        onValueChange={(value) => setSelectedChartApiKeyId(value === "all" ? null : value)}
                    >
                        <SelectTrigger className="w-full sm:w-[200px] text-xs h-9 rounded-md">
                          <SelectValue placeholder="Select API Key" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">All API Keys</SelectItem>
                          {displayApiKeys.map(apiKey => (
                              <SelectItem key={apiKey.id} value={apiKey.id} className="text-xs">{apiKey.name}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-4 sm:p-6">
                <Tabs value={currentPeriod} onValueChange={(value) => setCurrentPeriod(value as Period)} className="w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-baseline mb-4 gap-3">
                    <TabsList className="bg-secondary rounded-lg">
                      <TabsTrigger value="daily" className="text-xs px-3 py-1.5 h-auto rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Daily</TabsTrigger>
                      <TabsTrigger value="weekly" className="text-xs px-3 py-1.5 h-auto rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-xs px-3 py-1.5 h-auto rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Monthly</TabsTrigger>
                    </TabsList>
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium text-foreground border-primary/50 bg-primary/10 rounded-md">
                      Total ({currentPeriod}): {totalTokensThisPeriod.toLocaleString()} tokens
                    </Badge>
                  </div>
                  
                  <div className="mt-0 rounded-lg ">
                    <UsageChartDisplay 
                      data={chartData} 
                      period={currentPeriod} // Pass currentPeriod directly
                      allApiKeys={data.apiKeys} 
                      selectedChartApiKeyId={selectedChartApiKeyId} 
                    />
                  </div>
                </Tabs>
              </CardContent>
            </Card>
           )}
        </main>
      </div>

      {isApiKeyDialogOpen && (
        <ApiKeyDialog
          isOpen={isApiKeyDialogOpen}
          onClose={() => { setIsApiKeyDialogOpen(false); setEditingApiKey(undefined); }}
          onSave={handleSaveApiKey}
          existingApiKey={editingApiKey}
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
