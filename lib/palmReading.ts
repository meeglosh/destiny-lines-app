
import { supabase } from '@/lib/supabase';

export interface PalmReading {
  summary: string;
  heartLine: string;
  headLine: string;
  lifeLine: string;
  fateLine: string;
  marks: string;
  deeperInsights?: string;
  prompts?: string[];
  practices?: string[];
  isPremium?: boolean;
}

export interface AnalyzeResult {
  ok: boolean;
  reason?: string;
  code?: 'limit_reached' | 'not_a_palm' | 'error';
  reading?: PalmReading;
  remaining?: number;
}

export interface ReadingQuota {
  tier: 'free' | 'standard' | 'premium';
  readsUsed: number;
  readsLimit: number;
  remaining: number;
}

export async function fetchReadingQuota(): Promise<ReadingQuota | null> {
  const { data, error } = await supabase.rpc('get_reading_quota');
  if (error || !data || data.length === 0) {
    if (error) console.error('Error fetching reading quota:', error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    tier: row.tier,
    readsUsed: row.reads_used,
    readsLimit: row.reads_limit,
    remaining: row.remaining,
  };
}

export async function analyzePalm(imageBase64: string): Promise<AnalyzeResult> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-palm', {
      body: { imageBase64 },
    });

    if (error) {
      // Non-2xx responses throw FunctionsHttpError; the JSON body is on context.
      const context = (error as { context?: Response }).context;
      if (context) {
        try {
          const body = await context.json();
          if (body && typeof body.ok === 'boolean') return body;
        } catch {
          // fall through to generic error
        }
      }
      return { ok: false, code: 'error', reason: error.message };
    }

    return data as AnalyzeResult;
  } catch (error) {
    return {
      ok: false,
      code: 'error',
      reason: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}
