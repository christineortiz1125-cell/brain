import { useState, useCallback, useEffect } from 'react';
import { speak, stopSpeaking, languageCodeToSpeechLocale } from '@/lib/tts';
import { useAppStore } from '@/store';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const setStoreSpeaking = useAppStore((s) => s.setIsSpeaking);
  const targetLanguage = useAppStore((s) => s.profile.targetLanguage);

  useEffect(() => {
    return () => {
      stopSpeaking().catch(() => {});
    };
  }, []);

  const play = useCallback(
    async (text: string, languageOverride?: string) => {
      if (!text.trim()) return;

      setIsSpeaking(true);
      setStoreSpeaking(true);

      await speak({
        text,
        language: languageCodeToSpeechLocale(languageOverride ?? targetLanguage),
        rate: 0.9,
        onStart: () => {
          setIsSpeaking(true);
          setStoreSpeaking(true);
        },
        onDone: () => {
          setIsSpeaking(false);
          setStoreSpeaking(false);
        },
        onError: () => {
          setIsSpeaking(false);
          setStoreSpeaking(false);
        },
      });
    },
    [targetLanguage, setStoreSpeaking]
  );

  const stop = useCallback(async () => {
    await stopSpeaking();
    setIsSpeaking(false);
    setStoreSpeaking(false);
  }, [setStoreSpeaking]);

  const toggle = useCallback(
    async (text: string) => {
      if (isSpeaking) {
        await stop();
      } else {
        await play(text);
      }
    },
    [isSpeaking, play, stop]
  );

  return { isSpeaking, play, stop, toggle };
}
