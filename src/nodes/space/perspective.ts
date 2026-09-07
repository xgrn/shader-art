import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';
import { glslFloat } from '../../math/glsl';

/**
 * Pinhole projection of a `vec3` in view space (camera at the origin looking
 * down +z): `(x·fov/z, y·fov/z, z)`. Feed `z`-translated points; the output
 * `.xy` is screen space, `.z` stays as depth.
 */
export class PerspectiveNode extends Node {
  static readonly spec = {
    kind: 'perspective',
    inputs: { v: 'vec3' },
    outputs: { value: 'vec3' },
  } as const;

  readonly kind = 'perspective';
  readonly in = this.declareIn({ v: 'vec3' });
  readonly out = this.declareOut({ value: 'vec3' });

  private readonly fov: number;

  constructor(v?: Src<'vec3'>, fov = 2) {
    super();
    this.fov = fov;
    if (v !== undefined) this.in.v.connect(v);
  }

  emit(ctx: CompileContext): Record<string, string> {
    const v = ctx.resolve(this.in.v);
    return {
      value: ctx.hoist('vec3', `vec3(${v}.xy * (${glslFloat(this.fov)} / ${v}.z), ${v}.z)`),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const [x, y, z] = inputs.v as [number, number, number];
    return { value: [(x * this.fov) / z, (y * this.fov) / z, z] };
  }
}
