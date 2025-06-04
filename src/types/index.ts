
export interface ApiKey {
  id: string;
  name: string;
  model: string;
  keyFragment: string; // Store only a fragment for display, not the full key
  createdAt: string;
}

export interface TokenEntry {
  id: string;
  apiKeyId: string;
  date: string; // YYYY-MM-DD
  tokens: number;
  createdAt: string;
}

// This is the actual structure that will be stored, including the full API key
export interface StoredApiKey extends ApiKey {
  fullKey: string;
}

export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionEntry {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  startDate: string; // YYYY-MM-DD
  category?: string; // Optional for now
  notes?: string; // Optional for now
  createdAt: string;
}

export interface AppData {
  apiKeys: StoredApiKey[];
  tokenEntries: TokenEntry[];
  subscriptions: SubscriptionEntry[];
}

export type Period = 'daily' | 'weekly' | 'monthly';

export interface ChartDataItem {
  name: string; // Date or week/month label
  // Dynamically added properties for each API key's token count
  // e.g., "My OpenAI Key": 1234, "Another Key": 5678
  [apiKeyName: string]: number | string;
}

// For displaying API keys without exposing the full key
export interface DisplayApiKey {
  id: string;
  name: string;
  model: string;
  keyFragment: string;
  createdAt: string;
}
