
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const carouselSlides = [
  {
    icon: 'hand.raised.fill' as const,
    title: 'Welcome to\nDestiny Lines',
    subtitle: 'The Magical AI Palm Reader',
    description: 'Discover the ancient art of palmistry powered by cutting-edge AI technology. Your destiny awaits in the lines of your palm.',
  },
  {
    icon: 'sparkles' as const,
    title: 'AI-Powered\nInsights',
    subtitle: 'Advanced Palm Analysis',
    description: 'Our GPT-4 Vision AI analyzes your palm lines with incredible accuracy, revealing insights about your personality, relationships, and life path.',
  },
  {
    icon: 'lock.shield.fill' as const,
    title: 'Privacy\nFirst',
    subtitle: 'Your Data is Safe',
    description: 'All palm images are automatically deleted within 10 minutes. We never store your photos permanently. Your privacy is our priority.',
  },
  {
    icon: 'chart.line.uptrend.xyaxis' as const,
    title: 'Detailed\nReadings',
    subtitle: 'Comprehensive Analysis',
    description: 'Get in-depth readings of your Heart, Head, Life, and Fate lines, plus special marks and personalized guidance for your journey.',
  },
];

export default function IntroScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentIndex < carouselSlides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    } else {
      router.replace('/paywall');
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/paywall');
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <LinearGradient
        colors={[colors.background, colors.secondary, colors.background]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.container}>
          {/* Skip Button */}
          {currentIndex < carouselSlides.length - 1 && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.skipContainer}>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Carousel */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollView}
          >
            {carouselSlides.map((slide, index) => (
              <View key={index} style={styles.slide}>
                <Animated.View
                  entering={FadeInUp.duration(600).delay(200)}
                  style={styles.iconContainer}
                >
                  <View style={styles.iconCircle}>
                    {index === 0 ? (
                      <Image
                        source={require('@/assets/images/852cc84f-9c71-48c9-b534-1f0a40211835.png')}
                        style={styles.heroImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <IconSymbol name={slide.icon} size={80} color={colors.primary} />
                    )}
                  </View>
                </Animated.View>

                <Animated.View
                  entering={FadeInUp.duration(600).delay(400)}
                  style={styles.textContainer}
                >
                  <Text style={[commonStyles.title, styles.title]}>
                    {slide.title}
                  </Text>
                  <Text style={[commonStyles.subtitle, styles.subtitle]}>
                    {slide.subtitle}
                  </Text>
                  <Text style={[commonStyles.text, styles.description]}>
                    {slide.description}
                  </Text>
                </Animated.View>
              </View>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.paginationContainer}
          >
            <View style={styles.pagination}>
              {carouselSlides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </Animated.View>

          {/* Next/Get Started Button */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={styles.buttonContainer}
          >
            <TouchableOpacity
              style={[buttonStyles.primary, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={buttonStyles.text}>
                {currentIndex === carouselSlides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Disclaimer */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(600)}
            style={styles.disclaimerContainer}
          >
            <Text style={[commonStyles.textSecondary, styles.disclaimer]}>
              Entertainment purposes only • Ages 16+ • Not medical advice
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  skipContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(178, 255, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(178, 255, 89, 0.3)',
    overflow: 'hidden',
  },
  heroImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 44,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.primary,
    marginBottom: 24,
    fontSize: 18,
  },
  description: {
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 8,
  },
  paginationContainer: {
    paddingVertical: 20,
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
    backgroundColor: 'rgba(178, 255, 89, 0.3)',
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 32,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  nextButton: {
    paddingVertical: 18,
  },
  disclaimerContainer: {
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});
