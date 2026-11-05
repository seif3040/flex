export function stripMarkdown(text: string) { return text.replace(/```[\s\S]*?```/g, '').replace(/[*_`#>\[\]()]/g, '').trim(); }
export function speakText(text: string) { if (typeof window === 'undefined' || !('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(stripMarkdown(text))); }
export function stopSpeaking() { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }
