// Utility functions to map between camelCase (frontend) and snake_case (Supabase) for all main entities
import type { StoredApiKey, TokenEntry, SubscriptionEntry } from '@/types';
import type { StoredApiKeyRow, TokenEntryRow, SubscriptionEntryRow } from '@/types/supabase';

// --- API KEYS ---
export function toStoredApiKey(row: StoredApiKeyRow): StoredApiKey {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    keyFragment: row.key_fragment,
    fullKey: row.full_key,
    createdAt: row.created_at,
  };
}

export function fromStoredApiKey(apiKey: StoredApiKey): StoredApiKeyRow {
  return {
    id: apiKey.id,
    name: apiKey.name,
    model: apiKey.model,
    key_fragment: apiKey.keyFragment,
    full_key: apiKey.fullKey,
    created_at: apiKey.createdAt,
  };
}

// --- TOKEN ENTRIES ---
export function toTokenEntry(row: TokenEntryRow): TokenEntry {
  return {
    id: row.id,
    apiKeyId: row.api_key_id,
    date: row.date,
    tokens: row.tokens,
    createdAt: row.created_at,
  };
}

export function fromTokenEntry(entry: TokenEntry): TokenEntryRow {
  return {
    id: entry.id,
    api_key_id: entry.apiKeyId,
    date: entry.date,
    tokens: entry.tokens,
    created_at: entry.createdAt,
  };
}

// --- SUBSCRIPTIONS ---
export function toSubscriptionEntry(row: SubscriptionEntryRow): SubscriptionEntry {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    billingCycle: row.billing_cycle,
    startDate: row.start_date,
    category: row.category ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export function fromSubscriptionEntry(entry: SubscriptionEntry): SubscriptionEntryRow {
  return {
    id: entry.id,
    name: entry.name,
    amount: entry.amount,
    billing_cycle: entry.billingCycle,
    start_date: entry.startDate,
    category: entry.category ?? null,
    notes: entry.notes ?? null,
    created_at: entry.createdAt,
  };
} 