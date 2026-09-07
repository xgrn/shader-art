import type { Src } from '../../graph/ports';
import { SampleNode } from './sample';

let signalCount = 0;

/**
 * A 1-D float signal (e.g. an audio-waveform window) uploaded as a
 * `uniform float[N]`. Not a graph node itself — call `sample(x)` for a float
 * port reading it at `x ∈ [0, 1]` with linear interpolation. Push new data
 * with `set()` (e.g. from `App`'s `frame` event); it reaches the GPU on the
 * next render and the CPU on the next `sample()`.
 */
export class SignalNode {
  readonly uniformName: string;
  readonly buffer: Float32Array;

  constructor(
    readonly size = 64,
    name?: string,
  ) {
    this.uniformName = name ?? `sig_${++signalCount}`;
    this.buffer = new Float32Array(size);
  }

  set(data: ArrayLike<number>): void {
    const n = Math.min(data.length, this.size);
    for (let i = 0; i < n; i++) this.buffer[i] = data[i]!;
  }

  sample(x: Src<'float'>): SampleNode {
    return new SampleNode(this, x);
  }
}
