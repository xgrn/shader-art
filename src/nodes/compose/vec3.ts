import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';

/** Packs three floats into a `vec3`. */
export class Vec3Node extends Node {
  static readonly spec = {
    kind: 'vec3',
    inputs: { x: 'float', y: 'float', z: 'float' },
    outputs: { value: 'vec3' },
  } as const;

  readonly kind = 'vec3';
  readonly in = this.declareIn({ x: 'float', y: 'float', z: 'float' });
  readonly out = this.declareOut({ value: 'vec3' });

  constructor(x?: Src<'float'>, y?: Src<'float'>, z?: Src<'float'>) {
    super();
    if (x !== undefined) this.in.x.connect(x);
    if (y !== undefined) this.in.y.connect(y);
    if (z !== undefined) this.in.z.connect(z);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(
        'vec3',
        `vec3(${ctx.resolve(this.in.x)}, ${ctx.resolve(this.in.y)}, ${ctx.resolve(this.in.z)})`,
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const value: [number, number, number] = [
      inputs.x as number,
      inputs.y as number,
      inputs.z as number,
    ];
    return { value };
  }
}
