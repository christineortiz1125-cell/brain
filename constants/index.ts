export const COLORS = {
  bg: '#0A0A0F',
  surface: '#14141E',
  surfaceAlt: '#1E1E2E',
  border: '#2A2A3E',
  primary: '#6C63FF',
  primaryDim: '#3D3880',
  accent: '#00D4AA',
  accentDim: '#004D3E',
  warn: '#FF7043',
  text: '#F0F0F8',
  textMuted: '#8888AA',
  textDim: '#44445A',
  white: '#FFFFFF',
} as const;

export const FONTS = {
  regular: 'System',
  dyslexic: 'OpenDyslexic',
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const READING_LEVELS = [
  { value: 1, label: 'Elementary', description: 'Simple words, short sentences' },
  { value: 2, label: 'Middle School', description: 'Everyday vocabulary' },
  { value: 3, label: 'High School', description: 'Standard reading level' },
  { value: 4, label: 'College', description: 'Academic vocabulary' },
  { value: 5, label: 'Professional', description: 'Full complexity preserved' },
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const MODES = ['read', 'simplify', 'translate', 'define'] as const;
export type Mode = typeof MODES[number];

export const MODE_META: Record<Mode, { label: string; description: string; icon: string; color: string }> = {
  read: {
    label: 'Read',
    description: 'Capture and read text aloud',
    icon: '👓',
    color: '#6C63FF',
  },
  simplify: {
    label: 'Simplify',
    description: 'Rewrite at your reading level',
    icon: '✨',
    color: '#00D4AA',
  },
  translate: {
    label: 'Translate',
    description: 'Convert to your language',
    icon: '🌐',
    color: '#FF7043',
  },
  define: {
    label: 'Define',
    description: 'Tap a word for a plain-English definition',
    icon: '📖',
    color: '#FFB300',
  },
};

export const MAX_CACHED_SESSIONS = 10;
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
