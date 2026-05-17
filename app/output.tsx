import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TextDisplay } from '@/components/TextDisplay';
import { AudioControls } from '@/components/AudioControls';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  MODE_META,
  READING_LEVELS,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '@/constants';
import { useAppStore } from '@/store';
import { useTTS } from '@/hooks/useTTS';
import { streamClaudeResponse } from '@/lib/claude';
import { saveSession, saveWordLookup, getCachedOutput } from '@/lib/db';

export default function OutputScreen() {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  const activeMode = useAppStore((s) => s.session.activeMode);
  const capturedText = useAppStore((s) => s.session.capturedText);
  const processedText = useAppStore((s) => s.session.processedText);
  const isProcessing = useAppStore((s) => s.session.isProcessing);
  const setProcessedText = useAppStore((s) => s.setProcessedText);
  const appendChunk = useAppStore((s) => s.appendStreamChunk);
  const setIsProcessing = useAppStore((s) => s.setIsProcessing);
  const clearSession = useAppStore((s) => s.clearSession);

  const profile = useAppStore((s) => s.profile);
  const { isSpeaking, play, stop } = useTTS();

  const [fontSize, setFontSize] = useState(profile.fontSize);

  // Simplify: per-session reading level
  const [activeLevel, setActiveLevel] = useState(profile.readingLevel);
  const activeLevelRef = useRef(activeLevel);

  // Translate: per-session target language
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>(profile.targetLanguage);
  const activeLanguageRef = useRef(activeLanguage);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const [isCached, setIsCached] = useState(false);

  // Define word modal
  const [defineWord, setDefineWord] = useState<string | null>(null);
  const [defineResult, setDefineResult] = useState<string>('');
  const [definingWord, setDefiningWord] = useState(false);

  const modeMeta = MODE_META[activeMode];

  const runProcessing = useCallback(
    async (levelOverride?: number, languageOverride?: LanguageCode) => {
      if (!capturedText.trim()) return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsProcessing(true);
      setProcessedText('');
      setIsCached(false);

      const level = levelOverride ?? activeLevelRef.current;
      const language = languageOverride ?? activeLanguageRef.current;

      await streamClaudeResponse({
        mode: activeMode,
        text: capturedText,
        readingLevel: level,
        targetLanguage: language,
        signal: abortRef.current.signal,
        onChunk: (chunk) => {
          appendChunk(chunk);
        },
        onDone: async (fullText) => {
          setIsProcessing(false);
          if (activeMode === 'read' || activeMode === 'simplify') {
            play(fullText);
          }
          const wordCount = fullText.trim().split(/\s+/).length;
          await saveSession({
            mode: activeMode,
            inputText: capturedText,
            outputText: fullText,
            wordCount,
          }).catch(console.error);
        },
        onError: async (err) => {
          setIsProcessing(false);
          if (err.name === 'AbortError') return;
          const cached = await getCachedOutput(activeMode, capturedText).catch(() => null);
          if (cached) {
            setProcessedText(cached);
            setIsCached(true);
          } else {
            Alert.alert('Processing error', err.message);
          }
        },
      });
    },
    [capturedText, activeMode, setIsProcessing, setProcessedText, appendChunk, play]
  );

  useEffect(() => {
    runProcessing();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleLevelChange = useCallback(
    (level: number) => {
      if (level === activeLevelRef.current && isProcessing) return;
      activeLevelRef.current = level;
      setActiveLevel(level);
      stop();
      runProcessing(level, undefined);
    },
    [isProcessing, runProcessing, stop]
  );

  const handleLanguageChange = useCallback(
    (lang: LanguageCode) => {
      activeLanguageRef.current = lang;
      setActiveLanguage(lang);
      setShowLangPicker(false);
      stop();
      runProcessing(undefined, lang);
    },
    [runProcessing, stop]
  );

  const handleWordPress = useCallback(
    async (word: string) => {
      if (activeMode !== 'define') return;
      setDefineWord(word);
      setDefineResult('');
      setDefiningWord(true);

      const abort = new AbortController();
      await streamClaudeResponse({
        mode: 'define',
        text: capturedText,
        word,
        readingLevel: activeLevelRef.current,
        targetLanguage: activeLanguageRef.current,
        signal: abort.signal,
        onChunk: (chunk) => setDefineResult((prev) => prev + chunk),
        onDone: async (fullText) => {
          setDefiningWord(false);
          await saveWordLookup(word, fullText).catch(console.error);
        },
        onError: () => setDefiningWord(false),
      });
    },
    [activeMode, capturedText]
  );

  const handleBack = () => {
    abortRef.current?.abort();
    stop();
    clearSession();
    router.back();
  };

  const displayText = processedText || capturedText;

  const loadingLabel =
    activeMode === 'simplify'
      ? `Simplifying at Level ${activeLevel}…`
      : activeMode === 'translate'
      ? `Translating to ${SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage)?.label ?? activeLanguage}…`
      : activeMode === 'read'
      ? 'Cleaning text…'
      : 'Processing…';

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === activeLanguage);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <View style={[styles.modePill, { backgroundColor: modeMeta.color + '33' }]}>
          <Text style={styles.modeIcon}>{modeMeta.icon}</Text>
          <Text style={[styles.modeLabel, { color: modeMeta.color }]}>{modeMeta.label}</Text>
        </View>

        <View style={styles.fontControls}>
          <Pressable
            style={styles.fontBtn}
            onPress={() => setFontSize((s) => Math.max(12, s - 2))}
            accessibilityRole="button"
            accessibilityLabel="Decrease font size"
          >
            <Text style={styles.fontBtnText}>A−</Text>
          </Pressable>
          <Pressable
            style={styles.fontBtn}
            onPress={() => setFontSize((s) => Math.min(36, s + 2))}
            accessibilityRole="button"
            accessibilityLabel="Increase font size"
          >
            <Text style={styles.fontBtnText}>A+</Text>
          </Pressable>
        </View>
      </View>

      {/* Simplify: inline reading level picker */}
      {activeMode === 'simplify' && (
        <View style={styles.controlBar}>
          <Text style={styles.controlBarLabel}>Reading level</Text>
          <View style={styles.levelPills}>
            {READING_LEVELS.map((lvl) => {
              const active = lvl.value === activeLevel;
              return (
                <Pressable
                  key={lvl.value}
                  style={[styles.levelPill, active && styles.levelPillActive]}
                  onPress={() => handleLevelChange(lvl.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Level ${lvl.value}: ${lvl.label}`}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.levelPillNum, active && styles.levelPillNumActive]}>
                    {lvl.value}
                  </Text>
                  <Text style={[styles.levelPillName, active && styles.levelPillNameActive]}>
                    {lvl.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Translate: inline language picker trigger */}
      {activeMode === 'translate' && (
        <View style={styles.controlBar}>
          <Text style={styles.controlBarLabel}>Translating to</Text>
          <Pressable
            style={styles.langTrigger}
            onPress={() => setShowLangPicker(true)}
            accessibilityRole="button"
            accessibilityLabel={`Change language, currently ${currentLang?.label}`}
          >
            <Text style={styles.langTriggerText}>{currentLang?.label ?? activeLanguage}</Text>
            <Text style={styles.langTriggerNative}>{currentLang?.nativeLabel}</Text>
            <Text style={styles.langChevron}>›</Text>
          </Pressable>
        </View>
      )}

      {isCached && (
        <View style={styles.cacheBanner} accessibilityLiveRegion="polite">
          <Text style={styles.cacheBannerIcon}>📦</Text>
          <Text style={styles.cacheBannerText}>
            Backend unreachable — showing cached result
          </Text>
        </View>
      )}

      {isProcessing && !processedText && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={styles.loadingText}>{loadingLabel}</Text>
        </View>
      )}

      <TextDisplay
        text={displayText}
        fontSize={fontSize}
        dyslexicFont={profile.dyslexicFont}
        isStreaming={isProcessing}
        onWordPress={activeMode === 'define' ? handleWordPress : undefined}
        defineMode={activeMode === 'define'}
      />

      <View style={styles.footer}>
        {isProcessing && (
          <View style={styles.streamingRow}>
            <ActivityIndicator color={COLORS.accent} size="small" />
            <Text style={styles.streamingBadge} accessibilityLiveRegion="polite">
              {loadingLabel}
            </Text>
          </View>
        )}
        <AudioControls
          isSpeaking={isSpeaking}
          isLoading={false}
          disabled={!displayText || isProcessing}
          onPlay={() => play(displayText)}
          onStop={stop}
          onReplay={() => stop().then(() => play(displayText))}
        />
        <Pressable
          style={styles.retryBtn}
          onPress={() => runProcessing()}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel="Re-process text"
        >
          <Text style={[styles.retryLabel, isProcessing && styles.retryDisabled]}>↺ Retry</Text>
        </Pressable>
      </View>

      {/* Language picker modal (translate mode) */}
      <Modal
        visible={showLangPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLangPicker(false)}
        accessibilityViewIsModal
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLangPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalSheetTitle}>Translate to</Text>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const selected = lang.code === activeLanguage;
                return (
                  <Pressable
                    key={lang.code}
                    style={[styles.langRow, selected && styles.langRowSelected]}
                    onPress={() => handleLanguageChange(lang.code as LanguageCode)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${lang.label} — ${lang.nativeLabel}`}
                    accessibilityState={{ checked: selected }}
                  >
                    <View style={styles.langRowText}>
                      <Text style={[styles.langRowLabel, selected && styles.langRowLabelActive]}>
                        {lang.label}
                      </Text>
                      <Text style={styles.langRowNative}>{lang.nativeLabel}</Text>
                    </View>
                    {selected && <Text style={styles.langCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Define word modal */}
      <Modal
        visible={defineWord !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDefineWord(null)}
        accessibilityViewIsModal
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDefineWord(null)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalWord}>{defineWord}</Text>
            {definingWord ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={COLORS.accent} size="small" />
                <Text style={styles.modalLoadingText}>Looking up…</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalDefinition}>{defineResult}</Text>
              </ScrollView>
            )}
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setDefineWord(null)}
              accessibilityRole="button"
              accessibilityLabel="Close definition"
            >
              <Text style={styles.modalCloseBtnLabel}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: COLORS.text, fontSize: 22 },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flex: 1,
  },
  modeIcon: { fontSize: 14 },
  modeLabel: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  fontControls: { flexDirection: 'row', gap: 4 },
  fontBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fontBtnText: { color: COLORS.text, fontSize: FONT_SIZES.sm, fontWeight: '700' },
  controlBar: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.xs,
  },
  controlBarLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Level pills (simplify)
  levelPills: { flexDirection: 'row', gap: SPACING.xs },
  levelPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 2,
    minHeight: 44,
    justifyContent: 'center',
  },
  levelPillActive: { backgroundColor: COLORS.accentDim, borderColor: COLORS.accent },
  levelPillNum: { color: COLORS.textMuted, fontSize: FONT_SIZES.md, fontWeight: '800' },
  levelPillNumActive: { color: COLORS.accent },
  levelPillName: {
    color: COLORS.textDim,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  levelPillNameActive: { color: COLORS.accent },
  // Language trigger (translate)
  langTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  langTriggerText: { color: COLORS.text, fontSize: FONT_SIZES.md, fontWeight: '700' },
  langTriggerNative: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, flex: 1 },
  langChevron: { color: COLORS.textMuted, fontSize: 20 },
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  cacheBannerIcon: { fontSize: 14 },
  cacheBannerText: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  loadingText: { color: COLORS.textMuted, fontSize: FONT_SIZES.md },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  streamingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  streamingBadge: { color: COLORS.accent, fontSize: FONT_SIZES.xs, fontWeight: '600' },
  retryBtn: { alignSelf: 'flex-start' },
  retryLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
  retryDisabled: { opacity: 0.3 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '65%',
    gap: SPACING.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  modalSheetTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  modalWord: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  modalLoading: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  modalLoadingText: { color: COLORS.textMuted, fontSize: FONT_SIZES.md },
  modalScroll: { maxHeight: 300 },
  modalDefinition: { color: COLORS.text, fontSize: FONT_SIZES.md, lineHeight: 26 },
  modalCloseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
  },
  modalCloseBtnLabel: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700' },
  // Language rows in modal
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.sm,
    borderRadius: 10,
    marginBottom: 2,
    minHeight: 44,
  },
  langRowSelected: { backgroundColor: COLORS.primaryDim + '40' },
  langRowText: { flex: 1 },
  langRowLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.md, fontWeight: '500' },
  langRowLabelActive: { color: COLORS.text, fontWeight: '700' },
  langRowNative: { color: COLORS.textDim, fontSize: FONT_SIZES.sm, marginTop: 2 },
  langCheck: { color: COLORS.primary, fontSize: 18, fontWeight: '700' },
});
