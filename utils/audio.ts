class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);
      
      // Create a simple impulse response for reverb (castle echo)
      this.setupReverb();
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  private setupReverb() {
    if (!this.ctx) return;
    const duration = 2.0;
    const decay = 2.0;
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      // Exponential decay noise
      left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
    }

    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = impulse;
    this.reverbNode.connect(this.masterGain!);
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Realistic launch "Thwoomp" -> "Sshhhhh"
  playLaunch() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // 1. The "Thud" of the mortar
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    oscGain.gain.setValueAtTime(0.3, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);

    // 2. The "Whoosh" of the ascent (Filtered Noise)
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(1000, t + 1); // Pitch shift up

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, t);
    noiseGain.gain.linearRampToValueAtTime(0.05, t + 0.5);
    noiseGain.gain.linearRampToValueAtTime(0, t + 1.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
  }

  // Realistic "Crack" + "Boom"
  playExplosion(sizeMultiplier: number = 1) {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    
    // 1. The "Crack" (High frequency snap)
    const crackOsc = this.ctx.createOscillator();
    crackOsc.type = 'triangle';
    crackOsc.frequency.setValueAtTime(300, t);
    crackOsc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    
    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.4 * sizeMultiplier, t);
    crackGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    crackOsc.connect(crackGain);
    crackGain.connect(this.masterGain);
    crackOsc.start(t);
    crackOsc.stop(t + 0.15);

    // 2. The "Boom" (Deep low-end thud)
    const boomOsc = this.ctx.createOscillator();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(120, t);
    boomOsc.frequency.exponentialRampToValueAtTime(10, t + 0.5);
    
    const boomGain = this.ctx.createGain();
    boomGain.gain.setValueAtTime(0.8 * sizeMultiplier, t);
    boomGain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
    
    boomOsc.connect(boomGain);
    boomGain.connect(this.masterGain);
    boomOsc.start(t);
    boomOsc.stop(t + 0.8);

    // 3. The "Rumble" (Noise) sent to Reverb
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5 * sizeMultiplier, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    noise.connect(filter);
    filter.connect(noiseGain);
    
    // Connect to reverb if available, else master
    if (this.reverbNode) {
      noiseGain.connect(this.reverbNode);
    } else {
      noiseGain.connect(this.masterGain);
    }
    
    noise.start(t);
  }
}

export const soundManager = new SoundManager();
