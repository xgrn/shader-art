/**
 * Loops one user-picked audio file and exposes a moving time-domain window of
 * its samples, read straight from the decoded `AudioBuffer` — no `AnalyserNode`.
 * Nothing is persisted; the file is decoded in memory and discarded.
 *
 * Playback is paused and resumed by suspending the `AudioContext`, which also
 * freezes the sample window, so a paused comet holds its shape.
 */
export class TrackFeed {
  private ctx: AudioContext | undefined;
  private source: AudioBufferSourceNode | undefined;
  private buffer: AudioBuffer | undefined;
  private startedAt = 0;

  /** True while a file is loaded and the context is running. */
  get playing(): boolean {
    return this.source !== undefined && this.ctx?.state === 'running';
  }

  /** True while a file is loaded (playing or paused). */
  get loaded(): boolean {
    return this.source !== undefined;
  }

  /**
   * Decode `file`, start it looping, and resolve to its name (without the
   * extension) for the on-canvas credit.
   */
  async load(file: File): Promise<string> {
    const ctx = this.ensureContext();
    await ctx.resume();

    const bytes = await file.arrayBuffer();
    const credit = file.name.replace(/\.[^.]+$/, '');

    this.stop();
    const buffer = await ctx.decodeAudioData(bytes); // detaches `bytes`
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(ctx.destination);
    source.start();

    this.source = source;
    this.buffer = buffer;
    this.startedAt = ctx.currentTime;
    return credit;
  }

  pause(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        /* already stopped */
      }
      this.source.disconnect();
    }
    this.source = undefined;
    this.buffer = undefined;
  }

  destroy(): void {
    this.stop();
    void this.ctx?.close();
    this.ctx = undefined;
  }

  /**
   * `n` samples ending at the current playback head, `k = 0` newest, spanning
   * `seconds` of audio. Roughly [-1, 1]. Zeros when nothing is loaded.
   */
  window(n: number, seconds = 0.05): Float32Array {
    const out = new Float32Array(n);
    if (!this.ctx || !this.buffer) return out;

    const data = this.buffer.getChannelData(0);
    const total = data.length;
    const rate = this.buffer.sampleRate;
    const head = (this.ctx.currentTime - this.startedAt) * rate;
    const span = seconds * rate;

    for (let k = 0; k < n; k++) {
      const idx = Math.floor(head - (k / (n - 1)) * span);
      out[k] = data[((idx % total) + total) % total]!;
    }
    return out;
  }

  private ensureContext(): AudioContext {
    return (this.ctx ??= new AudioContext());
  }
}
