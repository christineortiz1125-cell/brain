import { Redirect } from 'expo-router';
import { useAppStore } from '@/store';

export default function RootIndex() {
  const onboardingComplete = useAppStore((s) => s.profile.onboardingComplete);

  if (!onboardingComplete) {
    return <Redirect href="/onboarding/reading-level" />;
  }
  return <Redirect href="/(tabs)" />;
}
