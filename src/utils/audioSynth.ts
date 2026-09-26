// Web Audio API ambient soundscape generator and multi-engine voice speech synthesis

class AmbientSoundscape {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  private droneOsc: OscillatorNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public playEnvironment(env: string) {
    this.stop();
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.isPlaying = true;

    // Create environment specific ambient sound
    if (env === 'cozy_cyber_loft' || env === 'sunset_balcony') {
      // Gentle rain & warm synth drone
      this.createRainEffect();
      this.createWarmDrone(110, 0.04); // low A2
    } else if (env === 'starlit_observatory') {
      // Ethereal celestial pad drone
      this.createWarmDrone(146.83, 0.06); // D3
      this.createChimePads();
    } else if (env === 'candlelit_library') {
      // Warm fireplace crackle & low room tone
      this.createFireplaceCrackle();
      this.createWarmDrone(73.42, 0.03); // D2
    } else {
      // Serene garden breeze
      this.createWindBreeze();
      this.createWarmDrone(98.0, 0.03); // G2
    }
  }

  private createRainEffect() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);
    whiteNoise.start();
    this.noiseNode = whiteNoise;
  }

  private createFireplaceCrackle() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const isPop = Math.random() > 0.998;
      data[i] = isPop ? (Math.random() * 2 - 1) * 0.8 : (Math.random() * 2 - 1) * 0.08;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noiseSource.start();
    this.noiseNode = noiseSource;
  }

  private createWindBreeze() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.03, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noiseSource.start();
    this.noiseNode = noiseSource;
  }

  private createWarmDrone(freq: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, this.ctx.currentTime);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    this.droneOsc = osc;
  }

  private createChimePads() {
    if (!this.ctx || !this.masterGain) return;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, this.ctx.currentTime); // A3
    gain2.gain.setValueAtTime(0.02, this.ctx.currentTime);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start();
  }

  public stop() {
    try {
      if (this.noiseNode) {
        (this.noiseNode as any).stop?.();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.droneOsc) {
        this.droneOsc.stop();
        this.droneOsc.disconnect();
        this.droneOsc = null;
      }
    } catch {}
    this.isPlaying = false;
  }

  public toggle(env: string) {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.playEnvironment(env);
      return true;
    }
  }

  public get active(): boolean {
    return this.isPlaying;
  }
}

export const soundscape = new AmbientSoundscape();

// Current active audio element for server TTS
let activeAudioElement: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.src = '';
    } catch {}
    activeAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

// Map companion archetypes to Gemini TTS voice names
export function getPrebuiltVoiceName(gender: string, archetype?: string): string {
  if (gender === 'male') {
    return archetype?.toLowerCase().includes('guardian') ? 'Fenrir' : 'Puck';
  } else if (gender === 'android') {
    return 'Zephyr';
  } else {
    return archetype?.toLowerCase().includes('dreamer') ? 'Kore' : 'Zephyr';
  }
}

// Master speak function: attempts high-res Gemini server TTS first, falls back instantly to Web Speech API
export async function speakCompanionVoice(
  text: string,
  pitch = 1.0,
  rate = 1.0,
  gender = 'female',
  archetype = '',
  onStart?: () => void,
  onEnd?: () => void
) {
  stopSpeaking();

  const cleanSpokenText = text.replace(/\*[^*]+\*/g, '').trim();
  if (!cleanSpokenText) {
    if (onEnd) onEnd();
    return;
  }

  const voiceName = getPrebuiltVoiceName(gender, archetype);

  // Try Server-Side Gemini TTS first
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanSpokenText,
        voiceName,
        style: `Warm, intimate, natural and deeply expressive companion voice with emotional nuances`,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.audioBase64) {
        const audioSrc = `data:${data.mimeType || 'audio/mp3'};base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        activeAudioElement = audio;

        audio.onplay = () => {
          if (onStart) onStart();
        };

        audio.onended = () => {
          activeAudioElement = null;
          if (onEnd) onEnd();
        };

        audio.onerror = () => {
          activeAudioElement = null;
          // Fall back to Web Speech
          speakWithWebSpeech(cleanSpokenText, pitch, rate, onStart, onEnd);
        };

        await audio.play();
        return;
      }
    }
  } catch (err) {
    console.warn('Server TTS failed, falling back to client Web Speech synthesis:', err);
  }

  // Fallback to Web Speech API
  speakWithWebSpeech(cleanSpokenText, pitch, rate, onStart, onEnd);
}

// Client-side Web Speech API implementation
export function speakWithWebSpeech(
  cleanSpokenText: string,
  pitch = 1.0,
  rate = 1.0,
  onStart?: () => void,
  onEnd?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
  utterance.pitch = Math.max(0.6, Math.min(1.8, pitch));
  utterance.rate = Math.max(0.7, Math.min(1.3, rate));

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
    if (englishVoices.length > 0) {
      if (pitch > 1.05) {
        const femaleVoice = englishVoices.find((v) =>
          /female|samantha|zira|victoria|karen|susan|fiona|natural/i.test(v.name)
        );
        if (femaleVoice) utterance.voice = femaleVoice;
      } else if (pitch < 0.95) {
        const maleVoice = englishVoices.find((v) =>
          /male|david|daniel|george|alex|fred|oliver/i.test(v.name)
        );
        if (maleVoice) utterance.voice = maleVoice;
      } else {
        utterance.voice = englishVoices[0];
      }
    }
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function speakText(
  text: string,
  pitch = 1.0,
  rate = 1.0,
  onStart?: () => void,
  onEnd?: () => void
) {
  speakCompanionVoice(text, pitch, rate, 'female', '', onStart, onEnd);
}
