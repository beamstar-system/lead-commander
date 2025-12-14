// Simple Text-to-Speech Service
let isMuted = false;

export const setMute = (mute: boolean) => {
  isMuted = mute;
  if (mute) {
    window.speechSynthesis.cancel();
  }
};

export const playAlert = (text: string, priority: 'high' | 'low' = 'low') => {
  if (isMuted || !window.speechSynthesis) return;

  // Don't queue too many low priority messages
  if (window.speechSynthesis.speaking && priority === 'low') return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1; // Slightly faster for "military" feel
  utterance.pitch = 0.9; // Lower pitch
  utterance.volume = 0.8;

  // Try to find a good voice
  const voices = window.speechSynthesis.getVoices();
  // Prefer a "Samantha" or "Google US English" or generic female voice for computer vibes
  const preferred = voices.find(v => 
    v.name.includes('Samantha') || 
    v.name.includes('Google US English') || 
    v.name.includes('Microsoft Zira')
  );
  
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
};