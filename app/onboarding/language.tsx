import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/OnboardingStep';
import { SUPPORTED_LANGUAGES, COLORS, SPACING, FONT_SIZES, type LanguageCode } from '@/constants';
import { useReadingProfile } from '@/hooks/useReadingProfile';

export default function LanguageScreen() {
  const router = useRouter();
  const { profile, update } = useReadingProfile();
  const [selected, setSelected] = useState<LanguageCode>(profile.targetLanguage);
  const [query, setQuery] = useState('');

  const filtered = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.label.toLowerCase().includes(query.toLowerCase()) ||
      l.nativeLabel.toLowerCase().includes(query.toLowerCase())
  );

  const handleNext = async () => {
    await update({ targetLanguage: selected });
    router.push('/onboarding/display');
  };

  return (
    <OnboardingStep
      step={2}
      total={3}
      title="What language do you read in?"
      subtitle="Translate mode outputs to this language. Brain reads English by default and translates on request."
      onNext={handleNext}
      onBack={() => router.back()}
    >
      <TextInput
        style={styles.search}
        placeholder="Search languages…"
        placeholderTextColor={COLORS.textMuted}
        value={query}
        onChangeText={setQuery}
        accessibilityLabel="Search languages"
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.map((lang) => (
          <Pressable
            key={lang.code}
            style={[styles.row, selected === lang.code && styles.rowSelected]}
            onPress={() => setSelected(lang.code as LanguageCode)}
            accessibilityRole="radio"
            accessibilityLabel={`${lang.label} — ${lang.nativeLabel}`}
            accessibilityState={{ checked: selected === lang.code }}
          >
            <View style={styles.rowText}>
              <Text style={[styles.label, selected === lang.code && styles.labelActive]}>
                {lang.label}
              </Text>
              <Text style={styles.native}>{lang.nativeLabel}</Text>
            </View>
            {selected === lang.code && (
              <Text style={styles.check} accessibilityElementsHidden>
                ✓
              </Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    marginBottom: 4,
    minHeight: 44,
  },
  rowSelected: {
    backgroundColor: COLORS.primaryDim + '40',
  },
  rowText: {
    flex: 1,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  labelActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  native: {
    color: COLORS.textDim,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  check: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});
