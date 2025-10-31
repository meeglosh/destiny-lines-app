
import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Skip auth flow and go directly to paywall
  return <Redirect href="/paywall" />;
}
