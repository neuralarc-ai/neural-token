
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
import type { ApiKey as DisplayApiKey, AppData, ChartDataItem, Period, StoredApiKey, TokenEntry } from '@/types';
import { format } from 'date-fns';
import { KeyRound, Pencil, PlusCircle, Trash2, History, MoreVertical, BotMessageSquare } from 'lucide-react';
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

export default function TokenTermPage() {
  const [data, setData] = useLocalStorage<AppData>('tokenTermData', { apiKeys: [], tokenEntries: [] });
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isTokenEntryDialogOpen, setIsTokenEntryDialogOpen] = useState(false);
  const [selectedApiKeyForDialog, setSelectedApiKeyForDialog] = useState<StoredApiKey | null>(null);
  const [editingApiKey, setEditingApiKey] = useState<StoredApiKey | undefined>(undefined);
  
  const [selectedChartApiKeyId, setSelectedChartApiKeyId] = useState<string | null>(null); // null means "All Keys"
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
      setSelectedChartApiKeyId(null); // Reset to "All Keys" if the deleted key was selected
    }
    toast({ title: "API Key Deleted", description: "The API key and its associated token entries have been removed.", variant: "destructive" });
  };

  const handleSaveTokenEntry = (tokenEntry: TokenEntry) => {
    setData(prevData => {
      // Check if an entry for this apiKeyId and date already exists
      const existingEntryIndex = prevData.tokenEntries.findIndex(
        entry => entry.apiKeyId === tokenEntry.apiKeyId && entry.date === tokenEntry.date
      );
      
      if (existingEntryIndex > -1) {
        // Update existing entry: add new tokens to existing tokens
        const updatedEntries = [...prevData.tokenEntries];
        updatedEntries[existingEntryIndex] = {
          ...updatedEntries[existingEntryIndex],
          tokens: updatedEntries[existingEntryIndex].tokens + tokenEntry.tokens, // Summing up tokens
          // createdAt will remain from the first entry of the day
        };
        return { ...prevData, tokenEntries: updatedEntries };
      }
      // Add as new entry
      return { ...prevData, tokenEntries: [...prevData.tokenEntries, tokenEntry] };
    });
    setIsTokenEntryDialogOpen(false);
  };
  
  const openTokenEntryDialog = (apiKey: StoredApiKey) => {
    setSelectedApiKeyForDialog(apiKey);
    setIsTokenEntryDialogOpen(true);
  };

  const displayApiKeys: DisplayApiKey[] = data.apiKeys.map(({ fullKey, ...rest }) => rest);

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (!isClient) return [];
    // Pass all stored API keys to aggregateTokenData for it to use names
    return aggregateTokenData(data.tokenEntries, data.apiKeys, selectedChartApiKeyId, currentPeriod);
  }, [data.tokenEntries, data.apiKeys, selectedChartApiKeyId, currentPeriod, isClient]);

  const totalTokensThisPeriod = useMemo<number>(() => {
    if (!isClient) return 0;
    return getTotalTokens(data.tokenEntries, selectedChartApiKeyId, currentPeriod);
  }, [data.tokenEntries, selectedChartApiKeyId, currentPeriod, isClient]);
  
  if (!isClient) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><KeyRound className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 bg-background text-foreground font-body antialiased">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <KeyRound className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-headline font-bold text-foreground">
            TokenTerm
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">Manage and track your AI model token usage effortlessly.</p>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 flex flex-col gap-6">
          <Card className="flex-grow flex flex-col shadow-xl rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl">API Key Management</CardTitle>
              <CardDescription>Add, edit, or log usage for your API keys.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-4 pt-0">
              <Button
                onClick={() => { setEditingApiKey(undefined); setIsApiKeyDialogOpen(true); }}
                className="w-full mb-6 text-sm"
                size="lg"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add New API Key
              </Button>
              {displayApiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No API keys added yet. Click above to add one.</p>
              ) : (
                <ScrollArea className="flex-grow pr-2 -mr-2">
                  <div className="space-y-3">
                    {displayApiKeys.map(apiKey => {
                      const fullKeyData = data.apiKeys.find(k => k.id === apiKey.id);
                      return (
                        <Card key={apiKey.id} className="shadow-md hover:shadow-lg transition-shadow bg-card rounded-lg overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex flex-col gap-3">
                              <div>
                                <h4 className="font-semibold text-md">{apiKey.name}</h4>
                                <p className="text-xs text-muted-foreground">{apiKey.model}</p>
                                <p className="text-xs text-muted-foreground">Key: ...{apiKey.keyFragment.slice(-4)}</p>
                                <p className="text-xs text-muted-foreground">Added: {format(new Date(apiKey.createdAt), 'PP')}</p>
                              </div>
                              <div className="flex items-center gap-2 self-stretch">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-grow text-xs"
                                  onClick={() => fullKeyData && openTokenEntryDialog(fullKeyData)}
                                >
                                  <History className="mr-1.5 h-3.5 w-3.5" /> Log Usage
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0">
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">More options for {apiKey.name}</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
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
                            </div>
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

        <section className="lg:col-span-2 flex flex-col gap-6">
           {data.apiKeys.length === 0 ? (
             <Alert className="h-full flex flex-col justify-center items-center text-center border-dashed border-2 border-border/70 rounded-xl shadow-lg p-8">
                <BotMessageSquare className="h-16 w-16 mb-6 text-primary opacity-80" />
                <AlertTitle className="text-2xl font-semibold mb-2">Welcome to TokenTerm!</AlertTitle>
                <AlertDescription className="text-base text-muted-foreground max-w-md">
                  Start by adding an API key to manage and track your token usage.
                  Once added, you can log daily consumption and visualize your patterns here.
                </AlertDescription>
                <Button
                    onClick={() => { setEditingApiKey(undefined); setIsApiKeyDialogOpen(true); }}
                    className="mt-8 text-sm"
                    size="lg"
                >
                    <PlusCircle className="mr-2 h-5 w-5" /> Add Your First API Key
                </Button>
            </Alert>
           ) : (
            <Card className="flex-grow flex flex-col shadow-xl rounded-xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <CardTitle className="text-xl">Usage Dashboard</CardTitle>
                        <CardDescription>Track your token consumption patterns.</CardDescription>
                    </div>
                    <Select 
                        value={selectedChartApiKeyId || "all"}
                        onValueChange={(value) => setSelectedChartApiKeyId(value === "all" ? null : value)}
                    >
                        <SelectTrigger className="w-full sm:w-[220px] text-sm">
                          <SelectValue placeholder="Select API Key for Chart" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-sm">All API Keys</SelectItem>
                          {displayApiKeys.map(apiKey => (
                              <SelectItem key={apiKey.id} value={apiKey.id} className="text-sm">{apiKey.name}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-4 pt-0">
                <Tabs value={currentPeriod} onValueChange={(value) => setCurrentPeriod(value as Period)}>
                  <div className="flex flex-col sm:flex-row justify-between items-baseline mb-4 gap-2">
                    <TabsList className="bg-secondary/70">
                      <TabsTrigger value="daily" className="text-xs px-2.5 py-1">Daily</TabsTrigger>
                      <TabsTrigger value="weekly" className="text-xs px-2.5 py-1">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-xs px-2.5 py-1">Monthly</TabsTrigger>
                    </TabsList>
                    <Badge variant="outline" className="px-2.5 py-1 text-xs text-foreground border-border/80">
                      Total ({currentPeriod}): {totalTokensThisPeriod.toLocaleString()} tokens
                    </Badge>
                  </div>
                  <Separator className="my-4 border-border/50" />
                  <TabsContent value="daily">
                    <UsageChartDisplay 
                      data={chartData} 
                      period="daily" 
                      allApiKeys={displayApiKeys} 
                      selectedChartApiKeyId={selectedChartApiKeyId} 
                    />
                  </TabsContent>
                  <TabsContent value="weekly">
                    <UsageChartDisplay 
                      data={chartData} 
                      period="weekly" 
                      allApiKeys={displayApiKeys} 
                      selectedChartApiKeyId={selectedChartApiKeyId} 
                    />
                  </TabsContent>
                  <TabsContent value="monthly">
                    <UsageChartDisplay 
                      data={chartData} 
                      period="monthly" 
                      allApiKeys={displayApiKeys} 
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
      <footer className="text-center mt-12 py-6 border-t border-border/50 text-xs text-muted-foreground">
        TokenTerm &copy; {new Date().getFullYear()}. Built with Next.js, ShadCN, Tailwind CSS, and Genkit.
      </footer>
    </div>
  );
}
