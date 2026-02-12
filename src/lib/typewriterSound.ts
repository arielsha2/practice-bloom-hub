// Subtle typewriter click sound using Web Audio API
// No external files needed - generates sound programmatically

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function playTypewriterClick(volume = 0.03) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create a very short noise burst to simulate a key click
    const bufferSize = Math.floor(ctx.sampleRate * 0.008); // 8ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Noise that decays quickly
      const decay = 1 - i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * decay * decay;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Bandpass filter to make it sound like a soft click
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 1.5;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(now);
    source.stop(now + 0.008);
  } catch {
    // Silently fail - sound is decorative
  }
}
