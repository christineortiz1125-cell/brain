import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ModeCard } from '@/components/ModeCard';
import { COLORS, SPACING, FONT_SIZES, MODES, type Mode } from '@/constants';
import { useAppStore } from '@/store';
import { useReadingProfile } from '@/hooks/useReadingProfile';

export default function HomeScreen() {
  const router = useRouter();
  const activeMode = useAppStore((s) => s.session.activeMode);
  const setActiveMode = useAppStore((s) => s.setActiveMode);
  const clearSession = useAppStore((s) => s.clearSession);
  const { profile } = useReadingProfile();

  const handleModeSelect = (mode: Mode) => {
    setActiveMode(mode);
  };

  const handleCapture = () => {
    clearSession();
    router.push('/(tabs)/camera');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.wordmark} accessibilityRole="header">
            Brain
          </Text>
          <Text style={styles.tagline}>Reading assistance for Ray-Ban glasses</Text>
        </View>

        <View style={styles.activeModeBadge}>
          <Text style={styles.activeModeLabel}>Active mode</Text>
          <Text style={styles.activeModeValue}>{activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}</Text>
        </View>

        <View style={styles.grid}>
          {MODES.map((mode) => (
            <ModeCard
              key={mode}
              mode={mode}
              isActive={activeMode === mode}
              onPress={() => handleModeSelect(mode)}
            />
          ))}
        </View>

        <Pressable
          style={styles.captureBtn}
          onPress={handleCapture}
          accessibilityRole="button"
          accessibilityLabel={`Capture text in ${activeMode} mode`}
          accessibilityHint="Opens the camera to capture text"
        >
          <Text style={styles.captureBtnIcon}>📷</Text>
          <Text style={styles.captureBtnLabel}>Capture text</Text>
        </Pressable>

        <View style={styles.profileHint}>
          <Text style={styles.profileHintText}>
            Level {profile.readingLevel} · {profile.targetLanguage.toUpperCase()} · {profile.fontSize}pt
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  header: {
    gap: 4,
  },
  wordmark: {
    color: COLORS.text,
    fontSize: FONT_SIZES.display,
    fontWeight: '900',
    letterSpacing: -1,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  activeModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeModeLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  activeModeValue: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    gap: SPACING.sm,
    minHeight: 60,
  },
  captureBtnIcon: {
    fontSize: 22,
  },
  captureBtnLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  profileHint: {
    alignItems: 'center',
  },
  profileHintText: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.xs,
  },
});
