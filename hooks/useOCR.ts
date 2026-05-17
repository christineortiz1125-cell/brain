import { useState, useCallback } from 'react';
import { recognizeText, cleanOCRText, type OCRResult } from '@/lib/ocr';
import { useAppStore } from '@/store';

interface UseOCRReturn {
  isProcessing: boolean;
  result: OCRResult | null;
  error: string | null;
  process: (imageUri: string) => Promise<string | null>;
  reset: () => void;
}

export function useOCR(): UseOCRReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setCapturedText = useAppStore((s) => s.setCapturedText);

  const process = useCallback(async (imageUri: string): Promise<string | null> => {
    setIsProcessing(true);
    setError(null);
    try {
      const ocr = await recognizeText(imageUri);
      const cleaned = cleanOCRText(ocr.text);
      setResult({ ...ocr, text: cleaned });
      setCapturedText(cleaned);
      return cleaned;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'OCR failed';
      setError(msg);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [setCapturedText]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { isProcessing, result, error, process, reset };
}
