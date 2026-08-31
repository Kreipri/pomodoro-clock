import type { AmbientStyle, TickStyle } from "$lib/features/settings/types";
import { AmbientSynth } from "./ambient-synth";
import { playSynthesizedTick } from "./tick-synth";

/** Owns browser audio resources so feature stores never touch Web Audio APIs. */
export class AudioEngine {
  private context: AudioContext | null = null;
  private ambient: AmbientSynth | null = null;
  private ambientRequested = false;
  private ambientStarting = false;

  async unlock(): Promise<AudioContext | null> {
    try {
      if (!this.context) this.context = new AudioContext();
      if (this.context.state === "suspended") await this.context.resume();
      return this.context;
    } catch {
      return null;
    }
  }

  async playTick(style: TickStyle, volume: number): Promise<void> {
    const context = await this.unlock();
    if (context) playSynthesizedTick(context, style, volume);
  }

  async syncAmbient(shouldPlay: boolean, style: AmbientStyle, volume: number): Promise<void> {
    this.ambientRequested = shouldPlay;
    if (!shouldPlay) {
      this.stopAmbient();
      return;
    }
    if (this.ambient?.style !== style) this.stopAmbient();
    if (this.ambient) {
      this.ambient.setVolume(volume);
      return;
    }
    if (this.ambientStarting) return;

    this.ambientStarting = true;
    const context = await this.unlock();
    if (context && this.ambientRequested) this.ambient = new AmbientSynth(context, style, volume);
    this.ambientStarting = false;
  }

  stopAmbient(): void {
    this.ambient?.stop();
    this.ambient = null;
  }

  dispose(): void {
    this.ambientRequested = false;
    this.stopAmbient();
    if (this.context) void this.context.close();
    this.context = null;
  }
}
