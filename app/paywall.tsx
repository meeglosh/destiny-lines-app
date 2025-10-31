
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { SUBSCRIPTION_TIERS } from '@/utils/constants';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function PaywallScreen() {
  const [selectedTier, setSelectedTier] = useState<'standard' | 'premium'>('premium');

  const handleSubscribe = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Coming Soon',
      `You selected the ${SUBSCRIPTION_TIERS[selectedTier].name} plan. In-app purchases will be integrated soon!`,
      [
        {
          text: 'OK',
          onPress: () => {
            console.log('User acknowledged subscription coming soon');
          },
        },
      ]
    );
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Restore Purchases', 'This feature will be available once IAP is integrated.');
  };

  const handleTestingMode = () => {
    console.log('Entering testing mode - navigating to main app');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Navigate directly to the main app experience (tabs/home)
    // Using replace to prevent going back to paywall
    try {
      router.replace('/(tabs)/(home)/');
      console.log('Navigation to /(tabs)/(home)/ initiated');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation attempts
      try {
        router.push('/(tabs)/(home)/');
        console.log('Fallback navigation with push initiated');
      } catch (fallbackError) {
        console.error('Fallback navigation error:', fallbackError);
        Alert.alert('Navigation Error', 'Unable to navigate to home screen. Please restart the app.');
      }
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
                    Advanced palm reading using GPT-4 Vision
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
                    Images deleted within 10 minutes
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
            {/* Standard Tier */}
            <TouchableOpacity
              style={[
                styles.tierCard,
                selectedTier === 'standard' && styles.tierCardSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTier('standard');
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  selectedTier === 'standard'
                    ? ['rgba(178, 255, 89, 0.2)', 'rgba(178, 255, 89, 0.05)']
                    : ['rgba(30, 26, 54, 0.8)', 'rgba(30, 26, 54, 0.8)']
                }
                style={styles.tierGradient}
              >
                <View style={styles.tierHeader}>
                  <View>
                    <Text style={styles.tierName}>
                      {SUBSCRIPTION_TIERS.standard.name}
                    </Text>
                    <Text style={styles.tierPrice}>
                      {SUBSCRIPTION_TIERS.standard.price}
                    </Text>
                  </View>
                  {selectedTier === 'standard' && (
                    <View style={styles.selectedBadge}>
                      <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                    </View>
                  )}
                </View>

                <View style={styles.tierFeatures}>
                  {SUBSCRIPTION_TIERS.standard.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <IconSymbol name="checkmark" size={16} color={colors.primary} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Premium Tier */}
            <TouchableOpacity
              style={[
                styles.tierCard,
                selectedTier === 'premium' && styles.tierCardSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTier('premium');
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  selectedTier === 'premium'
                    ? ['rgba(178, 255, 89, 0.2)', 'rgba(178, 255, 89, 0.05)']
                    : ['rgba(30, 26, 54, 0.8)', 'rgba(30, 26, 54, 0.8)']
                }
                style={styles.tierGradient}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>

                <View style={styles.tierHeader}>
                  <View>
                    <Text style={styles.tierName}>
                      {SUBSCRIPTION_TIERS.premium.name}
                    </Text>
                    <Text style={styles.tierPrice}>
                      {SUBSCRIPTION_TIERS.premium.price}
                    </Text>
                  </View>
                  {selectedTier === 'premium' && (
                    <View style={styles.selectedBadge}>
                      <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                    </View>
                  )}
                </View>

                <View style={styles.tierFeatures}>
                  {SUBSCRIPTION_TIERS.premium.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <IconSymbol name="checkmark" size={16} color={colors.primary} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Subscribe Button */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(600)}
            style={styles.buttonSection}
          >
            <TouchableOpacity
              style={[buttonStyles.primary, styles.subscribeButton]}
              onPress={handleSubscribe}
            >
              <Text style={buttonStyles.text}>
                Subscribe to {SUBSCRIPTION_TIERS[selectedTier].name}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>

            {/* Testing Mode Button */}
            <TouchableOpacity style={styles.testingButton} onPress={handleTestingMode}>
              <Text style={styles.testingText}>🧪 Enter Testing Mode</Text>
            </TouchableOpacity>

            <Text style={[commonStyles.textSecondary, styles.disclaimer]}>
              Entertainment purposes only. Not medical, legal, or financial advice.
              Auto-renews unless cancelled. Ages 16+.
            </Text>
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
    paddingTop: 20,
    paddingBottom: 40,
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
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
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
  testingButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.3)',
  },
  testingText: {
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
});
