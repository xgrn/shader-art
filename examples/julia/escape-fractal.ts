import { Node } from '../../src';
import type { CompileContext, Src, Value } from '../../src';

export interface EscapeFractalOptions {
  /** Maximum iterations. A positive integer (becomes a GLSL loop bound). */
  iterations?: number;
  /** `|z|²` past which a point counts as escaped. Larger = smoother bands. */
  bailout?: number;
}

/**
 * Example-scoped node: escape-time iteration of `z → z² + c` (complex).
 * `z = uv, c = param` → a Julia set; `z = 0, c = uv` → the Mandelbrot set.
 * `out.escape` is the smooth iteration count normalised to [0, 1] (1 = never
 * escaped); `out.z` is the final `z`.
 */
export class EscapeFractalNode extends Node {
  readonly kind = 'escape-fractal';
  readonly in = this.declareIn({ z: 'vec2', c: 'vec2' });
  readonly out = this.declareOut({ escape: 'float', z: 'vec2' });

  private readonly iterations: number;
  private readonly bailout: number;

  constructor(z?: Src<'vec2'>, c?: Src<'vec2'>, options: EscapeFractalOptions = {}) {
    super();
    this.iterations = Math.max(1, Math.floor(options.iterations ?? 64));
    this.bailout = options.bailout ?? 128;
    if (z !== undefined) this.in.z.connect(z);
    if (c !== undefined) this.in.c.connect(c);
  }

  emit(ctx: CompileContext): Record<string, string> {
    const fn = `escape_${this.iterations}_${String(this.bailout).replace(/[.-]/g, '_')}`;
    ctx.addHelper(fn, buildEscape(fn, this.iterations, this.bailout));
    const call = `${fn}(${ctx.resolve(this.in.z)}, ${ctx.resolve(this.in.c)})`;
    const v = ctx.hoist('vec3', call); // vec3(count, z.x, z.y)
    return { escape: `(${v}.x / ${this.iterations}.0)`, z: `${v}.yz` };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const [zx0, zy0] = inputs.z as [number, number];
    const [cx, cy] = inputs.c as [number, number];
    let zx = zx0;
    let zy = zy0;
    let count = this.iterations;
    for (let i = 0; i < this.iterations; i++) {
      const nx = zx * zx - zy * zy + cx;
      const ny = 2 * zx * zy + cy;
      zx = nx;
      zy = ny;
      const m2 = zx * zx + zy * zy;
      if (m2 > this.bailout) {
        count = i + 1 - Math.log2(0.5 * Math.log(m2));
        break;
      }
    }
    return { escape: count / this.iterations, z: [zx, zy] };
  }
}

const num = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);

function buildEscape(name: string, iterations: number, bailout: number): string {
  return `vec3 ${name}(vec2 z, vec2 c) {
  float count = ${iterations}.0;
  for (int i = 0; i < ${iterations}; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > ${num(bailout)}) {
      count = float(i) + 1.0 - log2(0.5 * log(dot(z, z)));
      break;
    }
  }
  return vec3(count, z);
}`;
}
