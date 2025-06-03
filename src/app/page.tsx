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
import { KeyRound, Pencil, PlusCircle, Trash2, History, MoreVertical } from 'lucide-react';
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
    toast({ title: "API Key Deleted", description: "The API key and its associated token entries have been removed.", variant: "destructive" });
  };

  const handleSaveTokenEntry = (tokenEntry: TokenEntry) => {
    setData(prevData => {
      const existingEntryIndex = prevData.tokenEntries.findIndex(
        entry => entry.apiKeyId === tokenEntry.apiKeyId && entry.date === tokenEntry.date
      );
      if (existingEntryIndex > -1) {
        const updatedEntries = [...prevData.tokenEntries];
        updatedEntries[existingEntryIndex] = tokenEntry;
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

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (!isClient) return [];
    return aggregateTokenData(data.tokenEntries, selectedChartApiKeyId, currentPeriod);
  }, [data.tokenEntries, selectedChartApiKeyId, currentPeriod, isClient]);

  const totalTokensThisPeriod = useMemo<number>(() => {
    if (!isClient) return 0;
    return getTotalTokens(data.tokenEntries, selectedChartApiKeyId, currentPeriod);
  }, [data.tokenEntries, selectedChartApiKeyId, currentPeriod, isClient]);
  
  if (!isClient) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><KeyRound className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const displayApiKeys: DisplayApiKey[] = data.apiKeys.map(({ fullKey, ...rest }) => rest);

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 bg-background text-foreground">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary">
          <KeyRound className="inline-block mr-3 h-10 w-10" />
          TokenTerm
        </h1>
        <p className="text-muted-foreground">Manage and track your AI model token usage effortlessly.</p>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 flex flex-col gap-6">
          <Card className="flex-grow flex flex-col">
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Add, edit, or delete your API keys.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <Button
                onClick={() => { setEditingApiKey(undefined); setIsApiKeyDialogOpen(true); }}
                className="w-full mb-6"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add New API Key
              </Button>
              {displayApiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No API keys added yet. Click above to add one.</p>
              ) : (
                <ScrollArea className="flex-grow"> {/* Removed fixed height, rely on flex-grow */}
                  <div className="space-y-4">
                    {displayApiKeys.map(apiKey => {
                      const fullKeyData = data.apiKeys.find(k => k.id === apiKey.id);
                      return (
                        <Card key={apiKey.id} className="shadow-md hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex-grow mb-3 sm:mb-0">
                                <h4 className="font-semibold text-lg">{apiKey.name}</h4>
                                <p className="text-sm text-muted-foreground">{apiKey.model}</p>
                                <p className="text-xs text-muted-foreground">Key: {apiKey.keyFragment}</p>
                                <p className="text-xs text-muted-foreground">Added: {format(new Date(apiKey.createdAt), 'PP')}</p>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fullKeyData && openTokenEntryDialog(fullKeyData)}
                                >
                                  <History className="mr-2 h-4 w-4" /> Log Usage
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="w-8 h-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      if (fullKeyData) {
                                        setEditingApiKey(fullKeyData);
                                        setIsApiKeyDialogOpen(true);
                                      }
                                    }}>
                                      <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteApiKey(apiKey.id)} 
                                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
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
             <Alert className="h-full flex flex-col justify-center items-center text-center border-dashed border-2">
                <KeyRound className="h-12 w-12 mb-4 text-primary" />
                <AlertTitle className="text-xl font-semibold">Welcome to TokenTerm!</AlertTitle>
                <AlertDescription className="text-base text-muted-foreground">
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
            <Card className="flex-grow flex flex-col">
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
                    <Badge variant="outline" className="px-3 py-1.5 text-sm text-foreground">
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
      <footer className="text-center mt-12 py-6 border-t text-sm text-muted-foreground">
        TokenTerm &copy; {new Date().getFullYear()}. Built with precision.
      </footer>
    </div>
  );
}
