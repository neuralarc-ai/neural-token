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

export interface AppData {
  apiKeys: StoredApiKey[];
  tokenEntries: TokenEntry[];
}

export type Period = 'daily' | 'weekly' | 'monthly';

export interface ChartDataItem {
  name: string; // Date or week/month label
  tokens: number;
}
