
// A robust audio context handler with synthesized sci-fi sound.
// Uses a singleton pattern to avoid creating multiple AudioContexts.
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    // @ts-ignore - Handle WebKit prefix for older Safari
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) {
      audioContext = new AudioCtor();
    }
  }
  return audioContext;
};

export const playStardustSound = () => {
  try {
    const context = getAudioContext();
    if (!context) return;

    // Browser Autoplay Policy: Resume context if suspended
    if (context.state === 'suspended') {
      context.resume().catch(err => console.warn("Audio resume failed:", err));
    }

    const t = context.currentTime;
    
    // Oscillator 1: The "Body" (Sine wave)
    const osc1 = context.createOscillator();
    const gain1 = context.createGain();
    osc1.type = 'sine';
    // Quick pitch sweep for a "laser/coin" feel
    osc1.frequency.setValueAtTime(880, t); 
    osc1.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
    
    // Envelope
    gain1.gain.setValueAtTime(0.15, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    // Oscillator 2: The "Sparkle" (Triangle wave, higher pitch)
    const osc2 = context.createOscillator();
    const gain2 = context.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760, t);
    osc2.frequency.linearRampToValueAtTime(2200, t + 0.1);
    
    // Envelope for sparkle
    gain2.gain.setValueAtTime(0.05, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    // Connect
    osc1.connect(gain1);
    gain1.connect(context.destination);
    
    osc2.connect(gain2);
    gain2.connect(context.destination);

    // Play
    osc1.start(t);
    osc1.stop(t + 0.15);
    osc2.start(t);
    osc2.stop(t + 0.15);

  } catch (e) {
      console.error("Audio playback error:", e);
  }
};
