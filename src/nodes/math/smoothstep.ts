import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';

/** `smoothstep(edge0, edge1, x)` — Hermite ease, clamped to [0, 1]. Float. */
export class SmoothstepNode extends Node {
  static readonly spec = {
    kind: 'smoothstep',
    inputs: { edge0: 'float', edge1: 'float', x: 'float' },
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'smoothstep';
  readonly in = this.declareIn({ edge0: 'float', edge1: 'float', x: 'float' });
  readonly out = this.declareOut({ value: 'float' });

  constructor(edge0?: Src<'float'>, edge1?: Src<'float'>, x?: Src<'float'>) {
    super();
    if (edge0 !== undefined) this.in.edge0.connect(edge0);
    if (edge1 !== undefined) this.in.edge1.connect(edge1);
    if (x !== undefined) this.in.x.connect(x);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(
        'float',
        `smoothstep(${ctx.resolve(this.in.edge0)}, ${ctx.resolve(this.in.edge1)}, ${ctx.resolve(this.in.x)})`,
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const e0 = inputs.edge0 as number;
    const e1 = inputs.edge1 as number;
    const x = inputs.x as number;
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return { value: t * t * (3 - 2 * t) };
  }
}
