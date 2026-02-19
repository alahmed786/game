// A simple audio context handler to play sounds.
// Using a singleton pattern to avoid creating multiple AudioContexts.
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Base64 encoded WAV data for a short, pleasing "coin" sound
const stardustSoundBase64 = "UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAQABAAMABgAKAAsADQANAAoABgADAAEAAAAA";

// Function to decode Base64 to an ArrayBuffer
const decodeBase64 = (base64: string) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Pre-decode audio data on module load for performance
let audioBuffer: AudioBuffer | null = null;
try {
    const context = getAudioContext();
    const audioData = decodeBase64(stardustSoundBase64);
    context.decodeAudioData(audioData, (buffer) => {
        audioBuffer = buffer;
    }, (e) => {
        console.error("Error decoding audio data", e);
    });
} catch (e) {
    console.error("Web Audio API is not supported in this browser.", e);
}


export const playStardustSound = () => {
  try {
    const context = getAudioContext();
    if (!context || !audioBuffer) return;
    
    // Allow sound to play on user interaction
    if (context.state === 'suspended') {
        context.resume();
    }

    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.start(0);
  } catch (e) {
      console.error("Could not play sound", e)
  }
};
