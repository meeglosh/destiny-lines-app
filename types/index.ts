
export type SubscriptionTier = 'standard' | 'premium' | null;

export interface User {
  id: string;
  email: string;
  tier: SubscriptionTier;
  periodStart: string | null;
  periodEnd: string | null;
  readsUsed: number;
  createdAt: string;
}

export interface Reading {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
  summary: string | null;
  heartLine: string | null;
  headLine: string | null;
  lifeLine: string | null;
  fateLine: string | null;
  marks: string | null;
  deeperInsights: string | null;
  prompts: string[] | null;
  practices: string[] | null;
}

export interface ReadingResult {
  ok: boolean;
  reason?: string;
  reading?: {
    summary: string;
    heartLine: string;
    headLine: string;
    lifeLine: string;
    fateLine: string;
    marks: string;
    deeperInsights?: string;
    prompts?: string[];
    practices?: string[];
  };
}

export interface UsageInfo {
  tier: SubscriptionTier;
  readsUsed: number;
  readsLimit: number;
  dailyLimit: number;
  readsToday: number;
}
