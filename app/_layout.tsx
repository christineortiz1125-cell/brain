import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SecureStore from 'expo-secure-store';
import { getReadingProfile } from '@/lib/db';
import { useAppStore } from '@/store';
import 'react-native-url-polyfill/auto';

const ONBOARDING_KEY = 'brain_onboarding_complete';

export default function RootLayout() {
  const setProfile = useAppStore((s) => s.setProfile);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          OpenDyslexic: require('../assets/fonts/OpenDyslexic-Regular.otf'),
        });
      } catch {
        // Font load failure is non-fatal; system font used as fallback
      }

      const [profile, onboardingFlag] = await Promise.allSettled([
        getReadingProfile(),
        SecureStore.getItemAsync(ONBOARDING_KEY),
      ]);

      const onboardingComplete =
        onboardingFlag.status === 'fulfilled' && onboardingFlag.value === 'true';

      if (profile.status === 'fulfilled') {
        setProfile({
          readingLevel: profile.value.readingLevel,
          targetLanguage: profile.value.targetLanguage,
          fontSize: profile.value.fontSize,
          dyslexicFont: profile.value.dyslexicFont,
          onboardingComplete,
        });
      } else {
        setProfile({ onboardingComplete });
      }
    })();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0F' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="output"
          options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
        />
      </Stack>
    </>
  );
}
