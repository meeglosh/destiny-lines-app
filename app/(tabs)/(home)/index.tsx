
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { analyzePalm, fetchReadingQuota, ReadingQuota } from '@/lib/palmReading';
import { FREE_READINGS } from '@/utils/constants';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [quota, setQuota] = useState<ReadingQuota | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadQuota = useCallback(async () => {
    const result = await fetchReadingQuota();
    if (result) setQuota(result);
  }, []);

  // Refresh whenever the tab regains focus (e.g. after subscribing on the paywall)
  useFocusEffect(
    useCallback(() => {
      loadQuota();
    }, [loadQuota])
  );

  const readsRemaining = quota?.remaining ?? FREE_READINGS;
  const maxReads = quota?.readsLimit ?? FREE_READINGS;
  const isFreeTier = (quota?.tier ?? 'free') === 'free';

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  };

  const handleCapturePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera access in Settings to capture your palm photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync(pickerOptions);
      if (!result.canceled && result.assets[0]?.base64) {
        handleAnalyzePalm(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleUploadPhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please grant photo library access in Settings to upload your palm photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (!result.canceled && result.assets[0]?.base64) {
        handleAnalyzePalm(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleAnalyzePalm = async (imageBase64: string) => {
    setIsAnalyzing(true);

    try {
      const result = await analyzePalm(imageBase64);

      if (!result.ok || !result.reading) {
        if (result.code === 'limit_reached') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert(
            'No Readings Left',
            result.reason ?? 'You have used all your readings.',
            [
              { text: 'Not Now', style: 'cancel' },
              { text: 'See Plans', onPress: () => router.push('/paywall') },
            ]
          );
        } else if (result.code === 'not_a_palm') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert(
            'Palm Not Detected',
            result.reason ??
              'We could not detect a palm in that photo. Try a clear, well-lit photo of your open palm.'
          );
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert(
            'Analysis Failed',
            result.reason ?? 'Something went wrong. Please try again.'
          );
        }
        return;
      }

      if (typeof result.remaining === 'number' && quota) {
        setQuota({ ...quota, remaining: result.remaining });
      } else {
        loadQuota();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: '/reading-result',
        params: { reading: JSON.stringify(result.reading) },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const progressPercentage = maxReads > 0 ? (readsRemaining / maxReads) * 100 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.secondary, colors.background]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
            <Text style={[commonStyles.title, styles.title]}>Destiny Lines</Text>
            <Text style={[commonStyles.textSecondary, styles.subtitle]}>
              Discover the secrets in your palm
            </Text>
          </Animated.View>

          {/* Usage Meter */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.meterSection}
          >
            <View style={commonStyles.glassCard}>
              <View style={styles.meterHeader}>
                <Text style={styles.meterTitle}>
                  {isFreeTier ? 'Free Readings' : 'Readings This Month'}
                </Text>
                <Text style={styles.meterCount}>
                  {readsRemaining} / {maxReads}
                </Text>
              </View>

              {/* Progress Ring */}
              <View style={styles.progressRing}>
                <View style={styles.progressRingInner}>
                  <Text style={styles.progressText}>{readsRemaining}</Text>
                  <Text style={styles.progressLabel}>left</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor:
                        progressPercentage > 50
                          ? colors.primary
                          : progressPercentage > 20
                          ? '#FF9500'
                          : '#FF3B30',
                    },
                  ]}
                />
              </View>

              {readsRemaining <= 2 && readsRemaining > 0 && (
                <TouchableOpacity
                  style={styles.warningContainer}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/paywall');
                  }}
                >
                  <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#FF9500" />
                  <Text style={styles.warningText}>
                    Running low on readings! Tap to see plans.
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Capture Section */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={styles.captureSection}
          >
            <View style={commonStyles.glassCard}>
              <View style={styles.captureIcon}>
                <IconSymbol name="hand.raised.fill" size={64} color={colors.primary} />
              </View>

              <Text style={styles.captureTitle}>Ready for Your Reading?</Text>
              <Text style={[commonStyles.textSecondary, styles.captureDescription]}>
                Capture a clear photo of your palm in good lighting for the most accurate reading.
              </Text>

              {/* Analyzing Indicator */}
              {isAnalyzing && (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.analyzingText}>Analyzing your palm...</Text>
                  <Text style={[commonStyles.textSecondary, styles.analyzingSubtext]}>
                    Reading the lines of your destiny
                  </Text>
                </View>
              )}

              {/* Capture Buttons */}
              {!isAnalyzing && (
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[buttonStyles.primary, styles.captureButton]}
                    onPress={handleCapturePhoto}
                    disabled={isAnalyzing || readsRemaining === 0}
                  >
                    <IconSymbol name="camera.fill" size={20} color={colors.background} />
                    <Text style={[buttonStyles.text, styles.buttonText]}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[buttonStyles.secondary, styles.uploadButton]}
                    onPress={handleUploadPhoto}
                    disabled={isAnalyzing || readsRemaining === 0}
                  >
                    <IconSymbol name="photo.fill" size={20} color={colors.primary} />
                    <Text style={[styles.uploadButtonText]}>Upload Photo</Text>
                  </TouchableOpacity>
                </View>
              )}

              {readsRemaining === 0 && !isAnalyzing && (
                <View style={styles.noReadsContainer}>
                  <Text style={styles.noReadsText}>
                    {isFreeTier
                      ? "You've used all your free readings."
                      : "You've used all your readings for this month."}
                  </Text>
                  <TouchableOpacity
                    style={styles.upgradeLink}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/paywall');
                    }}
                  >
                    <Text style={styles.upgradeLinkText}>
                      {isFreeTier ? 'Subscribe for More →' : 'Upgrade Plan →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Tips Section */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(600)}
            style={styles.tipsSection}
          >
            <Text style={styles.tipsTitle}>Tips for Best Results</Text>
            <View style={commonStyles.glassCard}>
              <View style={styles.tipItem}>
                <View style={styles.tipIcon}>
                  <IconSymbol name="sun.max.fill" size={20} color={colors.primary} />
                </View>
                <Text style={styles.tipText}>Use natural lighting or bright indoor light</Text>
              </View>

              <View style={styles.tipItem}>
                <View style={styles.tipIcon}>
                  <IconSymbol name="hand.raised" size={20} color={colors.primary} />
                </View>
                <Text style={styles.tipText}>Keep your palm flat and fingers spread</Text>
              </View>

              <View style={styles.tipItem}>
                <View style={styles.tipIcon}>
                  <IconSymbol name="camera.viewfinder" size={20} color={colors.primary} />
                </View>
                <Text style={styles.tipText}>Center your palm in the frame</Text>
              </View>

              <View style={styles.tipItem}>
                <View style={styles.tipIcon}>
                  <IconSymbol name="sparkles" size={20} color={colors.primary} />
                </View>
                <Text style={styles.tipText}>Ensure the image is clear and in focus</Text>
              </View>
            </View>
          </Animated.View>

          {/* Disclaimer */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(800)}
            style={styles.disclaimerSection}
          >
            <Text style={[commonStyles.textSecondary, styles.disclaimer]}>
              ⚠️ For entertainment purposes only. Not medical, legal, or financial advice.
              Palm photos are analyzed and never stored.
            </Text>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Extra padding for tab bar
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  meterSection: {
    marginBottom: 24,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  meterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  meterCount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'SpaceGrotesk',
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: colors.primary,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
  },
  progressRingInner: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'SpaceGrotesk',
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '500',
  },
  captureSection: {
    marginBottom: 24,
  },
  captureIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  captureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'SpaceGrotesk',
  },
  captureDescription: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 16,
  },
  analyzingSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  buttonGroup: {
    gap: 12,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  noReadsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  noReadsText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeLink: {
    paddingVertical: 8,
  },
  upgradeLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  disclaimerSection: {
    marginBottom: 24,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});
