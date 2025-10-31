
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [readsRemaining, setReadsRemaining] = useState(20);
  const [maxReads] = useState(20);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCapturePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera access to capture your palm photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Photo captured:', result.assets[0].uri);
        handleAnalyzePalm(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleUploadPhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please grant photo library access to upload your palm photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Photo selected:', result.assets[0].uri);
        handleAnalyzePalm(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleAnalyzePalm = async (imageUri: string) => {
    setIsAnalyzing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Simulate analysis (in production, this would call Supabase Edge Function)
    setTimeout(() => {
      setIsAnalyzing(false);
      setReadsRemaining(prev => Math.max(0, prev - 1));
      
      Alert.alert(
        'Analysis Complete! 🔮',
        'Your palm reading is ready. In the full version, you would see detailed insights about your Heart, Head, Life, and Fate lines.',
        [
          {
            text: 'View Reading',
            onPress: () => {
              console.log('Navigate to reading results');
              // In production: router.push('/reading-result')
            },
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    }, 2000);
  };

  const progressPercentage = (readsRemaining / maxReads) * 100;

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
              Destiny Lines
            </Text>
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
                <Text style={styles.meterTitle}>Readings Remaining</Text>
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

              {readsRemaining <= 5 && (
                <View style={styles.warningContainer}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#FF9500" />
                  <Text style={styles.warningText}>
                    Running low on readings! Upgrade for more.
                  </Text>
                </View>
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

              {/* Capture Buttons */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.captureButton]}
                  onPress={handleCapturePhoto}
                  disabled={isAnalyzing || readsRemaining === 0}
                >
                  <IconSymbol name="camera.fill" size={20} color={colors.background} />
                  <Text style={[buttonStyles.text, styles.buttonText]}>
                    {isAnalyzing ? 'Analyzing...' : 'Take Photo'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[buttonStyles.secondary, styles.uploadButton]}
                  onPress={handleUploadPhoto}
                  disabled={isAnalyzing || readsRemaining === 0}
                >
                  <IconSymbol name="photo.fill" size={20} color={colors.primary} />
                  <Text style={[styles.uploadButtonText]}>
                    Upload Photo
                  </Text>
                </TouchableOpacity>
              </View>

              {readsRemaining === 0 && (
                <View style={styles.noReadsContainer}>
                  <Text style={styles.noReadsText}>
                    You&apos;ve used all your readings for this period.
                  </Text>
                  <TouchableOpacity
                    style={styles.upgradeLink}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/paywall');
                    }}
                  >
                    <Text style={styles.upgradeLinkText}>Upgrade Plan →</Text>
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
