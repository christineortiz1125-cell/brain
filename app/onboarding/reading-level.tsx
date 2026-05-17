import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/OnboardingStep';
import { READING_LEVELS, COLORS, SPACING, FONT_SIZES } from '@/constants';
import { useReadingProfile } from '@/hooks/useReadingProfile';

export default function ReadingLevelScreen() {
  const router = useRouter();
  const { profile, update } = useReadingProfile();
  const [selected, setSelected] = useState(profile.readingLevel);

  const handleNext = async () => {
    await update({ readingLevel: selected });
    router.push('/onboarding/language');
  };

  return (
    <OnboardingStep
      step={1}
      total={3}
      title="What's your reading level?"
      subtitle="Brain adjusts how it simplifies text for you. You can change this any time."
      onNext={handleNext}
      nextLabel="Continue"
    >
      <View style={styles.options}>
        {READING_LEVELS.map((level) => (
          <Pressable
            key={level.value}
            style={[styles.option, selected === level.value && styles.optionSelected]}
            onPress={() => setSelected(level.value)}
            accessibilityRole="radio"
            accessibilityLabel={`${level.label}: ${level.description}`}
            accessibilityState={{ checked: selected === level.value }}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.radio, selected === level.value && styles.radioSelected]}>
                {selected === level.value && <View style={styles.radioDot} />}
              </View>
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.levelLabel, selected === level.value && styles.levelLabelActive]}>
                {level.label}
              </Text>
              <Text style={styles.levelDesc}>{level.description}</Text>
            </View>
            <View style={[styles.badge, selected === level.value && styles.badgeActive]}>
              <Text style={[styles.badgeNum, selected === level.value && styles.badgeNumActive]}>
                {level.value}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: SPACING.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 44,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim + '40',
  },
  optionLeft: {
    marginRight: SPACING.md,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  optionText: {
    flex: 1,
  },
  levelLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  levelLabelActive: {
    color: COLORS.text,
  },
  levelDesc: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: COLORS.primary,
  },
  badgeNum: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  badgeNumActive: {
    color: COLORS.white,
  },
});
