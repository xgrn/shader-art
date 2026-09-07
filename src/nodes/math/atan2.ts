import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';

/** `atan(y, x)` — the polar angle. Both inputs float. */
export class Atan2Node extends Node {
  static readonly spec = {
    kind: 'atan2',
    inputs: { y: 'float', x: 'float' },
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'atan2';
  readonly in = this.declareIn({ y: 'float', x: 'float' });
  readonly out = this.declareOut({ value: 'float' });

  constructor(y?: Src<'float'>, x?: Src<'float'>) {
    super();
    if (y !== undefined) this.in.y.connect(y);
    if (x !== undefined) this.in.x.connect(x);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(
        'float',
        `atan(${ctx.resolve(this.in.y)}, ${ctx.resolve(this.in.x)})`,
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    return { value: Math.atan2(inputs.y as number, inputs.x as number) };
  }
}
