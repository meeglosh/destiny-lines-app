
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { colors, commonStyles } from '@/styles/commonStyles';

export default function Index() {
  const { user, session, loading } = useAuthStore();

  console.log('Index - loading:', loading, 'user:', user?.id, 'session:', session?.user?.id);

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // No session - go to onboarding
  if (!session) {
    return <Redirect href="/onboarding" />;
  }

  // Has session but no user tier - go to paywall
  if (!user?.tier) {
    return <Redirect href="/paywall" />;
  }

  // Has session and tier - go to main app
  return <Redirect href="/(tabs)/home" />;
}
