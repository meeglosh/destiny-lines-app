
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { getCurrentTier } from '@/lib/purchases';
import { LEGAL_URLS, SUPPORT_EMAIL } from '@/utils/constants';

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [subscriptionLabel, setSubscriptionLabel] = useState<string>('Free');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserEmail(user.email || 'No email');
        const tier = await getCurrentTier();
        setSubscriptionLabel(
          tier === 'premium' ? 'Premium' : tier === 'standard' ? 'Standard' : 'Free'
        );
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/auth');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleManageSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/paywall');
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted. Any active subscription must be cancelled separately in your App Store settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { data, error } = await supabase.functions.invoke('delete-account', {
                body: {},
              });
              if (error || !data?.ok) {
                throw new Error(error?.message ?? data?.reason ?? 'Deletion failed');
              }
              await supabase.auth.signOut();
              router.replace('/auth');
            } catch (err) {
              console.error('Account deletion failed:', err);
              Alert.alert(
                'Deletion Failed',
                `We could not delete your account. Please try again or contact ${SUPPORT_EMAIL}.`
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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
            <Text style={[commonStyles.title, styles.title]}>Profile</Text>
            <Text style={[commonStyles.textSecondary, styles.subtitle]}>
              Manage your account and settings
            </Text>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.section}>
            <View style={commonStyles.glassCard}>
              <View style={styles.profileIcon}>
                <IconSymbol name="person.circle.fill" size={80} color={colors.primary} />
              </View>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              <View style={styles.subscriptionBadge}>
                <IconSymbol
                  name={subscriptionLabel === 'Premium' ? 'crown.fill' : 'star.fill'}
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.subscriptionText}>{subscriptionLabel}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Subscription Section */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={commonStyles.glassCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleManageSubscription}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <IconSymbol name="creditcard.fill" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.menuItemText}>Manage Subscription</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Settings Section */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={commonStyles.glassCard}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  WebBrowser.openBrowserAsync(LEGAL_URLS.privacy);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <IconSymbol name="lock.shield.fill" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.menuItemText}>Privacy Policy</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  WebBrowser.openBrowserAsync(LEGAL_URLS.terms);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <IconSymbol name="doc.text.fill" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.menuItemText}>Terms of Service</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Destiny%20Lines%20Support`).catch(() => {
                    Alert.alert('Help & Support', `For support, please email ${SUPPORT_EMAIL}`);
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <IconSymbol name="questionmark.circle.fill" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.menuItemText}>Help & Support</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Account Actions */}
          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.section}>
            <TouchableOpacity
              style={[buttonStyles.secondary, styles.actionButton]}
              onPress={handleSignOut}
            >
              <IconSymbol name="arrow.right.square.fill" size={20} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && { opacity: 0.5 }]}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
              <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
                {isDeleting ? 'Deleting…' : 'Delete Account'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Disclaimer */}
          <Animated.View entering={FadeInDown.duration(600).delay(500)} style={styles.disclaimerSection}>
            <Text style={[commonStyles.textSecondary, styles.disclaimer]}>
              ⚠️ For entertainment purposes only. Not medical, legal, or financial advice.
            </Text>
            <Text style={[commonStyles.textSecondary, styles.version]}>
              Version 1.0.0
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
    paddingBottom: 100, // Extra padding for tab bar
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  profileIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderRadius: 20,
    alignSelf: 'center',
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    marginVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.6,
  },
});
