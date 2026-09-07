import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';
import { glslFloat } from '../../math/glsl';

const BARY_HELPER = `vec3 sa_bary(vec2 a, vec2 b, vec2 c, vec2 p) {
  vec2 v0 = b - a, v1 = c - a, v2 = p - a;
  float den = v0.x * v1.y - v1.x * v0.y;
  float v = (v2.x * v1.y - v1.x * v2.y) / den;
  float w = (v0.x * v2.y - v2.x * v0.y) / den;
  return vec3(1.0 - v - w, v, w);
}`;

export interface TriangleInputs {
  /** Vertices — `.xy` in screen space, `.z` = depth (larger = farther). */
  a?: Src<'vec3'>;
  b?: Src<'vec3'>;
  c?: Src<'vec3'>;
  /** Flat fill colour. */
  tint?: Src<'vec3'>;
  /** The pixel, in the same screen space as the vertices' `.xy`. */
  uv?: Src<'vec2'>;
}

/**
 * Software-rasterises one screen-space triangle. `out.colour` is
 * `vec4(tint, coverage)` (soft edge for anti-aliasing); `out.depth` is the
 * barycentric-interpolated `z`. Composite several with a nearest-depth blend.
 */
export class TriangleNode extends Node {
  static readonly spec = {
    kind: 'triangle',
    inputs: { a: 'vec3', b: 'vec3', c: 'vec3', tint: 'vec3', uv: 'vec2' },
    outputs: { colour: 'vec4', depth: 'float' },
  } as const;

  readonly kind = 'triangle';
  readonly in = this.declareIn({
    a: 'vec3',
    b: 'vec3',
    c: 'vec3',
    tint: 'vec3',
    uv: 'vec2',
  });
  readonly out = this.declareOut({ colour: 'vec4', depth: 'float' });

  private readonly softness: number;

  constructor(inputs: TriangleInputs = {}, options: { softness?: number } = {}) {
    super();
    this.softness = options.softness ?? 0.004;
    if (inputs.a) this.in.a.connect(inputs.a);
    if (inputs.b) this.in.b.connect(inputs.b);
    if (inputs.c) this.in.c.connect(inputs.c);
    if (inputs.tint) this.in.tint.connect(inputs.tint);
    if (inputs.uv) this.in.uv.connect(inputs.uv);
  }

  emit(ctx: CompileContext): Record<string, string> {
    ctx.addHelper('sa_bary', BARY_HELPER);
    const a = ctx.resolve(this.in.a);
    const b = ctx.resolve(this.in.b);
    const c = ctx.resolve(this.in.c);
    const tint = ctx.resolve(this.in.tint);
    const uv = ctx.resolve(this.in.uv);

    const bc = ctx.hoist('vec3', `sa_bary(${a}.xy, ${b}.xy, ${c}.xy, ${uv})`);
    const edge = ctx.hoist('float', `min(min(${bc}.x, ${bc}.y), ${bc}.z)`);
    // coverage is 1 up to the true edge, fading only *outside* it, so triangles
    // sharing an edge overlap there instead of leaving an anti-aliased seam.
    const cov = ctx.hoist(
      'float',
      `smoothstep(${glslFloat(-2 * this.softness)}, 0.0, ${edge})`,
    );
    const depth = ctx.hoist('float', `dot(${bc}, vec3(${a}.z, ${b}.z, ${c}.z))`);

    return { colour: `vec4(${tint}, ${cov})`, depth };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const a = inputs.a as [number, number, number];
    const b = inputs.b as [number, number, number];
    const c = inputs.c as [number, number, number];
    const tint = inputs.tint as [number, number, number];
    const [px, py] = inputs.uv as [number, number];

    const v0x = b[0] - a[0];
    const v0y = b[1] - a[1];
    const v1x = c[0] - a[0];
    const v1y = c[1] - a[1];
    const v2x = px - a[0];
    const v2y = py - a[1];
    const den = v0x * v1y - v1x * v0y;
    const bv = (v2x * v1y - v1x * v2y) / den;
    const bw = (v0x * v2y - v2x * v0y) / den;
    const bu = 1 - bv - bw;

    const edge = Math.min(bu, bv, bw);
    const t = Math.min(1, Math.max(0, edge / (2 * this.softness) + 1));
    const cov = t * t * (3 - 2 * t);
    const depth = bu * a[2] + bv * b[2] + bw * c[2];

    return { colour: [tint[0], tint[1], tint[2], cov], depth };
  }
}
