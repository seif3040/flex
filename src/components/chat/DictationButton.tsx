'use client';

import { Button } from '@/components/ui/button';
import { useVoice } from '@/hooks/useVoice';
export function DictationButton({ onText }: { onText: (text: string) => void }) { const voice = useVoice(onText); return <><Button type="button" variant="outline" onClick={voice.isListening ? voice.stop : voice.start} disabled={!voice.supported} title={voice.supported ? 'Speak in Arabic or English' : 'Use Chrome or Edge and allow microphone access'} aria-label={voice.supported ? 'Use voice dictation' : 'Voice dictation is not supported'}>{voice.isListening ? 'Listening…' : voice.supported ? 'Voice' : 'Voice unavailable'}</Button>{voice.error && <p role="status" className="w-full text-xs text-destructive">{voice.error}</p>}</>; }
