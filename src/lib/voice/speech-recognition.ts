export type SpeechRecognitionLike = { start: () => void; stop: () => void; abort: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((event: unknown) => void) | null; onerror: ((event: unknown) => void) | null; onend: (() => void) | null };
type RecognitionWindow = Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
export type SpeechRecognitionErrorCode = 'not-supported' | 'permission-denied' | 'network' | 'unknown';
export function isSpeechRecognitionSupported() { return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window); }
export function createSpeechRecognition(): SpeechRecognitionLike | null { if (!isSpeechRecognitionSupported()) return null; const target = window as RecognitionWindow; const Constructor = target.SpeechRecognition ?? target.webkitSpeechRecognition; return Constructor ? new Constructor() : null; }
