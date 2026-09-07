import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';

/** Polar → Cartesian `vec2`: `(radius·cos(angle), radius·sin(angle))`. */
export class CartesianNode extends Node {
  static readonly spec = {
    kind: 'cartesian',
    inputs: { radius: 'float', angle: 'float' },
    outputs: { value: 'vec2' },
  } as const;

  readonly kind = 'cartesian';
  readonly in = this.declareIn({ radius: 'float', angle: 'float' });
  readonly out = this.declareOut({ value: 'vec2' });

  constructor(radius?: Src<'float'>, angle?: Src<'float'>) {
    super();
    if (radius !== undefined) this.in.radius.connect(radius);
    if (angle !== undefined) this.in.angle.connect(angle);
  }

  emit(ctx: CompileContext): Record<string, string> {
    const r = ctx.resolve(this.in.radius);
    const a = ctx.resolve(this.in.angle);
    return {
      value: ctx.hoist('vec2', `vec2(${r} * cos(${a}), ${r} * sin(${a}))`),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const r = inputs.radius as number;
    const a = inputs.angle as number;
    return { value: [r * Math.cos(a), r * Math.sin(a)] };
  }
}
