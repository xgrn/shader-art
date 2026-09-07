import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';

export type Axis3 = 'x' | 'y' | 'z';

const ROTATE_HELPER: Record<Axis3, string> = {
  x: `vec3 sa_rot_x(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z); }`,
  y: `vec3 sa_rot_y(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }`,
  z: `vec3 sa_rot_z(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z); }`,
};

/** Rotate a `vec3` by `angle` (radians) about a principal axis. */
export class Rotate3DNode extends Node {
  static readonly spec = {
    kind: 'rotate3d',
    inputs: { v: 'vec3', angle: 'float' },
    outputs: { value: 'vec3' },
  } as const;

  readonly kind = 'rotate3d';
  readonly in = this.declareIn({ v: 'vec3', angle: 'float' });
  readonly out = this.declareOut({ value: 'vec3' });

  private readonly axis: Axis3;

  constructor(v?: Src<'vec3'>, angle?: Src<'float'>, axis: Axis3 = 'y') {
    super();
    this.axis = axis;
    if (v !== undefined) this.in.v.connect(v);
    if (angle !== undefined) this.in.angle.connect(angle);
  }

  emit(ctx: CompileContext): Record<string, string> {
    const fn = `sa_rot_${this.axis}`;
    ctx.addHelper(fn, ROTATE_HELPER[this.axis]);
    return {
      value: ctx.hoist(
        'vec3',
        `${fn}(${ctx.resolve(this.in.v)}, ${ctx.resolve(this.in.angle)})`,
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const [x, y, z] = inputs.v as [number, number, number];
    const a = inputs.angle as number;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const value: [number, number, number] =
      this.axis === 'x'
        ? [x, c * y - s * z, s * y + c * z]
        : this.axis === 'y'
          ? [c * x + s * z, y, -s * x + c * z]
          : [c * x - s * y, s * x + c * y, z];
    return { value };
  }
}
