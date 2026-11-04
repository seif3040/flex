# AI Workspace — Voice Architecture

**Version**: 1.0.0  
**Date**: 2026-11-04  
**Status**: Active

---

## 1. Overview

Voice is implemented in two phases to manage complexity and browser compatibility:

| Phase | Features | Implementation |
|-------|----------|---------------|
| Phase A | Dictation, browser TTS | Web Speech API only — no server calls |
| Phase B | Turn-based voice chat | STT → LLM (SSE) → TTS pipeline |

> **Important**: Phase B is explicitly "turn-based voice chat" — NOT real-time full-duplex audio streaming. This distinction is surfaced in the UI.

---

## 2. Browser Compatibility

### Web Speech API (SpeechRecognition)

| Browser | Support |
|---------|---------|
| Chrome / Chromium | ✅ Full support |
| Edge (Chromium) | ✅ Full support |
| Safari (macOS 15+, iOS 17+) | ✅ Partial (may require HTTPS) |
| Firefox | ❌ Not supported |
| Samsung Internet | ✅ Supported |

**Detection**:
```typescript
const isSpeechRecognitionSupported = 
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
```

**Fallback policy**: If `SpeechRecognition` is not available, the dictation button is **disabled** with a tooltip: *"Dictation requires Chrome, Edge, or Safari. Firefox is not supported."*

### SpeechSynthesis (TTS)

| Browser | Support |
|---------|---------|
| All major browsers | ✅ Broadly supported |
| Voice availability | Varies by OS and browser |

**Detection**:
```typescript
const isSpeechSynthesisSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window;
```

---

## 3. Phase A — Dictation

### Architecture

```
User clicks mic button
       │
       ▼
DictationButton.tsx
  → Check browser support (show tooltip if unsupported)
  → Request microphone permission (navigator.mediaDevices if needed)
  → Create SpeechRecognition instance
  → recognition.start()
       │
       ▼ (continuous: false, interimResults: true)
recognition.onresult
  → Accumulate interim transcript → show in composer
  → On final result → set composer text
       │
recognition.onend / recognition.onerror
  → Release mic indicator
  → Handle errors (no-speech, audio-capture, not-allowed)
```

### State Machine

```
IDLE → REQUESTING_PERMISSION → LISTENING → PROCESSING → IDLE
                                    ↓
                                  ERROR
```

### Error Handling

| Error | User-visible message |
|-------|---------------------|
| `not-allowed` | "Microphone access denied. Please allow microphone in browser settings." |
| `no-speech` | "No speech detected. Please try again." |
| `audio-capture` | "No microphone detected." |
| `network` | "Speech recognition requires a network connection." |
| `aborted` | Silently reset (user cancelled) |

### Microphone Permission Rules

- Never request microphone permission on page load.
- Permission is requested **only** on user click of the mic button.
- The microphone is released immediately when recording stops.
- An animated indicator (pulsing red dot) is displayed while the mic is active.

---

## 4. Phase A — Browser Text-to-Speech

### Architecture

```typescript
// src/lib/voice/speech-synthesis.ts

export function speakText(text: string, options?: SpeechOptions): void {
  if (!isSpeechSynthesisSupported) return;
  
  window.speechSynthesis.cancel(); // Cancel any existing speech
  const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
  utterance.rate = options?.rate ?? 1.0;
  utterance.pitch = options?.pitch ?? 1.0;
  utterance.volume = options?.volume ?? 1.0;
  // Select preferred voice if available
  if (options?.voiceURI) {
    const voice = speechSynthesis.getVoices().find(v => v.voiceURI === options.voiceURI);
    if (voice) utterance.voice = voice;
  }
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported) window.speechSynthesis.cancel();
}
```

**Markdown stripping**: Before speaking, strip markdown syntax (headers, bold, code blocks) from text to produce natural speech.

### UI Controls

- "Read aloud" button on each assistant message.
- Global stop button when speech is playing.
- Voice selection in Settings (populated from `speechSynthesis.getVoices()`).

---

## 5. Phase B — Turn-Based Voice Chat

### Architecture

```
Voice Chat Mode activated
       │
       ▼
User speaks (mic active, SpeechRecognition)
       │ final transcript
       ▼
Transcript shown in UI
       │
       ▼
POST /api/chat with transcript as message content
  → SSE streaming response
       │ done event
       ▼
speakText(assistantResponse)
  → SpeechSynthesis plays response
       │ onend
       ▼
Mic re-activates for next turn (if not stopped/muted)
```

### Turn State Machine

```
IDLE
  → USER_SPEAKING (mic open, VAD or push-to-talk)
  → AI_THINKING (SSE request in flight)
  → AI_SPEAKING (TTS playing)
  → USER_SPEAKING (next turn)
  → IDLE (user stops session)
```

### Controls Required

| Control | Action |
|---------|--------|
| Stop Session | End voice chat, return to text mode |
| Mute Mic | Keep session active, silence user input |
| Stop AI Speech | Interrupt TTS playback, allow user to speak |

### Transcript Display

A scrollable panel displays the conversation transcript alongside the voice controls. Each turn is timestamped.

### Limitations Disclosed in UI

> "Voice chat is turn-based. The AI responds after each of your turns. This is not real-time duplex audio."

---

## 6. No External Voice APIs in Phase A

Phase A uses **only** browser-native APIs — no server calls, no API keys required for voice in Phase A. This ensures:
- No latency beyond STT processing time
- No additional cost
- No credential management for voice

Phase B still uses browser APIs for STT and TTS. The only server call is the existing `/api/chat` for the LLM turn.

Future consideration (not in MVP): OpenAI Realtime API or similar for lower-latency TTS voices.

---

## 7. Voice in `src/lib/voice/`

| File | Responsibility |
|------|---------------|
| `speech-recognition.ts` | SpeechRecognition wrapper, state machine, error normalization |
| `speech-synthesis.ts` | SpeechSynthesis wrapper, markdown stripping, voice selection |

### Hook: `useVoice`

```typescript
// src/hooks/useVoice.ts
interface UseVoiceReturn {
  // Phase A
  isDictating: boolean;
  startDictation: () => void;
  stopDictation: () => void;
  interimTranscript: string;
  
  // Phase B
  voiceChatState: 'idle' | 'user-speaking' | 'ai-thinking' | 'ai-speaking';
  startVoiceChat: () => void;
  stopVoiceChat: () => void;
  muteToggle: () => void;
  stopAISpeech: () => void;
  
  // Status
  isSupported: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  error: VoiceError | null;
}
```
