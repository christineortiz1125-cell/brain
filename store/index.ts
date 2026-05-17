import { create } from 'zustand';
import type { Mode, LanguageCode } from '@/constants';

interface ReadingProfile {
  readingLevel: number;
  targetLanguage: LanguageCode;
  fontSize: number;
  dyslexicFont: boolean;
  onboardingComplete: boolean;
}

interface SessionState {
  activeMode: Mode;
  capturedText: string;
  processedText: string;
  isProcessing: boolean;
  isSpeaking: boolean;
  streamBuffer: string;
}

interface AppState {
  profile: ReadingProfile;
  session: SessionState;

  setProfile: (updates: Partial<ReadingProfile>) => void;
  setActiveMode: (mode: Mode) => void;
  setCapturedText: (text: string) => void;
  setProcessedText: (text: string) => void;
  appendStreamChunk: (chunk: string) => void;
  setIsProcessing: (v: boolean) => void;
  setIsSpeaking: (v: boolean) => void;
  clearSession: () => void;
}

const DEFAULT_PROFILE: ReadingProfile = {
  readingLevel: 3,
  targetLanguage: 'en',
  fontSize: 18,
  dyslexicFont: false,
  onboardingComplete: false,
};

const DEFAULT_SESSION: SessionState = {
  activeMode: 'read',
  capturedText: '',
  processedText: '',
  isProcessing: false,
  isSpeaking: false,
  streamBuffer: '',
};

export const useAppStore = create<AppState>((set) => ({
  profile: { ...DEFAULT_PROFILE },
  session: { ...DEFAULT_SESSION },

  setProfile: (updates) =>
    set((s) => ({ profile: { ...s.profile, ...updates } })),

  setActiveMode: (mode) =>
    set((s) => ({ session: { ...s.session, activeMode: mode } })),

  setCapturedText: (text) =>
    set((s) => ({ session: { ...s.session, capturedText: text } })),

  setProcessedText: (text) =>
    set((s) => ({ session: { ...s.session, processedText: text, streamBuffer: text } })),

  appendStreamChunk: (chunk) =>
    set((s) => ({
      session: {
        ...s.session,
        streamBuffer: s.session.streamBuffer + chunk,
        processedText: s.session.streamBuffer + chunk,
      },
    })),

  setIsProcessing: (v) =>
    set((s) => ({ session: { ...s.session, isProcessing: v } })),

  setIsSpeaking: (v) =>
    set((s) => ({ session: { ...s.session, isSpeaking: v } })),

  clearSession: () =>
    set((s) => ({
      session: {
        ...DEFAULT_SESSION,
        activeMode: s.session.activeMode,
      },
    })),
}));
