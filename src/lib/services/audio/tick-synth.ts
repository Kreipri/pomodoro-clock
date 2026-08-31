import type { TickStyle } from "$lib/features/settings/types";

type TickProfile = {
  frequency: number;
  endFrequency: number;
  duration: number;
  waveform: OscillatorType;
  strength: number;
};

// Add or tune focus tick presets here; the settings type controls valid names.
const TICK_PROFILES: Record<TickStyle, TickProfile> = {
  soft: { frequency: 760, endFrequency: 610, duration: .045, waveform: "sine", strength: .1 },
  classic: { frequency: 1380, endFrequency: 980, duration: .032, waveform: "square", strength: .075 },
  wood: { frequency: 470, endFrequency: 240, duration: .075, waveform: "triangle", strength: .13 }
};

export function playSynthesizedTick(context: AudioContext, style: TickStyle, volume: number): void {
  const profile = TICK_PROFILES[style];
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = profile.waveform;
  oscillator.frequency.setValueAtTime(profile.frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(profile.endFrequency, now + profile.duration);
  // Exponential ramps cannot start/end at zero, hence the inaudible .0001 floor.
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume / 100 * profile.strength), now + .004);
  gain.gain.exponentialRampToValueAtTime(.0001, now + profile.duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + profile.duration + .01);
  // Disconnect short-lived nodes promptly instead of retaining one pair per second.
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
