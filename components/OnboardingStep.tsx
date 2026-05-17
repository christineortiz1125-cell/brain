import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

interface OnboardingStepProps {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export function OnboardingStep({
  step,
  total,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Continue',
  nextDisabled = false,
}: OnboardingStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i + 1 === step && styles.dotActive, i + 1 < step && styles.dotDone]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>
          {step} of {total}
        </Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.content}>{children}</View>

      <View style={styles.footer}>
        {onBack && (
          <Pressable
            style={styles.backBtn}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.nextBtn, nextDisabled && styles.nextDisabled]}
          onPress={onNext}
          disabled={nextDisabled}
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
        >
          <Text style={styles.nextLabel}>{nextLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  dotDone: {
    backgroundColor: COLORS.primaryDim,
  },
  stepLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    lineHeight: 34,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  backBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 2,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  nextDisabled: {
    opacity: 0.4,
  },
  nextLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
});
