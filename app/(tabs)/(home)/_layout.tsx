
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // Hide header to allow gradient to extend to top
          title: 'Home'
        }}
      />
    </Stack>
  );
}
