
"use client";

import { PinLogin } from '@/components/pin-login';
import type { TokenEntry, SubscriptionEntry, StoredApiKey as AppStoredApiKey } from '@/types';
import { ApiKeyDialog } from '@/components/api-key-dialog';
import { TokenEntryDialog } from '@/components/token-entry-dialog';
import { SubscriptionDialog } from '@/components/subscription-dialog';
import { UsageChartDisplay } from '@/components/usage-chart-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { aggregateTokenData, getTotalTokens } from '@/lib/date-utils';
import { calculateTotalMonthlySubscriptionCost } from '@/lib/subscription-utils';
import type { ChartDataItem, Period, DisplayApiKey as AppDisplayApiKey } from '@/types';
import { PlusCircle, Trash2, History, MoreVertical, Settings2, LayoutDashboard, Edit3, Home, BarChart3, List, CreditCard, Info, Loader2, FileText } from 'lucide-react';
import type { SVGProps } from 'react';
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
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { AppProviders } from '@/app/providers'; 

const CORRECT_PIN = '1111';

// SVG Icon Components
const OpenAIIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 28 28" fill="currentColor" {...props}>
    <path d="M14.28.02c.32 0 .63.02.94.05.33.04.66.09.98.15.32.07.64.15.95.24.3.09.6.2.9.31.28.1.56.22.83.34.26.12.5.25.75.39.24.14.47.29.7.45.22.16.43.33.64.51.2.18.38.37.56.57.17.2.34.4.5.61.15.21.29.42.42.64.13.22.25.44.36.67.1.23.19.46.28.7.08.24.15.48.21.72.06.25.11.5.15.75.03.26.05.52.06.78.01.27.01.54.01.81v3.7c0 .27 0 .54-.01.81-.01.26-.03.52-.06.78-.04.25-.09.5-.15.75-.06.24-.13.48-.21.72-.09.24-.18.47-.28.7-.11.23-.23.45-.36.67-.13.22-.27.43-.42.64s-.31.41-.5.61c-.18.2-.36.39-.56.57-.21.18-.42.35-.64.51-.23.16-.46.31-.7-.45-.25.14-.49.27-.75-.39-.27.12-.55.24-.83-.34-.3-.11-.6-.22-.9-.31-.31-.09-.63-.17-.95-.24-.32-.06-.65-.11-.98-.15-.31.03-.62.05-.94.05s-.63-.02-.94-.05c-.33-.04-.66-.09-.98-.15-.32-.07-.64-.15-.95-.24-.3-.09-.6-.2-.9-.31-.28-.1-.56-.22-.83-.34-.26-.12-.5-.25-.75-.39-.24-.14-.47-.29-.7-.45-.22-.16-.43-.33-.64-.51-.2-.18-.38-.37-.56-.57-.17-.2-.34-.4-.5-.61-.15-.21-.29-.42-.42-.64-.13-.22-.25-.44-.36-.67-.1-.23-.19-.46-.28-.7-.08-.24-.15-.48-.21-.72-.06-.25-.11-.5-.15-.75-.03-.26-.05-.52-.06-.78a13.6 13.6 0 010-1.62c.01-.26.03-.52.06-.78.04-.25.09-.5.15-.75.06-.24.13-.48.21-.72.09-.24.18-.47.28-.7.11-.23.23-.45.36-.67.13-.22.27-.43.42-.64s-.31-.41-.5-.61c-.18-.2-.36-.39-.56-.57-.21-.18-.42-.35-.64-.51-.23-.16-.46-.31-.7-.45-.25-.14-.49-.27-.75-.39-.27-.12-.55-.24-.83-.34-.3-.11-.6-.22-.9-.31-.31-.09-.63-.17-.95-.24-.32-.06-.65-.11-.98-.15A13.69 13.69 0 0113.34 0c.32.01.63.02.94.02zm-.94 2.68c-.27 0-.54.02-.81.05l-.78.06c-.25.03-.5.06-.75.1l-.72.1c-.23.04-.46.08-.69.13l-.66.12c-.21.04-.42.09-.63.14l-.6.13c-.19.05-.38.1-.57.16l-.54.15c-.17.05-.34.1-.51.16l-.48.15c-.15.05-.3.1-.45.15l-.42.14c-.13.05-.26.09-.39.14L3.09 5c-.1.04-.2.08-.3.13l-.27.1c-.08.03-.16.06-.24.1l-.21.08c-.06.03-.12.05-.18.08l-.15.07c-.04.02-.08.04-.12.06l-.09.05v.01L14 25.3c.27 0 .54-.02.81-.05l.78-.06c.25-.03.5-.06.75-.1l.72-.1c.23-.04.46-.08.69-.13l.66-.12c.21-.04.42-.09.63-.14l.6-.13c.19-.05.38-.1.57-.16l.54-.15c.17-.05.34-.1.51-.16l.48-.15c.15-.05.3-.1.45-.15l.42-.14c.13-.05.26-.09.39-.14l.27-.09c.1-.04.2-.08.3-.13l.27-.1c.08-.03.16-.06.24-.1l.21-.08c.06-.03.12-.05.18-.08l.15-.07c.04-.02.08-.04.12-.06l.09-.05L13.34 2.67zM12.06 7.13c.24 0 .48.01.71.03l.69.05c.22.02.43.05.65.08l.63.07c.2.03.4.06.59.09l.57.08c.18.03.36.06.53.09l.51.08c.16.02.32.05.48.08l.45.07c.14.02.28.05.41.07l.39.06c.12.02.24.04.36.06l.33.05c.1.02.2.03.3.05l.27.04.03.01V8.6l-10.42.02c-.24 0-.48-.01-.71-.03l-.69-.05c-.22-.02-.43-.05-.65-.08l-.63-.07c-.2-.03-.4-.06-.59-.09l-.57-.08c-.18-.03-.36-.06-.53-.09l-.51-.08c-.16-.02-.32-.05-.48-.08l-.45-.07c-.14-.02-.28-.05-.41-.07l-.39-.06c-.12-.02-.24-.04-.36-.06l-.33-.05a3.8 3.8 0 01-.3-.05L5.31 7.2V5.91l10.44-.02c.24-.01.48-.02.71-.03l.69-.04c.22-.02.43-.04.65-.07l.63-.06c.2-.02.4-.05.59-.07l.57-.06c.18-.02.36-.04.53-.06l.51-.05c.16-.02.32-.04.48-.05l.45-.05c.14-.01.28-.03.41-.04l.39-.03c.12-.01.24-.02.36-.03l.33-.02c.1-.01.2-.01.3-.02l.27-.01.03-.01v1.32l-10.41.01zM7.94 14c0-.24.01-.48.03-.71l.05-.69c.02-.22.05-.43.08-.65l.07-.63c.03-.2.06-.4.09-.59l.08-.57c.03-.18.06-.36.09-.53l.08-.51c.02-.16.05-.32.08-.48l.07-.45c.02-.14.05-.28.07-.41l.06-.39c.02-.12.04-.24.06-.36l.05-.33c.02-.1.03-.2.05-.3l.04-.27.01-.03h1.32l.01 10.41c0 .24-.01.48-.03.71l-.05.69c-.02.22-.05.43-.08.65l-.07.63c-.03.2-.06.4-.09.59l-.08.57c-.03.18-.06.36-.09.53l-.08.51c-.02.16-.05.32-.08.48l-.07.45c-.02.14-.05.28-.07.41l-.06.39c-.02.12-.04.24-.06.36l-.05.33c-.02.1-.03.2-.05.3l-.04.27-.01.03H7.94v-1.04zm12.12-1.04c0 .24-.01.48-.03.71l-.05.69c-.02.22-.05.43-.08.65l-.07.63c-.03.2-.06.4-.09.59l-.08.57c-.03.18-.06.36-.09.53l-.08.51c-.02.16-.05.32-.08.48l-.07.45c-.02.14-.05.28-.07.41l-.06.39c-.02.12-.04.24-.06.36l-.05.33c-.02.1-.03.2-.05.3l-.04.27-.01.03h-1.32l-.01-10.41c0-.24.01-.48.03-.71l.05-.69c.02-.22.05-.43.08-.65l.07-.63c.03-.2.06-.4.09-.59l.08-.57c.03-.18.06-.36.09-.53l.08-.51c.02-.16.05-.32.08-.48l.07-.45c.02-.14.05-.28.07-.41l.06-.39c.02-.12.04-.24.06-.36l.05-.33c.02-.1.03-.2.05-.3l.04-.27.01-.03h1.32v1.04z"/>
  </svg>
);

const GeminiIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2l2.54 5.54L20 10l-5.54 2.54L12 18l-2.54-5.54L4 10l5.54-2.54L12 2zm0 8l-1.07 2.33L8.6 13l2.33 1.07L12 16.4l1.07-2.33L15.4 13l-2.33-1.07L12 10z"/>
  </svg>
);

const ClaudeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props} xmlns="http://www.w3.org/2000/svg">
    <path d="M12.1641 3.5C12.0801 3.5 11.9961 3.5 11.9961 3.5C5.25211 3.5 2.00011 6.828 2.00011 12C2.00011 17.172 5.25211 20.5 11.9961 20.5C12.0801 20.5 12.1641 20.5 12.1641 20.5V3.5ZM11.1761 5.528V18.472C7.83611 18.288 5.50011 16.104 5.50011 12C5.50011 7.896 7.83611 5.712 11.1761 5.528ZM12.8401 3.5V20.5C18.7481 20.5 22.0001 17.172 22.0001 12C22.0001 6.828 18.7481 3.5 12.8401 3.5ZM14.0001 12C14.0001 13.384 14.4201 14.992 15.2881 16.044C15.1921 16.08 15.0921 16.112 14.9881 16.14C14.7081 16.216 14.2921 16.28 14.0001 16.28C13.3681 16.28 13.0001 15.768 13.0001 15.272V8.728C13.0001 8.232 13.3681 7.72 14.0001 7.72C14.2921 7.72 14.7081 7.784 14.9881 7.86C15.0921 7.888 15.1921 7.924 15.2881 7.96C14.4201 9.008 14.0001 10.616 14.0001 12Z"/>
  </svg>
);

const DeepseekIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M8.417 3.002h3.043c3.631 0 5.868 2.016 5.868 5.515v.109c0 2.125-.981 3.685-2.505 4.49-.104.052-.212.109-.32.162l2.91 5.72H14.44l-2.684-5.31H9.51v5.31H6.367V3.002h2.05zm1.093 2.11v5.201h1.849c2.016 0 3.043-.756 3.043-2.558v-.055c0-1.856-1.027-2.588-3.043-2.588H9.51z"/>
  </svg>
);

const GrokIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M15.104 14.19L22.096 3h-2.043l-5.784 9.583L9.02 3H2.904l7.207 10.873L2.904 21h2.042l6.028-9.954L16.09 21h6.116l-7.102-6.81z"/>
  </svg>
);


const navProviders = [
  { name: "Home", icon: Home, filterKeywords: [] },
  { name: "OpenAI", icon: OpenAIIcon, filterKeywords: ["openai", "gpt"] },
  { name: "Gemini", icon: GeminiIcon, filterKeywords: ["gemini", "google"] },
  { name: "Claude", icon: ClaudeIcon, filterKeywords: ["claude", "anthropic"] },
  { name: "Deepseek", icon: DeepseekIcon, filterKeywords: ["deepseek"] },
  { name: "Grok", icon: GrokIcon, filterKeywords: ["grok", "xai"] },
  { name: "Subscriptions", icon: CreditCard, filterKeywords: [] },
];

const fetchApiKeys = async (): Promise<AppStoredApiKey[]> => {
  const { data, error } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(key => ({
    id: key.id!,
    createdAt: key.created_at!,
    name: key.name!,
    model: key.model!,
    keyFragment: key.key_fragment!,
    fullKey: key.full_key!,
  }));
};

const fetchTokenEntries = async (): Promise<TokenEntry[]> => {
  const { data, error } = await supabase.from('token_entries').select('*').order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(entry => ({...entry, id: entry.id!, createdAt: entry.created_at!, date: entry.date!, apiKeyId: entry.api_key_id!, tokens: entry.tokens!  })) || [];
};

const fetchSubscriptions = async (): Promise<SubscriptionEntry[]> => {
  const { data, error } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(sub => ({ ...sub, id: sub.id!, createdAt: sub.created_at!, name: sub.name!, amount: sub.amount!, billingCycle: sub.billing_cycle as 'monthly' | 'yearly', startDate: sub.start_date! })) || [];
};


function TokenTermApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [isTokenEntryDialogOpen, setIsTokenEntryDialogOpen] = useState(false);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [selectedApiKeyForDialog, setSelectedApiKeyForDialog] = useState<AppStoredApiKey | null>(null);
  const [editingApiKey, setEditingApiKey] = useState<AppStoredApiKey | undefined>(undefined);
  
  const [activeProvider, setActiveProvider] = useState<string>("Home");
  const [selectedChartApiKeyId, setSelectedChartApiKeyId] = useState<string | null>(null); 
  const [currentPeriod, setCurrentPeriod] = useState<Period>('daily');

  const { data: apiKeys = [], isLoading: isLoadingApiKeys, error: errorApiKeys } = useQuery<AppStoredApiKey[]>({
    queryKey: ['apiKeys'],
    queryFn: fetchApiKeys,
  });
  const { data: tokenEntries = [], isLoading: isLoadingTokenEntries, error: errorTokenEntries } = useQuery<TokenEntry[]>({
    queryKey: ['tokenEntries'],
    queryFn: fetchTokenEntries,
  });
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions, error: errorSubscriptions } = useQuery<SubscriptionEntry[]>({
    queryKey: ['subscriptions'],
    queryFn: fetchSubscriptions,
  });

  useEffect(() => {
    if (errorApiKeys) toast({ title: "Error fetching API Keys", description: errorApiKeys.message, variant: "destructive" });
    if (errorTokenEntries) toast({ title: "Error fetching Token Entries", description: errorTokenEntries.message, variant: "destructive" });
    if (errorSubscriptions) toast({ title: "Error fetching Subscriptions", description: errorSubscriptions.message, variant: "destructive" });
  }, [errorApiKeys, errorTokenEntries, errorSubscriptions, toast]);

  useEffect(() => {
    setSelectedChartApiKeyId(null); 
  }, [activeProvider]);

  const addApiKeyMutation = useMutation({
    mutationFn: async (newApiKey: AppStoredApiKey) => {
      const { error } = await supabase.from('api_keys').insert([{ 
        name: newApiKey.name,
        model: newApiKey.model,
        full_key: newApiKey.fullKey,
        key_fragment: newApiKey.keyFragment,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast({ title: "API Key Added" });
      setIsApiKeyDialogOpen(false);
      setEditingApiKey(undefined);
    },
    onError: (error) => toast({ title: "Error Adding API Key", description: error.message, variant: "destructive" }),
  });

  const updateApiKeyMutation = useMutation({
    mutationFn: async (updatedApiKey: AppStoredApiKey) => {
      const { error } = await supabase.from('api_keys').update({
        name: updatedApiKey.name,
        model: updatedApiKey.model,
        full_key: updatedApiKey.fullKey,
        key_fragment: updatedApiKey.keyFragment,
      }).eq('id', updatedApiKey.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast({ title: "API Key Updated" });
      setIsApiKeyDialogOpen(false);
      setEditingApiKey(undefined);
    },
    onError: (error) => toast({ title: "Error Updating API Key", description: error.message, variant: "destructive" }),
  });
  
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (apiKeyId: string) => {
      const { error } = await supabase.from('api_keys').delete().eq('id', apiKeyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      queryClient.invalidateQueries({ queryKey: ['tokenEntries'] }); 
      toast({ title: "API Key Deleted", variant: "destructive" });
      if (selectedChartApiKeyId) setSelectedChartApiKeyId(null); 
    },
    onError: (error) => toast({ title: "Error Deleting API Key", description: error.message, variant: "destructive" }),
  });

  const addTokenEntryMutation = useMutation({
    mutationFn: async (newTokenEntry: TokenEntry) => {
      const { data: existingEntries, error: fetchError } = await supabase
        .from('token_entries')
        .select('id, tokens')
        .eq('api_key_id', newTokenEntry.apiKeyId)
        .eq('date', newTokenEntry.date);

      if (fetchError) throw fetchError;

      if (existingEntries && existingEntries.length > 0) {
        const existingEntry = existingEntries[0];
        const updatedTokens = existingEntry.tokens + newTokenEntry.tokens;
        const { error: updateError } = await supabase
          .from('token_entries')
          .update({ tokens: updatedTokens })
          .eq('id', existingEntry.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('token_entries').insert([{
            api_key_id: newTokenEntry.apiKeyId,
            date: newTokenEntry.date,
            tokens: newTokenEntry.tokens,
        }]);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokenEntries'] });
      toast({ title: "Token Entry Saved" });
      setIsTokenEntryDialogOpen(false);
    },
    onError: (error) => toast({ title: "Error Saving Token Entry", description: error.message, variant: "destructive" }),
  });

  const addSubscriptionMutation = useMutation({
    mutationFn: async (newSubscription: SubscriptionEntry) => {
      const { error } = await supabase.from('subscriptions').insert([{
        name: newSubscription.name,
        amount: newSubscription.amount,
        billing_cycle: newSubscription.billingCycle,
        start_date: newSubscription.startDate,
        category: newSubscription.category,
        notes: newSubscription.notes,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: "Subscription Added" });
      setIsSubscriptionDialogOpen(false);
    },
    onError: (error) => toast({ title: "Error Adding Subscription", description: error.message, variant: "destructive" }),
  });


  const handleSaveApiKey = (apiKey: AppStoredApiKey) => {
    if (editingApiKey) {
      updateApiKeyMutation.mutate(apiKey);
    } else {
      addApiKeyMutation.mutate(apiKey);
    }
  };

  const handleDeleteApiKey = (apiKeyId: string) => {
    deleteApiKeyMutation.mutate(apiKeyId);
  };

  const handleSaveTokenEntry = (tokenEntry: TokenEntry) => {
    addTokenEntryMutation.mutate(tokenEntry);
  };

  const handleSaveSubscription = (subscription: SubscriptionEntry) => {
    addSubscriptionMutation.mutate(subscription);
  };
  
  const openTokenEntryDialog = (apiKey: AppStoredApiKey) => {
    setSelectedApiKeyForDialog(apiKey);
    setIsTokenEntryDialogOpen(true);
  };

  const filteredApiKeysForProviderView = useMemo(() => {
    if (activeProvider === "Home" || activeProvider === "Subscriptions") {
      return []; 
    }
    const providerConfig = navProviders.find(p => p.name === activeProvider);
    if (!providerConfig) return [];
    return apiKeys.filter(apiKey => 
      providerConfig.filterKeywords.some(keyword => 
        apiKey.name.toLowerCase().includes(keyword) || apiKey.model.toLowerCase().includes(keyword)
      )
    );
  }, [apiKeys, activeProvider]);

  const displayApiKeysForList: AppDisplayApiKey[] = filteredApiKeysForProviderView.map(apiKey => ({
    ...apiKey,
    keyFragment: (apiKey.keyFragment && typeof apiKey.keyFragment === 'string' && apiKey.keyFragment.length > 4 ? apiKey.keyFragment.slice(-4) : '****' )
  }));

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (activeProvider === "Subscriptions") return [];
    const keysForAggregation = activeProvider === "Home" ? apiKeys : filteredApiKeysForProviderView;
    return aggregateTokenData(tokenEntries, keysForAggregation, selectedChartApiKeyId, currentPeriod, activeProvider);
  }, [tokenEntries, apiKeys, filteredApiKeysForProviderView, activeProvider, selectedChartApiKeyId, currentPeriod]);

  const seriesForChart = useMemo<AppStoredApiKey[]>(() => {
    if (activeProvider === "Home") {
      return [{ id: 'total-usage', name: 'Total Usage', model: 'Aggregated', fullKey:'', keyFragment: '', createdAt: new Date().toISOString() }];
    }
    const keysWithDataInChart = new Set<string>();
    if (chartData.length > 0) {
        chartData.forEach(dataItem => {
            Object.keys(dataItem).forEach(keyNameInChart => {
                if (keyNameInChart !== 'name' && typeof dataItem[keyNameInChart] === 'number' && (dataItem[keyNameInChart] as number) > 0) {
                    const apiKey = (selectedChartApiKeyId ? apiKeys.filter(k => k.id === selectedChartApiKeyId) : filteredApiKeysForProviderView)
                                    .find(k => k.name === keyNameInChart);
                    if(apiKey) keysWithDataInChart.add(apiKey.id);
                }
            });
        });
    }
    
    if (selectedChartApiKeyId) {
      return apiKeys.filter(key => key.id === selectedChartApiKeyId && keysWithDataInChart.has(key.id));
    }
    return filteredApiKeysForProviderView.filter(key => keysWithDataInChart.has(key.id));

  }, [activeProvider, chartData, apiKeys, filteredApiKeysForProviderView, selectedChartApiKeyId]);


  const totalTokensThisPeriod = useMemo<number>(() => {
    if (activeProvider === "Subscriptions") return 0;
    const keysForTotal = activeProvider === "Home" ? null : filteredApiKeysForProviderView;
    return getTotalTokens(tokenEntries, selectedChartApiKeyId, currentPeriod, activeProvider, keysForTotal || undefined);
  }, [tokenEntries, filteredApiKeysForProviderView, activeProvider, selectedChartApiKeyId, currentPeriod]);

  const totalMonthlySubscriptionCost = useMemo(() => {
    return calculateTotalMonthlySubscriptionCost(subscriptions);
  }, [subscriptions]);

  const totalTokensCurrentMonth = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    return tokenEntries
      .filter(entry => {
        const entryDate = parseISO(entry.date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      })
      .reduce((sum, entry) => sum + entry.tokens, 0);
  }, [tokenEntries]);
  
  let currentViewTitle = "Overall Dashboard";
  if (activeProvider === "Subscriptions") {
    currentViewTitle = "Manage Subscriptions";
  } else if (activeProvider !== "Home") {
    currentViewTitle = `${activeProvider} Usage`;
  }

  let addKeyButtonText = "Add New API Key";
  if (activeProvider === "Subscriptions") {
    addKeyButtonText = "Add New Subscription";
  } else if (activeProvider !== "Home") {
    addKeyButtonText = `Add New ${activeProvider} Key`;
  }

  const handleAddButtonClick = () => {
    if (activeProvider === "Subscriptions") {
      setIsSubscriptionDialogOpen(true);
    } else {
      setEditingApiKey(undefined);
      setIsApiKeyDialogOpen(true);
    }
  };

  if (isLoadingApiKeys || isLoadingTokenEntries || isLoadingSubscriptions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen font-body antialiased p-4 sm:p-6 md:p-8 bg-page-background">
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-0 max-w-screen-2xl mx-auto bg-background border-2 border-black shadow-neo rounded-2xl overflow-hidden w-full">
        
        <aside className="lg:col-span-3 bg-card p-6 flex flex-col space-y-6 border-r-2 border-black">
          <div className="flex items-center gap-3 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-headline font-bold text-foreground">
              NeuralTokens
            </h1>
          </div>

          <nav className="flex-grow flex flex-col space-y-2 overflow-hidden">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">Providers</h2>
            {navProviders.map((provider) => (
              <Button
                key={provider.name}
                variant={activeProvider === provider.name ? "default" : "ghost"}
                className={cn(
                  "w-[96%] justify-start text-sm h-10 px-3 py-2 rounded-md border-2 border-transparent font-semibold",
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

        <div className="lg:col-span-9 flex flex-col bg-page-background">
          <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <h2 className="text-4xl font-bold text-foreground font-headline">{currentViewTitle}</h2>
                  <p className="text-muted-foreground mt-1 text-md">
                    {activeProvider === "Subscriptions" 
                      ? "Track your recurring expenses." 
                      : activeProvider === "Home"
                      ? "A high-level overview of your token usage."
                      : `Track your ${activeProvider} token consumption patterns.`}
                  </p>
              </div>
              <Button
                  onClick={handleAddButtonClick}
                  className="text-md border-2 border-black shadow-neo hover:shadow-neo-sm active:shadow-none font-semibold whitespace-nowrap"
                  size="lg"
                  variant="default"
                  disabled={addApiKeyMutation.isPending || updateApiKeyMutation.isPending || addSubscriptionMutation.isPending}
              >
                  <PlusCircle className="mr-2 h-5 w-5" /> {addKeyButtonText}
              </Button>
            </div>
            
            {activeProvider === "Home" && (
              <>
                  {apiKeys.length === 0 ? (
                      <Card className="mb-8 h-auto flex flex-col justify-center items-center text-center p-8 bg-card border-2 border-black shadow-neo rounded-xl">
                          <LayoutDashboard className="h-16 w-16 mb-6 text-primary opacity-70" />
                          <CardTitle className="text-xl font-semibold mb-2">Welcome to NeuralTokens!</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
                          Get started by adding an API key. Once added, log consumption and visualize your token usage across different providers.
                          </CardDescription>
                      </Card>
                  ) : (
                      <Card className="mb-8 bg-card border-2 border-black shadow-neo rounded-xl">
                          <CardHeader>
                              <CardTitle className="text-xl font-bold flex items-center"><Home className="mr-2 h-6 w-6 text-primary"/>Home Dashboard Summary</CardTitle>
                              <CardDescription className="text-sm text-muted-foreground">A quick glance at your overall activity.</CardDescription>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div className="p-4 bg-secondary/30 rounded-lg border-2 border-black shadow-neo-sm">
                                  <h3 className="text-md font-semibold text-muted-foreground">Total API Keys</h3>
                                  <p className="text-3xl font-bold text-foreground">{apiKeys.length}</p>
                              </div>
                              <div className="p-4 bg-secondary/30 rounded-lg border-2 border-black shadow-neo-sm">
                                  <h3 className="text-md font-semibold text-muted-foreground">Tokens This Month</h3>
                                  <p className="text-3xl font-bold text-foreground">{totalTokensCurrentMonth.toLocaleString()}</p>
                              </div>
                              <div className="p-4 bg-secondary/30 rounded-lg border-2 border-black shadow-neo-sm">
                                  <h3 className="text-md font-semibold text-muted-foreground">Monthly Sub Costs</h3>
                                  <p className="text-3xl font-bold text-foreground">${totalMonthlySubscriptionCost.toFixed(2)}</p>
                              </div>
                              <div className="p-4 bg-secondary/30 rounded-lg border-2 border-black shadow-neo-sm">
                                  <h3 className="text-md font-semibold text-muted-foreground">Active Subscriptions</h3>
                                  <p className="text-3xl font-bold text-foreground">{subscriptions.length}</p>
                              </div>
                          </CardContent>
                      </Card>
                  )}
              </>
            )}


            {activeProvider !== "Subscriptions" && activeProvider !== "Home" && (
              <>
                {filteredApiKeysForProviderView.length === 0 ? (
                  <Card className="mb-8 bg-card border-2 border-black shadow-neo rounded-xl p-6 text-center">
                      <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground opacity-60 mb-3" />
                      <p className="text-md font-semibold text-foreground mb-1">No {activeProvider} API keys yet.</p>
                      <p className="text-sm text-muted-foreground">Click "{addKeyButtonText}" to add one.</p>
                  </Card>
                ) : displayApiKeysForList.length > 0 ? (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center"><List className="mr-2 h-5 w-5 text-primary"/>{activeProvider} API Keys</h3>
                    <ScrollArea className="h-auto max-h-[300px] -mx-1 pr-1"> 
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-1">
                        {displayApiKeysForList.map(apiKey => {
                          const fullKeyData = apiKeys.find(k => k.id === apiKey.id);
                          return (
                            <div key={apiKey.id} className="group bg-card border-2 border-black shadow-neo-sm rounded-lg p-4 transition-all hover:shadow-neo flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-grow">
                                    <h4 className="font-semibold text-md text-foreground">{apiKey.name}</h4>
                                    <p className="text-xs text-muted-foreground">{apiKey.model}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Key: ...{apiKey.keyFragment && typeof apiKey.keyFragment === 'string' && apiKey.keyFragment.length > 4 ? apiKey.keyFragment.slice(-4) : '****'}</p>
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
                                        disabled={deleteApiKeyMutation.isPending}
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
              </>
            )}

            {activeProvider !== "Subscriptions" && (
                <Card className="bg-card border-2 border-black shadow-neo rounded-xl overflow-hidden">
                  <CardHeader className="pb-4 border-b-2 border-black">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2 font-bold">
                              <BarChart3 className="h-6 w-6 text-primary"/>
                              Usage Overview
                            </CardTitle>
                            <CardDescription className="text-sm mt-1 text-muted-foreground">
                              {activeProvider === "Home" 
                                ? "Total token usage across all providers."
                                : `Visualize token usage for ${activeProvider}.`}
                            </CardDescription>
                        </div>
                        {activeProvider !== "Home" && (
                          <Select 
                              value={selectedChartApiKeyId || "all"}
                              onValueChange={(value) => {
                                  setSelectedChartApiKeyId(value === "all" ? null : value);
                              }}
                              disabled={filteredApiKeysForProviderView.length === 0}
                          >
                              <SelectTrigger 
                                className="w-full sm:w-[220px] text-sm h-11 rounded-md border-2 border-black shadow-neo-sm font-medium"
                              >
                                <SelectValue placeholder="Select API Key" />
                              </SelectTrigger>
                              {filteredApiKeysForProviderView.length > 0 && (
                                  <SelectContent className="text-sm border-2 border-black shadow-neo bg-card rounded-md">
                                    <SelectItem value="all" className="text-sm cursor-pointer focus:bg-primary focus:text-primary-foreground">
                                      {`All ${activeProvider} Keys`}
                                    </SelectItem>
                                    {filteredApiKeysForProviderView.map(apiKey => (
                                        <SelectItem key={apiKey.id} value={apiKey.id} className="text-sm cursor-pointer focus:bg-primary focus:text-primary-foreground">{apiKey.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                              )}
                          </Select>
                        )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow p-4 sm:p-6">
                    <Tabs value={currentPeriod} onValueChange={(value) => setCurrentPeriod(value as Period)} className="w-full">
                      <div className="flex flex-col sm:flex-row justify-between items-baseline mb-6 gap-4">
                        <TabsList className="bg-secondary border-2 border-black shadow-neo-sm rounded-lg p-1 h-fit">
                          <TabsTrigger value="daily" className="text-sm px-4 py-1.5 h-auto rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neo-sm data-[state=active]:border-2 data-[state=active]:border-black font-medium">Daily</TabsTrigger>
                          <TabsTrigger value="weekly" className="text-sm px-4 py-1.5 h-auto rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neo-sm data-[state=active]:border-2 data-[state=active]:border-black font-medium">Weekly</TabsTrigger>
                          <TabsTrigger value="monthly" className="text-sm px-4 py-1.5 h-auto rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neo-sm data-[state=active]:border-2 data-[state=active]:border-black font-medium">Monthly</TabsTrigger>
                        </TabsList>
                        <Badge variant="outline" className="px-4 py-2 text-sm font-semibold text-foreground border-2 border-black shadow-neo-sm bg-card rounded-md">
                          Total ({currentPeriod}): {totalTokensThisPeriod.toLocaleString()} tokens
                        </Badge>
                      </div>
                      
                      <div className="mt-0 rounded-lg border-2 border-black shadow-neo bg-card p-2">
                        <UsageChartDisplay 
                          data={chartData} 
                          period={currentPeriod}
                          seriesKeys={seriesForChart} 
                          selectedChartApiKeyId={selectedChartApiKeyId}
                          activeProvider={activeProvider}
                        />
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>
            )}

            {activeProvider === "Subscriptions" && (
              <div className="space-y-8">
                <Card className="bg-card border-2 border-black shadow-neo rounded-xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl flex items-center gap-2 font-bold">
                        <List className="h-6 w-6 text-primary" />
                        Subscription List
                      </CardTitle>
                      <Badge variant="outline" className="px-4 py-2 text-sm font-semibold text-foreground border-2 border-black shadow-neo-sm bg-card rounded-md">
                        Total Monthly: ${totalMonthlySubscriptionCost.toFixed(2)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {subscriptions.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No subscriptions added yet.</p>
                        <p className="text-sm">Click "Add New Subscription" to get started.</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-auto max-h-[400px] -mx-1 pr-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-1">
                          {subscriptions.map(sub => (
                            <div key={sub.id} className="bg-card border-2 border-black shadow-neo-sm rounded-lg p-4 flex flex-col justify-between">
                              <div>
                                <h4 className="font-semibold text-md text-foreground">{sub.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  ${sub.amount.toFixed(2)} / {sub.billingCycle === 'monthly' ? 'month' : 'year'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Starts: {format(parseISO(sub.startDate), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-2 border-black shadow-neo rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 font-bold">
                      <BarChart3 className="h-6 w-6 text-primary" />
                      Subscription Cost Visualizer
                    </CardTitle>
                    <CardDescription className="text-sm mt-1 text-muted-foreground">
                      Visualize your subscription spending patterns.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-72 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Info className="h-10 w-10 mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-medium">Chart coming soon!</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-2 border-black shadow-neo rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 font-bold">
                      <FileText className="h-6 w-6 text-primary" /> {/* Changed icon */}
                      AI Savings Insights
                    </CardTitle>
                    <CardDescription className="text-sm mt-1 text-muted-foreground">
                      Get AI-powered tips to optimize your subscription costs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-40 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Info className="h-10 w-10 mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-medium">AI insights coming soon!</p>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}
          </main>
        </div>
      </div>

      <footer className="w-full max-w-screen-2xl mx-auto mt-auto pt-6 pb-8 text-center border-t-2 border-black">
        <p className="text-sm text-foreground">
          NeuralTokens &mdash; &copy; {new Date().getFullYear()}{' '}
          <a
            href="https://neuralarc.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:text-primary"
          >
            NeuralArc
          </a>
        </p>
      </footer>

      {isApiKeyDialogOpen && (
        <ApiKeyDialog
          isOpen={isApiKeyDialogOpen}
          onClose={() => { setIsApiKeyDialogOpen(false); setEditingApiKey(undefined); }}
          onSave={handleSaveApiKey}
          existingApiKey={editingApiKey}
          defaultProvider={activeProvider !== "Home" && activeProvider !== "Subscriptions" ? activeProvider : undefined}
          isSaving={addApiKeyMutation.isPending || updateApiKeyMutation.isPending}
        />
      )}
      {isTokenEntryDialogOpen && selectedApiKeyForDialog && (
        <TokenEntryDialog
          isOpen={isTokenEntryDialogOpen}
          onClose={() => setIsTokenEntryDialogOpen(false)}
          onSave={handleSaveTokenEntry}
          apiKey={selectedApiKeyForDialog}
          isSaving={addTokenEntryMutation.isPending}
        />
      )}
      {isSubscriptionDialogOpen && (
        <SubscriptionDialog
          isOpen={isSubscriptionDialogOpen}
          onClose={() => setIsSubscriptionDialogOpen(false)}
          onSave={handleSaveSubscription}
          isSaving={addSubscriptionMutation.isPending}
        />
      )}
    </div>
  );
}

export default function Page() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    const authStatus = localStorage.getItem('tokenTermAuthenticated'); 
    return authStatus === 'true';
  });


  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') { 
        const authStatus = localStorage.getItem('tokenTermAuthenticated');
        setIsAuthenticated(authStatus === 'true');
    }
  }, []);

  const handleLoginSuccess = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('tokenTermAuthenticated', 'true');
    }
    setIsAuthenticated(true);
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page-background">
        {/* Using a simple SVG loader that inherits primary color */}
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLogin onLoginSuccess={handleLoginSuccess} correctPin={CORRECT_PIN} />;
  }

  return (
    <AppProviders> 
      <TokenTermApp />
    </AppProviders>
  );
}

