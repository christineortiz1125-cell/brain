import React, { useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '@/constants';

interface TextDisplayProps {
  text: string;
  fontSize: number;
  dyslexicFont: boolean;
  isStreaming?: boolean;
  onWordPress?: (word: string) => void;
  defineMode?: boolean;
}

export function TextDisplay({
  text,
  fontSize,
  dyslexicFont,
  isStreaming = false,
  onWordPress,
  defineMode = false,
}: TextDisplayProps) {
  const fontFamily = dyslexicFont ? FONTS.dyslexic : FONTS.regular;
  const lineHeight = Math.round(fontSize * 1.7);

  const renderWords = useCallback(() => {
    if (!defineMode || !onWordPress) {
      return (
        <Text
          style={[styles.text, { fontSize, fontFamily, lineHeight }]}
          accessibilityRole="text"
        >
          {text}
          {isStreaming && <Text style={styles.cursor}>▋</Text>}
        </Text>
      );
    }

    const words = text.split(/(\s+)/);
    return (
      <Text style={[styles.text, { fontSize, fontFamily, lineHeight }]}>
        {words.map((segment, i) => {
          if (/^\s+$/.test(segment)) return segment;
          const word = segment.replace(/[^a-zA-Z'-]/g, '');
          if (!word) return segment;
          return (
            <Pressable
              key={i}
              onPress={() => onWordPress(word)}
              accessibilityRole="button"
              accessibilityLabel={`Define ${word}`}
              style={styles.wordPressable}
            >
              <Text style={[styles.tapWord, { fontSize, fontFamily, lineHeight }]}>
                {segment}
              </Text>
            </Pressable>
          );
        })}
        {isStreaming && <Text style={styles.cursor}>▋</Text>}
      </Text>
    );
  }, [text, fontSize, fontFamily, lineHeight, isStreaming, defineMode, onWordPress]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {renderWords()}
      {!text && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No text yet. Capture something to begin.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  text: {
    color: COLORS.text,
  },
  cursor: {
    color: COLORS.primary,
  },
  tapWord: {
    color: COLORS.text,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.primary + '66',
  },
  wordPressable: {
    // Inline, so no specific layout needed
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
});
