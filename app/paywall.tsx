
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { SUBSCRIPTION_TIERS, LEGAL_URLS } from '@/utils/constants';
import {
  configurePurchases,
  isPurchasesConfigured,
  syncSubscriptionToSupabase,
  tierFromCustomerInfo,
} from '@/lib/purchases';
import { supabase } from '@/lib/supabase';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

type TierKey = 'standard' | 'premium';

export default function PaywallScreen() {
  const [selectedTier, setSelectedTier] = useState<TierKey>('premium');
  const [packages, setPackages] = useState<Partial<Record<TierKey, PurchasesPackage>>>({});
  const [billingReady, setBillingReady] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ready = await configurePurchases(session?.user.id);
      if (!ready) {
        setBillingReady(false);
        return;
      }

      const offerings = await Purchases.getOfferings();
      const available = offerings.current?.availablePackages ?? [];

      const found: Partial<Record<TierKey, PurchasesPackage>> = {};
      for (const pkg of available) {
        const id = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
        if (id.includes('premium')) found.premium = pkg;
        else if (id.includes('standard')) found.standard = pkg;
      }
      setPackages(found);
      setBillingReady(!!found.standard || !!found.premium);
    } catch (error) {
      console.error('Failed to load offerings:', error);
      setBillingReady(false);
    } finally {
      setIsLoading(false);
    }
  };

  const priceFor = (tier: TierKey) =>
    packages[tier]?.product.priceString
      ? `${packages[tier]!.product.priceString}/mo`
      : SUBSCRIPTION_TIERS[tier].price;

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const pkg = packages[selectedTier];
    if (!billingReady || !pkg) {
      Alert.alert(
        'Purchases Unavailable',
        'In-app purchases are not available in this build. Please try again from the App Store version of the app.'
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      await syncSubscriptionToSupabase();

      const tier = tierFromCustomerInfo(customerInfo);
      if (tier !== 'free') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Welcome Aboard! 🔮',
          `Your ${SUBSCRIPTION_TIERS[tier as TierKey].name} subscription is active.`,
          [{ text: 'Start Reading', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase failed:', error);
        Alert.alert('Purchase Failed', error.message ?? 'Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!isPurchasesConfigured()) {
      Alert.alert(
        'Purchases Unavailable',
        'In-app purchases are not available in this build.'
      );
      return;
    }

    setIsPurchasing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      await syncSubscriptionToSupabase();

      const tier = tierFromCustomerInfo(customerInfo);
      if (tier !== 'free') {
        Alert.alert(
          'Purchases Restored',
          `Your ${SUBSCRIPTION_TIERS[tier as TierKey].name} subscription has been restored.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('No Purchases Found', 'There are no previous purchases to restore.');
      }
    } catch (error: any) {
      console.error('Restore failed:', error);
      Alert.alert('Restore Failed', error.message ?? 'Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(home)/');
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <LinearGradient
        colors={[colors.background, colors.secondary, colors.background]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Close */}
          <View style={styles.closeRow}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
            <Text style={[commonStyles.title, styles.title]}>
              Unlock Your{'\n'}Destiny
            </Text>
            <Text style={[commonStyles.textSecondary, styles.subtitle]}>
              Choose the plan that&apos;s right for you
            </Text>
          </Animated.View>

          {/* Value Proposition */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.valueSection}
          >
            <View style={commonStyles.glassCard}>
              <View style={styles.valueItem}>
                <View style={styles.iconContainer}>
                  <IconSymbol name="sparkles" size={24} color={colors.primary} />
                </View>
                <View style={styles.valueText}>
                  <Text style={styles.valueTitle}>AI-Powered Analysis</Text>
                  <Text style={commonStyles.textSecondary}>
                    Advanced palm reading powered by AI vision
                  </Text>
                </View>
              </View>

              <View style={styles.valueItem}>
                <View style={styles.iconContainer}>
                  <IconSymbol name="lock.shield" size={24} color={colors.primary} />
                </View>
                <View style={styles.valueText}>
                  <Text style={styles.valueTitle}>Privacy First</Text>
                  <Text style={commonStyles.textSecondary}>
                    Palm photos are analyzed and never stored
                  </Text>
                </View>
              </View>

              <View style={styles.valueItem}>
                <View style={styles.iconContainer}>
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.primary} />
                </View>
                <View style={styles.valueText}>
                  <Text style={styles.valueTitle}>Detailed Insights</Text>
                  <Text style={commonStyles.textSecondary}>
                    Heart, Head, Life, Fate lines & more
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Subscription Tiers */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={styles.tiersSection}
          >
            {(['standard', 'premium'] as TierKey[]).map((tier) => (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.tierCard,
                  selectedTier === tier && styles.tierCardSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTier(tier);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    selectedTier === tier
                      ? ['rgba(178, 255, 89, 0.2)', 'rgba(178, 255, 89, 0.05)']
                      : ['rgba(30, 26, 54, 0.8)', 'rgba(30, 26, 54, 0.8)']
                  }
                  style={styles.tierGradient}
                >
                  <View style={styles.tierHeader}>
                    <View style={styles.tierHeaderLeft}>
                      {tier === 'premium' && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>MOST POPULAR</Text>
                        </View>
                      )}
                      <Text style={styles.tierName}>
                        {SUBSCRIPTION_TIERS[tier].name}
                      </Text>
                      <Text style={styles.tierPrice}>{priceFor(tier)}</Text>
                    </View>
                    {selectedTier === tier && (
                      <View style={styles.selectedBadge}>
                        <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                      </View>
                    )}
                  </View>

                  <View style={styles.tierFeatures}>
                    {SUBSCRIPTION_TIERS[tier].features.map((feature, index) => (
                      <View key={index} style={styles.featureRow}>
                        <IconSymbol name="checkmark" size={16} color={colors.primary} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Subscribe Button */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(600)}
            style={styles.buttonSection}
          >
            <TouchableOpacity
              style={[buttonStyles.primary, styles.subscribeButton]}
              onPress={handleSubscribe}
              disabled={isPurchasing || isLoading}
            >
              {isPurchasing || isLoading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={buttonStyles.text}>
                  Subscribe to {SUBSCRIPTION_TIERS[selectedTier].name}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isPurchasing}
            >
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>

            <Text style={[commonStyles.textSecondary, styles.disclaimer]}>
              Subscriptions renew monthly and are billed to your App Store account.
              Cancel anytime in your App Store settings. Entertainment purposes only.
              Not medical, legal, or financial advice. Ages 16+.
            </Text>

            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.terms)}>
                <Text style={styles.legalLinkText}>Terms of Use</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}>•</Text>
              <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)}>
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  valueSection: {
    marginBottom: 32,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  valueText: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tiersSection: {
    gap: 16,
    marginBottom: 32,
  },
  tierCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tierCardSelected: {
    borderColor: colors.primary,
    boxShadow: '0px 0px 20px rgba(178, 255, 89, 0.3)',
    elevation: 8,
  },
  tierGradient: {
    padding: 24,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tierHeaderLeft: {
    flex: 1,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  },
  tierName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk',
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'SpaceGrotesk',
  },
  selectedBadge: {
    marginTop: 4,
  },
  tierFeatures: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  buttonSection: {
    gap: 16,
  },
  subscribeButton: {
    paddingVertical: 18,
  },
  restoreButton: {
    alignItems: 'center',
    padding: 12,
  },
  restoreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  legalLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
