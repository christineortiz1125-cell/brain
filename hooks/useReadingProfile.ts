import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';
import { getReadingProfile, updateReadingProfile } from '@/lib/db';
import type { LanguageCode } from '@/constants';

export function useReadingProfile() {
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);

  useEffect(() => {
    getReadingProfile()
      .then((p) => {
        setProfile({
          readingLevel: p.readingLevel,
          targetLanguage: p.targetLanguage,
          fontSize: p.fontSize,
          dyslexicFont: p.dyslexicFont,
        });
      })
      .catch(console.error);
  }, []);

  const update = useCallback(
    async (updates: {
      readingLevel?: number;
      targetLanguage?: LanguageCode;
      fontSize?: number;
      dyslexicFont?: boolean;
      onboardingComplete?: boolean;
    }) => {
      setProfile(updates);
      const dbUpdates: Parameters<typeof updateReadingProfile>[0] = {};
      if (updates.readingLevel !== undefined) dbUpdates.readingLevel = updates.readingLevel;
      if (updates.targetLanguage !== undefined) dbUpdates.targetLanguage = updates.targetLanguage;
      if (updates.fontSize !== undefined) dbUpdates.fontSize = updates.fontSize;
      if (updates.dyslexicFont !== undefined) dbUpdates.dyslexicFont = updates.dyslexicFont;
      if (Object.keys(dbUpdates).length > 0) {
        await updateReadingProfile(dbUpdates);
      }
    },
    [setProfile]
  );

  return { profile, update };
}
