import type { AmbientStyle } from "$lib/features/settings/types";

type AmbientProfile = {
  waveform: OscillatorType;
  filter: number;
  secondsPerChord: number;
  chords: number[][];
};

// Add or tune break moods here. Chords contain one frequency per oscillator voice.
const AMBIENT_PROFILES: Record<AmbientStyle, AmbientProfile> = {
  moonlit: { waveform: "sine", filter: 1050, secondsPerChord: 7, chords: [[220, 261.63, 329.63], [196, 246.94, 293.66], [174.61, 220, 261.63], [196, 246.94, 329.63]] },
  dreaming: { waveform: "triangle", filter: 820, secondsPerChord: 8, chords: [[174.61, 220, 277.18], [164.81, 207.65, 261.63], [146.83, 196, 246.94], [164.81, 220, 261.63]] },
  deep: { waveform: "sine", filter: 610, secondsPerChord: 9, chords: [[110, 146.83, 174.61], [98, 130.81, 164.81], [87.31, 116.54, 146.83], [98, 130.81, 174.61]] }
};

/** One running ambient soundscape; AudioEngine owns its lifecycle. */
export class AmbientSynth {
  readonly style: AmbientStyle;
  private readonly context: AudioContext;
  private readonly master: GainNode;
  private readonly voices: OscillatorNode[];
  private chordInterval: ReturnType<typeof setInterval> | null = null;

  constructor(context: AudioContext, style: AmbientStyle, volume: number) {
    this.context = context;
    this.style = style;
    const profile = AMBIENT_PROFILES[style];
    const filter = context.createBiquadFilter();
    this.master = context.createGain();
    const now = context.currentTime;

    // A low-pass filter softens the raw oscillator harmonics into background ambience.
    filter.type = "lowpass";
    filter.frequency.value = profile.filter;
    filter.Q.value = .55;
    this.master.gain.setValueAtTime(.0001, now);
    this.master.gain.exponentialRampToValueAtTime(Math.max(.0001, volume / 100 * .14), now + 1.5);
    this.master.connect(filter);
    filter.connect(context.destination);

    // Three lightly detuned voices produce the ambient chord without media files.
    this.voices = profile.chords[0].map((frequency, index) => {
      const oscillator = context.createOscillator();
      const voiceGain = context.createGain();
      oscillator.type = profile.waveform;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = [-5, 2, 7][index] ?? 0;
      voiceGain.gain.value = index === 0 ? .17 : .12;
      oscillator.connect(voiceGain);
      voiceGain.connect(this.master);
      oscillator.start();
      oscillator.onended = () => { oscillator.disconnect(); voiceGain.disconnect(); };
      return oscillator;
    });

    let chordIndex = 0;
    // Frequencies glide to the next chord rather than switching abruptly.
    this.chordInterval = setInterval(() => {
      chordIndex = (chordIndex + 1) % profile.chords.length;
      const changeAt = context.currentTime;
      this.voices.forEach((voice, index) => voice.frequency.setTargetAtTime(profile.chords[chordIndex][index], changeAt, 1.8));
    }, profile.secondsPerChord * 1000);
  }

  setVolume(volume: number): void {
    this.master.gain.setTargetAtTime(Math.max(.0001, volume / 100 * .14), this.context.currentTime, .08);
  }

  stop(): void {
    if (this.chordInterval) clearInterval(this.chordInterval);
    this.chordInterval = null;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(.0001, this.context.currentTime, .09);
    // Allow the gain fade to finish before stopping and disconnecting the voices.
    setTimeout(() => {
      this.voices.forEach((voice) => { try { voice.stop(); } catch { /* Voice already stopped. */ } });
      this.master.disconnect();
    }, 420);
  }
}
