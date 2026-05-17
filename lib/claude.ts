import { BACKEND_URL } from '@/constants';
import type { Mode, LanguageCode } from '@/constants';

export interface ClaudeStreamOptions {
  mode: Mode;
  text: string;
  readingLevel: number;
  targetLanguage: LanguageCode;
  word?: string;
  onChunk: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: Error) => void;
  signal?: AbortSignal;
}

export async function streamClaudeResponse(opts: ClaudeStreamOptions): Promise<void> {
  const { mode, text, readingLevel, targetLanguage, word, onChunk, onDone, onError, signal } = opts;

  let endpoint: string;
  let body: Record<string, unknown>;

  switch (mode) {
    case 'read':
      endpoint = '/api/read';
      body = { text };
      break;
    case 'simplify':
      endpoint = '/api/simplify';
      body = { text, reading_level: readingLevel };
      break;
    case 'translate':
      endpoint = '/api/translate';
      body = { text, target_language: targetLanguage };
      break;
    case 'define':
      endpoint = '/api/define';
      body = { word: word ?? text };
      break;
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    onError(e instanceof Error ? e : new Error('Network error'));
    return;
  }

  if (!response.ok) {
    onError(new Error(`Server error: ${response.status}`));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError(new Error('No response body'));
    return;
  }

  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data) as { text?: string };
          if (parsed.text) {
            fullText += parsed.text;
            onChunk(parsed.text);
          }
        } catch {
          // partial JSON line — skip
        }
      }
    }
    onDone(fullText);
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      onError(e instanceof Error ? e : new Error('Stream error'));
    }
  } finally {
    reader.releaseLock();
  }
}
