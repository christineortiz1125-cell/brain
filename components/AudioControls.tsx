import React from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

interface AudioControlsProps {
  isSpeaking: boolean;
  isLoading?: boolean;
  onPlay: () => void;
  onStop: () => void;
  onReplay?: () => void;
  disabled?: boolean;
}

export function AudioControls({
  isSpeaking,
  isLoading = false,
  onPlay,
  onStop,
  onReplay,
  disabled = false,
}: AudioControlsProps) {
  return (
    <View style={styles.row} accessibilityRole="toolbar" accessibilityLabel="Audio playback controls">
      <Pressable
        style={[styles.primaryBtn, disabled && styles.disabled]}
        onPress={isSpeaking ? onStop : onPlay}
        disabled={disabled || isLoading}
        accessibilityRole="button"
        accessibilityLabel={isSpeaking ? 'Stop reading' : 'Read aloud'}
        accessibilityHint={isSpeaking ? 'Stops audio playback' : 'Reads the processed text aloud'}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <Text style={styles.primaryIcon}>{isSpeaking ? '⏹' : '▶'}</Text>
        )}
        <Text style={styles.primaryLabel}>
          {isLoading ? 'Loading…' : isSpeaking ? 'Stop' : 'Read aloud'}
        </Text>
      </Pressable>

      {onReplay && (
        <Pressable
          style={[styles.secondaryBtn, disabled && styles.disabled]}
          onPress={onReplay}
          disabled={disabled || isSpeaking}
          accessibilityRole="button"
          accessibilityLabel="Replay from beginning"
        >
          <Text style={styles.secondaryIcon}>↺</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    minHeight: 44,
  },
  primaryIcon: {
    fontSize: 16,
    color: COLORS.white,
  },
  primaryLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  secondaryBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryIcon: {
    fontSize: 20,
    color: COLORS.text,
  },
  disabled: {
    opacity: 0.4,
  },
});
