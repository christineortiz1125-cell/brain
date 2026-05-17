import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { OnboardingStep } from '@/components/OnboardingStep';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import { useReadingProfile } from '@/hooks/useReadingProfile';
import { useAppStore } from '@/store';

const ONBOARDING_KEY = 'brain_onboarding_complete';

const FONT_SIZE_OPTIONS = [14, 16, 18, 20, 24, 28];

export default function DisplayScreen() {
  const router = useRouter();
  const { profile, update } = useReadingProfile();
  const setProfile = useAppStore((s) => s.setProfile);

  const [fontSize, setFontSize] = useState(profile.fontSize);
  const [dyslexicFont, setDyslexicFont] = useState(profile.dyslexicFont);

  const handleFinish = async () => {
    await Promise.all([
      update({ fontSize, dyslexicFont }),
      SecureStore.setItemAsync(ONBOARDING_KEY, 'true'),
    ]);
    setProfile({ onboardingComplete: true });
    router.replace('/(tabs)');
  };

  const previewText = 'The quick brown fox jumps over the lazy dog.';

  return (
    <OnboardingStep
      step={3}
      total={3}
      title="Make it readable"
      subtitle="Adjust text size and font to match how you read best."
      onNext={handleFinish}
      onBack={() => router.back()}
      nextLabel="Get started"
    >
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Font size</Text>
        <View style={styles.sizeRow}>
          {FONT_SIZE_OPTIONS.map((size) => (
            <Pressable
              key={size}
              style={[styles.sizeChip, fontSize === size && styles.sizeChipActive]}
              onPress={() => setFontSize(size)}
              accessibilityRole="radio"
              accessibilityLabel={`Font size ${size}`}
              accessibilityState={{ checked: fontSize === size }}
            >
              <Text style={[styles.sizeChipText, fontSize === size && styles.sizeChipTextActive]}>
                {size}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.sectionLabel}>OpenDyslexic font</Text>
            <Text style={styles.toggleSub}>Designed to improve readability for dyslexia</Text>
          </View>
          <Switch
            value={dyslexicFont}
            onValueChange={setDyslexicFont}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
            accessibilityLabel="Enable OpenDyslexic font"
          />
        </View>
      </View>

      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Preview</Text>
        <View style={styles.previewBox}>
          <Text
            style={[
              styles.previewText,
              { fontSize, fontFamily: dyslexicFont ? 'OpenDyslexic' : undefined },
            ]}
          >
            {previewText}
          </Text>
        </View>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  sizeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    minWidth: 44,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  sizeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim + '40',
  },
  sizeChipText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  sizeChipTextActive: {
    color: COLORS.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleSub: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  preview: {
    flex: 1,
    marginTop: SPACING.sm,
  },
  previewLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewText: {
    color: COLORS.text,
    lineHeight: 28,
  },
});
