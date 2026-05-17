import * as Speech from 'expo-speech';

export interface TTSOptions {
  text: string;
  language?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
}

export async function speak(opts: TTSOptions): Promise<void> {
  const { text, language = 'en-US', rate = 0.9, pitch = 1.0, onStart, onDone, onError } = opts;

  await stopSpeaking();

  Speech.speak(text, {
    language,
    rate,
    pitch,
    onStart,
    onDone,
    onError: (err) => onError?.(new Error(err?.message ?? 'TTS error')),
  });
}

export async function stopSpeaking(): Promise<void> {
  const speaking = await Speech.isSpeakingAsync();
  if (speaking) Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

export function languageCodeToSpeechLocale(code: string): string {
  const map: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    pt: 'pt-BR',
    zh: 'zh-CN',
    ar: 'ar-SA',
    hi: 'hi-IN',
    ko: 'ko-KR',
    ja: 'ja-JP',
    de: 'de-DE',
  };
  return map[code] ?? 'en-US';
}
