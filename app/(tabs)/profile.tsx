import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, READING_LEVELS, SUPPORTED_LANGUAGES, type LanguageCode } from '@/constants';
import { useReadingProfile } from '@/hooks/useReadingProfile';
import { getProfileStats, getWordLookups, type WordLookup } from '@/lib/db';

interface Stats {
  totalSessions: number;
  totalWords: number;
  uniqueWords: number;
  sessionsByMode: Record<string, number>;
}

export default function ProfileScreen() {
  const { profile, update } = useReadingProfile();
  const [stats, setStats] = useState<Stats | null>(null);
  const [wordLookups, setWordLookups] = useState<WordLookup[]>([]);
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    getProfileStats().then(setStats).catch(console.error);
    getWordLookups(20).then(setWordLookups).catch(console.error);
  }, []);

  const currentLevel = READING_LEVELS.find((l) => l.value === profile.readingLevel);
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === profile.targetLanguage);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title} accessibilityRole="header">
          Your profile
        </Text>

        <View style={styles.statsGrid}>
          <StatCard
            value={stats?.totalSessions ?? '—'}
            label="Sessions"
            icon="📚"
          />
          <StatCard
            value={stats?.totalWords ?? '—'}
            label="Words read"
            icon="✍️"
          />
          <StatCard
            value={stats?.uniqueWords ?? '—'}
            label="Words looked up"
            icon="🔍"
          />
          <StatCard
            value={stats ? Object.values(stats.sessionsByMode).reduce((a, b) => a + b, 0) : '—'}
            label="Total uses"
            icon="⚡"
          />
        </View>

        {stats?.sessionsByMode && Object.keys(stats.sessionsByMode).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sessions by mode</Text>
            {Object.entries(stats.sessionsByMode).map(([mode, count]) => (
              <View key={mode} style={styles.modeRow}>
                <Text style={styles.modeRowLabel}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
                <View style={styles.modeBarWrap}>
                  <View
                    style={[
                      styles.modeBar,
                      {
                        width: `${Math.min(100, (count / stats.totalSessions) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.modeRowCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Reading level</Text>
              <Text style={styles.settingValue}>
                {currentLevel?.label ?? 'Level ' + profile.readingLevel}
              </Text>
            </View>
            <View style={styles.levelBtns}>
              <Pressable
                style={styles.levelBtn}
                onPress={() => update({ readingLevel: Math.max(1, profile.readingLevel - 1) })}
                disabled={profile.readingLevel <= 1}
                accessibilityRole="button"
                accessibilityLabel="Decrease reading level"
              >
                <Text style={styles.levelBtnText}>−</Text>
              </Pressable>
              <Text style={styles.levelNum}>{profile.readingLevel}</Text>
              <Pressable
                style={styles.levelBtn}
                onPress={() => update({ readingLevel: Math.min(5, profile.readingLevel + 1) })}
                disabled={profile.readingLevel >= 5}
                accessibilityRole="button"
                accessibilityLabel="Increase reading level"
              >
                <Text style={styles.levelBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={styles.settingRow}
            onPress={() => setShowLangModal(true)}
            accessibilityRole="button"
            accessibilityLabel={`Target language: ${currentLang?.label ?? profile.targetLanguage}. Tap to change.`}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Target language</Text>
              <Text style={styles.settingValue}>{currentLang?.label ?? profile.targetLanguage}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Font size</Text>
              <Text style={styles.settingValue}>{profile.fontSize}pt</Text>
            </View>
            <View style={styles.levelBtns}>
              <Pressable
                style={styles.levelBtn}
                onPress={() => update({ fontSize: Math.max(12, profile.fontSize - 2) })}
                accessibilityRole="button"
                accessibilityLabel="Decrease font size"
              >
                <Text style={styles.levelBtnText}>−</Text>
              </Pressable>
              <Text style={styles.levelNum}>{profile.fontSize}</Text>
              <Pressable
                style={styles.levelBtn}
                onPress={() => update({ fontSize: Math.min(36, profile.fontSize + 2) })}
                accessibilityRole="button"
                accessibilityLabel="Increase font size"
              >
                <Text style={styles.levelBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>OpenDyslexic font</Text>
              <Text style={styles.settingValue}>
                {profile.dyslexicFont ? 'On' : 'Off'}
              </Text>
            </View>
            <Switch
              value={profile.dyslexicFont}
              onValueChange={(v) => update({ dyslexicFont: v })}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
              accessibilityLabel="Toggle OpenDyslexic font"
            />
          </View>
        </View>

        {wordLookups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent word lookups</Text>
            {wordLookups.map((lookup) => (
              <View key={lookup.id} style={styles.lookupCard}>
                <Text style={styles.lookupWord}>{lookup.word}</Text>
                <Text style={styles.lookupDef} numberOfLines={2}>
                  {lookup.definition.split('\n')[0]}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.privacyNote}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Images never leave your device. Only extracted text is sent to AI for processing.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showLangModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLangModal(false)}
        accessibilityViewIsModal
      >
        <Pressable style={modalStyles.backdrop} onPress={() => setShowLangModal(false)}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.title}>Target language</Text>
            <ScrollView style={modalStyles.list} keyboardShouldPersistTaps="handled">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const selected = lang.code === profile.targetLanguage;
                return (
                  <Pressable
                    key={lang.code}
                    style={[modalStyles.row, selected && modalStyles.rowSelected]}
                    onPress={() => {
                      update({ targetLanguage: lang.code as LanguageCode });
                      setShowLangModal(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityLabel={`${lang.label} — ${lang.nativeLabel}`}
                    accessibilityState={{ checked: selected }}
                  >
                    <View style={modalStyles.rowText}>
                      <Text style={[modalStyles.label, selected && modalStyles.labelActive]}>
                        {lang.label}
                      </Text>
                      <Text style={modalStyles.native}>{lang.nativeLabel}</Text>
                    </View>
                    {selected && <Text style={modalStyles.check}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: number | string;
  label: string;
  icon: string;
}) {
  return (
    <View style={statStyles.card} accessibilityLabel={`${label}: ${value}`}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '65%',
    gap: SPACING.md,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  title: { color: COLORS.text, fontSize: FONT_SIZES.lg, fontWeight: '800' },
  list: { maxHeight: 400 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.sm,
    borderRadius: 10,
    marginBottom: 2,
    minHeight: 44,
  },
  rowSelected: { backgroundColor: COLORS.primaryDim + '40' },
  rowText: { flex: 1 },
  label: { color: COLORS.textMuted, fontSize: FONT_SIZES.md, fontWeight: '500' },
  labelActive: { color: COLORS.text, fontWeight: '700' },
  native: { color: COLORS.textDim, fontSize: FONT_SIZES.sm, marginTop: 2 },
  check: { color: COLORS.primary, fontSize: 18, fontWeight: '700' },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  icon: { fontSize: 20 },
  value: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
  },
  label: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
});

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
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modeRowLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    width: 70,
  },
  modeBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  modeBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  modeRowCount: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    width: 24,
    textAlign: 'right',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
  },
  settingInfo: {
    gap: 2,
  },
  settingLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  settingValue: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  levelBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelBtnText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  levelNum: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  chevron: {
    color: COLORS.textMuted,
    fontSize: 22,
  },
  lookupCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  lookupWord: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  lookupDef: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  privacyNote: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.accentDim,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  privacyIcon: { fontSize: 18, marginTop: 1 },
  privacyText: {
    flex: 1,
    color: COLORS.accent,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
});
