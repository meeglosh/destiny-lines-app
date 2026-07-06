
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function ReadingResultScreen() {
  const params = useLocalSearchParams();
  
  // Parse the reading data from params
  const reading = params.reading ? JSON.parse(params.reading as string) : null;

  if (!reading) {
    return (
      <SafeAreaView style={commonStyles.safeArea}>
        <LinearGradient
          colors={[colors.background, colors.secondary, colors.background]}
          style={styles.gradient}
        >
          <View style={commonStyles.centerContent}>
            <Text style={commonStyles.text}>No reading data available</Text>
            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 20 }]}
              onPress={() => router.back()}
            >
              <Text style={buttonStyles.text}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const shareText = `My Palm Reading from Destiny Lines 🔮\n\n🌿 Life Line\n${reading.lifeLine}\n\n🧠 Head Line\n${reading.headLine}\n\n❤️ Heart Line\n${reading.heartLine}\n\n✨ Fate Line\n${reading.fateLine}\n\n🌟 Overall Reading\n${reading.summary}`;
      
      await Share.share({
        message: shareText,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <LinearGradient
        colors={[colors.background, colors.secondary, colors.background]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[commonStyles.title, styles.headerTitle]}>Your Reading</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <IconSymbol name="square.and.arrow.up" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Life Line */}
          <Animated.View entering={FadeInUp.duration(600)} style={styles.section}>
            <View style={commonStyles.glassCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.emoji}>🌿</Text>
                <Text style={styles.sectionTitle}>Life Line</Text>
              </View>
              <Text style={styles.readingText}>{reading.lifeLine}</Text>
            </View>
          </Animated.View>

          {/* Head Line */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.section}>
            <View style={commonStyles.glassCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.emoji}>🧠</Text>
                <Text style={styles.sectionTitle}>Head Line</Text>
              </View>
              <Text style={styles.readingText}>{reading.headLine}</Text>
            </View>
          </Animated.View>

          {/* Heart Line */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.section}>
            <View style={commonStyles.glassCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.emoji}>❤️</Text>
                <Text style={styles.sectionTitle}>Heart Line</Text>
              </View>
              <Text style={styles.readingText}>{reading.heartLine}</Text>
            </View>
          </Animated.View>

          {/* Fate Line */}
          <Animated.View entering={FadeInDown.duration(600).delay(300)} style={styles.section}>
            <View style={commonStyles.glassCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.emoji}>✨</Text>
                <Text style={styles.sectionTitle}>Fate Line</Text>
              </View>
              <Text style={styles.readingText}>{reading.fateLine}</Text>
            </View>
          </Animated.View>

          {/* Special Marks */}
          {!!reading.marks && (
            <Animated.View entering={FadeInDown.duration(600).delay(350)} style={styles.section}>
              <View style={commonStyles.glassCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.emoji}>✋</Text>
                  <Text style={styles.sectionTitle}>Special Marks</Text>
                </View>
                <Text style={styles.readingText}>{reading.marks}</Text>
              </View>
            </Animated.View>
          )}

          {/* Overall Reading */}
          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.section}>
            <View style={commonStyles.glassCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.emoji}>🌟</Text>
                <Text style={styles.sectionTitle}>Overall Reading</Text>
              </View>
              <Text style={styles.readingText}>{reading.summary}</Text>
            </View>
          </Animated.View>

          {/* Premium Content */}
          {reading.deeperInsights && (
            <Animated.View entering={FadeInDown.duration(600).delay(500)} style={styles.section}>
              <View style={[commonStyles.glassCard, styles.premiumCard]}>
                <View style={styles.sectionHeader}>
                  <IconSymbol name="crown.fill" size={24} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Deeper Insights</Text>
                </View>
                <Text style={styles.readingText}>{reading.deeperInsights}</Text>
              </View>
            </Animated.View>
          )}

          {reading.prompts && reading.prompts.length > 0 && (
            <Animated.View entering={FadeInDown.duration(600).delay(600)} style={styles.section}>
              <View style={[commonStyles.glassCard, styles.premiumCard]}>
                <View style={styles.sectionHeader}>
                  <IconSymbol name="lightbulb.fill" size={24} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Reflective Prompts</Text>
                </View>
                {reading.prompts.map((prompt: string, index: number) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.listNumber}>{index + 1}.</Text>
                    <Text style={styles.listText}>{prompt}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {reading.practices && reading.practices.length > 0 && (
            <Animated.View entering={FadeInDown.duration(600).delay(700)} style={styles.section}>
              <View style={[commonStyles.glassCard, styles.premiumCard]}>
                <View style={styles.sectionHeader}>
                  <IconSymbol name="figure.mind.and.body" size={24} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Spiritual Practices</Text>
                </View>
                {reading.practices.map((practice: string, index: number) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.listNumber}>{index + 1}.</Text>
                    <Text style={styles.listText}>{practice}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Disclaimer */}
          <Animated.View entering={FadeInDown.duration(600).delay(800)} style={styles.section}>
            <Text style={[commonStyles.textSecondary, styles.disclaimer]}>
              ⚠️ For entertainment purposes only. Not medical, legal, or financial advice.
            </Text>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.duration(600).delay(900)} style={styles.actions}>
            <TouchableOpacity
              style={[buttonStyles.primary, styles.actionButton]}
              onPress={handleClose}
            >
              <Text style={buttonStyles.text}>Done</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(178, 255, 89, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    marginBottom: 0,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  emoji: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'SpaceGrotesk',
  },
  readingText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    opacity: 0.9,
  },
  premiumCard: {
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: 'rgba(178, 255, 89, 0.05)',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  listNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    minWidth: 24,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
    opacity: 0.9,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
  },
});
