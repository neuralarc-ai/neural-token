"use client";

import { ApiKeyDialog } from '@/components/api-key-dialog';
import { TokenEntryDialog } from '@/components/token-entry-dialog';
import { UsageChartDisplay } from '@/components/usage-chart-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useLocalStorage from '@/hooks/use-local-storage';
import { aggregateTokenData, getTotalTokens } from '@/lib/date-utils';
import type { ApiKey as DisplayApiKey, AppData, ChartDataItem, Period, StoredApiKey, TokenEntry } from '@/types';
import { format } from 'date-fns';
import { KeyRound, Pencil, PlusCircle, Trash2, TrendingUp, History } from 'lucide-react';
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
  
  const [selectedChartApiKeyId, setSelectedChartApiKeyId] = useState<string | null>(null); // null for "All Keys"
  const [currentPeriod, setCurrentPeriod] = useState<Period>('daily');

  const { toast } = useToast();

  // Client-side hydration check
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
      tokenEntries: prevData.tokenEntries.filter(entry => entry.apiKeyId !== apiKeyId), // Also remove associated token entries
    }));
    toast({ title: "API Key Deleted", description: "The API key and its associated token entries have been removed.", variant: "destructive" });
  };

  const handleSaveTokenEntry = (tokenEntry: TokenEntry) => {
    setData(prevData => {
      // Check if an entry for this key and date already exists
      const existingEntryIndex = prevData.tokenEntries.findIndex(
        entry => entry.apiKeyId === tokenEntry.apiKeyId && entry.date === tokenEntry.date
      );
      if (existingEntryIndex > -1) {
        // Update existing entry
        const updatedEntries = [...prevData.tokenEntries];
        updatedEntries[existingEntryIndex] = tokenEntry;
        return { ...prevData, tokenEntries: updatedEntries };
      }
      // Add new entry
      return { ...prevData, tokenEntries: [...prevData.tokenEntries, tokenEntry] };
    });
    setIsTokenEntryDialogOpen(false);
  };

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (!isClient) return []; // Ensure this runs client-side
    return aggregateTokenData(data.tokenEntries, selectedChartApiKeyId, currentPeriod);
  }, [data.tokenEntries, selectedChartApiKeyId, currentPeriod, isClient]);

  const totalTokensThisPeriod = useMemo<number>(() => {
    if (!isClient) return 0;
    return getTotalTokens(data.tokenEntries, selectedChartApiKeyId, currentPeriod);
  }, [data.tokenEntries, selectedChartApiKeyId, currentPeriod, isClient]);
  
  if (!isClient) {
    return <div className="flex items-center justify-center min-h-screen"><KeyRound className="h-12 w-12 animate-spin text-primary" /></div>; // Or some loading state
  }

  const displayApiKeys: DisplayApiKey[] = data.apiKeys.map(({ fullKey, ...rest }) => rest);

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">
          <KeyRound className="inline-block mr-3 h-10 w-10" />
          TokenTerm
        </h1>
        <p className="text-muted-foreground">Manage and track your AI model token usage effortlessly.</p>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: API Keys & Token Input */}
        <section className="lg:col-span-1 flex flex-col gap-6">
          <Card className="flex-grow flex flex-col bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Add, edit, or delete your API keys.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <Button
                onClick={() => { setEditingApiKey(undefined); setIsApiKeyDialogOpen(true); }}
                className="w-full mb-4"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add New API Key
              </Button>
              {displayApiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No API keys added yet. Click above to add one.</p>
              ) : (
                <ScrollArea className="h-[calc(100%-4rem-1rem)]"> {/* Adjust height as needed */}
                  <div className="space-y-3">
                    {displayApiKeys.map(apiKey => (
                      <div key={apiKey.id} className="p-3 border rounded-md bg-background/30 hover:bg-background/50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">{apiKey.name}</h4>
                            <p className="text-xs text-muted-foreground">{apiKey.model} - {apiKey.keyFragment}</p>
                            <p className="text-xs text-muted-foreground">Added: {format(new Date(apiKey.createdAt), 'PP')}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="px-2">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                const fullKeyData = data.apiKeys.find(k => k.id === apiKey.id);
                                if (fullKeyData) {
                                  setEditingApiKey(fullKeyData);
                                  setIsApiKeyDialogOpen(true);
                                }
                              }}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const fullKeyData = data.apiKeys.find(k => k.id === apiKey.id);
                                if (fullKeyData) {
                                  setSelectedApiKeyForDialog(fullKeyData);
                                  setIsTokenEntryDialogOpen(true);
                                }
                              }}>
                                <History className="mr-2 h-4 w-4" /> Add Token Entry
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteApiKey(apiKey.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right Panel: Usage Dashboard */}
        <section className="lg:col-span-2 flex flex-col gap-6">
           {data.apiKeys.length === 0 ? (
             <Alert className="h-full flex flex-col justify-center items-center text-center">
                <KeyRound className="h-12 w-12 mb-4 text-primary" />
                <AlertTitle className="text-xl font-semibold">Welcome to TokenTerm!</AlertTitle>
                <AlertDescription className="text-base">
                  Start by adding an API key to manage and track your token usage.
                  <br />
                  Once you add an API key, you can log daily token consumption and visualize your usage patterns here.
                </AlertDescription>
                <Button
                    onClick={() => { setEditingApiKey(undefined); setIsApiKeyDialogOpen(true); }}
                    className="mt-6"
                >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Your First API Key
                </Button>
            </Alert>
           ) : (
            <Card className="flex-grow flex flex-col bg-card text-card-foreground">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <CardTitle>Usage Dashboard</CardTitle>
                        <CardDescription>Track your token consumption patterns.</CardDescription>
                    </div>
                    <Select 
                        value={selectedChartApiKeyId || "all"}
                        onValueChange={(value) => setSelectedChartApiKeyId(value === "all" ? null : value)}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Select API Key" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">All Keys</SelectItem>
                        {displayApiKeys.map(apiKey => (
                            <SelectItem key={apiKey.id} value={apiKey.id}>{apiKey.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <Tabs value={currentPeriod} onValueChange={(value) => setCurrentPeriod(value as Period)}>
                  <div className="flex flex-col sm:flex-row justify-between items-baseline mb-4 gap-2">
                    <TabsList>
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                    <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      Total ({currentPeriod}): {totalTokensThisPeriod.toLocaleString()} tokens
                    </Badge>
                  </div>
                  <Separator className="my-4" />
                  <TabsContent value="daily">
                    <UsageChartDisplay data={chartData} period="daily" />
                  </TabsContent>
                  <TabsContent value="weekly">
                    <UsageChartDisplay data={chartData} period="weekly" />
                  </TabsContent>
                  <TabsContent value="monthly">
                    <UsageChartDisplay data={chartData} period="monthly" />
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
      <footer className="text-center mt-12 py-4 border-t border-border text-sm text-muted-foreground">
        TokenTerm &copy; {new Date().getFullYear()}. Built with precision.
      </footer>
    </div>
  );
}
