
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { supabase } from '@/lib/supabase';
import { ENTITLEMENTS } from '@/utils/constants';

export type Tier = 'free' | 'standard' | 'premium';

let configured = false;

export function isBillingSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function getApiKey(): string | null {
  const extra = Constants.expoConfig?.extra;
  const key =
    Platform.OS === 'ios'
      ? extra?.revenueCatIosApiKey
      : extra?.revenueCatAndroidApiKey;
  if (!key || typeof key !== 'string' || key.includes('PLACEHOLDER')) {
    return null;
  }
  return key;
}

// Safe to call multiple times. Returns false when billing is unavailable
// (web, Expo Go, or API key not yet configured in app.json extra).
export async function configurePurchases(appUserId?: string): Promise<boolean> {
  if (!isBillingSupported()) return false;
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('RevenueCat API key not configured; purchases disabled');
    return false;
  }

  try {
    if (!configured) {
      Purchases.configure({ apiKey, appUserID: appUserId ?? null });
      configured = true;
    } else if (appUserId) {
      await Purchases.logIn(appUserId);
    }
    return true;
  } catch (error) {
    console.error('Failed to configure purchases:', error);
    return false;
  }
}

export function isPurchasesConfigured(): boolean {
  return configured;
}

export function tierFromCustomerInfo(info: CustomerInfo): Tier {
  if (info.entitlements.active[ENTITLEMENTS.premium]) return 'premium';
  if (info.entitlements.active[ENTITLEMENTS.standard]) return 'standard';
  return 'free';
}

// Ask the backend to verify entitlements against the RevenueCat API and
// mirror them into the subscriptions table (which the analyze-palm function
// trusts for tier limits). Clients cannot write that table directly.
export async function syncSubscriptionToSupabase(): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('sync-subscription', {
      body: {},
    });
    if (error) console.error('Failed to sync subscription:', error);
  } catch (error) {
    console.error('Failed to sync subscription:', error);
  }
}

// Current tier: RevenueCat entitlements first, Supabase subscriptions row as
// fallback (covers web and fresh installs before RevenueCat cache warms up).
export async function getCurrentTier(): Promise<Tier> {
  if (configured) {
    try {
      const info = await Purchases.getCustomerInfo();
      const tier = tierFromCustomerInfo(info);
      if (tier !== 'free') return tier;
    } catch (error) {
      console.error('Failed to get customer info:', error);
    }
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 'free';

    const { data } = await supabase
      .from('subscriptions')
      .select('tier, expires_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!data) return 'free';
    if (data.expires_at && new Date(data.expires_at) < new Date()) return 'free';
    return data.tier === 'premium' ? 'premium' : 'standard';
  } catch (error) {
    console.error('Failed to get tier from Supabase:', error);
    return 'free';
  }
}
