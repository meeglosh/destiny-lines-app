
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { DISCLAIMER_TEXT, TOS_TEXT, LEGAL_URLS } from '@/utils/constants';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [agreedToTOS, setAgreedToTOS] = useState(false);

  const steps = [
    {
      title: 'Welcome to\nDestiny Lines',
      subtitle: 'Discover the secrets hidden in your palm',
      description: 'AI-powered palm reading that reveals insights about your life, personality, and future.',
    },
    {
      title: 'Entertainment\nOnly',
      subtitle: 'Important Disclaimer',
      description: DISCLAIMER_TEXT,
    },
    {
      title: 'Terms of\nService',
      subtitle: 'Please read and agree',
      description: TOS_TEXT,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (agreedToTOS) {
      router.push('/auth');
    }
  };

  const handleSkip = () => {
    setCurrentStep(steps.length - 1);
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
          <Animated.View
            entering={FadeInUp.duration(600)}
            style={styles.header}
          >
            <Text style={[commonStyles.title, styles.title]}>
              {steps[currentStep].title}
            </Text>
            <Text style={[commonStyles.subtitle, styles.subtitle]}>
              {steps[currentStep].subtitle}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.descriptionContainer}
          >
            <View style={commonStyles.glassCard}>
              <Text style={[commonStyles.text, styles.description]}>
                {steps[currentStep].description}
              </Text>
            </View>
          </Animated.View>

          {currentStep === steps.length - 1 && (
            <Animated.View
              entering={FadeInDown.duration(600).delay(400)}
              style={styles.checkboxContainer}
            >
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAgreedToTOS(!agreedToTOS)}
              >
                <View style={[styles.checkboxBox, agreedToTOS && styles.checkboxBoxChecked]}>
                  {agreedToTOS && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={commonStyles.text}>I agree to the Terms of Service</Text>
              </TouchableOpacity>
              <View style={styles.legalLinks}>
                <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.terms)}>
                  <Text style={styles.legalLinkText}>Read Terms of Service</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)}>
                  <Text style={styles.legalLinkText}>Read Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          <View style={styles.footer}>
            <View style={styles.pagination}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentStep && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {currentStep < steps.length - 1 && (
                <TouchableOpacity
                  style={[buttonStyles.outline, styles.button]}
                  onPress={handleSkip}
                >
                  <Text style={buttonStyles.textOutline}>Skip</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  buttonStyles.primary,
                  styles.button,
                  currentStep === steps.length - 1 && !agreedToTOS && styles.buttonDisabled,
                ]}
                onPress={handleNext}
                disabled={currentStep === steps.length - 1 && !agreedToTOS}
              >
                <Text style={buttonStyles.text}>
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.primary,
  },
  descriptionContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 40,
  },
  description: {
    textAlign: 'center',
    lineHeight: 28,
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 8,
  },
  legalLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    gap: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
