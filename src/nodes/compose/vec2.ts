import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';

/** Packs two floats into a `vec2`. */
export class Vec2Node extends Node {
  static readonly spec = {
    kind: 'vec2',
    inputs: { x: 'float', y: 'float' },
    outputs: { value: 'vec2' },
  } as const;

  readonly kind = 'vec2';
  readonly in = this.declareIn({ x: 'float', y: 'float' });
  readonly out = this.declareOut({ value: 'vec2' });

  constructor(x?: Src<'float'>, y?: Src<'float'>) {
    super();
    if (x !== undefined) this.in.x.connect(x);
    if (y !== undefined) this.in.y.connect(y);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(
        'vec2',
        `vec2(${ctx.resolve(this.in.x)}, ${ctx.resolve(this.in.y)})`,
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const value: [number, number] = [inputs.x as number, inputs.y as number];
    return { value };
  }
}
