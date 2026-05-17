import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';

export interface OCRResult {
  text: string;
  blocks: Array<{
    text: string;
    frame?: { x: number; y: number; width: number; height: number };
  }>;
  durationMs: number;
}

export async function recognizeText(imageUri: string): Promise<OCRResult> {
  const start = Date.now();
  const result: TextRecognitionResult = await TextRecognition.recognize(imageUri);

  const blocks = result.blocks.map((block) => ({
    text: block.text,
    frame: block.frame
      ? {
          x: block.frame.left,
          y: block.frame.top,
          width: block.frame.width,
          height: block.frame.height,
        }
      : undefined,
  }));

  const fullText = result.text.trim();
  const durationMs = Date.now() - start;

  return { text: fullText, blocks, durationMs };
}

export function cleanOCRText(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*\n/g, '$1 ')
    .replace(/\n+/g, '\n')
    .trim();
}
