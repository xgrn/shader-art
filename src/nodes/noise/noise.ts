import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';
import { glslFloat } from '../../math/glsl';
import { fbm2D } from '../../math/noise';

export interface NoiseOptions {
  /** Octaves to sum. 1 = plain value noise; >1 = fBm. Default 1. */
  octaves?: number;
  /** Frequency multiplier per octave. Default 2. */
  lacunarity?: number;
  /** Amplitude multiplier per octave. Default 0.5. */
  gain?: number;
}

/**
 * 2-D value noise / fBm over a `vec2`. Output is ≈ [-1, 1] (a little narrower
 * for one octave). `compute()` is an approximation — hash precision differs
 * between CPU and GPU — so it mirrors shape and range, not exact values.
 */
export class NoiseNode extends Node {
  static readonly spec = {
    kind: 'noise',
    inputs: { p: 'vec2' },
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'noise';
  readonly in = this.declareIn({ p: 'vec2' });
  readonly out = this.declareOut({ value: 'float' });

  private readonly octaves: number;
  private readonly lacunarity: number;
  private readonly gain: number;

  constructor(p?: Src<'vec2'>, options: NoiseOptions = {}) {
    super();
    this.octaves = Math.max(1, Math.floor(options.octaves ?? 1));
    this.lacunarity = options.lacunarity ?? 2;
    this.gain = options.gain ?? 0.5;
    if (p !== undefined) this.in.p.connect(p);
  }

  emit(ctx: CompileContext): Record<string, string> {
    ctx.require('saValueNoise');
    const fn = `sa_fbm_${this.octaves}_${key(this.lacunarity)}_${key(this.gain)}`;
    ctx.addHelper(fn, buildFbm(fn, this.octaves, this.lacunarity, this.gain));
    return { value: ctx.hoist('float', `${fn}(${ctx.resolve(this.in.p)})`) };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const [px, py] = inputs.p as [number, number];
    return { value: fbm2D(px, py, this.octaves, this.lacunarity, this.gain) };
  }
}

const key = (n: number) => String(n).replace(/[.-]/g, '_');

function buildFbm(
  name: string,
  octaves: number,
  lacunarity: number,
  gain: number,
): string {
  return `float ${name}(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < ${octaves}; i++) {
    sum += amp * sa_valueNoise(p);
    p *= ${glslFloat(lacunarity)};
    amp *= ${glslFloat(gain)};
  }
  return sum;
}`;
}
