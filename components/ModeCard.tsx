import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  AccessibilityRole,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, SPACING, FONT_SIZES, MODE_META, type Mode } from '@/constants';

interface ModeCardProps {
  mode: Mode;
  isActive: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ModeCard({ mode, isActive, onPress }: ModeCardProps) {
  const scale = useSharedValue(1);
  const meta = MODE_META[mode];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.card, isActive && { borderColor: meta.color, borderWidth: 2 }, animatedStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityLabel={`${meta.label} mode. ${meta.description}`}
      accessibilityState={{ selected: isActive }}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
      </View>
      <Text style={styles.label}>{meta.label}</Text>
      <Text style={styles.description}>{meta.description}</Text>
      {isActive && <View style={[styles.activeDot, { backgroundColor: meta.color }]} />}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 140,
    minWidth: '46%',
    alignItems: 'flex-start',
    position: 'relative',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
  },
  activeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
