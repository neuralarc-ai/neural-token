
"use client";

import { ApiKeyDialog } from '@/components/api-key-dialog';
import { TokenEntryDialog } from '@/components/token-entry-dialog';
import { UsageChartDisplay } from '@/components/usage-chart-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useLocalStorage from '@/hooks/use-local-storage';
import { aggregateTokenData, getTotalTokens } from '@/lib/date-utils';
import type { AppData, ChartDataItem, Period, StoredApiKey, DisplayApiKey as AppDisplayApiKey } from '@/types';
import { format } from 'date-fns';
import { KeyRound, Pencil, PlusCircle, Trash2, History, MoreVertical, BotMessageSquare, Settings2, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';

// Renaming DisplayApiKey to avoid conflict if StoredApiKey is also in scope.
// It seems DisplayApiKey was already used as a type, so I'll use AppDisplayApiKey locally for clarity.

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <KeyRound className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body antialiased">
      <header className="p-4 md:px-8 pt-6 md:pt-8 mb-6 border-b border-border/60 bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <KeyRound className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-headline font-semibold text-foreground">
            TokenTerm
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Effortlessly manage and track your AI model token usage.</p>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:px-8">
        {/* API Key Management - adjusted to lg:col-span-4 for a typical dashboard sidebar feel */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <Card className="flex-grow flex flex-col shadow-card rounded-lg bg-card">
            <CardHeader className="border-b border-border/60">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" />
                    API Key Management
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">Add, edit, or log usage for your API keys.</CardDescription>
                </div>
                 <Button
                  size="sm"
                  onClick={() => { setEditingApiKey(undefined); setIsApiKeyDialogOpen(true); }}
                  className="shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Key
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-4">
              {displayApiKeys.length === 0 ? (
                 <div className="text-center py-8">
                    <BotMessageSquare className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <p className="text-sm text-muted-foreground mb-1">No API keys yet.</p>
                    <p className="text-xs text-muted-foreground">Click "Add Key" to get started.</p>
                 </div>
              ) : (
                <ScrollArea className="flex-grow -mx-2">
                  <div className="space-y-3 px-2">
                    {displayApiKeys.map(apiKey => {
                      const fullKeyData = data.apiKeys.find(k => k.id === apiKey.id);
                      return (
                        <Card key={apiKey.id} className="shadow-sm hover:shadow-md transition-shadow bg-background/30 rounded-md overflow-hidden border-border/80">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-grow">
                                <h4 className="font-semibold text-sm text-card-foreground">{apiKey.name}</h4>
                                <p className="text-xs text-muted-foreground">{apiKey.model}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Key: ...{apiKey.keyFragment.slice(-4)}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0 text-muted-foreground hover:text-foreground">
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
                                className="w-full mt-3 text-xs"
                                onClick={() => fullKeyData && openTokenEntryDialog(fullKeyData)}
                              >
                                <History className="mr-1.5 h-3.5 w-3.5" /> Log Token Usage
                              </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Usage Dashboard - adjusted to lg:col-span-8 */}
        <section className="lg:col-span-8 flex flex-col gap-6">
           {data.apiKeys.length === 0 ? (
             <Card className="h-full flex flex-col justify-center items-center text-center shadow-card rounded-lg p-8 bg-card">
                <TrendingUp className="h-16 w-16 mb-6 text-primary opacity-70" />
                <CardTitle className="text-xl font-semibold mb-2">Welcome to TokenTerm!</CardTitle>
                <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
                  Start by adding an API key using the panel on the left. Once added, you can log daily consumption and visualize your token usage patterns here.
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
            <Card className="flex-grow flex flex-col shadow-card rounded-lg overflow-hidden bg-card">
              <CardHeader className="pb-4 border-b border-border/60">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                           <TrendingUp className="h-5 w-5 text-primary"/>
                           Usage Dashboard
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">Track your token consumption patterns.</CardDescription>
                    </div>
                    <Select 
                        value={selectedChartApiKeyId || "all"}
                        onValueChange={(value) => setSelectedChartApiKeyId(value === "all" ? null : value)}
                    >
                        <SelectTrigger className="w-full sm:w-[200px] text-xs h-9">
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
              <CardContent className="flex-grow p-4">
                <Tabs value={currentPeriod} onValueChange={(value) => setCurrentPeriod(value as Period)} className="w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-baseline mb-4 gap-2">
                    <TabsList className="bg-secondary">
                      <TabsTrigger value="daily" className="text-xs px-3 py-1.5 h-auto">Daily</TabsTrigger>
                      <TabsTrigger value="weekly" className="text-xs px-3 py-1.5 h-auto">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-xs px-3 py-1.5 h-auto">Monthly</TabsTrigger>
                    </TabsList>
                    <Badge variant="outline" className="px-2.5 py-1 text-xs font-medium text-foreground border-border/80 bg-transparent">
                      Total ({currentPeriod}): {totalTokensThisPeriod.toLocaleString()} tokens
                    </Badge>
                  </div>
                  
                  <TabsContent value="daily" className="mt-0">
                    <UsageChartDisplay 
                      data={chartData} 
                      period="daily" 
                      allApiKeys={data.apiKeys} 
                      selectedChartApiKeyId={selectedChartApiKeyId} 
                    />
                  </TabsContent>
                  <TabsContent value="weekly" className="mt-0">
                    <UsageChartDisplay 
                      data={chartData} 
                      period="weekly" 
                      allApiKeys={data.apiKeys} 
                      selectedChartApiKeyId={selectedChartApiKeyId} 
                    />
                  </TabsContent>
                  <TabsContent value="monthly" className="mt-0">
                    <UsageChartDisplay 
                      data={chartData} 
                      period="monthly" 
                      allApiKeys={data.apiKeys} 
                      selectedChartApiKeyId={selectedChartApiKeyId} 
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
           )}
        </section>
      </main>

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
      <footer className="text-center mt-10 py-5 border-t border-border/60 text-xs text-muted-foreground">
        TokenTerm &copy; {new Date().getFullYear()}. Inspired by modern dashboard designs.
      </footer>
    </div>
  );
}
