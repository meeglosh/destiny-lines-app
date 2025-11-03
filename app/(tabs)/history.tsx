
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

interface Reading {
  id: string;
  created_at: string;
  summary: string;
  heart_line: string;
  head_line: string;
  life_line: string;
  fate_line: string;
  marks: string;
  deeper_insights?: string;
  prompts?: string[];
  practices?: string[];
  is_premium: boolean;
}

export default function HistoryScreen() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log('No user logged in');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading readings:', error);
      } else {
        setReadings(data || []);
      }
    } catch (error) {
      console.error('Error in loadReadings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReadings();
  };

  const handleViewReading = (reading: Reading) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Convert database format to display format
    const readingData = {
      lifeLine: reading.life_line,
      headLine: reading.head_line,
      heartLine: reading.heart_line,
      handShape: reading.fate_line,
      overallReading: reading.summary,
      deeperInsights: reading.deeper_insights,
      prompts: reading.prompts,
      practices: reading.practices,
    };

    router.push({
      pathname: '/reading-result',
      params: {
        reading: JSON.stringify(readingData),
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={commonStyles.safeArea}>
        <LinearGradient
          colors={[colors.background, colors.secondary, colors.background]}
          style={styles.gradient}
        >
          <View style={commonStyles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[commonStyles.text, { marginTop: 16 }]}>Loading your readings...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
            <Text style={[commonStyles.title, styles.title]}>Reading History</Text>
            <Text style={[commonStyles.textSecondary, styles.subtitle]}>
              View your past palm readings
            </Text>
          </Animated.View>

          {/* Readings List */}
          {readings.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.emptyState}>
              <View style={commonStyles.glassCard}>
                <View style={styles.emptyIcon}>
                  <IconSymbol name="hand.raised" size={64} color={colors.textSecondary} />
                </View>
                <Text style={styles.emptyTitle}>No Readings Yet</Text>
                <Text style={[commonStyles.textSecondary, styles.emptyText]}>
                  Your palm reading history will appear here once you complete your first reading.
                </Text>
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.emptyButton]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/(tabs)/(home)/');
                  }}
                >
                  <Text style={buttonStyles.text}>Get Your First Reading</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            readings.map((reading, index) => (
              <Animated.View
                key={reading.id}
                entering={FadeInDown.duration(600).delay(index * 100)}
                style={styles.readingCard}
              >
                <TouchableOpacity
                  style={commonStyles.glassCard}
                  onPress={() => handleViewReading(reading)}
                  activeOpacity={0.7}
                >
                  <View style={styles.readingHeader}>
                    <View style={styles.readingHeaderLeft}>
                      <View style={styles.readingIcon}>
                        <IconSymbol name="hand.raised.fill" size={24} color={colors.primary} />
                      </View>
                      <View style={styles.readingInfo}>
                        <Text style={styles.readingDate}>{formatDate(reading.created_at)}</Text>
                        {reading.is_premium && (
                          <View style={styles.premiumBadge}>
                            <IconSymbol name="crown.fill" size={12} color={colors.primary} />
                            <Text style={styles.premiumText}>Premium</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                  </View>

                  <Text style={styles.readingSummary} numberOfLines={3}>
                    {reading.summary}
                  </Text>

                  <View style={styles.readingFooter}>
                    <View style={styles.readingTag}>
                      <Text style={styles.readingTagText}>🌿 Life Line</Text>
                    </View>
                    <View style={styles.readingTag}>
                      <Text style={styles.readingTagText}>🧠 Head Line</Text>
                    </View>
                    <View style={styles.readingTag}>
                      <Text style={styles.readingTagText}>❤️ Heart Line</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}

          {/* Stats Section */}
          {readings.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(600).delay(readings.length * 100)}
              style={styles.statsSection}
            >
              <View style={commonStyles.glassCard}>
                <Text style={styles.statsTitle}>Your Journey</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{readings.length}</Text>
                    <Text style={styles.statLabel}>Total Readings</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {readings.filter((r) => r.is_premium).length}
                    </Text>
                    <Text style={styles.statLabel}>Premium Readings</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
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
  emptyState: {
    marginTop: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'SpaceGrotesk',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    paddingVertical: 16,
  },
  readingCard: {
    marginBottom: 16,
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  readingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  readingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  readingInfo: {
    flex: 1,
  },
  readingDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(178, 255, 89, 0.15)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  readingSummary: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    opacity: 0.8,
    marginBottom: 12,
  },
  readingFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  readingTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    borderRadius: 12,
  },
  readingTagText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.8,
  },
  statsSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    fontFamily: 'SpaceGrotesk',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(178, 255, 89, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(178, 255, 89, 0.2)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
    fontFamily: 'SpaceGrotesk',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
