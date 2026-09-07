import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';

/** Cartesian `vec2` → polar: `radius = length(p)`, `angle = atan(p.y, p.x)`. */
export class PolarNode extends Node {
  static readonly spec = {
    kind: 'polar',
    inputs: { p: 'vec2' },
    outputs: { radius: 'float', angle: 'float' },
  } as const;

  readonly kind = 'polar';
  readonly in = this.declareIn({ p: 'vec2' });
  readonly out = this.declareOut({ radius: 'float', angle: 'float' });

  constructor(p?: Src<'vec2'>) {
    super();
    if (p !== undefined) this.in.p.connect(p);
  }

  emit(ctx: CompileContext): Record<string, string> {
    const p = ctx.resolve(this.in.p);
    const v = ctx.hoist('vec2', `vec2(length(${p}), atan(${p}.y, ${p}.x))`);
    return { radius: `${v}.x`, angle: `${v}.y` };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const [x, y] = inputs.p as [number, number];
    return { radius: Math.hypot(x, y), angle: Math.atan2(y, x) };
  }
}
