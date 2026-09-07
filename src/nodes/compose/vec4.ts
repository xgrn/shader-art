import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';

/** Packs four floats into a `vec4`. */
export class Vec4Node extends Node {
  static readonly spec = {
    kind: 'vec4',
    inputs: { x: 'float', y: 'float', z: 'float', w: 'float' },
    outputs: { value: 'vec4' },
  } as const;

  readonly kind = 'vec4';
  readonly in = this.declareIn({ x: 'float', y: 'float', z: 'float', w: 'float' });
  readonly out = this.declareOut({ value: 'vec4' });

  constructor(x?: Src<'float'>, y?: Src<'float'>, z?: Src<'float'>, w?: Src<'float'>) {
    super();
    if (x !== undefined) this.in.x.connect(x);
    if (y !== undefined) this.in.y.connect(y);
    if (z !== undefined) this.in.z.connect(z);
    if (w !== undefined) this.in.w.connect(w);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(
        'vec4',
        `vec4(${ctx.resolve(this.in.x)}, ${ctx.resolve(this.in.y)}, ` +
          `${ctx.resolve(this.in.z)}, ${ctx.resolve(this.in.w)})`,
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const value: [number, number, number, number] = [
      inputs.x as number,
      inputs.y as number,
      inputs.z as number,
      inputs.w as number,
    ];
    return { value };
  }
}
